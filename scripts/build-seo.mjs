import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { marked } from 'marked';
const require = createRequire(import.meta.url);
const { parseFrontmatter, estimateReadMinutes, renderPostContent } = require('../js/musings.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, value) => fs.writeFileSync(file, value);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const entities = JSON.parse(read('data/site-entities.json'));
const entityBlock = `<!-- site-entities:start --><script type="application/ld+json">\n${JSON.stringify(entities, null, 2).replace(/</g, '\\u003c')}\n</script><!-- site-entities:end -->`;
const slugs = JSON.parse(read('posts/manifest.json')).posts;
const posts = slugs.map(slug => {
  const {meta, body} = parseFrontmatter(read(`posts/${slug}.md`));
  return {...meta,slug,body,tags:meta.tags || [],dropCap:meta.dropCap !== 'false',readMinutes:estimateReadMinutes(body)};
}).sort((a,b) => b.date.localeCompare(a.date));
let count=0;
for (const post of posts) {
  const file = `musings/${post.slug}/index.html`;
  let source = read(file);
  // The Fabric already has a bespoke static article and gallery; retain it verbatim.
  if (source.includes('id="post-content"')) {
    const rendered = renderPostContent(post, marked.parse(post.body));
    const catalog = posts.map(({body, ...metadata}) => metadata);
    const payload = `<script id="musings-post-catalog" type="application/json">${JSON.stringify(catalog).replace(/</g, '\\u003c')}</script>`;
    source=source.replace(/<script id="musings-post-catalog" type="application\/json">[\s\S]*?<\/script>\s*/g,'');
    source=source.replace('</head>',payload+'\n</head>');
    const pattern = /<div id="post-content"[^>]*>[\s\S]*?<\/div>\s*(?=<nav id="post-nav")/;
    if (!pattern.test(source)) throw new Error(`Cannot locate article container: ${file}`);
    source=source.replace(pattern, () => `<div id="post-content" data-prerendered="true" data-post-slug="${post.slug}">${rendered}</div>\n    `);
    source=source.replace(/(<main class="post-page)([^"]*)(")/, (_,a,b,c)=>a+(post.coverTreatment==='editorial'?' post-page--editorial':'')+c);
    source=source.replace(/\s*<!-- Markdown renderer[^>]*-->\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/marked\/marked\.min\.js" defer><\/script>/g,'');
    source=source.replace(/\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/marked\/marked\.min\.js" defer><\/script>/g,'');
    const i=posts.indexOf(post);
    const links=[posts[i-1],posts[i+1]].filter(Boolean).map(p=>`<a class="post-nav-link" href="/musings/${p.slug}">${escape(p.title)}</a>`).join('');
    source=source.replace(/(<nav id="post-nav"[^>]*>)[\s\S]*?<\/nav>/,(_,open)=>`${open}<div class="post-nav-ledger">${links}</div></nav>`);
    count++;
  }
  write(file,source.replace(/[ \t]+$/gm,''));
}
const files=['index.html','bio.html','ai.html','career.html','contact.html','photography.html','musings.html','post.html',...slugs.map(s=>`musings/${s}/index.html`)];
for(const file of files){
 let source=read(file);
 if(!source.includes('<!-- site-entities:start -->')) throw new Error(`Missing shared head slot: ${file}`);
 source=source.replace(/<!-- site-entities:start -->[\s\S]*?<!-- site-entities:end -->/,()=>entityBlock);
 write(file,source.replace(/[ \t]+$/gm,''));
}
console.log(`Built ${count} static essays; preserved The Fabric; inlined linked entities on ${files.length} pages.`);
