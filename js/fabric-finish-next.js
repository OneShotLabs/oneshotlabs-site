/* (next) The published rebuild (default since the 2026-11 release). Same globe, same position and
   mapping as fabric-finish.js. The light is carried in high dynamic range:
   the limb, the sun glint and the comet head exceed display white and roll
   off through a soft shoulder instead of clipping, and the limb keeps a
   gentle bloom skirt. A gold mark on the limb shows the visitor's place in
   the quiz. The Earth stays in daylight and its placement is unchanged.
   Geographic sphere mapping inside the existing cinematic horizon composition.
   Surface texture: turban/webgl-earth images/2_no_clouds_4k.jpg (NASA-derived). */
(()=>{'use strict';
const horizon=document.querySelector('.horizon'),fabric=document.querySelector('.fabric'),stage=document.querySelector('.globe-stage'),plane=document.querySelector('.globe-plane'),canvas=document.querySelector('#globe-surface');
const paths=[...document.querySelectorAll('.rim path')],reduce=matchMedia('(prefers-reduced-motion: reduce)'),pause=document.querySelector('#globe-motion');
const cx=2041.21,cy=1874.08,r=1341.01;
// Trace the photographed limb, from its left edge to its right crop.
const start=cx-Math.sqrt(r*r-(1440-cy)**2),endY=cy-Math.sqrt(r*r-(2560-cx)**2);
paths.forEach(p=>{p.setAttribute('d',`M ${start} 1440 A ${r} ${r} 0 0 1 2560 ${endY}`);p.setAttribute('pathLength','1')});
function fit(){const w=stage.clientWidth,h=stage.clientHeight,s=Math.max(w/2560,h/1440),left=(w-2560*s)*(innerWidth<=700?.64:.5),top=(h-1440*s)*.5;plane.style.cssText=`width:${2560*s}px;height:${1440*s}px;left:${left}px;top:${top}px`;
// Keep the photographed planet fallback, but remove its baked-in blue sky.
horizon.querySelector('img.art').style.clipPath=`circle(${r*s}px at ${cx*s+left}px ${cy*s+top}px)`;}
new ResizeObserver(()=>{fit();if(gl){resizeSurface();wake()}}).observe(stage);fit();
let active=false,fabricActive=true,userPaused=false,traceStarted=false,trace=0,clock=0,last=0,frame=0;
let targetX=0,targetY=0,x=0,y=0,turn=0,targetTurn=0,turnVelocity=0,fabricClock=0,drag=false,dragX=0,dragStart=0,gl=null,program=null,uniforms={};
const svg=document.querySelector('.rim'),heads=[24,8,2.6].map((radius,i)=>{const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('r',radius);c.setAttribute('fill',i===2?'#ffffff':'#f5d998');if(i===0)c.setAttribute('filter','url(#rim-bloom)');svg.append(c);return c});
let traceEase=0,headLevel=0;
function paintTrace(){const t=reduce.matches?1:Math.min(trace/4.4,1);const ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;traceEase=traceStarted||reduce.matches?ease:0;headLevel=traceStarted&&!reduce.matches&&t<1?Math.min(t*10,1)*Math.min((1-t)*7,1):0;paths.forEach(p=>p.style.strokeDashoffset=String(1-ease));const point=paths[0].getPointAtLength(paths[0].getTotalLength()*ease);heads.forEach((c,i)=>{c.setAttribute('cx',point.x);c.setAttribute('cy',point.y);c.style.opacity=String(traceStarted&&!reduce.matches&&t<1?Math.min(t*12,1)*Math.min((1-t)*10,1)*[.55,.65,1][i]:0)});stage.dataset.trace=String(ease)}
function wake(){if(!frame&&!document.hidden)frame=requestAnimationFrame(tick)}
function tick(now){frame=0;const dt=Math.min((now-(last||now))/1000,.05);last=now;const running=!reduce.matches&&!userPaused;
if(running){if(active)clock+=dt;x+=(targetX-x)*(1-Math.exp(-dt*2.4));y+=(targetY-y)*(1-Math.exp(-dt*2.4));turnVelocity+=((targetTurn-turn)*12-turnVelocity*7)*dt;turn+=turnVelocity*dt;if(active&&traceStarted)trace+=dt;}
else if(reduce.matches){x=targetX;y=targetY;turn=targetTurn;turnVelocity=0;}
// Paused: the planet stops turning, but the light still eases when the visitor (or the quiz) moves it.
else{x+=(targetX-x)*(1-Math.exp(-dt*1.6));y+=(targetY-y)*(1-Math.exp(-dt*1.6));turn=targetTurn;turnVelocity=0;}
const settle=reduce.matches?1:1-Math.exp(-dt*1.5);place.at+=(place.goal-place.at)*settle;place.on+=(place.onGoal-place.on)*settle;
if(active){paintTrace();if(gl){gl.uniform1f(uniforms.trace,traceEase);gl.uniform1f(uniforms.head,headLevel);gl.uniform1f(uniforms.mark,place.at);gl.uniform1f(uniforms.markOn,place.on);stage.dataset.place=place.on>.01?place.at.toFixed(3):'';gl.uniform1f(uniforms.time,clock);gl.uniform1f(uniforms.angle,turn*.65+(reduce.matches?0:clock*.018));gl.uniform2f(uniforms.light,x*.45+Math.sin(clock*.13)*.1,y*.18);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.rotation=String(turn*.65+(reduce.matches?0:clock*.018));}}
if(running&&active)wake();
else if(active&&(Math.abs(place.goal-place.at)>.0006||Math.abs(place.onGoal-place.on)>.004||Math.abs(targetX-x)>.002))wake();}
// ── The visitor's place on the curve ───────────────────────────────────
// While the questions are answered a gold mark advances along the limb; with
// a result it rests at the visitor's score, and stays there on the hero.
const quizRoot=document.querySelector('#ai-curve-app'),questionnaire=document.querySelector('#questionnaire');
const place={goal:.1,at:.1,onGoal:0,on:0,from:.1,to:.9};
function visibleArc(){
  // Which stretch of the limb is on screen in the current layout.
  // With the quiz open on a wide screen, the copy holds the left; the mark keeps to the limb beside it.
  const clear=document.body.classList.contains('questionnaire-open')&&!document.body.classList.contains('assessment-result')&&innerWidth>700?innerWidth*.64:0;
  const box=plane.getBoundingClientRect(),scale=box.width/2560,a0=Math.atan2(1440-cy,start-cx),a1=Math.atan2(endY-cy,2560-cx);let lo=1,hi=0;
  for(let i=0;i<=80;i++){const s=i/80,a=a0+(a1-a0)*s,px=box.left+(cx+r*Math.cos(a))*scale,py=box.top+(cy+r*Math.sin(a))*scale;
    if(px>clear+24&&px<innerWidth-24&&py>70&&py<innerHeight-40){lo=Math.min(lo,s);hi=Math.max(hi,s);}}
  if(hi-lo>.06){place.from=lo+.02;place.to=hi-.02;}
}
function readPlace(){
  if(!quizRoot)return;
  const label=quizRoot.querySelector('.curve-progress-label'),match=label&&label.textContent.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i);let share=null;
  if(match)share=(Number(match[1])-1)/Number(match[2]);
  else if(quizRoot.querySelector('.curve-result')||!document.body.classList.contains('questionnaire-open')){
    try{const saved=JSON.parse(sessionStorage.getItem(`oneshot-ai-curve-last-result-v3-${quizRoot.dataset.storageNamespace||'live'}`)||'null');if(saved?.scoring)share=Number(saved.scoring.overall)/100;}catch{}
  }
  visibleArc();place.onGoal=share===null?0:1;if(share!==null)place.goal=place.from+(place.to-place.from)*Math.min(1,Math.max(0,share));wake();
}
// While the quiz is open the sky sits behind it; clip that sky to the quiz's own extent so it never covers the page above or below.
function stageClip(){
  if(!questionnaire||questionnaire.hidden)return;const box=questionnaire.getBoundingClientRect();
  document.documentElement.style.setProperty('--quiz-top',Math.max(0,box.top)+'px');document.documentElement.style.setProperty('--quiz-bottom',Math.max(0,innerHeight-box.bottom)+'px');
}
if(quizRoot){new MutationObserver(()=>{readPlace();stageClip();}).observe(quizRoot,{childList:true,subtree:true});
  new MutationObserver(()=>{stageClip();requestAnimationFrame(readPlace);}).observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('scroll',stageClip,{passive:true});addEventListener('resize',()=>{stageClip();readPlace();});}
function observe(){new IntersectionObserver(entries=>{active=entries[0].isIntersecting;last=0;wake();},{threshold:.03}).observe(horizon);new IntersectionObserver(e=>{fabricActive=e[0].isIntersecting;wake()},{threshold:.03}).observe(fabric);
// Observe the globe's visible region, not the first pixel of its upper rim.
const cue=document.createElement('span');cue.style.cssText='position:absolute;top:38%;bottom:4%;left:0;right:0;pointer-events:none';cue.setAttribute('aria-hidden','true');stage.append(cue);
const revealObserver=new IntersectionObserver(entries=>{if(entries[0].intersectionRatio>=.8){traceStarted=true;wake();revealObserver.disconnect()}},{threshold:[0,.8],rootMargin:'0px 0px -3% 0px'});revealObserver.observe(cue);}
observe();
for(const section of [fabric,horizon]){section.addEventListener('pointermove',e=>{if(e.target.closest('.scene-controls,button,a'))return;const b=section.getBoundingClientRect();targetX=Math.max(-1,Math.min(1,(e.clientX-b.left)/b.width*2-1));targetY=Math.max(-1,Math.min(1,(e.clientY-b.top)/b.height*2-1));if(drag){targetTurn=Math.max(-1,Math.min(1,dragStart+(e.clientX-dragX)/b.width*3));document.querySelector('#globe-direction').value=targetTurn;}wake()});section.addEventListener('pointerleave',()=>{targetX=0;targetY=0;wake()});}
stage.addEventListener('pointerdown',e=>{drag=true;dragX=e.clientX;dragStart=targetTurn;stage.setPointerCapture(e.pointerId)});stage.addEventListener('pointerup',()=>drag=false);stage.addEventListener('pointercancel',()=>drag=false);
document.querySelector('#light-direction').addEventListener('input',e=>{targetX=Number(e.target.value);wake()});document.querySelector('#globe-direction').addEventListener('input',e=>{targetTurn=Number(e.target.value);wake()});
pause.addEventListener('click',()=>{userPaused=!userPaused;pause.textContent=userPaused?'Play motion':'Pause motion';pause.setAttribute('aria-pressed',String(userPaused));wake()});
document.querySelector('#replay-rim').addEventListener('click',()=>{trace=0;traceStarted=true;userPaused=false;pause.textContent='Pause motion';pause.setAttribute('aria-pressed','false');paintTrace();wake()});
document.querySelector('#reset-scene').addEventListener('click',()=>{targetX=targetY=targetTurn=0;clock=0;document.querySelector('#light-direction').value=0;document.querySelector('#globe-direction').value=0;wake()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const details=document.querySelector('.scene-controls details');if(details.open){details.open=false;details.querySelector('summary').focus()}}});
// ── Results, in the same night ─────────────────────────────────────────
// The results keep their structure and every word. They are set on the night
// sky instead of ivory paper, under a OneShotLens lockup, and close on the mark.
{
  const quiz=document.querySelector('#ai-curve-app'),section=document.querySelector('#questionnaire'),logo=document.querySelector('.logo-icon svg');
  // The site's own mark, re-identified so its definitions never collide with the header's.
  const mark=prefix=>{const copy=logo.cloneNode(true);copy.querySelectorAll('[id]').forEach(el=>el.id=prefix+el.id);
    copy.querySelectorAll('use').forEach(el=>{for(const attr of ['href','xlink:href']){const ref=el.getAttribute(attr);if(ref)el.setAttribute(attr,ref.replace('#','#'+prefix));}});copy.setAttribute('aria-hidden','true');return copy;};
  function dress(){
    const result=quiz?.querySelector('.curve-result');if(!result||!logo||result.querySelector('.curve-brand-plate'))return;
    const plate=document.createElement('div');plate.className='curve-brand-plate';
    const word=document.createElement('span');word.className='plate-word';word.textContent='OneShotLens';plate.append(mark('plate-'),word);result.prepend(plate);
    const seal=document.createElement('div');seal.className='curve-brand-seal';seal.setAttribute('aria-hidden','true');seal.append(mark('seal-'));result.append(seal);
  }
  // The same sky as the Curve and the questions, carried under the results:
  // the same stars in three depths and the same faint haze, fixed to the
  // window so the layers part as the results scroll past.
  const sky=document.createElement('canvas');sky.className='results-sky';sky.setAttribute('aria-hidden','true');
  const paint=sky.getContext('2d'),still=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width:700px)').matches;
  let seed=917;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const bands=[{count:narrow?150:300,depth:[.05,.3],size:[.3,.55],alpha:[.16,.42]},{count:narrow?110:190,depth:[.35,.8],size:[.45,1.15],alpha:[.25,.72]},{count:narrow?10:20,depth:[.9,1.25],size:[1.6,2.6],alpha:[.10,.22],soft:true}];
  const field=[];for(const band of bands)for(let i=0;i<band.count;i++){const k=Math.pow(rnd(),2.2);field.push({x:rnd(),y:rnd(),depth:band.depth[0]+(band.depth[1]-band.depth[0])*rnd(),r:band.size[0]+(band.size[1]-band.size[0])*k,a:band.alpha[0]+(band.alpha[1]-band.alpha[0])*Math.pow(rnd(),1.4),tw:rnd()*6.28,gold:rnd()<.07,soft:!!band.soft});}
  const mist=Array.from({length:7},()=>({x:rnd(),y:rnd(),r:.18+.24*rnd(),a:.035+.045*rnd(),depth:.05+.12*rnd()}));
  let skyW=0,skyH=0,skyRatio=1,skyFrame=0,skyTime=0,skyLast=0;
  function sizeSky(){skyRatio=Math.min(devicePixelRatio||1,2);skyW=innerWidth;skyH=innerHeight;sky.width=Math.round(skyW*skyRatio);sky.height=Math.round(skyH*skyRatio);drawSky();}
  function drawSky(){
    if(!skyW||!skyH)return;
    // How far the results have scrolled: nearer layers travel further.
    const travel=still.matches?0:-section.getBoundingClientRect().top/Math.max(1,skyH);
    paint.setTransform(skyRatio,0,0,skyRatio,0,0);paint.clearRect(0,0,skyW,skyH);
    for(const m of mist){const x=m.x*skyW,y=(((m.y*skyH-travel*m.depth*160)%skyH)+skyH)%skyH,r=m.r*skyW,g=paint.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,`rgba(62,92,160,${m.a})`);g.addColorStop(1,'rgba(62,92,160,0)');paint.globalAlpha=1;paint.fillStyle=g;paint.fillRect(x-r,y-r,r*2,r*2);}
    for(const s of field){
      const y=(((s.y*skyH-travel*s.depth*150)%skyH)+skyH)%skyH,x=s.x*skyW,twinkle=still.matches?1:.80+.20*Math.sin(skyTime*(.3+s.depth*.4)+s.tw);
      // Thinner behind the reading column, so the copy sits on quiet sky.
      const quiet=!narrow&&Math.abs(x-skyW/2)<Math.min(500,skyW*.34)?.55:1;
      paint.globalAlpha=s.a*twinkle*quiet;paint.fillStyle=s.gold?'#f2d9a6':'#dfe7ff';
      if(s.soft){const g=paint.createRadialGradient(x,y,0,x,y,s.r*2.2);g.addColorStop(0,s.gold?'#f2d9a6':'#dfe7ff');g.addColorStop(1,'rgba(223,231,255,0)');paint.fillStyle=g;paint.fillRect(x-s.r*2.2,y-s.r*2.2,s.r*4.4,s.r*4.4);}
      else{paint.beginPath();paint.arc(x,y,s.r,0,6.2832);paint.fill();}
    }
    paint.globalAlpha=1;
  }
  function skyTick(now){skyFrame=0;if(!section.classList.contains('has-result')||document.hidden)return;skyTime+=Math.min(.05,(now-(skyLast||now))/1000);skyLast=now;drawSky();if(!still.matches)skyFrame=requestAnimationFrame(skyTick);}
  function paintSky(){
    if(!section.classList.contains('has-result'))return;if(!sky.isConnected){section.prepend(sky);sizeSky();}
    stageClip();skyLast=0;if(!skyFrame)skyFrame=requestAnimationFrame(skyTick);
  }
  if(quiz&&section){new MutationObserver(()=>{dress();requestAnimationFrame(paintSky);}).observe(quiz,{childList:true,subtree:true});
    new MutationObserver(()=>requestAnimationFrame(paintSky)).observe(section,{attributes:true,attributeFilter:['class']});
    addEventListener('resize',()=>{if(sky.isConnected)sizeSky();});addEventListener('scroll',()=>{if(still.matches&&sky.isConnected)drawSky();},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)paintSky();});dress();}
}
// Once the scene controls are open there must be an obvious way to put them away again.
{const details=document.querySelector('.scene-controls details'),panel=details?.querySelector('.direction-panel');
 if(panel){const hide=document.createElement('button');hide.type='button';hide.className='direction-close';hide.textContent='Hide controls';
  hide.addEventListener('click',()=>{details.open=false;details.querySelector('summary').focus();});panel.append(hide);
  // A click anywhere outside the panel also closes it.
  document.addEventListener('pointerdown',e=>{if(details.open&&!details.contains(e.target))details.open=false;});}}
reduce.addEventListener('change',()=>{paintTrace();wake()});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake()});
paintTrace();
// The still remains visible if the browser cannot create or load the WebGL layer.
function resizeSurface(){const width=Math.min(2560,Math.round(plane.clientWidth*Math.min(devicePixelRatio,1.5)));
if(canvas.width!==width){canvas.width=width;canvas.height=Math.round(width*1440/2560)}gl.viewport(0,0,canvas.width,canvas.height);}
const source=new Image();source.crossOrigin='anonymous';
source.onload=()=>{try{
gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:'low-power'});if(!gl)return;
const vertex=`attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}`;
const fragment=`precision highp float;varying vec2 uv;uniform sampler2D image;uniform sampler2D earth;uniform sampler2D clouds;uniform float angle;uniform vec2 light;
uniform float trace;uniform float head;uniform float time;uniform vec2 arc;uniform float mark;uniform float markOn;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 px=uv*vec2(2560.,1440.);vec2 q=(px-vec2(2041.21,1874.08))/1341.01;float d=dot(q,q),radius=sqrt(d);
vec3 color=vec3(0.);float a=0.;
vec3 l=normalize(vec3(-.5+light.x,.8-light.y,1.1));
// Sunward direction across the disc: the limb burns brightest where the light grazes it.
vec2 limbDir=q/max(radius,.0001);float sunward=max(dot(limbDir*vec2(1.,-1.),normalize(l.xy)),0.);
if(d<1.){float z=sqrt(1.-d);vec3 normal=vec3(q.x,-q.y,z);
float tilt=-.28;vec3 tilted=vec3(normal.x*cos(tilt)-normal.y*sin(tilt),normal.x*sin(tilt)+normal.y*cos(tilt),normal.z);
float latitude=-.26;float ny=tilted.y*cos(latitude)+tilted.z*sin(latitude);float nz=tilted.z*cos(latitude)-tilted.y*sin(latitude);
float longitude=atan(tilted.x,nz)-1.83+angle;vec2 geo=vec2(fract(longitude/6.2831853+.5),.5-asin(clamp(ny,-1.,1.))/3.14159265);
vec3 land=texture2D(earth,geo).rgb;float lum=dot(land,vec3(.2126,.7152,.0722));land=mix(vec3(lum),land,.64);
float ocean=1.-smoothstep(.015,.09,land.g-land.b);land=mix(land,land*vec3(.38,.59,.69),ocean*.65);
float ndl=dot(normal,l);
// A soft terminator: light wraps a little past the edge of day.
float day=smoothstep(-.10,.32,ndl),diffuse=clamp((ndl+.10)/1.10,0.,1.);
vec2 cloudUV=vec2(fract(geo.x+angle*.015),geo.y);vec4 cloud=texture2D(clouds,cloudUV);float cloudAmount=cloud.r*cloud.a;
// Clouds cast faint shadows, offset away from the light.
vec4 shade=texture2D(clouds,cloudUV+l.xy*vec2(-.0035,.0035));float shadow=shade.r*shade.a*.32*day;
color=land*(.15+.92*diffuse)*vec3(.72,.87,1.)*(1.-shadow);
color=mix(color,vec3(.75,.83,.90)*(.22+.82*diffuse),cloudAmount*.74);
// Sun glint on open water only: a tight core and a broad sheen.
vec3 h=normalize(l+vec3(0.,0.,1.));float nh=max(dot(normal,h),0.);
// The sun on open water: a small, tight highlight only. The broad sheen read as an unexplained white patch.
float glint=(pow(nh,260.)*.55+pow(nh,60.)*.012)*ocean*(1.-cloudAmount)*day;
color+=vec3(1.,.95,.85)*glint;
// A warm band where day turns to night.
float dusk=exp(-pow(ndl/.09,2.))*(1.-cloudAmount*.5);color+=vec3(1.,.56,.26)*dusk*.10;
// Atmosphere: blue haze thickening toward the limb, brighter on the lit side.
float fresnel=pow(1.-z,2.6);color=mix(color,vec3(.46,.68,1.)*(.35+.9*day),fresnel*(.38+.32*sunward));
color+=vec3(1.,.93,.80)*pow(1.-z,7.)*sunward*.55;
a=smoothstep(0.,.012,z);color*=a;}
// Outside the limb: a thin, breathing atmosphere on the night sky.
float outside=max(radius-1.,0.);
float halo=(exp(-outside/.010)*.55+exp(-outside/.045)*.16)*(.45+.75*sunward)*step(1.,radius);
color+=vec3(.50,.72,1.)*halo;
// The limb light, traced along the visible arc. White core, gold glow, a soft
// comet head with a four-point glint, and a slow shimmer once it has settled.
float theta=atan(q.y,q.x),s=(theta-arc.x)/(arc.y-arc.x);
float edge=radius-1.;float core=exp(-pow(edge/.0011,2.)),glow=exp(-pow(edge/.0042,2.)),bloom=exp(-pow(edge/.016,2.));
float lit=1.-smoothstep(trace-.012,trace+.002,s);lit*=step(0.,s)*step(s,1.);
float tail=lit*mix(1.,exp(-(trace-s)/.10),head);
float shimmer=.86+.14*sin(s*22.-time*.55);
float lightAlong=tail*shimmer*(.62+.55*sunward);
// Scene-referred: the core is brighter than white; a wide skirt is its bloom.
float skirt=exp(-abs(edge)/.045)*step(0.,edge)+exp(-abs(edge)/.020)*step(edge,0.);
vec3 rimLight=vec3(1.,.99,.95)*core*2.6+vec3(1.,.80,.44)*glow*.86+vec3(.98,.78,.48)*bloom*.26+vec3(1.,.84,.58)*skirt*.075;
// The visitor's place on the curve: a gold thread laid along the limb from
// where it begins, and a node at its head. The white limb yields to it.
float laid=exp(-pow(edge/.0030,2.))*(1.-smoothstep(mark-.03,mark+.004,s))*step(0.,s);
vec2 placeAt=vec2(cos(mix(arc.x,arc.y,mark)),sin(mix(arc.x,arc.y,mark)));vec2 pd=(q-placeAt)*1341.01;
float node=exp(-dot(pd,pd)/30.)*2.4+exp(-dot(pd,pd)/520.)*.42;
vec3 gold=(vec3(1.,.76,.34)*laid*1.15+vec3(1.,.86,.56)*node)*markOn;
color+=rimLight*lightAlong*(1.-.8*min(1.,laid+node)*markOn)+gold;
vec2 headPos=vec2(cos(mix(arc.x,arc.y,trace)),sin(mix(arc.x,arc.y,trace)));vec2 hd=(q-headPos)*1341.01;
float coma=exp(-dot(hd,hd)/90.)*1.4+exp(-dot(hd,hd)/1400.)*.42;
float spikes=(exp(-abs(hd.y)*.9)*exp(-abs(hd.x)*.035)+exp(-abs(hd.x)*.9)*exp(-abs(hd.y)*.035))*.55;
color+=vec3(1.,.93,.78)*(coma*1.5+spikes)*head;
float glowAlpha=clamp(max(max(max(halo,rimLight.r*lightAlong),(coma+spikes)*head),gold.r),0.,1.);
a=max(a,glowAlpha);
// Highlight shoulder: values above .82 ease toward white rather than clip,
// and the very brightest lose a little colour, as on film.
float peak=max(color.r,max(color.g,color.b));
if(peak>.82){float rolled=.82+.18*(1.-exp(-(peak-.82)/.36));color=mix(color*(rolled/peak),vec3(rolled),smoothstep(1.,3.,peak)*.55);}
// Dither the gentle gradients so they never band.
color+=(hash(gl_FragCoord.xy+time)-.5)/255.*a;
gl_FragColor=vec4(color,a);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Globe shader link failed');gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
gl.uniform1i(gl.getUniformLocation(program,'image'),0);
const globeTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,globeTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,earth);gl.uniform1i(gl.getUniformLocation(program,'earth'),1);
const cloudTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,cloudTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,clouds);gl.uniform1i(gl.getUniformLocation(program,'clouds'),2);
// Render at a capped density; retain the high-resolution source texture.
resizeSurface();
uniforms.mark=gl.getUniformLocation(program,'mark');uniforms.markOn=gl.getUniformLocation(program,'markOn');
uniforms.angle=gl.getUniformLocation(program,'angle');uniforms.trace=gl.getUniformLocation(program,'trace');uniforms.head=gl.getUniformLocation(program,'head');uniforms.time=gl.getUniformLocation(program,'time');
// The visible limb runs from the left crop to the right edge; the shader traces it by angle.
const arcStart=Math.atan2((1440-cy)/r,(start-cx)/r),arcEnd=Math.atan2((endY-cy)/r,(2560-cx)/r);gl.uniform2f(gl.getUniformLocation(program,'arc'),arcStart,arcEnd);gl.uniform1f(uniforms.trace,0);gl.uniform1f(uniforms.head,0);
stage.classList.add('gl-rim');uniforms.light=gl.getUniformLocation(program,'light');gl.uniform1f(uniforms.angle,0);gl.uniform2f(uniforms.light,0,0);gl.drawArrays(gl.TRIANGLES,0,6);canvas.classList.add('ready');readPlace();wake();
}catch(error){canvas.classList.remove('ready');gl=null;console.warn('Using still globe fallback:',error.message)}};
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.classList.remove('ready');gl=null});
const earth=new Image();earth.onload=()=>{source.src=horizon.querySelector('img.art').src};earth.onerror=()=>console.warn('Earth texture unavailable; retaining still fallback.');const clouds=new Image();clouds.onload=()=>{earth.src=(Math.min(screen.width,screen.height)<=820||innerWidth<=900)?'images/earth-surface-2k.jpg':'images/earth-surface-4k.jpg'};clouds.onerror=()=>console.warn('Cloud texture unavailable; retaining still fallback.');clouds.src=(Math.min(screen.width,screen.height)<=820||innerWidth<=900)?'images/earth-clouds-2k.webp':'images/earth-clouds-4k.webp';
})();
