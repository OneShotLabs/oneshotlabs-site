const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const routes = new Map([
  ['/', 'index.html'],
  ['/ai', 'ai.html'],
  ['/bio', 'bio.html'],
  ['/career', 'career.html'],
  ['/contact', 'contact.html'],
  ['/musings', 'musings.html'],
  ['/photography', 'photography.html'],
  ['/musings/the-intelligence-inside-your-business', 'musings/the-intelligence-inside-your-business/index.html'],
  ['/musings/ai-has-a-branding-problem', 'musings/ai-has-a-branding-problem/index.html'],
  ['/musings/systems-thinkers-netflix', 'musings/systems-thinkers-netflix/index.html'],
]);

http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const requested = routes.get(url.pathname) || decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const resolved = path.resolve(root, requested || 'index.html');
  if (!resolved.startsWith(`${root}${path.sep}`) || !fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(resolved).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(resolved).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Local review: http://127.0.0.1:${port}`);
});
