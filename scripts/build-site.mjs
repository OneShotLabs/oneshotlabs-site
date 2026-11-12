import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { marked } from 'marked';
const require=createRequire(import.meta.url);
const {generateSeo}=require('./lib/site-seo.cjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const exclude=new Set(['.git','.netlify','node_modules','work','outputs','dist','.DS_Store']);
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
for(const name of fs.readdirSync(root)) {
  if(exclude.has(name)||name.startsWith('.env'))continue;
  fs.cpSync(path.join(root,name),path.join(output,name),{recursive:true});
}
const posts=generateSeo(output,{marked});
if(fs.existsSync(path.join(root,'scripts/build-geo.mjs'))) {
  const geo=spawnSync(process.execPath,[path.join(root,'scripts/build-geo.mjs')],{cwd:output,env:{...process.env,SITE_BUILD_ROOT:output},stdio:'inherit'});
  if(geo.status!==0)process.exit(geo.status||1);
}
console.log(`Built fresh dist/: ${posts.length} published posts, schema, sitemap and llms.txt. Source HTML is unchanged.`);
