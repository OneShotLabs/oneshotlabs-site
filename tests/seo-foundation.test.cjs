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
test('all published essays contain substantial article text in initial HTML',()=>{
 for(const slug of slugs){
  const source=read(`musings/${slug}/index.html`);
  const article=slug==='the-fabric'?source.match(/<article[\s\S]*?<\/article>/)?.[0]:source.match(/<div id="post-body"[^>]*>([\s\S]*?)<\/article>/)?.[1];
  assert.ok(article&&article.replace(/<[^>]*>/g,'').split(/\s+/).length>60,slug);
  assert.doesNotMatch(source,/Loading…|file:\/\/|Couldn't load posts/);
  assert.ok(source.includes(`https://oneshotlens.com/musings/${slug}`));
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
 assert.doesNotMatch(read('netlify.toml'),/from = "https:\/\/(?:www\.)?oneshotlabsai.com/);
});
test('static essays enhance from their embedded catalog without network requests',async()=>{
 const vm=require('node:vm');
 const source=read('musings/ai-has-a-branding-problem/index.html');
 const catalog=source.match(/<script id="musings-post-catalog" type="application\/json">([\s\S]*?)<\/script>/)[1];
 let fetches=0;
 const context=vm.createContext({console:{warn(){}},document:{addEventListener(){},getElementById(id){return id==='musings-post-catalog'?{textContent:catalog}:null;}},fetch(){fetches++;throw Error('Network unavailable');}});
 vm.runInContext(read('js/musings.js'),context);
 const posts=await vm.runInContext('loadAllPosts()',context);
 assert.equal(posts.length,slugs.length);assert.equal(fetches,0);
 const container={dataset:{prerendered:'true'},innerHTML:'Published article'};
 context.container=container;
 vm.runInContext('showFetchError(container,new Error("private diagnostic"))',context);
 assert.equal(container.innerHTML,'Published article');
 assert.match(source,/data-post-slug="ai-has-a-branding-problem"/);
 assert.doesNotMatch(source,/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/marked/);
});
