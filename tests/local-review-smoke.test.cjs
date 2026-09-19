const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const routes = [
  '/', '/ai-consulting.html', '/photography.html', '/contact.html', '/career.html', '/bio.html', '/musings.html', '/post.html',
  '/decision-cube/index.html', '/css/home-motion.css', '/js/home-motion.js', '/css/site-motion.css', '/js/site-motion.js',
  '/css/fabric-finish.css', '/css/fabric-method.css', '/css/fabric-questionnaire.css', '/css/fabric-assessment-navy.css',
  '/js/navy-veil.js', '/js/fabric-breath.js', '/js/fabric-finish.js', '/js/fabric-method.js', '/js/fabric-questionnaire.js',
  '/js/fabric-results-globe.js', '/images/fabric-woven-v6.png', '/images/earth-surface-4k.jpg', '/images/earth-clouds-4k.png'
];

const server = http.createServer((request, response) => {
  const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\//, '');
  const file = path.join(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html' });
  fs.createReadStream(file).pipe(response);
});

server.listen(0, '127.0.0.1', async () => {
  try {
    const { port } = server.address();
    for (const route of routes) {
      const response = await fetch(`http://127.0.0.1:${port}${route}`);
      assert.equal(response.status, 200, `${route} should load`);
      assert.ok((await response.text()).length > 100, `${route} should not be empty`);
    }
    console.log('PASS: all local review pages and motion assets load.');
  } finally {
    server.close();
  }
});
