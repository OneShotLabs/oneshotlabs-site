const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");

test("Luck, by Design is published with its video and final copy", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "posts/manifest.json"), "utf8"));
  const post = fs.readFileSync(path.join(root, "posts/luck-by-design.md"), "utf8");
  const index = fs.readFileSync(path.join(root, "musings.html"), "utf8");
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");

  assert.ok(manifest.posts.includes("luck-by-design"));
  assert.match(post, /title: Luck, by Design/);
  assert.match(post, /video: \/assets\/video\/luck-by-design\.mp4/);
  assert.match(post, /Those moments may look like luck to some\./);
  assert.match(post, /More often, the work that made them possible began long before the opportunity arrived\./);
  assert.ok(!post.includes("—"));
  assert.match(index, /href="\/musings\/luck-by-design"/);
  assert.match(sitemap, /https:\/\/oneshotlens\.com\/musings\/luck-by-design/);
  assert.ok(fs.statSync(path.join(root, "assets/video/luck-by-design.mp4")).size > 1_000_000);
  assert.ok(fs.statSync(path.join(root, "assets/editorial/luck-by-design.jpg")).size > 50_000);
});
