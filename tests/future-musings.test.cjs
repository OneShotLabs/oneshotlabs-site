const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {generateSeo,loadPosts,runtimeDuration}=require('../scripts/lib/site-seo.cjs');
const source=path.resolve(__dirname,'..');
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'oneshot-seo-post-'));
 for(const name of ['posts','templates','data'])fs.cpSync(path.join(source,name),path.join(root,name),{recursive:true});
 for(const file of ['index.html','bio.html','ai.html','career.html','contact.html','photography.html','musings.html','post.html','sitemap.xml','js/musings.js']){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.copyFileSync(path.join(source,file),path.join(root,file));}
 for(const post of JSON.parse(fs.readFileSync(path.join(root,'posts/manifest.json'),'utf8')).posts){
  const text=fs.readFileSync(path.join(root,'posts',post+'.md'),'utf8');
  for(const match of text.matchAll(/^(?:cover|socialImage|video|videoCover): (\/[^\n]+)/gm)){const file=path.join(root,match[1]);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'fixture asset');}
 }
 return root;
}
test('a manifest + Markdown film generates its page, both schemas and all discovery entries',async()=>{
 const {marked}=await import('marked');const root=fixture();
 try{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'posts/manifest.json'),'utf8'));manifest.posts=['the-turn','future-essay',...manifest.posts.filter(slug=>!['the-turn','future-essay'].includes(slug))];
  fs.writeFileSync(path.join(root,'posts/manifest.json'),JSON.stringify(manifest));
  fs.copyFileSync(path.join(source,'tests/fixtures/the-turn.md'),path.join(root,'posts/the-turn.md'));
  fs.writeFileSync(path.join(root,'posts/future-essay.md'),'---\ntitle: A Future Essay\ndate: 2026-11-12\nexcerpt: A future essay added through the manifest and Markdown alone.\n---\n\nNew source content renders automatically without an existing route shell.\n');
  for(const file of ['assets/video/the-turn.mp4','assets/editorial/the-turn.jpg']){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),'fixture asset');}
  generateSeo(root,{marked});
  const read=file=>fs.readFileSync(path.join(root,file),'utf8');const html=read('musings/the-turn/index.html');
  assert.match(html,/Ever had a last-minute data dump/);assert.match(html,/Film · 0:25/);assert.doesNotMatch(html,/Loading…|file:\/\//);
  const nodes=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const d=JSON.parse(m[1]);return d['@graph']||[d];});
  const article=nodes.filter(n=>n['@type']==='BlogPosting');assert.equal(article.length,1);assert.equal(article[0].headline,'The Turn');
  const videos=nodes.filter(n=>n['@type']==='VideoObject');assert.equal(videos.length,1);const video=videos[0];
  for(const field of ['name','description','thumbnailUrl','uploadDate','duration','contentUrl'])assert.ok(video[field],field);
  assert.equal(video.duration,'PT25S');assert.equal(video.contentUrl,'https://oneshotlens.com/assets/video/the-turn.mp4');
  assert.ok(read('sitemap.xml').includes('https://oneshotlens.com/musings/the-turn/'));
  assert.ok(read('llms.txt').includes('[The Turn](https://oneshotlens.com/musings/the-turn/)'));
  assert.ok(read('musings.html').includes('/musings/the-turn/'));
  const essay=read('musings/future-essay/index.html');assert.match(essay,/New source content renders automatically/);assert.match(essay,/BlogPosting/);assert.ok(read('sitemap.xml').includes('/musings/future-essay/'));assert.ok(read('llms.txt').includes('[A Future Essay]'));
  assert.ok(!fs.existsSync(path.join(source,'musings/the-turn/index.html')) || JSON.parse(fs.readFileSync(path.join(source,'posts/manifest.json'),'utf8')).posts.includes('the-turn'));
  assert.equal(read('llms.txt'),read('public/llms.txt'));
  const before=read('musings/the-turn/index.html');generateSeo(root,{marked});assert.equal(read('musings/the-turn/index.html'),before);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('runtime parsing rejects invalid film data rather than publishing invented durations',()=>{
 assert.equal(runtimeDuration('0:25'),'PT25S');assert.equal(runtimeDuration('1:25'),'PT1M25S');assert.equal(runtimeDuration('1:02:03'),'PT1H2M3S');
 for(const value of ['','25','0:99','0:00'])assert.throws(()=>runtimeDuration(value));
});
