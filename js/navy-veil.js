/* OneShotLabs AI entrance — Gold Seam. */
(() => {
  'use strict';
  const HANDOFF_KEY = 'osl-ai-entrance';
  const NAVY = '#1d2f4e';
  const GOLD = '#c6a153';
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const isAI = /\/ai-consulting(?:\.html)?\/?$/.test(location.pathname);
  let busy = false;

  function freshHandoff() {
    try { return Date.now() - Number(sessionStorage.getItem(HANDOFF_KEY)) < 15000; }
    catch { return false; }
  }

  function makeLayer() {
    const layer = document.createElement('div');
    layer.dataset.navyVeil = 'gold-seam';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:hidden;pointer-events:none;background:transparent;contain:paint';
    ['left', 'right'].forEach(side => {
      const panel = document.createElement('i');
      panel.dataset.panel = side;
      panel.style.cssText = `position:absolute;top:0;bottom:0;${side}:0;width:50.15%;background:${NAVY}`;
      layer.append(panel);
    });
    const seam = document.createElement('i');
    seam.dataset.seam = '';
    seam.style.cssText = `position:absolute;left:50%;top:0;bottom:0;width:1px;background:linear-gradient(transparent,${GOLD} 18%,#fff0c3 50%,${GOLD} 82%,transparent);box-shadow:0 0 18px rgba(198,161,83,.26);transform:scaleY(0)`;
    layer.append(seam);
    document.body.append(layer);
    return layer;
  }

  function timing(duration, easing = 'cubic-bezier(.16,.72,.16,1)', delay = 0) {
    return { duration: reduced ? Math.min(140, duration) : duration, easing, delay: reduced ? 0 : delay, fill: 'both' };
  }

  function reset() {
    document.querySelectorAll('[data-navy-veil]').forEach(el => el.remove());
    document.documentElement.classList.remove('ai-prepaint');
    busy = false;
  }

  async function closeSeam(layer) {
    const left = layer.querySelector('[data-panel="left"]');
    const right = layer.querySelector('[data-panel="right"]');
    const seam = layer.querySelector('[data-seam]');
    seam.animate([{transform:'scaleY(0)'},{transform:'scaleY(1)'}], timing(520,'cubic-bezier(.2,.7,.2,1)',170));
    await Promise.all([
      left.animate([{transform:'translateX(-101%)'},{transform:'translateX(0)'}],timing(680,'cubic-bezier(.7,0,.24,1)')).finished,
      right.animate([{transform:'translateX(101%)'},{transform:'translateX(0)'}],timing(680,'cubic-bezier(.7,0,.24,1)',55)).finished
    ]);
  }

  async function openSeam(layer) {
    const left = layer.querySelector('[data-panel="left"]');
    const right = layer.querySelector('[data-panel="right"]');
    const seam = layer.querySelector('[data-seam]');
    document.documentElement.classList.remove('ai-prepaint');
    seam.animate([{transform:'scaleY(1)',opacity:1},{opacity:1,offset:.32},{transform:'scaleY(.2)',opacity:0}],timing(760,'ease-out'));
    await Promise.all([
      left.animate([{transform:'translateX(0)'},{transform:'translateX(-101%)'}],timing(920,'cubic-bezier(.18,.76,.16,1)',70)).finished,
      right.animate([{transform:'translateX(0)'},{transform:'translateX(101%)'}],timing(920,'cubic-bezier(.18,.76,.16,1)')).finished
    ]);
  }

  function resolveHero() {
    const art = document.querySelector('.fabric .art');
    const copy = document.querySelector('.fabric .copy');
    const network = document.querySelector('.woven-network');
    if (art && !reduced) art.animate([{opacity:.46,transform:'scale(1.025)',filter:'brightness(.72) saturate(.82)'},{opacity:1,transform:'scale(1)',filter:'brightness(1) saturate(1)'}],timing(1450));
    if (copy && !reduced) copy.animate([{opacity:0,transform:'translate3d(0,18px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],timing(880,'cubic-bezier(.16,.76,.18,1)',180));
    if (network && !reduced) network.animate([{opacity:0},{opacity:1}],timing(1100,'ease-out',360));
  }

  addEventListener('pageshow', event => { if (event.persisted) reset(); });

  if (isAI && freshHandoff()) {
    try { sessionStorage.removeItem(HANDOFF_KEY); } catch {}
    const cover = makeLayer();
    document.documentElement.classList.remove('ai-prepaint');
    const art = document.querySelector('.fabric img');
    const ready = art && !art.complete
      ? Promise.race([art.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve,1800))])
      : Promise.resolve();
    ready.then(async () => { resolveHero(); await openSeam(cover); cover.remove(); });
  } else if (isAI) {
    document.documentElement.classList.remove('ai-prepaint');
  }

  document.addEventListener('click', async event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const url = new URL(anchor.href,location.href);
    if (isAI || url.origin !== location.origin || !/^\/ai-consulting(?:\.html)?\/?$/.test(url.pathname)) return;
    event.preventDefault();
    if (busy) return;
    busy = true;
    const cover = makeLayer();
    try { await closeSeam(cover); sessionStorage.setItem(HANDOFF_KEY,String(Date.now())); } catch {}
    location.assign(url.href);
  });
})();
