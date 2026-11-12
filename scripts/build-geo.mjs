import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {parseFrontmatter}=require('../js/musings.js');
const {PHOTOS,sortChronological,photoCardHTML}=require('../js/photography.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
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
for(const post of posts){
 const url=origin+`/musings/${post.slug}/`;
 upsert(`musings/${post.slug}/index.html`,{'@context':'https://schema.org','@type':'BlogPosting','@id':url+'#article',url,headline:post.title,description:post.socialDescription||post.excerpt,image:origin+(post.socialImage||post.cover),datePublished:post.date,dateModified:post.dateModified||post.updated||post.date,author:person,publisher,mainEntityOfPage:{'@type':'WebPage','@id':url},isPartOf:{'@id':origin+'/#website'}});
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
write('sitemap.xml',canonical(read('sitemap.xml')));
const llms=`# OneShotLens\n\n> OneShotLens is David Jergovic’s canonical personal publishing hub for applied AI, commercial real estate finance, essays and Fujifilm X100V photography. David is based in Chicago and is the founder of OneShotLabs, the parent organization of the OneShot ecosystem.\n\nThe primary site is https://oneshotlens.com/. David’s biography, authored essays and photography are published here. OneShotLabs is identified at https://oneshotlabsai.com/. The sister properties below are distinct projects within the same ecosystem.\n\n## David Jergovic and core pages\n\n- [OneShotLens](https://oneshotlens.com/): David Jergovic’s personal publishing hub.\n- [David Jergovic](https://oneshotlens.com/bio): Biography, Chicago background, education at Texas Christian University and the University of Dallas, commercial real estate finance, applied AI and photography.\n- [Career](https://oneshotlens.com/career): David’s experience in commercial real estate finance.\n- [Applied AI systems](https://oneshotlens.com/ai): The Fabric and The Curve, experiments in connected tools, workflows and human judgment.\n- [Musings](https://oneshotlens.com/musings): Essays, creative experiments and perspectives on AI, work and judgment.\n- [Photography](https://oneshotlens.com/photography): Chicago and travel photographs by David Jergovic, made with a Fujifilm X100V.\n\n## Published essays\n\n${posts.map(p=>`- [${p.title}](${origin}/musings/${p.slug}/): ${p.excerpt}`).join('\n')}\n\n## OneShot ecosystem\n\n- [OneShotLabs](https://oneshotlabsai.com/): Parent organization founded by David Jergovic.\n- [OneShotLooks](https://oneshotlooks.com/): Sister property in the OneShot ecosystem.\n- [OneShotSpins](https://oneshotspins.com/): Sister property in the OneShot ecosystem.\n- [OneShotLines](https://oneshotlines.com/): Sister property in the OneShot ecosystem.\n\n## Optional\n\n- [Sitemap](https://oneshotlens.com/sitemap.xml): Canonical public page index.\n- [Contact](https://oneshotlens.com/contact): Contact OneShotLens.\n`;
fs.mkdirSync('public',{recursive:true});write('public/llms.txt',llms);write('llms.txt',llms);
console.log(`Built route schema for ${posts.length} essays and ${publicPhotos.length} public gallery images; audited ${PHOTOS.length} photo descriptions; published /llms.txt.`);
