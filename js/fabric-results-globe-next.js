/* Results globe (next). The published rebuild (default since the 2026-11 release). Same globe,
   controls and data as fabric-results-globe.js; it sits on the night instead
   of on ivory paper, and it is modelled as a sphere: relief on the land,
   clouds that ride above the ground and cast shadows, water that reflects
   the sky, and a limb that darkens under a thin atmosphere. */
(()=>{'use strict';
const vertex='attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}';
const fragment=`precision highp float;varying vec2 uv;uniform sampler2D earth;uniform sampler2D clouds;uniform float latitude;uniform float radius;uniform float angle;uniform vec2 light;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
// A point on the sphere, as seen, to its place on the map.
vec2 geoOf(vec3 n){float tilt=-.28;vec3 t=vec3(n.x*cos(tilt)-n.y*sin(tilt),n.x*sin(tilt)+n.y*cos(tilt),n.z);
  float ny=t.y*cos(latitude)+t.z*sin(latitude),nz=t.z*cos(latitude)-t.y*sin(latitude);
  return vec2(fract((atan(t.x,nz)-1.83+angle)/6.2831853+.5),.5-asin(clamp(ny,-1.,1.))/3.14159265);}
vec3 surface(vec2 g){vec3 c=texture2D(earth,g).rgb;float l=dot(c,vec3(.2126,.7152,.0722));return mix(vec3(l),c,.64);}
float waterAt(vec3 c){return 1.-smoothstep(.015,.09,c.g-c.b);}
// Relief: the land's own tone read as height, with finer ground that only resolves as the visitor zooms in.
float heightAt(vec2 g){vec3 c=surface(g);
  float fine=vnoise(g*vec2(2600.,1300.))*.10*smoothstep(650.,1400.,radius)+vnoise(g*vec2(900.,450.))*.13*smoothstep(430.,950.,radius);
  return (dot(c,vec3(.2126,.7152,.0722))*1.6+fine)*(1.-waterAt(c));}
void main(){vec2 q=(uv*1024.-512.)/radius;float d=dot(q,q),rim=sqrt(d);
// Outside the planet: the page's midnight, and a thin blue atmosphere against it.
vec3 sky=vec3(.050,.098,.208)+vec3(.28,.46,.86)*(exp(-max(rim-1.,0.)/.030)*.42+exp(-max(rim-1.,0.)/.12)*.10);vec3 color=sky;
if(d<1.){float z=sqrt(1.-d);vec3 n=vec3(q.x,-q.y,z);
  vec2 geo=geoOf(n);vec3 land=surface(geo);float ocean=waterAt(land);
  // The sun stands upper left and a little forward, so the sphere turns away into shade.
  vec3 l=normalize(vec3(-.55+light.x,.62-light.y,.56));
  // Relief: tilt the surface by the slope of the ground beneath it.
  float reach=1.6/radius;vec3 east=normalize(cross(vec3(0.,1.,0.),n)),north=cross(n,east);
  float h0=heightAt(geo),hx=heightAt(geoOf(normalize(n+east*reach))),hy=heightAt(geoOf(normalize(n+north*reach)));
  vec3 ground=normalize(n-(east*(hx-h0)+north*(hy-h0))/reach*mix(.034,.062,smoothstep(430.,1500.,radius)));
  float facing=dot(n,l),day=smoothstep(-.18,.42,facing),lit=clamp(dot(ground,l)*.5+.5,0.,1.);lit*=lit*1.15;
  // Clouds ride above the ground: they shift toward the limb, and throw shadows away from the sun.
  vec2 above=geoOf(normalize(n+vec3(q.x,-q.y,0.)*.012));above.x=fract(above.x+angle*.015);
  vec4 cover=texture2D(clouds,above);float cloud=cover.r*cover.a;
  vec2 sunward=geoOf(normalize(n+l*.022));sunward.x=fract(sunward.x+angle*.015);
  vec4 shade=texture2D(clouds,sunward);float shadow=shade.r*shade.a;
  land=mix(land,land*vec3(.34,.56,.70),ocean*.7);
  color=land*(.13+.22*day+1.05*lit*day)*vec3(.74,.88,1.)*(1.-.55*shadow*day);
  // Water: the sky's reflection at a glancing angle, and only a faint, tight trace of the sun.
  float nh=max(dot(n,normalize(l+vec3(0.,0.,1.))),0.);
  color+=vec3(.20,.34,.55)*pow(1.-z,4.)*ocean*.5*day;
  color+=vec3(1.,.96,.88)*(pow(nh,320.)*.22+pow(nh,90.)*.008)*ocean*(1.-cloud)*day;
  // Cloud tops catch the sun; their far sides are thinner and dimmer.
  float cloudLight=clamp(facing*.6+.5,0.,1.),body=cloud-texture2D(clouds,above+l.xy*vec2(.0022,-.0022)).r*.5;
  color=mix(color,vec3(.80,.87,.94)*(.16+.95*cloudLight)*(.85+.4*clamp(body,-.2,.4)),clamp(cloud*.82,0.,1.));
  // The limb: the surface darkens as it turns away, under a deepening blue of air.
  color*=mix(.60,1.,pow(z,.45));
  color=mix(color,vec3(.42,.64,1.)*(.25+.95*day),pow(1.-z,2.4)*.55);
  color+=vec3(.55,.75,1.)*pow(1.-z,6.)*.5*day;
  color=mix(sky,color,smoothstep(0.,.018,z));}
gl_FragColor=vec4(color,1.);}`;
const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
const assets=Promise.all([image('images/earth-surface-4k.jpg'),image('images/earth-clouds-4k.png')]);
async function init(stage){if(stage.dataset.cinematicGlobe)return;stage.dataset.cinematicGlobe='loading';const canvas=document.createElement('canvas');// A denser canvas on larger screens keeps the surface crisp when the visitor zooms in.
canvas.width=canvas.height=innerWidth>700?1536:1024;canvas.setAttribute('aria-hidden','true');stage.append(canvas);stage.tabIndex=0;stage.setAttribute('role','group');stage.setAttribute('aria-label','Participation globe. Drag or use left and right arrows to rotate. Pinch with two fingers or use the plus and minus controls to zoom.');const hint=document.createElement('p');hint.className='results-globe-hint';hint.textContent='Drag to rotate · Pinch or use + / − to zoom';stage.before(hint);let angle=0,latitude=-.26,radius=430;
try{const [earth,clouds]=await assets;if(!stage.isConnected)return;const gl=canvas.getContext('webgl',{alpha:false});if(!gl)throw Error('WebGL unavailable');
const shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader unavailable');return s};
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
[earth,clouds].forEach((im,i)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.uniform1i(gl.getUniformLocation(program,i?'clouds':'earth'),i);});
gl.uniform2f(gl.getUniformLocation(program,'light'),0,0);
const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('viewBox','0 0 1024 1024');overlay.setAttribute('aria-hidden','true');stage.append(overlay);const rim=document.createElementNS(overlay.namespaceURI,'circle');rim.setAttribute('cx',512);rim.setAttribute('cy',512);rim.setAttribute('fill','none');rim.setAttribute('stroke','#e8d5a3');rim.setAttribute('stroke-width','1.5');overlay.append(rim);
const demo=['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('preview')==='results'&&new URLSearchParams(location.search).get('pins')==='100';
const data=demo?{status:'demo',privacy_threshold:3,locations:window.OSL_DEMO_LOCATIONS()}:stage.participationData||{};
if(demo){const card=stage.closest('.curve-participation');card.querySelector('.hero-eyebrow').textContent='Synthetic participation preview';card.querySelector('.curve-participation-update').textContent='100 illustrative pins';card.querySelector('.curve-participation-lede').textContent='Design demonstration only: 70 U.S. locations and 30 international locations. These are not real participants or assessment counts.';const totals=card.querySelectorAll('.curve-participation-foot>span');totals[0].textContent='70 U.S. pins';totals[1].textContent='30 international pins';stage.setAttribute('aria-label','Synthetic 100-pin globe demonstration, not real participation. Drag to rotate; scroll to zoom.');}
const threshold=Math.max(3,Number(data.privacy_threshold)||3);const pins=((data.status==='live'||demo)?data.locations||[]:[]).filter(d=>Number(d.count)>=threshold&&Number.isFinite(Number(d.lat))&&Number.isFinite(Number(d.lon))).map((d,index)=>{const c=document.createElementNS(overlay.namespaceURI,'g');c.classList.add('participation-signal-ring');const ring=document.createElementNS(overlay.namespaceURI,'circle'),core=document.createElementNS(overlay.namespaceURI,'circle');ring.setAttribute('r',Math.min(12,5+Math.sqrt(d.count)*.5));ring.setAttribute('fill','#1d2f4e88');ring.setAttribute('stroke','#d7b773');ring.setAttribute('stroke-width','1.5');core.setAttribute('r','2.5');core.setAttribute('fill','#fffdf8');const pulse=document.createElementNS(overlay.namespaceURI,'circle');pulse.classList.add('signal-pulse');pulse.setAttribute('r',ring.getAttribute('r'));pulse.setAttribute('fill','none');pulse.setAttribute('stroke','#f1d89e');pulse.setAttribute('stroke-width','1.2');pulse.style.animationDelay=-(index*.618%4)+'s';core.classList.add('signal-core');core.style.animationDelay=pulse.style.animationDelay;c.append(pulse,ring,core);const title=document.createElementNS(overlay.namespaceURI,'title');title.textContent=demo?'Illustrative location — no participant data':d.count+' aggregated assessments';c.append(title);overlay.append(c);return{d,c}});
function draw(){gl.uniform1f(gl.getUniformLocation(program,'latitude'),latitude);stage.dataset.zoom=String(radius/430);gl.uniform1f(gl.getUniformLocation(program,'angle'),angle);gl.uniform1f(gl.getUniformLocation(program,'radius'),radius);gl.drawArrays(gl.TRIANGLES,0,6);rim.setAttribute('r',radius+2);pins.forEach(({d,c})=>{const lat=d.lat*Math.PI/180,lon=d.lon*Math.PI/180+1.83-angle;const x=Math.cos(lat)*Math.sin(lon),y=Math.sin(lat),z=Math.cos(lat)*Math.cos(lon),ty=y*Math.cos(latitude)-z*Math.sin(latitude),tz=y*Math.sin(latitude)+z*Math.cos(latitude),nx=x*Math.cos(-.28)+ty*Math.sin(-.28),ny=-x*Math.sin(-.28)+ty*Math.cos(-.28);c.setAttribute('transform',`translate(${512+nx*radius} ${512-ny*radius})`);c.style.display=tz>0?'':'none'});}
let drag=null,pinch=null,resumeAt=0;const pointers=new Map(),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);if(pointers.size===1){drag={x:e.clientX,y:e.clientY,a:angle,l:latitude};stage.classList.add('is-dragging')}else if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.max(1,distance(a,b)),radius};drag=null;stage.classList.remove('is-dragging')}});
stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>=2&&pinch){const [a,b]=[...pointers.values()];radius=Math.max(320,Math.min(1600,pinch.radius*distance(a,b)/pinch.distance));resumeAt=performance.now()+2600;draw();return}if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y,screenRadius=radius*stage.clientWidth/1024,tilt=-.28;angle=drag.a-(dx*Math.cos(tilt)+dy*Math.sin(tilt))/(screenRadius*Math.max(.3,Math.cos(drag.l)));latitude=Math.max(-1.3,Math.min(1.3,drag.l+(-dx*Math.sin(tilt)+dy*Math.cos(tilt))/screenRadius));draw()}});
const release=e=>{pointers.delete(e.pointerId);drag=null;pinch=null;stage.classList.remove('is-dragging');resumeAt=performance.now()+2600};stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();angle+=e.key==='ArrowLeft'?.08:-.08;resumeAt=performance.now()+2600;draw()}});
stage.closest('.curve-participation').querySelectorAll('[data-globe-zoom]').forEach(b=>b.addEventListener('click',()=>{radius=Math.max(320,Math.min(1600,radius+(b.dataset.globeZoom==='in'?100:-100)));draw()}));stage.addEventListener('wheel',e=>{const next=Math.max(320,Math.min(1600,radius-e.deltaY*.16));if(next!==radius){e.preventDefault();radius=next;resumeAt=performance.now()+2600;draw()}},{passive:false});
const controls=stage.closest('.curve-participation').querySelector('.curve-participation-controls');
for(const [label,focus] of [['Focus U.S.',true],['World view',false]]){const b=document.createElement('button');b.type='button';b.className='globe-view-button';b.textContent=label;b.addEventListener('click',()=>{angle=focus?.12:0;latitude=focus?.66:-.26;radius=focus?1050:430;resumeAt=performance.now()+2600;draw()});controls.prepend(b);}
let visible=false,frame=0,last=0;const reduce=matchMedia('(prefers-reduced-motion:reduce)');
function tick(now){frame=0;if(!stage.isConnected||!visible||document.hidden)return;const dt=Math.min(now-(last||now),50);last=now;if(!drag&&radius<=600&&now>resumeAt&&!reduce.matches){angle+=dt*.00004189;draw()}if(!reduce.matches)frame=requestAnimationFrame(tick);}
const watch=new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;last=0}else if(!frame)frame=requestAnimationFrame(tick)});watch.observe(stage);
reduce.addEventListener('change',()=>{last=0;if(!frame&&visible)frame=requestAnimationFrame(tick)});document.addEventListener('visibilitychange',()=>{last=0;if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick)});
draw();stage.dataset.cinematicGlobe='ready';
}catch{stage.textContent='Globe preview unavailable. Participation information remains below.';stage.dataset.cinematicGlobe='unavailable';}}
const scan=()=>document.querySelectorAll('[data-participation-globe]').forEach(init),root=document.querySelector('#ai-curve-app');if(!root)return;new MutationObserver(scan).observe(root,{childList:true,subtree:true});scan();
})();
