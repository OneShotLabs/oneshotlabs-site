/* OneShotLabs spatial instrument. Dependency-free, scoped, event-driven Canvas + semantic DOM. */
(()=>{'use strict';
const root=document.querySelector('.osl-experiment'),stage=root.querySelector('.stage'),canvas=stage.querySelector('canvas'),ctx=canvas.getContext('2d'),layer=stage.querySelector('.node-layer');
const raw=[
['ChatGPT','THINK','Model','Strategy, positioning, brand, creative direction, brainstorming, ad concepts and workflow architecture.',-3.45,-.75,.25],
['Claude / Claude Code','BUILD','Model & implementation','Site development, implementation, newsletter, AI Curve, interface iterations and initial architecture.',-1.8,-1.5,-.3],
['Gemini','THINK','Model','Ideation and creative exploration.',-3.9,.25,-.35],
['X','THINK','Influence','Frontier awareness and product, design and AI discourse.',-4.5,-1.4,-.6],
['Pinterest','DESIGN','Influence','Visual inspiration and reference gathering.',-.95,-2.15,-.45],
['Claude Design','DESIGN','Tool','UI and design exploration.',.65,-1.95,.2],
['Figma','DESIGN','Tool','Interface and design-system work.',2,-1.4,.55],
['Google AI Studio','CREATE','Tool','Hero imagery and generative prototyping.',2.6,-.45,-.4],
['Higgsfield','CREATE','Tool','AI video and cinematic experimentation.',3.1,.4,.35],
['ElevenLabs','CREATE','Tool','Voice and sound.',2.15,1.2,.65],
['DaVinci Resolve','CREATE','Tool','Video editing and assembly.',3.65,1.8,-.4],
['GitHub','BUILD','Platform','Source control and canonical development history.',-2.6,1.6,.2],
['Netlify','PUBLISH','Platform','Deployment and preview environments.',-.95,2,.25],
['Cloudflare','PUBLISH','Platform','Domain and infrastructure.',.7,2.25,-.35],
['Google Drive','PUBLISH','Repository','Asset and operational repository.',-2.8,2.35,-.7],
['Daydream','CREATE','TESTED → MOVED ON','A video workflow explored, then left outside the lasting system.',3.1,-2.05,-.9],
['Adobe','DESIGN','TESTED → MOVED ON','A design workflow explored, then left outside the preferred system.',4,-1.6,-.6],
['Human Judgment','JUDGMENT','The deciding layer','Taste, context, responsibility, standards and decision-making determine what becomes part of the final system.',-1.05,.42,.5],
['Descript','CREATE','Supporting experiment','Audio and video workflow experimentation.',4.25,.8,-.6],
['Buttondown / Beehiiv','PUBLISH','Supporting experiment','Newsletter infrastructure explored while developing the publishing system.',1.3,2.8,-.9]
];
const nodes=raw.map((a,i)=>({i,name:a[0],territory:a[1],type:a[2],desc:a[3],p:{x:a[4],y:a[5],z:a[6]},dormant:i===15||i===16}));
const links=[[3,0],[0,1],[0,2],[0,5],[2,7],[4,5],[5,6],[1,11],[11,12],[12,13],[14,11],[7,8],[8,9],[9,10],[18,10],[12,19],[6,17],[10,17],[13,17],[0,17],[1,17],[2,17],[15,8],[16,6]];
const origin={x:-4.6,y:-.25,z:.1},center={x:0,y:0,z:0};
let width=0,height=0,scale=1,mobile=false,rotation={x:-.13,y:-.13,z:-.025},velocity={x:0,y:0,z:0},drag=null,selected=null,hover=null,territory='all',raf=0,timer=0,visible=false,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,paused=false,time=0,last=0,introDone=false,settling=false;
const rest={...rotation},motionQuery=matchMedia('(prefers-reduced-motion:reduce)'),logo=new Image();logo.src='assets/ai-network/oneshotlabs-mark.svg';logo.onload=()=>{prepareLogo();wake()};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const signalSpeed=1.3;
function world(p){if(!mobile)return p;return {x:p.x*.52,y:p.y*1.1,z:p.z*.8}}
function rotate(p){let a=world(p),x=a.x*Math.cos(rotation.y)+a.z*Math.sin(rotation.y),z=-a.x*Math.sin(rotation.y)+a.z*Math.cos(rotation.y),y=a.y*Math.cos(rotation.x)-z*Math.sin(rotation.x);z=a.y*Math.sin(rotation.x)+z*Math.cos(rotation.x);return{x:x*Math.cos(rotation.z)-y*Math.sin(rotation.z),y:x*Math.sin(rotation.z)+y*Math.cos(rotation.z),z}}
function project(p){const q=rotate(p),f=9/(9-q.z);return{x:width*.5+q.x*scale*f,y:height*.46+q.y*scale*f,z:q.z,f}}
function blend(a,b,t){return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t}}
function geometry(a,b,i){let mid=blend(a,b,.5);mid.y+=(i%2?1:-1)*(.28+Math.abs(a.x-b.x)*.07);mid.z+=.55;return[a,mid,b]}
function curvePoint(g,t){return blend(blend(g[0],g[1],t),blend(g[1],g[2],t),t)}
function focusNode(){return selected??hover}
function connected(i,f){return i===f||links.some(([a,b])=>a===f&&b===i||b===f&&a===i)}
function belongs(n){return territory==='all'||n.territory===territory||([0,1].includes(n.i)&&['THINK','DESIGN','BUILD'].includes(territory))}
function show(i){const n=nodes[i];root.querySelector('#detail-type').textContent=n.type+' / '+([0,1].includes(i)?'THINK · DESIGN · BUILD':n.territory);root.querySelector('#detail-name').textContent=n.name;root.querySelector('#detail-copy').textContent=n.desc;root.querySelector('.node-card').hidden=false;}
function clear(){selected=hover=null;nodes.forEach(n=>n.button.setAttribute('aria-pressed','false'));root.querySelector('.node-card').hidden=true;wake()}
root.querySelector('.card-close').addEventListener('click',()=>{const previous=selected;clear();if(previous!==null&&nodes[previous].button.tabIndex===0)nodes[previous].button.focus();else stage.focus()});
function select(i){selected=selected===i?null:i;nodes.forEach(n=>n.button.setAttribute('aria-pressed',String(n.i===selected)));if(selected!==null)show(i);else clear();wake()}
for(const n of nodes){const button=document.createElement('button');button.className='node';button.innerHTML='<span class="label"></span>';button.querySelector('span').textContent=n.name;button.setAttribute('aria-label',n.name+': '+n.type+'. '+n.desc);button.setAttribute('aria-pressed','false');button.dataset.dormant=n.dormant;button.addEventListener('click',()=>select(n.i));button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=n.i;wake()}});button.addEventListener('pointerleave',()=>{hover=null;if(selected===null)clear();wake()});button.addEventListener('focus',()=>{hover=n.i;wake()});button.addEventListener('blur',()=>{hover=null;if(selected!==null)show(selected);else clear();wake()});n.button=button;layer.append(button);
const entry=document.createElement('button');entry.innerHTML='<small></small><br><strong></strong><p></p>';entry.querySelector('small').textContent=n.type+' / '+n.territory;entry.querySelector('strong').textContent=n.name;entry.querySelector('p').textContent=n.desc;entry.addEventListener('click',()=>{selected=null;select(n.i);stage.scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'})});root.querySelector('.directory-grid').append(entry)}
function drawLine(g,color,lineWidth=1,dash=[]){ctx.beginPath();for(let j=0;j<=28;j++){let p=project(curvePoint(g,j/28));j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
// Preserve the canonical alpha silhouette; isolate finishes at render time.
const finish=Object.freeze({mist:35,shimmer:78,opacity:54});
const starTexture=document.createElement('canvas'),goldTexture=document.createElement('canvas'),goldFinish=document.createElement('canvas'),emblemBuffer=document.createElement('canvas');
const cornerClip=new Path2D('M0 0H680L0 680Z M550 0H1254V704Z M0 550V1254H704Z M1254 566V1254H566Z');
let starEdges=[],goldEdges=[];
// Continuous side walls connect the canonical face outlines, with no stacked slices.
function outlineEdges(texture){const step=2,size=1254,data=texture.getContext('2d').getImageData(0,0,size,size).data,edges=[];
 const solid=(x,y)=>x>=0&&y>=0&&x<size&&y<size&&data[(y*size+x)*4+3]>127;
 for(let y=0;y<size;y+=step)for(let x=0;x<size;x+=step){if(!solid(x,y))continue;if(!solid(x,y-step))edges.push([x,y,x+step,y]);if(!solid(x+step,y))edges.push([x+step,y,x+step,y+step]);if(!solid(x,y+step))edges.push([x+step,y+step,x,y+step]);if(!solid(x-step,y))edges.push([x,y+step,x,y])}return edges}
function sideWalls(target,edges,color){const point=(x,y,z)=>project({x:(x-627)/627*.624/(mobile?.52:1),y:(y-627)/627*.624/(mobile?1.1:1),z});target.save();target.setTransform(deviceScale,0,0,deviceScale,0,0);target.beginPath();
 for(const [x,y,u,v] of edges){const a=point(x,y,-.04),b=point(u,v,-.04),c=point(u,v,.04),d=point(x,y,.04);const area=(b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x);const quad=area>=0?[a,b,c,d]:[a,d,c,b];target.moveTo(quad[0].x,quad[0].y);for(let i=1;i<4;i++)target.lineTo(quad[i].x,quad[i].y);target.closePath()}
 target.fillStyle=color;target.fill();target.restore()}
function prepareLogo(){for(const c of [starTexture,goldTexture,goldFinish]){c.width=c.height=1254}let s=starTexture.getContext('2d');s.drawImage(logo,0,0);s.globalCompositeOperation='destination-out';s.fill(cornerClip);s.globalCompositeOperation='source-over';let g=goldTexture.getContext('2d');g.save();g.clip(cornerClip);g.drawImage(logo,0,0);g.restore();starEdges=outlineEdges(starTexture);goldEdges=outlineEdges(goldTexture)}
function logoFace(target,texture,z,shade=1){const p=project({x:0,y:0,z}),x=project({x:mobile?.624/.52:.624,y:0,z}),y=project({x:0,y:mobile?.624/1.1:.624,z});target.save();target.setTransform(deviceScale,0,0,deviceScale,0,0);target.transform((x.x-p.x)/627,(x.y-p.y)/627,(y.x-p.x)/627,(y.y-p.y)/627,p.x,p.y);target.filter=shade===1?'none':`brightness(${shade})`;target.drawImage(texture,-627,-627);target.restore()}
function emblem(alpha){if(!logo.complete||!logo.naturalWidth||!starTexture.width)return;
 const g=goldFinish.getContext('2d');g.clearRect(0,0,1254,1254);g.drawImage(goldTexture,0,0);g.globalCompositeOperation='source-atop';
 // A broad, restrained reflection across gold only. Static under reduced motion.
 const phase=(paused||reduced?0:time/16000)+rotation.y*.3+rotation.z*.2;
 const pos=627+Math.sin(phase*Math.PI*2)*750,gradient=g.createLinearGradient(pos-240,0,pos+240,1254);gradient.addColorStop(0,'rgba(255,247,207,0)');gradient.addColorStop(.15,'rgba(255,247,207,0)');gradient.addColorStop(.5,`rgba(255,247,207,${finish.shimmer/100*.72})`);gradient.addColorStop(.85,'rgba(255,247,207,0)');gradient.addColorStop(1,'rgba(255,247,207,0)');g.fillStyle=gradient;g.fillRect(0,0,1254,1254);g.globalCompositeOperation='source-over';
 if(emblemBuffer.width!==canvas.width||emblemBuffer.height!==canvas.height){emblemBuffer.width=canvas.width;emblemBuffer.height=canvas.height}const buffer=emblemBuffer.getContext('2d');
 for(const [texture,opacity,edges,color] of [[starTexture,finish.opacity/100,starEdges,'#263955'],[goldFinish,1,goldEdges,'#a77e36']]){buffer.setTransform(1,0,0,1,0,0);buffer.clearRect(0,0,emblemBuffer.width,emblemBuffer.height);
 const front=rotate({x:0,y:0,z:1}).z>0;
 sideWalls(buffer,edges,color);logoFace(buffer,texture,front?.04:-.04)
 ctx.save();ctx.globalAlpha=alpha*opacity;ctx.drawImage(emblemBuffer,0,0,width,height);ctx.restore()}}
function gate(alpha){for(let k=0;k<2;k++){ctx.beginPath();for(let j=0;j<=80;j++){const a=j/80*Math.PI*2,p=project({x:-1.05+(k-.5)*.03,y:.42+Math.sin(a)*.23,z:.5+Math.cos(a)*.15});j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.strokeStyle=`rgba(167,126,54,${alpha*(k?.65:1)})`;ctx.lineWidth=k?.7:1.4;ctx.stroke()}}
let deviceScale=1;
function draw(){ctx.clearRect(0,0,width,height);const f=focusNode(),intro=reduced||paused?1:clamp(time/6800,0,1),r=clamp(intro*5,0,1);const primitives=[];
// Mist is anchored to projected nodes, leaving open space between territories.
if(finish.mist>0)for(const n of nodes){if(n.i===17)continue;const p=project(n.p),matching=belongs(n);
 const radius=(mobile?29:48)*p.f,opacity=finish.mist/100*r*(n.dormant?.045:matching?.21:.025);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(n.i*.73);ctx.scale(1.22,.78);const mist=ctx.createRadialGradient(0,0,0,0,0,radius);mist.addColorStop(0,`rgba(66,111,153,${opacity})`);mist.addColorStop(.35,`rgba(100,143,175,${opacity*.65})`);mist.addColorStop(1,'rgba(139,174,198,0)');ctx.fillStyle=mist;ctx.fillRect(-radius,-radius,radius*2,radius*2);ctx.restore()}
// Fine spatial arcs describe territories, not an enclosing sphere.
for(let k=0;k<3;k++){const g=geometry({x:-4+k*.4,y:-1.3+k*1.6,z:-.8},{x:3.8-k*.6,y:-1.7+k*1.9,z:-.6},k);drawLine(g,`rgba(29,47,78,${.055*r})`,.65)}
links.forEach(([a,b],i)=>{const A=nodes[a].p,B=b===21?center:nodes[b].p,g=geometry(A,B,i),dormant=nodes[a].dormant;const active=f!==null&&(a===f||b===f||b===21&&f!==null&&!nodes[f].dormant);let alpha=active?.72:f!==null?.06:.2;if(territory!=='all'&&!belongs(nodes[a])&&b!==17&&b!==21)alpha*=.22;if(dormant)alpha*=.45;const phase=b===21?.85:b===17?.65:a<3?.25:.42;alpha*=clamp((intro-phase)*5,0,1);const color=b===21||active?'167,126,54':'29,47,78';for(let j=0;j<20;j++){const p=project(curvePoint(g,j/20)),q=project(curvePoint(g,(j+1)/20));primitives.push({z:(p.z+q.z)/2,draw:()=>{ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=`rgba(${color},${alpha*clamp(.8+(p.z+q.z)*.12,.3,1)})`;ctx.lineWidth=active?1.35:.7;ctx.setLineDash(dormant?[2,4]:[]);ctx.stroke();ctx.setLineDash([])}})}
if(!paused&&!reduced&&!dormant){let t=-1;if(intro<1){const opening=.34/signalSpeed,judgment=.3/signalSpeed,center=.15/signalSpeed;if(a<3&&intro>.18&&intro<.18+opening)t=(intro-.18)/opening;else if(b===17&&intro>.55&&intro<.55+judgment)t=(intro-.55)/judgment;else if(b===21&&intro>.85&&intro<.85+center)t=(intro-.85)/center}else{const signalDuration=2600/signalSpeed;if(time%16000<signalDuration&&[20,25].includes(i))t=(time%16000)/signalDuration}if(t>=0&&t<=1){const p=project(curvePoint(g,t));primitives.push({z:p.z+.01,draw:()=>{ctx.beginPath();ctx.arc(p.x,p.y,2.4,0,Math.PI*2);ctx.fillStyle='#b88c3d';ctx.fill()}})}}});
if(intro<.5){for(let i=0;i<3;i++)drawLine(geometry(origin,nodes[i].p,i),`rgba(167,126,54,${clamp((intro-.12)*4,0,.5)})`,1)}
primitives.push({z:0,draw:()=>emblem(clamp((intro-.84)*7,0,1))},{z:rotate(nodes[17].p).z,draw:()=>gate(clamp((intro-.64)*7,0,1))});
for(const n of nodes){const p=project(n.p);n.screen=p;const a=r*(n.dormant?.3:clamp(.78+p.z*.15,.48,1))*(f!==null&&!connected(n.i,f)?.35:1);primitives.push({z:p.z,draw:()=>{if(n.i===17)return;ctx.beginPath();if(n.type==='Influence'){ctx.moveTo(p.x,p.y-3.5);ctx.lineTo(p.x+3.5,p.y);ctx.lineTo(p.x,p.y+3.5);ctx.lineTo(p.x-3.5,p.y);ctx.closePath()}else ctx.arc(p.x,p.y,n.i===f?5:3,0,Math.PI*2);ctx.fillStyle='#fffdf8';ctx.fill();ctx.strokeStyle=`rgba(${n.i===f?'167,126,54':'29,47,78'},${a})`;ctx.lineWidth=n.i===f?1.7:1;ctx.stroke()}})}
primitives.sort((a,b)=>a.z-b.z).forEach(x=>x.draw());
// Collision-aware DOM labels: reserved center, selected labels first, then depth.
const cp=project(center),boxes=[{x:cp.x-35,y:cp.y-35,w:70,h:70}];const sorted=[...nodes].sort((a,b)=>(b.i===f)-(a.i===f)||(b.i===17)-(a.i===17)||([0,1].includes(b.i))-([0,1].includes(a.i))||b.screen.z-a.screen.z);
const card=root.querySelector('.node-card');if(!card.hidden){const cr=card.getBoundingClientRect(),sr=stage.getBoundingClientRect();boxes.push({x:cr.left-sr.left-8,y:cr.top-sr.top-8,w:cr.width+16,h:cr.height+16})}
for(const n of sorted){const p=n.screen,b=n.button;const allowed=!mobile||n.i===f||n.i===17||(territory==='all'?[0,1,2,6,8,11,12,13].includes(n.i):belongs(n));const matching=belongs(n)||n.i===17||n.i===f;const bw=b.offsetWidth||120,bh=28;let found=null;
if(allowed&&matching&&r>.2){for(const dy of [0,-23,23,-46,46,-70,70]){const box={x:clamp(p.x+7,7,width-bw-7),y:clamp(p.y-14+dy,4,height-65),w:bw,h:bh};if(n.i===f||!boxes.some(o=>box.x<o.x+o.w+7&&box.x+box.w+7>o.x&&box.y<o.y+o.h+5&&box.y+box.h+5>o.y)){found=box;break}}}
b.style.visibility=found?'visible':'hidden';b.tabIndex=found?0:-1;if(found){boxes.push(found);b.style.left=(found.x+8)+'px';b.style.top=(found.y+14)+'px';b.style.opacity=n.dormant?'.55':'1';b.style.zIndex=String(Math.round((p.z+5)*10));if(Math.abs(found.y+14-p.y)>15){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(found.x,found.y+14);ctx.strokeStyle='rgba(29,47,78,.18)';ctx.lineWidth=.5;ctx.stroke()}}}

const captions=intro<.18?['An originating question','What could this become?']:intro<.42?['Possibilities take shape.','Models / Strategy & exploration']:intro<.66?['Direction becomes practice.','Design / Build / Create / Publish']:intro<.87?['Judgment determines what stays.','Taste / Context / Responsibility']:['The resulting system.','Shaped by human judgment'];stage.querySelector('.caption-step').textContent=captions[0];stage.querySelector('.caption-sub').textContent=captions[1];}
function tick(now){raf=0;if(!visible||document.hidden)return;const dt=Math.min(now-last||16,32);last=now;if(!paused&&!reduced)time+=dt;else time=Math.max(time,6800);if(time>=6800)introDone=true;let moving=false;if(!drag&&!reduced&&!paused){if(introDone&&!settling)rotation.y+=dt*.000045;for(const key of ['x','y','z']){if(Math.abs(velocity[key])>.00002){rotation[key]+=velocity[key]*dt;velocity[key]*=Math.pow(.91,dt/16);moving=true}}if(settling){for(const key of ['x','y','z'])rotation[key]+=(rest[key]-rotation[key])*.06;moving=Object.keys(rest).some(k=>Math.abs(rest[k]-rotation[k])>.0005);if(!moving){rotation={...rest};settling=false}}}draw();if(!paused&&!reduced)raf=requestAnimationFrame(tick)}
function wake(){if(visible&&!document.hidden&&!raf){last=performance.now();raf=requestAnimationFrame(tick)}}
function resize(){const r=stage.getBoundingClientRect();width=r.width;height=r.height;mobile=width<680;scale=mobile?width/5.55:Math.min(width/10.8,height/6.4);deviceScale=Math.min(devicePixelRatio||1,2.5);canvas.width=Math.round(width*deviceScale);canvas.height=Math.round(height*deviceScale);ctx.setTransform(deviceScale,0,0,deviceScale,0,0);wake()}
function reset(){clear();territory='all';root.querySelectorAll('[data-territory]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.territory==='all')));velocity={x:0,y:0,z:0};if(reduced||paused)rotation={...rest};else settling=true;wake()}
root.querySelector('.reset').addEventListener('click',reset);root.querySelector('.motion').addEventListener('click',e=>{paused=!paused;e.currentTarget.textContent=paused?'Resume motion':'Pause motion';e.currentTarget.setAttribute('aria-pressed',String(paused));clearTimeout(timer);wake()});
root.querySelectorAll('[data-territory]').forEach(b=>b.addEventListener('click',()=>{territory=b.dataset.territory;root.querySelectorAll('[data-territory]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));clear();wake()}));
stage.addEventListener('pointerdown',e=>{if(e.target.closest('button, .node-card'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:e.timeStamp,roll:e.shiftKey};settling=false;velocity={x:0,y:0,z:0};stage.setPointerCapture(e.pointerId);stage.classList.add('dragging')});
stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y,dt=Math.max(8,e.timeStamp-drag.t);if(drag.roll){rotation.z+=dx*.005;velocity.z=clamp(dx*.005/dt,-.004,.004)}else{rotation.y+=dx*.006;rotation.x+=dy*.006;velocity.y=clamp(dx*.006/dt,-.004,.004);velocity.x=clamp(dy*.006/dt,-.004,.004)}drag.x=e.clientX;drag.y=e.clientY;drag.t=e.timeStamp;wake()});
function release(){drag=null;stage.classList.remove('dragging');wake()}stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',()=>{velocity={x:0,y:0,z:0};release()});stage.addEventListener('lostpointercapture',release);
stage.addEventListener('keydown',e=>{if(e.key==='Escape'){clear();stage.focus();return}if(e.key==='Home'){e.preventDefault();reset();return}const m={ArrowLeft:['y',-.12],ArrowRight:['y',.12],ArrowUp:['x',-.12],ArrowDown:['x',.12]};if(!m[e.key])return;e.preventDefault();settling=false;velocity={x:0,y:0,z:0};const [k,v]=m[e.key];rotation[e.shiftKey?'z':k]+=v;wake()});
new ResizeObserver(resize).observe(stage);new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake();else{cancelAnimationFrame(raf);raf=0;clearTimeout(timer)}},{threshold:.05}).observe(stage);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;clearTimeout(timer)}else wake()});motionQuery.addEventListener('change',e=>{reduced=e.matches;velocity={x:0,y:0,z:0};clearTimeout(timer);wake()});resize();
})();
