/* The AI Curve's night sky (next). Preview build, loaded only at /ai?next.
   The same night as The Fabric continues here: stars in three depths that
   drift with parallax as the visitor scrolls, and a very faint navy haze
   high in the sky. The planet, drawn on its own canvas above, occludes the
   stars behind it; its position and limb light are untouched. */
(()=>{'use strict';
const section=document.querySelector('.horizon'),canvas=section?.querySelector('.curve-sky');
if(!section||!canvas)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),ctx=canvas.getContext('2d'),phone=matchMedia('(max-width:700px)').matches;
let seed=917;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
// Far dust, a middle field, and a few near, soft stars.
const bands=[{count:phone?150:300,depth:[.05,.3],size:[.3,.55],alpha:[.16,.42],soft:false},{count:phone?110:190,depth:[.35,.8],size:[.45,1.15],alpha:[.25,.72],soft:false},{count:phone?10:20,depth:[.9,1.25],size:[1.6,2.6],alpha:[.10,.22],soft:true}];
const stars=[];
for(const band of bands)for(let i=0;i<band.count;i++){const k=Math.pow(rnd(),2.2);stars.push({x:rnd(),y:rnd(),depth:band.depth[0]+(band.depth[1]-band.depth[0])*rnd(),r:band.size[0]+(band.size[1]-band.size[0])*k,a:band.alpha[0]+(band.alpha[1]-band.alpha[0])*Math.pow(rnd(),1.4),tw:rnd()*6.28,gold:rnd()<.07,soft:band.soft});}
// Haze: a few broad navy clouds, painted once and drifted as the farthest layer.
const clouds=Array.from({length:7},()=>({x:rnd(),y:.04+.42*rnd(),r:.16+.22*rnd(),a:.035+.045*rnd()}));
let width=0,height=0,ratio=1,frame=0,visible=false,time=0,last=0,haze=null;
function paintHaze(){
  if(!width||!height){haze=null;return;}
  haze=document.createElement('canvas');haze.width=Math.max(2,Math.round(width/4));haze.height=Math.max(2,Math.round(height/4));
  const h=haze.getContext('2d');
  for(const c of clouds){const x=c.x*haze.width,y=c.y*haze.height,r=c.r*haze.width,g=h.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,`rgba(62,92,160,${c.a})`);g.addColorStop(1,'rgba(62,92,160,0)');h.fillStyle=g;h.fillRect(x-r,y-r,r*2,r*2);}
  // The haze gathers below the top edge, so the section opens on the same clear midnight the band ends on.
  const veil=h.createLinearGradient(0,0,0,haze.height);veil.addColorStop(0,'rgba(0,0,0,0)');veil.addColorStop(.2,'rgba(0,0,0,1)');veil.addColorStop(1,'rgba(0,0,0,1)');
  h.globalCompositeOperation='destination-in';h.fillStyle=veil;h.fillRect(0,0,haze.width,haze.height);h.globalCompositeOperation='source-over';
}
function size(){ratio=Math.min(devicePixelRatio||1,2);width=section.clientWidth;height=section.clientHeight;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);paintHaze();draw();}
function draw(){
  if(!width||!height)return;
  const box=section.getBoundingClientRect(),travel=reduce.matches?0:(box.top+box.height/2-innerHeight/2)/innerHeight;
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
  if(haze){ctx.globalAlpha=1;ctx.drawImage(haze,0,travel*8,width,height);}
  for(const s of stars){
    // Nearer stars move more; the field stays densest overhead and thins toward the planet.
    const y=s.y*height+travel*s.depth*70,fade=Math.max(0,1-Math.max(0,s.y-.55)/.4);
    if(fade<=0)continue;
    const twinkle=reduce.matches?1:.80+.20*Math.sin(time*(.3+s.depth*.4)+s.tw),py=((y%height)+height)%height;
    ctx.globalAlpha=s.a*twinkle*fade;ctx.fillStyle=s.gold?'#f2d9a6':'#dfe7ff';
    if(s.soft){const g=ctx.createRadialGradient(s.x*width,py,0,s.x*width,py,s.r*2.2);g.addColorStop(0,s.gold?'#f2d9a6':'#dfe7ff');g.addColorStop(1,'rgba(223,231,255,0)');ctx.fillStyle=g;ctx.fillRect(s.x*width-s.r*2.2,py-s.r*2.2,s.r*4.4,s.r*4.4);}
    else{ctx.beginPath();ctx.arc(s.x*width,py,s.r,0,6.2832);ctx.fill();}
  }
  ctx.globalAlpha=1;
}
function tick(now){frame=0;if(!visible||document.hidden)return;time+=Math.min(.05,(now-(last||now))/1000);last=now;draw();if(!reduce.matches)frame=requestAnimationFrame(tick);}
new IntersectionObserver(([e])=>{visible=e.isIntersecting;last=0;if(visible&&!frame)frame=requestAnimationFrame(tick);},{threshold:0}).observe(section);
document.addEventListener('visibilitychange',()=>{last=0;if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);});
new ResizeObserver(size).observe(section);size();
})();

/* The band between the system and The Curve. It was a flat navy interval;
   here the night deepens through it and the stars begin, so the page reads
   as one continuous sky from the silk down to the planet. Styles are set
   inline so the approved page, which never loads this file, is untouched. */
(()=>{'use strict';
const band=document.querySelector('.navy-interval.method-to-globe'),horizon=document.querySelector('.horizon');
if(!band||!horizon)return;
band.style.background='linear-gradient(180deg,#1d2f4e 0%,#152547 34%,#0f1d3c 78%,#0f1d3c 100%)';
// The Curve now opens at the same midnight the band ends on.
horizon.style.background='linear-gradient(#0f1d3c 0%,#0e1b37 34%,#0c1834 58%,#13234a 82%,#1d2f4e 100%)';
const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';band.prepend(canvas);
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),ctx=canvas.getContext('2d'),phone=matchMedia('(max-width:700px)').matches;
let seed=2611;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const stars=Array.from({length:phone?90:210},()=>{const depth=rnd();return{x:rnd(),y:rnd(),depth,r:.4+1.1*Math.pow(rnd(),3)*(.4+depth),a:.28+.62*Math.pow(rnd(),1.4)*(.35+.65*depth),tw:rnd()*6.28,gold:rnd()<.07};});
let width=0,height=0,ratio=1,frame=0,visible=false,time=0,last=0;
function size(){ratio=Math.min(devicePixelRatio||1,2);width=band.clientWidth;height=band.clientHeight;canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));draw();}
function draw(){
  const box=band.getBoundingClientRect(),travel=reduce.matches?0:(box.top+box.height/2-innerHeight/2)/innerHeight;
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
  for(const s of stars){
    // Stars emerge as the navy deepens: none at the top edge, the full field by the foot.
    const emerge=Math.min(1,Math.max(0,(s.y-.04)/.34)),y=s.y*height+travel*s.depth*30;
    if(emerge<=0||y<0||y>height)continue;
    const twinkle=reduce.matches?1:.80+.20*Math.sin(time*(.3+s.depth*.4)+s.tw);
    ctx.globalAlpha=s.a*twinkle*emerge;ctx.fillStyle=s.gold?'#f2d9a6':'#dfe7ff';
    ctx.beginPath();ctx.arc(s.x*width,y,s.r,0,6.2832);ctx.fill();
  }
  ctx.globalAlpha=1;
}
function tick(now){frame=0;if(!visible||document.hidden)return;time+=Math.min(.05,(now-(last||now))/1000);last=now;draw();if(!reduce.matches)frame=requestAnimationFrame(tick);}
new IntersectionObserver(([e])=>{visible=e.isIntersecting;last=0;if(visible&&!frame)frame=requestAnimationFrame(tick);},{threshold:0}).observe(band);
document.addEventListener('visibilitychange',()=>{last=0;if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);});
new ResizeObserver(size).observe(band);size();
})();
