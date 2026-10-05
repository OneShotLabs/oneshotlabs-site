/* The Curve, presentation layer. The question bank, scoring and flow live in
   ai-curve.js and are untouched; this file only shapes how they are experienced.
   1. Choosing an answer with the pointer advances after a brief beat (Back still works).
   2. The results curve becomes light: a gold path drawn by a travelling spark
      that comes to rest exactly on the curve at the visitor's score, a dotted
      path onward to the frontier, a soft glow beneath, and a quiet ambient
      spark that keeps inviting the visitor forward.
   3. The interpretation opens into two columns across the paper. */
(()=>{'use strict';
const root=document.querySelector('#ai-curve-app');if(!root)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const NS='http://www.w3.org/2000/svg';
const make=(tag,attrs={},parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent?.append(n);return n;};

// ── 1. Auto-advance ─────────────────────────────────────────────────────
// Only pointer choices advance; keyboard users moving through options with
// the arrow keys keep full control and use Next as before.
let pointerChoice=0,advanceTimer=0;
root.addEventListener('pointerdown',e=>{if(e.target.closest('.curve-question-panel .curve-option'))pointerChoice=performance.now();},true);
root.addEventListener('change',e=>{
  if(!e.target.matches('.curve-option input'))return;
  if(performance.now()-pointerChoice>900)return;
  clearTimeout(advanceTimer);
  const label=root.querySelector('.curve-progress-label')?.textContent;
  requestAnimationFrame(()=>root.querySelector('.curve-question-panel')?.classList.add('is-advancing'));
  advanceTimer=setTimeout(()=>{
    // Advance only if the visitor is still on the same question.
    if(root.querySelector('.curve-progress-label')?.textContent!==label)return;
    const next=root.querySelector('.curve-question-panel .curve-next');
    if(next&&!next.disabled)next.click();
  },reduce.matches?120:560);
});

// ── 2. The curve as light ────────────────────────────────────────────────
function pointAtX(path,x){
  // The curve rises monotonically left to right, so a binary search on length finds x.
  const total=path.getTotalLength();let lo=0,hi=total;
  for(let i=0;i<28;i++){const mid=(lo+hi)/2;if(path.getPointAtLength(mid).x<x)lo=mid;else hi=mid;}
  const length=(lo+hi)/2;return{length,point:path.getPointAtLength(length),total};
}
function enhanceCurve(svg){
  if(svg.dataset.light)return;svg.dataset.light='1';
  const base=svg.querySelector('.curve-line'),userDot=svg.querySelector('.curve-user-marker'),userLabel=svg.querySelector('.curve-svg-label-user');
  if(!base||!userDot||!userLabel)return;
  const d=base.getAttribute('d'),userX=Number(userLabel.getAttribute('x'));
  const probe=make('path',{d,fill:'none',stroke:'none'},svg);
  const {length,point,total}=pointAtX(probe,userX);probe.remove();
  const score=(svg.getAttribute('aria-label').match(/score of (\d+)/)||[])[1]||'';
  svg.classList.add('curve-lit');
  const id='cv'+Math.random().toString(36).slice(2,7);
  const defs=make('defs',{},svg);
  const gold=make('linearGradient',{id:id+'g',x1:'0',x2:'1',y1:'0',y2:'0'},defs);
  make('stop',{offset:'0','stop-color':'#d9bf86','stop-opacity':'.55'},gold);make('stop',{offset:'.7','stop-color':'#c6a153'},gold);make('stop',{offset:'1','stop-color':'#b08638'},gold);
  const wash=make('linearGradient',{id:id+'w',x1:'0',x2:'0',y1:'0',y2:'1'},defs);
  make('stop',{offset:'0','stop-color':'#c6a153','stop-opacity':'.14'},wash);make('stop',{offset:'1','stop-color':'#c6a153','stop-opacity':'0'},wash);
  const glow=make('filter',{id:id+'f',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);make('feGaussianBlur',{stdDeviation:'3.2'},glow);
  const reached=make('clipPath',{id:id+'c'},defs);const reachRect=make('rect',{x:'0',y:'0',width:reduce.matches?String(point.x):'0',height:'180'},reached);
  const ahead=make('clipPath',{id:id+'a'},defs);make('rect',{x:String(point.x),y:'0',width:'640',height:'180'},ahead);
  const layer=make('g',{class:'curve-light-layer'});svg.insertBefore(layer,base.nextSibling);
  // A faint wash beneath the whole curve, and a warmer one beneath the ground covered.
  const area=`${d} L 616,156 L 24,156 Z`;
  make('path',{d:area,fill:`url(#${id}w)`,opacity:'.35'},layer);
  make('path',{d:area,fill:`url(#${id}w)`,'clip-path':`url(#${id}c)`},layer);
  // The road ahead: a dotted path from the visitor to the frontier.
  make('path',{d,class:'curve-ahead','clip-path':`url(#${id}a)`},layer);
  // The ground covered: a gold path drawn by the spark.
  const drawn=make('path',{d,class:'curve-reached',stroke:`url(#${id}g)`,'stroke-dasharray':`${length} ${total}`,'stroke-dashoffset':reduce.matches?'0':String(length)},layer);
  const halo=make('path',{d,class:'curve-reached-glow',stroke:'#e2c88e','stroke-dasharray':`${length} ${total}`,'stroke-dashoffset':reduce.matches?'0':String(length),filter:`url(#${id}f)`},layer);
  // A hairline from the visitor down to the axis, carrying the score.
  const drop=make('g',{class:'curve-drop'},layer);
  make('line',{x1:String(point.x),x2:String(point.x),y1:String(point.y+9),y2:'156'},drop);
  const tick=make('text',{x:String(point.x),y:'172','text-anchor':'middle',class:'curve-drop-label'},drop);tick.textContent=score;
  // Snap the marker onto the curve itself.
  // Near the frontier the two labels would collide, so YOU steps aside to the left.
  const crowded=point.x>640-190;
  const settle=()=>{userDot.classList.remove('is-animating');userDot.setAttribute('cx',String(point.x));userDot.setAttribute('cy',String(point.y));
    if(crowded){userLabel.setAttribute('x',String(point.x-14));userLabel.setAttribute('y',String(point.y+4));userLabel.setAttribute('text-anchor','end');}
    else userLabel.setAttribute('y',String(Math.max(14,point.y-16)));};
  settle();setTimeout(settle,80);
  const rings=[0,1].map(i=>make('circle',{cx:String(point.x),cy:String(point.y),r:'6',class:'curve-ring',style:`animation-delay:${i*1.2}s`},layer));
  const spark=make('g',{class:'curve-spark'},layer);
  make('circle',{r:'9',fill:'#f3e2b8',opacity:'.35',filter:`url(#${id}f)`},spark);make('circle',{r:'3.2',fill:'#fffaf0'},spark);
  const trail=[.6,.4,.22].map((o,i)=>make('circle',{r:String(2.6-i*.6),fill:'#e8d29a',opacity:String(o)},layer));
  svg.classList.toggle('is-arrived',reduce.matches);
  if(reduce.matches){spark.remove();trail.forEach(t=>t.remove());return;}
  // The arrival: the spark draws the curve and comes to rest on the visitor.
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,DURATION=2400,start=performance.now()+260;
  const probePath=drawn;
  function frame(now){
    const t=Math.min(1,Math.max(0,(now-start)/DURATION)),e=ease(t),at=length*e;
    drawn.setAttribute('stroke-dashoffset',String(length-at));halo.setAttribute('stroke-dashoffset',String(length-at));
    const p=probePath.getPointAtLength(at);reachRect.setAttribute('width',String(p.x));
    spark.setAttribute('transform',`translate(${p.x},${p.y})`);spark.style.opacity=String(Math.min(1,t*8)*(1-Math.max(0,(t-.92)/.08)));
    trail.forEach((c,i)=>{const q=probePath.getPointAtLength(Math.max(0,at-(i+1)*7));c.setAttribute('cx',q.x);c.setAttribute('cy',q.y);c.style.opacity=String((.6-i*.18)*Math.min(1,t*8)*(1-t));});
    if(t<1)requestAnimationFrame(frame);else{svg.classList.add('is-arrived');trail.forEach(c=>c.remove());wander();}
  }
  requestAnimationFrame(frame);
  // Afterwards, a faint spark travels the road ahead every few seconds:
  // the gap to the frontier, made visible.
  function wander(){
    if(!svg.isConnected)return;
    const lead=make('circle',{r:'2.4',class:'curve-wander'},layer);const t0=performance.now(),span=total-length;
    (function move(now){if(!svg.isConnected)return;const t=Math.min(1,(now-t0)/3600),e=ease(t),p=probePath.getPointAtLength(length+span*e);
      lead.setAttribute('cx',p.x);lead.setAttribute('cy',p.y);lead.style.opacity=String(Math.sin(Math.PI*t)*.9);
      if(t<1)requestAnimationFrame(move);else{lead.remove();setTimeout(wander,2600);}})(t0);
  }
}

// ── 3. The interpretation, across the paper ─────────────────────────────
function widenInterpretation(block){
  if(block.dataset.columns)return;block.dataset.columns='1';
  const kids=[...block.children],split=kids.findIndex((k,i)=>i>0&&k.tagName==='H3'&&/challenge/i.test(k.textContent));
  if(split<1)return;
  const left=document.createElement('div'),right=document.createElement('div');left.className='curve-interp-col';right.className='curve-interp-col curve-interp-challenge';
  kids.slice(0,split).forEach(k=>left.append(k));kids.slice(split).forEach(k=>right.append(k));block.append(left,right);
}

function enhance(){
  const svg=root.querySelector('.curve-result .curve-svg');if(svg)enhanceCurve(svg);
  const interp=root.querySelector('.curve-result .curve-interp');if(interp)widenInterpretation(interp);
}
new MutationObserver(enhance).observe(root,{childList:true,subtree:true});enhance();
})();
