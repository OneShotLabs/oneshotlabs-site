const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  for (const width of [320, 375, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1,
      isMobile: true, hasTouch: true });
    await page.goto('http://127.0.0.1:4182/ai-consulting.html?mobile-audit', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      document.querySelector('.ai-ledger-frame')?.contentDocument?.querySelector('video')?.pause();
    });
    const report = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('body *')].filter(el => {
        const s = getComputedStyle(el), r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
      });
      const overflow = visible.filter(el => !el.closest('.nav:not(.open)') && !el.classList.contains('grain-overlay')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.left < -1 || r.right > innerWidth + 1;
      }).map(el => ({ tag: el.tagName, cls: el.className, rect: el.getBoundingClientRect().toJSON() }));
      const links = visible.filter(el => !el.closest('.nav:not(.open)')).filter(el => el.matches('a,button,input,select,textarea')).map(el => {
        const r = el.getBoundingClientRect(); return { text: el.textContent.trim(), w: r.width, h: r.height };
      }).filter(x => x.w < 44 || x.h < 44);
      return { overflow, links, pageWidth: document.documentElement.scrollWidth, viewport: innerWidth };
    });
    assert.equal(report.pageWidth, width, `${width}px page must not scroll horizontally`);
    assert.deepEqual(report.overflow, [], `${width}px visible elements must stay in viewport`);
    assert.deepEqual(report.links, [], `${width}px controls must meet 44px touch target`);
    if (width === 390) {
      await page.screenshot({ path: '/private/tmp/oneshotlabs-ai-mobile.png', fullPage: true });
      await page.locator('.ai-curve-section').screenshot({ path: '/private/tmp/oneshotlabs-ai-curve-mobile.png' });
    }
    await page.close();
  }
  await browser.close();
  console.log('PASS: AI page has no mobile overflow and all visible controls meet 44px touch targets at 320/375/390/430px.');
})().catch(error => { console.error(error); process.exitCode = 1; });
