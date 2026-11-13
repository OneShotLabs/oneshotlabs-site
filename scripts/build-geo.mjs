import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {parseFrontmatter}=require('./lib/content.cjs');
const {PHOTOS,sortChronological,photoCardHTML}=require('../js/photography.js');
const root=process.env.SITE_BUILD_ROOT;
if(!root)throw Error('Run npm run build to generate GEO in dist/.');
process.chdir(root);
const read=file=>fs.readFileSync(file,'utf8');
const write=(file,text)=>fs.writeFileSync(file,text.replace(/[ \t]+$/gm,'').replace(/\n{3,}/g,'\n\n'));
const origin='https://oneshotlens.com';
const person={'@id':origin+'/#david-jergovic'};
const publisher={'@id':'https://oneshotlabsai.com/#organization'};
const slugs=JSON.parse(read('posts/manifest.json')).posts;
const posts=slugs.map(slug=>({slug,...parseFrontmatter(read(`posts/${slug}.md`)).meta}));
// Follow the static host's native shape: directory essays end in /; flat pillars do not.
const canonical=value=>value.replace(/(https:\/\/oneshotlens\.com\/musings\/[^/#?"'<>\s]+)\/?(?=[#?"'<>\s]|$)/g,(_,url)=>url.replace(/\/$/,'')+'/');
const json=value=>JSON.stringify(value,null,2).replace(/</g,'\\u003c');
function upsert(file,node){
 let source=read(file);let found=false;
 source=source.replace(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/g,(block,attributes,body)=>{
  const data=JSON.parse(body);const isType=n=>[n['@type']].flat().includes(node['@type']);
  if(data['@graph']){
   const count=data['@graph'].filter(isType).length;
   if(!count)return block;
   data['@graph']=data['@graph'].flatMap(n=>isType(n)?(found?[]:(found=true,[node])):[n]);
   return `<script${attributes}>\n${json(data)}\n</script>`;
  }
  if(isType(data)){if(found)return '';found=true;return `<script${attributes}>\n${json(node)}\n</script>`;}
  return block;
 });
 if(!found)source=source.replace('</head>',`<script type="application/ld+json">\n${json(node)}\n</script>\n</head>`);
 write(file,source);
}
const publicPhotos=sortChronological(PHOTOS.filter(p=>(p.visibility||'public')==='public'),'desc');
for(const photo of PHOTOS){
 if(!photo.alt||!photo.width||!photo.height)throw Error(`Photo metadata missing: ${photo.src}`);
 if(!fs.existsSync(photo.src))throw Error(`Photo asset missing: ${photo.src}`);
}
const images=publicPhotos.map(photo=>({'@type':'ImageObject','@id':origin+'/'+photo.src+'#image',contentUrl:origin+'/'+photo.src,name:photo.alt,caption:photo.alt,width:photo.width,height:photo.height,author:person,...(photo.location?{contentLocation:{'@type':'Place',name:photo.location}}:{}),exifData:{'@type':'PropertyValue',name:'Camera',value:'Fujifilm X100V'}}));
upsert('photography.html',{'@context':'https://schema.org','@type':'ImageGallery','@id':origin+'/photography#gallery',url:origin+'/photography',name:'Fujifilm X100V Photography by David Jergovic',description:'Chicago and travel photography by David Jergovic, captured with a Fujifilm X100V.',author:person,publisher,mainEntityOfPage:origin+'/photography',isPartOf:{'@id':origin+'/#website'},hasPart:images,image:images.map(image=>({'@id':image['@id']}))});
let photography=read('photography.html');
const staticPhotos=publicPhotos.map((photo,i)=>photoCardHTML(photo,i).replace('timeline-item reveal','timeline-item reveal is-visible')).join('');
const gallery=/<div id="photo-timeline"[^>]*>[\s\S]*?<!-- photo-timeline:end -->|<div id="photo-timeline"[^>]*>\s*<noscript>[\s\S]*?<\/noscript>\s*<\/div>/;
if(!gallery.test(photography))throw Error('Cannot find photography timeline');
photography=photography.replace(gallery,()=>`<div id="photo-timeline" class="photo-timeline" aria-live="polite" data-prerendered="public">${staticPhotos}\n      </div><!-- photo-timeline:end -->`);
write('photography.html',photography);
const files=['index.html','bio.html','ai.html','musings.html','photography.html','career.html','contact.html','post.html',...slugs.map(s=>`musings/${s}/index.html`)];
for(const file of files){
 let source=canonical(read(file));
 // Update root-relative essay links too, including generated no-JS navigation.
 source=source.replace(/(href=["']\/musings\/[^/#?"']+)\/?(["'])/g,(_,url,quote)=>url.replace(/\/$/,'')+'/'+quote);
 write(file,source);
}
// The base build owns sitemap and llms generation for all posts, including films.
write('sitemap.xml',canonical(read('sitemap.xml')));
let ai=read('ai.html');
ai=ai.replace('aria-label="The Fabric"','aria-label="The Fabric — Applied AI Systems for Commercial Real Estate"').replace('style="--i:5">C</span></span></h1>','style="--i:5">C</span></span><span class="seo-sr-only"> — Applied AI Systems for Commercial Real Estate</span></h1>');
write('ai.html',ai);
let musings=read('musings.html');
musings=musings.replace('<h1>Musings</h1>','<h1>Musings<span class="seo-sr-only"> by David Jergovic — AI, Work and Judgment</span></h1>');
musings=musings.replace('Musings reflect the founder’s belief that AI can structure and sharpen ideas, while perspective, voice and final edit belong to the author.','Musings reflect <a href="/bio">David Jergovic’s</a> belief that <a href="/ai">applied AI systems</a> can structure and sharpen ideas, while perspective, voice and final edit belong to the author. Explore the <a href="/photography">photography and visual craft</a> behind OneShotLens.');
write('musings.html',musings);
console.log(`Built ImageGallery for ${publicPhotos.length} public images and GEO enhancements in dist/.`);
