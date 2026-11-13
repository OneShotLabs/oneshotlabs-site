const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseFrontmatter, estimateReadMinutes, renderPostContent, formatDate, lengthLabel } = require('./content.cjs');
const ORIGIN = 'https://oneshotlens.com';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
const read = (root, file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (root, file, text) => { fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true}); fs.writeFileSync(path.join(root,file),text.replace(/\n{3,}/g,'\n\n')); };
function photoCatalog(root) {
  const context=vm.createContext({document:{addEventListener(){}}});
  vm.runInContext(read(root,'js/photography.js'),context);
  return vm.runInContext('PHOTOS',context);
}
function loadPosts(root) {
  const slugs=JSON.parse(read(root,'posts/manifest.json')).posts;
  if (!Array.isArray(slugs) || new Set(slugs).size!==slugs.length) throw Error('Post manifest must contain unique slugs');
  return slugs.map(slug=>{
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Unsafe post slug: '+slug);
    const {meta,body}=parseFrontmatter(read(root,`posts/${slug}.md`));
    for(const key of ['title','date','excerpt']) if(!meta[key]) throw Error(`${slug}: missing ${key}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || !Number.isFinite(Date.parse(meta.date))) throw Error(`${slug}: invalid publication date`);
    if (meta.format==='film' && (!meta.video || !meta.runtime)) throw Error(`${slug}: film requires video and runtime`);
    for(const key of ['cover','socialImage','video','videoCover']) {
      const asset=meta[key];
      if(asset?.startsWith('/')&&!fs.existsSync(path.join(root,asset))) throw Error(`${slug}: missing ${key} asset ${asset}`);
    }
    return {...meta,slug,body,tags:Array.isArray(meta.tags)?meta.tags:[],dropCap:meta.dropCap!=='false',readMinutes:estimateReadMinutes(body)};
  }).sort((a,b)=>b.date.localeCompare(a.date));
}
function runtimeDuration(runtime) {
  const match=String(runtime).match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if(!match || +match[3]>=60 || (match[1] && +match[2]>=60)) throw Error('Invalid film runtime: '+runtime);
  const seconds=(+(match[1]||0)*3600)+(+match[2]*60)+(+match[3]);
  if(!seconds) throw Error('Film runtime must be positive');
  const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
  return 'PT'+(h?h+'H':'')+(m?m+'M':'')+(s?s+'S':'');
}
function upsertSchema(source,node) {
  let found=false;
  source=source.replace(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/g,(block,attributes,body)=>{
    const data=JSON.parse(body),matches=value=>[value['@type']].flat().includes(node['@type']);
    if(data['@graph']) {
      if(!data['@graph'].some(matches)) return block;
      data['@graph']=data['@graph'].flatMap(value=>matches(value)?(found?[]:(found=true,[node])):[value]);
      return `<script${attributes}>\n${json(data)}\n</script>`;
    }
    if(!matches(data)) return block;
    if(found) return '';
    found=true;return `<script${attributes}>\n${json(node)}\n</script>`;
  });
  return found?source:source.replace('</head>',`<script type="application/ld+json">\n${json(node)}\n</script>\n</head>`);
}
function metadata(source,{title,description,url,type='website',image,alt}) {
  if(title) source=source.replace(/<title>[\s\S]*?<\/title>/,()=>`<title>${escape(title)}</title>`);
  const tags=[['name','description',description],['property','og:title',title],['property','og:description',description],['property','og:url',url],['property','og:type',type],['property','og:site_name','OneShotLens'],['property','og:image',image],['property','og:image:alt',alt],['name','twitter:card','summary_large_image'],['name','twitter:title',title],['name','twitter:description',description],['name','twitter:image',image]];
  for(const [attribute,name,value] of tags) {
    if(!value) continue;
    const expression=new RegExp(`<meta\\b(?=[^>]*${attribute}="${name}")[^>]*>`,'g');
    const tag=`<meta ${attribute}="${name}" content="${escape(value)}" />`;
    source=expression.test(source)?source.replace(expression,()=>tag):source.replace('</head>',tag+'\n</head>');
  }
  if(url) {
    const tag=`<link rel="canonical" href="${url}" />`;
    const pattern=/<link rel="canonical" href="[^"]*"\s*\/?>/g;
    source=pattern.test(source)?source.replace(pattern,tag):source.replace('</head>',tag+'\n</head>');
  }
  return source;
}
function commonHead(source,entities) {
  const block=`<!-- site-entities:start --><script type="application/ld+json">\n${json(entities)}\n</script><!-- site-entities:end -->`;
  source=source.includes('<!-- site-entities:start -->')?source.replace(/<!-- site-entities:start -->[\s\S]*?<!-- site-entities:end -->/,()=>block):source.replace('</head>',block+'\n</head>');
  if(!source.includes('/css/seo-foundation.css')) source=source.replace('</head>','<link rel="stylesheet" href="/css/seo-foundation.css?v=20261112" />\n</head>');
  // Footer attribution: OneShotLens is David's project; no OneShotLabs name or link (David, 2026-11-12).
  if(!source.includes('class="ecosystem-attribution"')) source=source.replace('</footer>','<span class="ecosystem-attribution">OneShotLens · A project by <a href="/bio">David Jergovic</a></span></footer>');
  return source;
}
function navigation(posts,index) {
  const item=(post,direction,number)=>!post?'':`<a class="post-nav-link post-nav-link--${direction}" href="/musings/${post.slug}/"><span class="post-nav-number">${String(number).padStart(2,'0')}</span><span class="post-nav-copy"><span class="post-nav-label">${direction==='prev'?'Earlier musing':'Continue reading'}</span><span class="post-nav-title">${escape(post.title)}</span><span class="post-nav-meta">${formatDate(post.date)} · ${lengthLabel(post)}</span></span><span class="post-nav-arrow" aria-hidden="true">${direction==='prev'?'←':'→'}</span></a>`;
  return `<div class="post-nav-ledger">${item(posts[index-1],'prev',index)}${item(posts[index+1],'next',index+2)}</div><div class="post-nav-footer"><a class="post-nav-index" href="/musings">Musings index</a><span>OneShotLens · ${posts[index].date.slice(0,4)}</span></div>`;
}
function generateDiscovery(root,posts) {
  let index=read(root,'musings.html');
  const missing=posts.filter(post=>!new RegExp(`/musings/${post.slug}(?:/|["'#?])`).test(index));
  if(missing.length) {
    const section='<section class="generated-musings" aria-labelledby="generated-musings-heading"><h2 id="generated-musings-heading">More Musings</h2>'+missing.map(post=>`<article><h3><a href="/musings/${post.slug}/">${escape(post.title)}</a></h3><p>${escape(post.excerpt)}</p><p>${formatDate(post.date)} · ${lengthLabel(post)}</p></article>`).join('')+'</section>';
    index=index.replace('</main>',section+'</main>');
  }
  write(root,'musings.html',index);
  let sitemap=read(root,'sitemap.xml');
  for(const post of posts) {
    const pattern=new RegExp(`<url>\\s*<loc>https://oneshotlens\\.com/musings/${post.slug}/?<\\/loc>[\\s\\S]*?<\\/url>`, 'g');
    sitemap=sitemap.replace(pattern,'');
  }
  const entries=posts.map(post=>`  <url><loc>${ORIGIN}/musings/${post.slug}/</loc><lastmod>${post.dateModified||post.updated||post.date}</lastmod></url>`).join('\n');
  write(root,'sitemap.xml',sitemap.replace('</urlset>',entries+'\n</urlset>'));
  const llms=`# OneShotLens\n\n> David Jergovic’s Chicago-based publishing hub for applied AI, commercial real estate finance, photography and creative experiments.\n\nOneShotLens is the canonical source for David’s biography and published work.\n\n## Core pages\n\n- [David Jergovic](${ORIGIN}/bio): Biography, education and interests.\n- [OneShotLens](${ORIGIN}/): Personal publishing hub.\n- [Applied AI](${ORIGIN}/ai): The Fabric, The Curve and applied AI systems.\n- [Musings](${ORIGIN}/musings): Essays, films and creative experiments.\n- [Photography](${ORIGIN}/photography): Fujifilm X100V photography.\n- [Career](${ORIGIN}/career): Commercial real estate finance.\n\n## Published essays and films\n\n${posts.map(post=>`- [${post.title}](${ORIGIN}/musings/${post.slug}/): ${post.excerpt}${post.format==='film'?' Film runtime: '+post.runtime+'.':''}`).join('\n')}\n\n## OneShot ecosystem\n\n- [OneShotLooks](https://oneshotlooks.com/): Sister property.\n- [OneShotSpins](https://oneshotspins.com/): Sister property.\n- [OneShotLines](https://oneshotlines.com/): Sister property.\n\n## Optional\n\n- [Sitemap](${ORIGIN}/sitemap.xml): Complete canonical page index.\n- [Contact](${ORIGIN}/contact): Contact OneShotLens.\n`;
  write(root,'llms.txt',llms);write(root,'public/llms.txt',llms);
}
function generateSeo(root,{marked}) {
  const entities=JSON.parse(read(root,'data/site-entities.json'));
  const pageMetadata=JSON.parse(read(root,'data/page-seo.json'));
  const posts=loadPosts(root);
  for(const post of posts) {
    const file=`musings/${post.slug}/index.html`,url=`${ORIGIN}/musings/${post.slug}/`;
    let source=fs.existsSync(path.join(root,file))?read(root,file):read(root,'templates/musing.html');
    source=metadata(source,{title:post.title+' — OneShotLens Musings',description:post.socialDescription||post.excerpt,url,type:'article',image:new URL(post.socialImage||post.cover||'/assets/brand/oneshotlens-social-card.png',ORIGIN).href,alt:post.socialAlt||post.coverAlt||post.title});
    if(source.includes('id="post-content"')) {
      const content=renderPostContent(post,marked.parse(post.body));
      source=source.replace(/<div id="post-content"[^>]*>[\s\S]*?<\/div>\s*(?=<nav id="post-nav")/,()=>`<div id="post-content" data-prerendered="true" data-post-slug="${post.slug}">${content}</div>\n`);
      source=source.replace(/<nav id="post-nav"[^>]*>[\s\S]*?<\/nav>/,()=>`<nav id="post-nav" class="post-nav" aria-label="Previous and next post">${navigation(posts,posts.indexOf(post))}</nav>`);
      source=source.replace(/class="post-page(?: post-page--editorial)?"/,post.coverTreatment==='editorial'?'class="post-page post-page--editorial"':'class="post-page"');
      source=source.replace(/\s*<script\b[^>]*src="(?:https:\/\/cdn\.jsdelivr\.net\/npm\/marked[^" ]*|\/?js\/musings(?:-static)?\.js[^" ]*)"[^>]*><\/script>\s*/g,'');
      source=source.replace(/<!-- Markdown renderer[^>]*-->/g,'').replace(/<script id="musings-post-catalog"[^>]*>[\s\S]*?<\/script>/g,'');
      source=source.replace('</body>','\n<script src="/js/musings-static.js?v=20261112" defer></script>\n</body>');
    }
    const article={'@context':'https://schema.org','@type':'BlogPosting','@id':url+'#article',url,headline:post.title,description:post.socialDescription||post.excerpt,image:new URL(post.socialImage||post.cover||'/assets/brand/oneshotlens-social-card.png',ORIGIN).href,datePublished:post.date,dateModified:post.dateModified||post.updated||post.date,author:{'@id':ORIGIN+'/#david-jergovic'},publisher:{'@id':ORIGIN+'/#organization'},mainEntityOfPage:{'@type':'WebPage','@id':url}};
    source=upsertSchema(source,article);
    if(post.video&&post.runtime) source=upsertSchema(source,{'@context':'https://schema.org','@type':'VideoObject','@id':url+'#video',name:post.title,description:post.socialDescription||post.excerpt,thumbnailUrl:new URL(post.socialImage||post.cover||'/assets/brand/oneshotlens-social-card.png',ORIGIN).href,uploadDate:post.date,duration:runtimeDuration(post.runtime),contentUrl:new URL(post.video,ORIGIN).href,publisher:article.publisher,creator:article.author});
    source=commonHead(source,entities);
    write(root,file,source.replace(/[ \t]+$/gm,''));
  }
  for(const file of ['index.html','bio.html','ai.html','career.html','contact.html','photography.html','musings.html','post.html']) {
    let source=read(root,file);
    if(pageMetadata[file]) source=metadata(source,{...pageMetadata[file],url:file==='index.html'?ORIGIN+'/':ORIGIN+'/'+file.replace('.html',''),type:file==='bio.html'?'profile':'website'});
    source=commonHead(source,entities);
    write(root,file,source);
  }
  // Retain the original browser engine for the Studio branch; harden only the built fallback reader.
  let legacy=read(root,'js/musings.js');
  legacy=legacy.replace(/function showFetchError\(container, err\) \{[\s\S]*?\n\}\n(?=\nfunction setMeta)/,`function showFetchError(container, err) {\n  if (container.dataset.prerendered === "true") return;\n  container.innerHTML = '<div class="musings-status" data-nosnippet><p>Musings are temporarily unavailable. <a href="/musings">Browse Musings</a>.</p></div>';\n}\n`);
  
  write(root,'js/musings.js',legacy);
  generateDiscovery(root,posts);
  return posts;
}
module.exports={loadPosts,photoCatalog,runtimeDuration,upsertSchema,metadata,generateSeo,generateDiscovery};
