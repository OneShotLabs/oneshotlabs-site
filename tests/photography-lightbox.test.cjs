const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const lightbox = fs.readFileSync(path.join(root, 'js/lightbox.js'), 'utf8');

assert.match(
  lightbox,
  /const aspectRatio = image\.naturalWidth \/ image\.naturalHeight/,
  'lightbox sizing must use each original image aspect ratio',
);
assert.match(
  lightbox,
  /window\.innerWidth \* 0\.94/,
  'lightbox photos must expand to the available viewport width',
);
assert.match(
  lightbox,
  /window\.innerHeight \* 0\.9/,
  'lightbox photos must remain within the available viewport height',
);
assert.match(
  lightbox,
  /<img src="\$\{img\.getAttribute\("src"\)\}"/,
  'lightbox must load the original timeline source rather than a thumbnail',
);
assert.doesNotMatch(
  lightbox,
  /canvas|toDataURL|toBlob|quality\s*:/,
  'lightbox must not recompress or rasterize source photos',
);
assert.match(
  lightbox,
  /window\.addEventListener\("resize"/,
  'lightbox must refit the active photo after the viewport changes',
);

console.log('PASS: every lightbox photo expands from its original source without cropping or recompression.');
