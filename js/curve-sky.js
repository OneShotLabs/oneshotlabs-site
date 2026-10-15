/* The AI Curve's night sky: a sparse field of stars in three depths that
   drift with gentle parallax as the visitor scrolls. The planet, drawn on
   its own canvas above, naturally occludes the stars behind it. */
(()=>{'use strict';
const section=document.querySelector('.horizon'),canvas=section?.querySelector('.curve-sky');
if(!section||!canvas)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),ctx=canvas.getContext('2d');
let seed=917;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const stars=Array.from({length:230},()=>{const depth=rnd();return{x:rnd(),y:rnd(),depth,r:.45+1.5*Math.pow(rnd(),3)*(.4+depth),a:.25+.6*Math.pow(rnd(),1.4)*(.35+.65*depth),tw:rnd()*6.28,gold:rnd()<.07};});
let width=0,height=0,ratio=1,frame=0,visible=false,time=0,last=0;
function size(){ratio=Math.min(devicePixelRatio||1,2);width=section.clientWidth;height=section.clientHeight;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);draw();}
function draw(){
  const box=section.getBoundingClientRect(),travel=reduce.matches?0:(box.top+box.height/2-innerHeight/2)/innerHeight;
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
  for(const s of stars){
    // Nearer stars move more; the field stays densest overhead and thins toward the planet.
    const y=s.y*height+travel*s.depth*70,fade=Math.max(0,1-Math.max(0,s.y-.55)/.4);
    if(fade<=0)continue;
    const twinkle=reduce.matches?1:.78+.22*Math.sin(time*(.4+s.depth*.5)+s.tw);
    ctx.globalAlpha=s.a*twinkle*fade;ctx.fillStyle=s.gold?'#f2d9a6':'#dfe7ff';
    ctx.beginPath();ctx.arc(s.x*width,((y%height)+height)%height,s.r,0,6.2832);ctx.fill();
  }
  ctx.globalAlpha=1;
}
function tick(now){frame=0;if(!visible)return;time+=Math.min(.05,(now-(last||now))/1000);last=now;draw();if(!reduce.matches)frame=requestAnimationFrame(tick);}
new IntersectionObserver(([e])=>{visible=e.isIntersecting;last=0;if(visible&&!frame)frame=requestAnimationFrame(tick);},{threshold:0}).observe(section);
new ResizeObserver(size).observe(section);size();
})();
