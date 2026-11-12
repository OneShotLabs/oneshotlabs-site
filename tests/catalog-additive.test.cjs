const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {photoCatalog}=require('../scripts/lib/site-seo.cjs');
const root=path.resolve(__dirname,'..');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'data/published-catalog.json'),'utf8'));
test('every published post and photograph remains present; additions are allowed',()=>{
 const posts=JSON.parse(fs.readFileSync(path.join(root,'posts/manifest.json'),'utf8')).posts;
 assert.equal(new Set(posts).size,posts.length,'duplicate post slug');
 for(const slug of baseline.posts)assert.ok(posts.includes(slug),`Published post removed: ${slug}`);
 for(const slug of posts)assert.ok(fs.existsSync(path.join(root,'posts',slug+'.md')),`Missing post source: ${slug}`);
 const photos=photoCatalog(root).map(p=>p.src);
 assert.equal(new Set(photos).size,photos.length,'duplicate photo');
 for(const src of baseline.photos){assert.ok(photos.includes(src),`Published photo removed: ${src}`);assert.ok(fs.existsSync(path.join(root,src)),`Photo asset removed: ${src}`);}
});
