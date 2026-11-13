// OneShotLens is the organization (no OneShotLabs entity; David does not hold that name, 2026-11-12).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const {PHOTOS,photoCardHTML}=require('../js/photography.js');
const {parseFrontmatter}=require('../scripts/lib/content.cjs');
const slugs=JSON.parse(read('posts/manifest.json')).posts;
const nodes=file=>[...read(file).matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const d=JSON.parse(m[1]);return d['@graph']||[d];});
const fileFor=url=>{const p=new URL(url).pathname;return p==='/'?'index.html':p.startsWith('/musings/')?p.replace(/^\//,'')+'index.html':p.slice(1)+'.html';};

test('each published essay has one complete BlogPosting with consistent parent publisher',()=>{
 for(const slug of slugs){
  const file=`musings/${slug}/index.html`;
  const articles=nodes(file).filter(n=>n['@type']==='BlogPosting');assert.equal(articles.length,1,slug);
  const article=articles[0];const meta=parseFrontmatter(read(`posts/${slug}.md`)).meta;
  assert.equal(article.author['@id'],'https://oneshotlens.com/#david-jergovic');
  assert.equal(article.publisher['@id'],'https://oneshotlens.com/#organization');
  assert.equal(article.headline,meta.title);assert.equal(article.datePublished,meta.date);
  assert.ok(article.description.length>30);assert.ok(Date.parse(article.dateModified)>=Date.parse(article.datePublished));
  assert.equal(article.mainEntityOfPage['@id'],`https://oneshotlens.com/musings/${slug}/`);
 }
 assert.match(read('js/musings.js'),/publisher: \{ "@id": "https:\/\/oneshotlens.com\/#organization" \}/);
});

test('bio profile links to the Person with education and expertise',()=>{
 const graph=nodes('bio.html');const profile=graph.find(n=>Array.isArray(n['@type'])&&n['@type'].includes('ProfilePage'));
 assert.ok(profile['@type'].includes('AboutPage'));assert.equal(profile.mainEntity['@id'],'https://oneshotlens.com/#david-jergovic');
 const person=graph.find(n=>n['@type']==='Person');
 assert.deepEqual(person.alumniOf.map(n=>n.name),['Texas Christian University','University of Dallas']);
 assert.deepEqual(person.knowsAbout,['Commercial Real Estate Finance','Applied Artificial Intelligence','Agentic AI Systems','Digital Photography']);
});

test('ImageGallery matches the initial public gallery without adding family images',()=>{
 const gallery=nodes('photography.html').find(n=>n['@type']==='ImageGallery');
 assert.equal(gallery.author['@id'],'https://oneshotlens.com/#david-jergovic');
 const publicPhotos=PHOTOS.filter(p=>(p.visibility||'public')==='public');
 assert.equal(gallery.hasPart.length,publicPhotos.length);
 const contents=new Set(gallery.hasPart.map(i=>new URL(i.contentUrl).pathname.slice(1)));
 for(const photo of PHOTOS)assert.equal(contents.has(photo.src),(photo.visibility||'public')==='public',photo.src);
 const html=read('photography.html');const imgs=[...html.matchAll(/<img class="timeline-photo"[^>]*>/g)];
 assert.equal(imgs.length,publicPhotos.length);
 for(const img of imgs){assert.match(img[0],/loading="lazy"/);assert.match(img[0],/width="[1-9]\d*" height="[1-9]\d*"/);assert.match(img[0],/alt="[^"<>]+Fujifilm X100V photography"/);}
 assert.match(html,/<img\s+src="images\/photo-hero[^>]+fetchpriority="high"\s+loading="eager"/);
});

test('all 81 catalog photos retain descriptive accessible text and stable dimensions after filtering',()=>{
 assert.ok(PHOTOS.length>=81);
 for(const photo of PHOTOS){
  assert.ok(photo.width>0&&photo.height>0,photo.src);assert.match(photo.alt,/Fujifilm X100V photography/);
  if(photo.location)assert.ok(photo.alt.includes(photo.location),photo.src);
  assert.ok(photo.alt.length>40);const html=photoCardHTML(photo,0);
  assert.match(html,/loading="lazy"/);assert.doesNotMatch(html,/fetchpriority="high"/);
  assert.ok(html.includes(`width="${photo.width}" height="${photo.height}"`));
 }
});

test('canonical, OpenGraph and sitemap URLs agree for all public routes',()=>{
 const urls=[...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,urls.length);
 for(const slug of slugs)assert.ok(urls.includes(`https://oneshotlens.com/musings/${slug}/`));
 for(const url of urls){
  const source=read(fileFor(url));
  const canonical=source.match(/<link rel="canonical" href="([^"]+)"/)[1];assert.equal(canonical,url);
  assert.equal(source.match(/property="og:url" content="([^"]+)"/)[1],url);
  assert.match(source,/property="og:type" content="(?:article|website|profile)"/);
  assert.match(source,/name="twitter:card" content="summary_large_image"/);
  const image=source.match(/property="og:image" content="([^"]+)"/)[1];
  assert.ok(fs.existsSync(path.join(root,new URL(image).pathname)),image);
  if(url.includes('/musings/'))assert.ok(url.endsWith('/'));else if(new URL(url).pathname!=='/')assert.ok(!url.endsWith('/'));
 }
 assert.match(read('post.html'),/name="robots" content="noindex, follow"/);
 assert.doesNotMatch(read('post.html'),/rel="canonical" href=""/);
});

test('pillar pages have one descriptive H1 and no skipped heading levels',()=>{
 for(const file of ['index.html','bio.html','ai.html','musings.html','photography.html']){
  const headings=[...read(file).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)];
  assert.equal(headings.filter(h=>h[1]==='1').length,1,file);
  let level=0;
  for(const h of headings){assert.ok(Number(h[1])<=level+1,`${file}: heading skips to H${h[1]}`);level=Number(h[1]);}
  const h1=headings.find(h=>h[1]==='1')[2].replace(/<[^>]+>/g,'');assert.ok(h1.length>10,file);
 }
});

test('llms.txt follows the proposal and stays in sync with the published catalog',()=>{
 const text=read('llms.txt');assert.equal(text,read('public/llms.txt'));
 assert.ok(text.startsWith('# OneShotLens\n\n> '));assert.match(text,/\n## Published essays(?: and films)?\n/);
 for(const slug of slugs)assert.ok(text.includes(`https://oneshotlens.com/musings/${slug}/`));
 for(const domain of ['oneshotlooks.com','oneshotspins.com','oneshotlines.com'])assert.ok(text.includes(`https://${domain}/`));
 assert.doesNotMatch(text,/starting-one-shot|one-shot-method|why-a-fixed-lens/);
});

// The AI page carries no body paragraph by design (David, 2026-11-12): its hero offers only
// "Explore the system" and "Read the story". It links to the other pillars through the site navigation.
test('contextual pillar links occur inside Musings editorial body copy',()=>{
 const source=read('musings.html').match(/<body[\s\S]*?<\/body>/)[0].replace(/<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>/g,'');
 const paragraphs=[...source.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]).join('');
 for(const route of ['/bio','/ai','/photography'])assert.ok(paragraphs.includes(`href="${route}"`),`musings.html lacks body link to ${route}`);
});

test('Bio editorial copy stays plain text',()=>{
 const bioBody=read('bio.html').match(/<body[\s\S]*?<\/body>/)[0].replace(/<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>/g,'');
 const bioParagraphs=[...bioBody.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]).join('');
 assert.doesNotMatch(bioParagraphs,/<a\b/i,'Bio prose must not contain hyperlinks');
});

test('offscreen EXIF reads wait until an image approaches the viewport',()=>{
 let ready;let reads=0;const observers=[];
 const frames=PHOTOS.filter(p=>(p.visibility||'public')==='public').map(()=>({querySelector(){return {textContent:'',remove(){}};}}));
 const mount={dataset:{prerendered:'public'},style:{setProperty(){}},getBoundingClientRect(){return {height:20000,top:2500};},querySelectorAll(selector){return selector==='.timeline-photo-frame'?frames:[];}};
 class Observer{constructor(callback,options){this.callback=callback;this.options=options;this.targets=[];observers.push(this);}observe(target){this.targets.push(target);}disconnect(){}unobserve(){}}
 const context=vm.createContext({document:{addEventListener(event,fn){if(event==='DOMContentLoaded')ready=fn;},getElementById(){return mount;},querySelector(){return null;}},window:{IntersectionObserver:Observer,innerHeight:800,addEventListener(){}},IntersectionObserver:Observer,exifr:{parse(){reads++;return Promise.resolve({});}}});
 vm.runInContext(read('js/photography.js'),context);ready();
 assert.equal(reads,0,'initial rendering must not fetch offscreen EXIF');
 const observer=observers.find(o=>o.options?.rootMargin==='160px');assert.ok(observer.targets.length>0);
 const frame=observer.targets[0];observer.callback([{target:frame,isIntersecting:false}]);assert.equal(reads,0);
 observer.callback([{target:frame,isIntersecting:true}]);assert.equal(reads,1);
 observer.callback([{target:frame,isIntersecting:true}]);assert.equal(reads,1,'each frame should load EXIF once');
});
