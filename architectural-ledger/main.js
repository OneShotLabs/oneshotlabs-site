const DEAL = Object.freeze({
  asset: 'Alder Commerce Center', type: 'Multi-Tenant Industrial', area: '345,000 RSF',
  price: '$125.0M', cap: '5.40%', irr: '15.8%', multiple: '1.99x', debt: '$81.25M',
  debtYield: '8.31%', dscr: '1.35x', ltv: '65.0%', noi: '$6.75M', capex: '$2.40M'
});

const documents = [
  ['01', 'Rent Roll & Lease Abstracts', 'NOI $6,741,282'],
  ['02', 'T-12 Operating Statement', 'NOI $6,752,904'],
  ['03', 'Appraisal & Market Comps', 'NOI $6,748,000'],
  ['04', 'Debt Terms', '$81.25M · 65.0% LTV'],
  ['05', 'PCA & Capital Plan', '$2.40M Near-Term Capital']
];

const metrics = [
  ['Purchase Price', DEAL.price], ['Going-In Cap', DEAL.cap], ['Levered IRR', DEAL.irr],
  ['Equity Multiple', DEAL.multiple], ['Debt', DEAL.debt], ['Debt Yield', DEAL.debtYield],
  ['DSCR', DEAL.dscr], ['LTV', DEAL.ltv]
];

document.querySelector('#app').innerHTML = `
  <section class="hero" aria-label="OneShotLabs transforms investment evidence into judgment">
    <canvas id="depth" aria-hidden="true"></canvas>
    <div class="studio-light key" aria-hidden="true"></div><div class="studio-light rim" aria-hidden="true"></div>
    <header class="brand"><span class="prototype">AI / PROTOTYPE</span></header>
    <div class="headline"><p>INVESTMENT INTELLIGENCE</p><h1>From information<br><em>to judgment.</em></h1></div>
    <div class="stage" id="stage">
      <div class="mandate scene" data-scene="mandate">
        <p class="eyebrow">THE MANDATE</p>
        <p class="mandate-copy"><span>Analyze this investment opportunity.</span> <span>Validate the underwriting, identify material risks,</span> <span>and prepare a decision-ready recommendation.</span></p>
        <i></i>
      </div>
      <div class="ledger scene" data-scene="evidence">
        <svg class="connections" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
          <path class="gold-path path-a" d="M210 210 C390 205 500 300 675 308 S825 310 870 310" />
          <path class="gold-path path-b" d="M188 390 C340 350 490 430 650 385 S800 360 905 420" />
          <circle cx="210" cy="210" r="4"/><circle cx="500" cy="300" r="4"/><circle cx="870" cy="310" r="4"/>
        </svg>
        <div class="planes">${documents.map((d, i) => `<article class="plane p${i + 1}"><i class="glass-edge"></i><div class="plate-content"><p><b>${d[0]}</b> ${d[1]}</p><strong>${d[2]}</strong><div class="rows"><i></i><i></i><i></i><i></i></div><span class="audit-seal">AUDITED</span></div></article>`).join('')}</div>
        <div class="validation evidence-item" tabindex="0"><span>✓ VALIDATED</span><strong>${DEAL.noi}</strong><small>YEAR 1 NOI<br>Rent roll · T-12 · Appraisal</small><aside>Rent Roll: $6,741,282<br>T-12: $6,752,904<br>Appraisal: $6,748,000</aside></div>
        <div class="exception evidence-item" tabindex="0"><span>MATERIAL EXCEPTION</span><strong>${DEAL.capex}</strong><p>Near-term capital requirement omitted from sponsor underwriting.</p><small>Property Condition Assessment · §4.2</small><aside>Sponsor UW: $0<br>PCA: $2.40M</aside></div>
        <div class="rate"><span>HEDGE EXPIRY</span><strong>YEAR 4 RATE EXPOSURE</strong><p>Replacement hedge cost is not reflected in the base underwriting.</p></div>
      </div>
      <article class="decision scene" data-scene="decision">
        <header><p>ACQUISITION REVIEW</p><h2>${DEAL.asset}</h2><span>${DEAL.type} · ${DEAL.area}</span></header>
        <div class="verdict"><small>INVESTMENT CASE</small><strong>SUPPORTED</strong><span>2 material items require IC judgment</span></div>
        <dl>${metrics.map(([k,v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <div class="items"><p>MATERIAL ITEMS</p><div><b>01 — CAPITAL PLAN</b><span>${DEAL.capex} PCA requirement absent from sponsor case</span></div><div><b>02 — RATE EXPOSURE</b><span>Replacement hedge assumption required after Year 3</span></div></div>
        <footer><b>SOURCE CONFIDENCE — HIGH</b><span>✓ Core property economics corroborated across source documents</span></footer>
      </article>
      <div class="mobile-story" aria-hidden="true">
        <div>THE MANDATE<small>Validate the underwriting</small></div><i>↓</i>
        <div>3 SOURCES AGREE<strong>${DEAL.noi} NOI</strong></div><i>↓</i>
        <div>1 CONFLICT FOUND<strong>${DEAL.capex}</strong></div><i>↓</i>
        <div>RATE EXPOSURE<small>After Year 3</small></div><i>↓</i>
        <div>INVESTMENT CASE<strong>SUPPORTED</strong><small>2 items require judgment</small></div>
      </div>
    </div>
    <nav class="timeline" aria-label="Animation progress"><button data-jump="0">01 MANDATE</button><button data-jump="3">02 EXPAND</button><button data-jump="8">03 ALIGN</button><button data-jump="10">04 CHALLENGE</button><button data-jump="14">05 DECIDE</button><i></i></nav>
    <button class="motion-toggle" id="motionToggle" aria-pressed="false">PAUSE</button>
  </section>`;

const hero = document.querySelector('.hero');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let start = performance.now(), pausedAt = 0, paused = reduced.matches, completed = false;
const duration = 17;

function sceneAt(t) {
  if (t < 3) return 'mandate';
  if (t < 8) return 'evidence';
  if (t < 10) return 'validate';
  if (t < 12) return 'challenge';
  if (t < 13) return 'rate';
  if (t < 14) return 'compress';
  return 'decision';
}

function render(now) {
  const t = reduced.matches ? 15 : paused ? pausedAt : ((now - start) / 1000) % duration;
  if (!completed && t > 16.7) completed = true;
  hero.dataset.phase = sceneAt(t);
  hero.style.setProperty('--progress', `${(t / duration) * 100}%`);
  hero.style.setProperty('--t', t.toFixed(2));
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

function setPaused(value) {
  if (value === paused) return;
  if (value) pausedAt = ((performance.now() - start) / 1000) % duration;
  else start = performance.now() - pausedAt * 1000;
  paused = value;
  document.querySelector('#motionToggle').textContent = paused ? 'PLAY' : 'PAUSE';
  document.querySelector('#motionToggle').setAttribute('aria-pressed', String(paused));
}
document.querySelector('#motionToggle').addEventListener('click', () => setPaused(!paused));
document.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => {
  setPaused(true);
  pausedAt = +b.dataset.jump;
  hero.dataset.phase = sceneAt(pausedAt);
  hero.style.setProperty('--progress', `${(pausedAt / duration) * 100}%`);
}));
document.querySelectorAll('.evidence-item').forEach(el => {
  el.addEventListener('mouseenter', () => completed && setPaused(true));
  el.addEventListener('focus', () => completed && setPaused(true));
});

// Lightweight progressive WebGL atmosphere: no text or financial truth is rendered here.
const canvas = document.querySelector('#depth');
const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
if (gl) {
  const vert = `attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`;
  const frag = `precision mediump float; uniform vec2 r; uniform float t; void main(){vec2 uv=gl_FragCoord.xy/r; vec2 q=uv-vec2(.72,.48); float rake=.016/(abs(q.y+q.x*.15+sin(uv.x*4.+t*.04)*.012)+.022); float caustic=.009/(abs(length(q)-.34)+.025); float falloff=smoothstep(.9,.08,length(q)); vec3 brass=vec3(.773,.627,.349); vec3 navy=vec3(.114,.184,.306); vec3 col=mix(navy,brass,.65)*((rake*.14+caustic*.09)*falloff); gl_FragColor=vec4(col,min(.22,(rake+caustic)*.11));}`;
  const shader = (type, src) => { const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return s; };
  const prog=gl.createProgram(); gl.attachShader(prog,shader(gl.VERTEX_SHADER,vert)); gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,frag)); gl.linkProgram(prog); gl.useProgram(prog);
  const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(prog,'p'); gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  const resize=()=>{const d=Math.min(devicePixelRatio,1.5); canvas.width=innerWidth*d; canvas.height=innerHeight*d; gl.viewport(0,0,canvas.width,canvas.height);}; addEventListener('resize',resize); resize();
  (function draw(n){gl.uniform2f(gl.getUniformLocation(prog,'r'),canvas.width,canvas.height); gl.uniform1f(gl.getUniformLocation(prog,'t'),n/1000); gl.drawArrays(gl.TRIANGLES,0,6); requestAnimationFrame(draw)})(0);
} else hero.classList.add('no-webgl');
