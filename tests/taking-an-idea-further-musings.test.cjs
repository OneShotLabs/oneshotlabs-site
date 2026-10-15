const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");

test("Taking an Idea Further with AI is published with the Pan Forward UI demo", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "posts/manifest.json"), "utf8"));
  const post = fs.readFileSync(path.join(root, "posts/taking-an-idea-further-with-ai.md"), "utf8");
  const index = fs.readFileSync(path.join(root, "musings.html"), "utf8");
  const article = fs.readFileSync(path.join(root, "musings/taking-an-idea-further-with-ai/index.html"), "utf8");

  assert.ok(manifest.posts.includes("taking-an-idea-further-with-ai"));
  assert.match(post, /title: Taking an Idea Further with AI/);
  assert.match(post, /video: \/assets\/video\/taking-an-idea-further-with-ai-4k\.mp4/);
  assert.match(index, /href="\/musings\/taking-an-idea-further-with-ai/);
  assert.match(article, /Taking an Idea Further with AI/);
  assert.ok(fs.statSync(path.join(root, "assets/video/taking-an-idea-further-with-ai-4k.mp4")).size > 1_000_000);
});
