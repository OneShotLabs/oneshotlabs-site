#!/usr/bin/env python3
"""Plan/apply the authorized Cloudflare redirects, or verify their live headers.

API authentication uses environment variables only. An authenticated Cloudflare
connector can apply the JSON from --plan without exposing its token to Python.
"""
import argparse, concurrent.futures, datetime, json, os, pathlib, subprocess, time
import urllib.error, urllib.request
MAPPING={
 'oneshotbrands.com':'https://oneshotlens.com/',
 'oneshotflow.com':'https://oneshotlens.com/',
 'oneshotmoods.com':'https://oneshotlens.com/',
 'oneshotsounds.com':'https://oneshotlens.com/',
 'oneshotcre.com':'https://oneshotlens.com/ai',
 'oneshotinvest.com':'https://oneshotlens.com/ai',
 'oneshotmarkets.com':'https://oneshotlens.com/ai',
 'oneshotprops.com':'https://oneshotlens.com/ai',
 'oneshotstrategy.com':'https://oneshotlens.com/ai',
 'oneshotlearn.com':'https://oneshotlens.com/musings'}
EXCLUDED={'oneshotlens.com','oneshotlabsai.com','oneshotlooks.com','oneshotspins.com','oneshotlines.com'}
LIST='oneshot_brand_redirects'
assert not EXCLUDED.intersection(MAPPING)
ITEMS=[{'redirect':{'source_url':domain+'/', 'target_url':target,'status_code':301,'include_subdomains':True,'subpath_matching':True,'preserve_path_suffix':False,'preserve_query_string':False}} for domain,target in MAPPING.items()]
RULE={'ref':'enable_oneshot_brand_redirects','description':'Consolidate ten defensive OneShot domains','action':'redirect','expression':f'http.request.full_uri in ${LIST}','action_parameters':{'from_list':{'name':LIST,'key':'http.request.full_uri'}},'enabled':True}
def api(method,path,body=None):
 token=os.environ.get('CLOUDFLARE_API_TOKEN')
 if not token: raise RuntimeError('Set CLOUDFLARE_API_TOKEN securely in the environment, or apply --plan through the connected Cloudflare tool.')
 req=urllib.request.Request('https://api.cloudflare.com/client/v4'+path,data=json.dumps(body).encode() if body is not None else None,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},method=method)
 try:
  with urllib.request.urlopen(req,timeout=30) as r: result=json.load(r)
 except urllib.error.HTTPError as e: raise RuntimeError(f'Cloudflare {method} {path}: HTTP {e.code}') from None
 if not result.get('success'): raise RuntimeError(f'Cloudflare {method} {path}: {result.get("errors")}')
 return result

def wait(operation,base):
 for _ in range(30):
  result=api('GET',base+'/rules/lists/bulk_operations/'+operation)['result']
  if result['status']=='completed':return
  if result['status']=='failed':raise RuntimeError('Bulk operation failed: '+json.dumps(result))
  time.sleep(1)
 raise RuntimeError('Bulk operation did not finish within 30 seconds')

def apply(output):
 account=os.environ.get('CLOUDFLARE_ACCOUNT_ID')
 if not account:raise RuntimeError('Set CLOUDFLARE_ACCOUNT_ID in the environment.')
 base='/accounts/'+account
 zones={}
 # Exact zone lookup and DNS snapshot before any writes; never touch protected domains.
 for domain in MAPPING:
  found=api('GET','/zones?name='+domain+'&account.id='+account)['result']
  if len(found)!=1 or found[0]['status']!='active':raise RuntimeError('Expected one active zone: '+domain)
  z=found[0]; records=api('GET','/zones/'+z['id']+'/dns_records?per_page=100')['result']
  if len(records)>=100:raise RuntimeError('Review DNS pagination before applying: '+domain)
  conflicts=[r for r in records if r['name'] in [domain,'www.'+domain] and r['type'] in ['A','AAAA','CNAME'] and not (r['type']=='A' and r['name']==domain and r['content']=='192.0.2.1') and not (r['type']=='CNAME' and r['name']=='www.'+domain and r['content']==domain)]
  if conflicts:raise RuntimeError('Existing DNS needs explicit reconciliation: '+domain)
  zones[domain]={'id':z['id'],'records':records}
 lists=api('GET',base+'/rules/lists')['result']
 current=next((x for x in lists if x['name']==LIST),None)
 prior_items=api('GET',base+'/rules/lists/'+current['id']+'/items')['result'] if current else []
 prior_rules=api('GET',base+'/rulesets')['result']
 entry=next((r for r in prior_rules if r['kind']=='root' and r['phase']=='http_request_redirect'),None)
 entry_data=api('GET',base+'/rulesets/'+entry['id'])['result'] if entry else None
 pathlib.Path(output).write_text(json.dumps({'zones':zones,'list':current,'items':prior_items,'entrypoint':entry_data},indent=2)+'\n')
 if not current:current=api('POST',base+'/rules/lists',{'name':LIST,'kind':'redirect','description':'Ten defensive OneShot domains to the OneShotLens hub'})['result']
 if current['kind']!='redirect':raise RuntimeError('Existing list has the wrong kind')
 if len(prior_items)>=1000:raise RuntimeError('Review list pagination before applying')
 if any(x['redirect']['source_url'] not in {i['redirect']['source_url'] for i in ITEMS} for x in prior_items):raise RuntimeError('List contains unrelated items; preserve and reconcile them first')
 operation=api('PUT',base+'/rules/lists/'+current['id']+'/items',ITEMS)['result']['operation_id'];wait(operation,base)
 if entry_data:
  rules=[{k:v for k,v in r.items() if k not in ['version','last_updated']} for r in entry_data['rules']]
  matches=[i for i,r in enumerate(rules) if r.get('action_parameters',{}).get('from_list',{}).get('name')==LIST]
  if len(matches)>1:raise RuntimeError('Duplicate redirect rules require reconciliation')
  if matches:rules[matches[0]]={**RULE,'id':rules[matches[0]]['id']}
  else:rules.append(RULE)
  api('PUT',base+'/rulesets/'+entry['id'],{'name':entry_data['name'],'kind':'root','phase':'http_request_redirect','rules':rules})
 else:api('POST',base+'/rulesets',{'name':'OneShot brand redirects','kind':'root','phase':'http_request_redirect','rules':[RULE]})
 # Enable the edge routes only after their redirect list is active.
 for domain,z in zones.items():
  for record in [{'type':'A','name':domain,'content':'192.0.2.1','proxied':True,'ttl':1},{'type':'CNAME','name':'www.'+domain,'content':domain,'proxied':True,'ttl':1}]:
   existing=next((r for r in z['records'] if r['type']==record['type'] and r['name']==record['name']),None)
   if existing:api('PATCH','/zones/'+z['id']+'/dns_records/'+existing['id'],record)
   else:api('POST','/zones/'+z['id']+'/dns_records',record)
 print('Applied ten redirects and twenty proxied DNS records.')

def check(pair):
 url,target,doh=pair
 proc=subprocess.run(['curl','-sS','-I','--connect-timeout','8','--max-time','20']+(['--doh-url',doh] if doh else [])+[url],capture_output=True,text=True)
 lines=proc.stdout.replace('\r','').splitlines()
 status=next((int(x.split()[1]) for x in reversed(lines) if x.startswith('HTTP/')),None)
 location=next((x.split(':',1)[1].strip() for x in reversed(lines) if x.lower().startswith('location:')),None)
 return {'url':url,'status':status,'location':location,'target':target,'pass':status==301 and location==target and proc.returncode==0,'error':proc.stderr.strip() or None}
def verify(output,paths,doh=None):
 suffixes=['/','/seo-verification/deep-path?source=check'] if paths else ['/']
 pairs=[(scheme+'://'+host+suffix,target,doh) for domain,target in MAPPING.items() for host in [domain,'www.'+domain] for scheme in ['http','https'] for suffix in suffixes]
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:rows=list(pool.map(check,pairs))
 report={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'resolver':doh or 'system DNS','passed':sum(r['pass'] for r in rows),'total':len(rows),'rows':rows}
 pathlib.Path(output).write_text(json.dumps(report,indent=2)+'\n')
 print('| URL | HTTP | Location | Result |\n|---|---|---|---|')
 for r in rows:print(f"| {r['url']} | {r['status'] or 'ERROR'} | {r['location'] or r['error']} | {'PASS' if r['pass'] else 'FAIL'} |")
 print(f"{report['passed']}/{len(rows)} checks passed")
 return all(r['pass'] for r in rows)
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__); mode=parser.add_mutually_exclusive_group(required=True);mode.add_argument('--plan',action='store_true');mode.add_argument('--apply',action='store_true');mode.add_argument('--verify',action='store_true');parser.add_argument('--paths',action='store_true');parser.add_argument('--doh-url',help='Optional public DNS-over-HTTPS resolver for fresh DNS checks');parser.add_argument('--output',default='domain-verification.json');args=parser.parse_args()
 if args.plan:print(json.dumps({'list':{'name':LIST,'kind':'redirect'},'items':ITEMS,'rule':RULE,'mapping':MAPPING,'excluded':sorted(EXCLUDED)},indent=2))
 elif args.apply:apply(args.output)
 else:raise SystemExit(0 if verify(args.output,args.paths,args.doh_url) else 1)
