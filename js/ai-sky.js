/* AI page · one night sky behind the whole page (see css/ai-sky.css).
   Draws a fixed star field in the same palette as the hero and the Curve (cool white, a few gold),
   with a slow twinkle. Static under reduced motion; rests while the tab is hidden. */
(() => {
  'use strict';
  if (!document.body) return;
  const dusk = document.createElement('div'); dusk.className = 'ai-sky-dusk'; dusk.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); canvas.className = 'ai-sky'; canvas.setAttribute('aria-hidden', 'true');
  // Appended last so page scripts that look up the first <canvas> keep finding their own.
  document.body.append(canvas, dusk);
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let W = 0, H = 0, dpr = 1, stars = [], raf = 0, last = 0;
  // Seeded so the sky is the same on every visit and every resize keeps its character.
  let seed = 20261112;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  function build() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = Math.max(innerHeight, document.documentElement.clientHeight);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    seed = 20261112;
    const n = Math.round(W * H / 5200);
    stars = Array.from({ length: n }, () => {
      const big = rand() < .07;
      return { x: rand(), y: rand(), r: big ? .9 + rand() * .9 : .35 + rand() * .6, a: big ? .55 + rand() * .4 : .18 + rand() * .45,
        gold: rand() < .06, ph: rand() * Math.PI * 2, sp: .25 + rand() * .7, tw: big ? .35 : .5 };
    });
    draw(performance.now());
  }
  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Night: a little lighter where the eye rests, deeper at the edges.
    const g = ctx.createRadialGradient(W * .55, H * .45, 0, W * .55, H * .45, Math.hypot(W, H) * .62);
    g.addColorStop(0, '#1d2f4e'); g.addColorStop(.6, '#192a4b'); g.addColorStop(1, '#10203f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const s = t / 1000;
    for (const p of stars) {
      const tw = still.matches ? 1 : 1 - p.tw * (.5 + .5 * Math.sin(s * p.sp + p.ph));
      const a = p.a * tw; if (a < .02) continue;
      const x = p.x * W, y = p.y * H;
      if (p.r > .9) {
        const halo = ctx.createRadialGradient(x, y, 0, x, y, p.r * 5);
        halo.addColorStop(0, p.gold ? `rgba(242,217,166,${a * .35})` : `rgba(223,231,255,${a * .3})`); halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo; ctx.fillRect(x - p.r * 5, y - p.r * 5, p.r * 10, p.r * 10);
      }
      ctx.globalAlpha = a; ctx.fillStyle = p.gold ? '#f2d9a6' : '#dfe7ff';
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  function loop(t) {
    raf = 0;
    if (document.hidden || still.matches) return;
    if (t - last > 33) { last = t; draw(t); } // ~30 fps is plenty for a twinkle
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf && !still.matches && !document.hidden) raf = requestAnimationFrame(loop); };
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 120); }, { passive: true });
  document.addEventListener('visibilitychange', start);
  still.addEventListener('change', () => { draw(performance.now()); start(); });
  build(); start();
})();
