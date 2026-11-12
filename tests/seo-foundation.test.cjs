const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const slugs=JSON.parse(read('posts/manifest.json')).posts;
const pages=['index.html','bio.html','ai.html','musings.html','photography.html','career.html','contact.html',...slugs.map(s=>`musings/${s}/index.html`)];
test('every public page delivers valid linked Person, parent Organization and WebSite entities',()=>{
 for(const file of pages){
  const source=read(file);
  const blocks=[...source.matchAll(/<script(?: [^>]*?)? type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  const nodes=blocks.flatMap(m=>{const data=JSON.parse(m[1]);return data['@graph']||[data];});
  const person=nodes.find(n=>n['@type']==='Person'&&n['@id']==='https://oneshotlens.com/#david-jergovic');
  assert.ok(person,file); assert.equal(person.worksFor['@id'],'https://oneshotlabsai.com/#organization');
  assert.equal(person.homeLocation.name,'Chicago, Illinois');
  const parent=nodes.find(n=>n['@id']==='https://oneshotlabsai.com/#organization');
  assert.equal(parent.subOrganization.length,4);
  const website=nodes.find(n=>n['@type']==='WebSite');
  assert.equal(website.author['@id'],person['@id']); assert.equal(website.publisher['@id'],person['@id']);
 }
});
test('all manifest posts deliver their article content, including short films',()=>{
 const {parseFrontmatter}=require('../scripts/lib/content.cjs');
 for(const slug of slugs){
  const source=read(`musings/${slug}/index.html`);
  const {body}=parseFrontmatter(read(`posts/${slug}.md`));
  assert.ok(source.includes('id="post-body"')||source.includes('<article'),slug);
  if(slug!=='the-fabric')assert.ok(source.includes(body.split('\n')[0].slice(0,35)),slug);
  assert.doesNotMatch(source,/Loading…|file:\/\/|Couldn't load posts/);
 }
});
test('public metadata is unique and photography controls follow editorial content',()=>{
 const titles=new Set();const descriptions=new Set();
 for(const file of ['index.html','bio.html','ai.html','musings.html','photography.html']){
  const source=read(file);const title=source.match(/<title>(.*?)<\/title>/)[1];const desc=source.match(/name="description" content="([^"]+)"/)[1];
  assert.ok(!titles.has(title));assert.ok(!descriptions.has(desc));titles.add(title);descriptions.add(desc);
  assert.match(source, /property="og:title" content="[^"]+"/);assert.match(source,/property="og:description" content="[^"]+"/);
 }
 const photo=read('photography.html');
 assert.ok(photo.indexOf('Photography by David Jergovic')<photo.indexOf('<summary>Photography layout controls'));
 assert.match(photo,/<div data-nosnippet>\s*<details class="photo-layout-tool" open hidden inert aria-hidden="true">/);
 assert.doesNotMatch(read('js/musings.js'),/file:\/\/[\s\S]*?Try running/);
 assert.match(read('netlify.toml'),/from = "https:\/\/oneshotlabsai.com\/\*"\s+to = "https:\/\/oneshotlens.com\/"/);
});
test('pre-rendered articles enhance without replacing or fetching their content',()=>{
 const vm=require('node:vm');let ready;let fetches=0;
 const content={innerHTML:'Published article',querySelector(){return null;},querySelectorAll(){return [];}};
 const context=vm.createContext({document:{addEventListener(event,fn){ready=fn;},querySelector(){return content;}},fetch(){fetches++;throw Error('network');}});
 vm.runInContext(read('js/musings-static.js'),context);ready();
 assert.equal(content.innerHTML,'Published article');assert.equal(fetches,0);
 const source=read('musings/ai-has-a-branding-problem/index.html');
 assert.match(source,/data-post-slug="ai-has-a-branding-problem"/);
 assert.match(source,/js\/musings-static\.js/);
 assert.doesNotMatch(source,/<script[^>]+src="js\/musings\.js/);
});
