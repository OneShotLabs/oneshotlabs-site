/* Geographic sphere mapping inside the existing cinematic horizon composition.
   Surface texture: turban/webgl-earth images/2_no_clouds_4k.jpg (NASA-derived). */
(()=>{'use strict';
const horizon=document.querySelector('.horizon'),fabric=document.querySelector('.fabric'),stage=document.querySelector('.globe-stage'),plane=document.querySelector('.globe-plane'),canvas=document.querySelector('#globe-surface');
const paths=[...document.querySelectorAll('.rim path')],reduce=matchMedia('(prefers-reduced-motion: reduce)'),pause=document.querySelector('#globe-motion');
const cx=2041.21,cy=1874.08,r=1341.01;
// Trace the photographed limb, from its left edge to its right crop.
const start=cx-Math.sqrt(r*r-(1440-cy)**2),endY=cy-Math.sqrt(r*r-(2560-cx)**2);
paths.forEach(p=>{p.setAttribute('d',`M ${start} 1440 A ${r} ${r} 0 0 1 2560 ${endY}`);p.setAttribute('pathLength','1')});
function fit(){const w=stage.clientWidth,h=stage.clientHeight,s=Math.max(w/2560,h/1440);plane.style.cssText=`width:${2560*s}px;height:${1440*s}px;left:${(w-2560*s)*(innerWidth<=700?.64:.5)}px;top:${(h-1440*s)*.5}px`;}
new ResizeObserver(()=>{fit();if(gl){resizeSurface();wake()}}).observe(stage);fit();
let active=false,fabricActive=true,userPaused=false,traceStarted=false,trace=0,clock=0,last=0,frame=0;
let targetX=0,targetY=0,x=0,y=0,turn=0,targetTurn=0,turnVelocity=0,fabricClock=0,drag=false,dragX=0,dragStart=0,gl=null,program=null,uniforms={};
const svg=document.querySelector('.rim'),heads=[24,8,2.6].map((radius,i)=>{const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('r',radius);c.setAttribute('fill',i===2?'#ffffff':'#f5d998');if(i===0)c.setAttribute('filter','url(#rim-bloom)');svg.append(c);return c});
function paintTrace(){const t=reduce.matches?1:Math.min(trace/3.2,1);const ease=t*t*(3-2*t);paths.forEach(p=>p.style.strokeDashoffset=String(1-ease));const point=paths[0].getPointAtLength(paths[0].getTotalLength()*ease);heads.forEach((c,i)=>{c.setAttribute('cx',point.x);c.setAttribute('cy',point.y);c.style.opacity=String(traceStarted&&!reduce.matches&&t<1?Math.min(t*12,1)*Math.min((1-t)*10,1)*[.55,.65,1][i]:0)});stage.dataset.trace=String(ease)}
function wake(){if(!frame&&!document.hidden)frame=requestAnimationFrame(tick)}
function tick(now){frame=0;const dt=Math.min((now-(last||now))/1000,.05);last=now;const running=!reduce.matches&&!userPaused;
if(running){if(active)clock+=dt;x+=(targetX-x)*(1-Math.exp(-dt*2.4));y+=(targetY-y)*(1-Math.exp(-dt*2.4));turnVelocity+=((targetTurn-turn)*12-turnVelocity*7)*dt;turn+=turnVelocity*dt;if(active&&traceStarted)trace+=dt;}
else{x=targetX;y=targetY;turn=targetTurn;turnVelocity=0;}
if(active){paintTrace();if(gl){gl.uniform1f(uniforms.angle,turn*.65+(reduce.matches?0:clock*.018));gl.uniform2f(uniforms.light,x*.45+Math.sin(clock*.13)*.1,y*.18);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.rotation=String(turn*.65+(reduce.matches?0:clock*.018));}}
if(running&&active)wake();}
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
reduce.addEventListener('change',()=>{paintTrace();wake()});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake()});
paintTrace();
// The still remains visible if the browser cannot create or load the WebGL layer.
function resizeSurface(){const width=Math.min(2560,Math.round(plane.clientWidth*Math.min(devicePixelRatio,1.5)));
if(canvas.width!==width){canvas.width=width;canvas.height=Math.round(width*1440/2560)}gl.viewport(0,0,canvas.width,canvas.height);}
const source=new Image();source.crossOrigin='anonymous';
source.onload=()=>{try{
gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return;
const vertex=`attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}`;
const fragment=`precision highp float;varying vec2 uv;uniform sampler2D image;uniform sampler2D earth;uniform sampler2D clouds;uniform float angle;uniform vec2 light;
void main(){vec2 px=uv*vec2(2560.,1440.);vec2 q=(px-vec2(2041.21,1874.08))/1341.01;float d=dot(q,q);vec3 color=texture2D(image,uv).rgb;
if(d<1.){float z=sqrt(1.-d);vec3 normal=vec3(q.x,-q.y,z);
float tilt=-.28;vec3 tilted=vec3(normal.x*cos(tilt)-normal.y*sin(tilt),normal.x*sin(tilt)+normal.y*cos(tilt),normal.z);
float latitude=-.26;float ny=tilted.y*cos(latitude)+tilted.z*sin(latitude);float nz=tilted.z*cos(latitude)-tilted.y*sin(latitude);
float longitude=atan(tilted.x,nz)-1.83+angle;vec2 geo=vec2(fract(longitude/6.2831853+.5),.5-asin(clamp(ny,-1.,1.))/3.14159265);
vec3 land=texture2D(earth,geo).rgb;float lum=dot(land,vec3(.2126,.7152,.0722));land=mix(vec3(lum),land,.64);
vec3 l=normalize(vec3(-.5+light.x,.8-light.y,1.1));float diffuse=max(dot(normal,l),0.);
float fresnel=pow(1.-z,3.5);float ocean=1.-smoothstep(.015,.09,land.g-land.b);land=mix(land,land*vec3(.38,.59,.69),ocean*.65);color=land*(.24+.88*diffuse)*vec3(.72,.87,1.);vec4 cloud=texture2D(clouds,vec2(fract(geo.x+angle*.015),geo.y));float cloudAmount=cloud.r*cloud.a; color=mix(color,vec3(.73,.82,.88)*(.35+.7*diffuse),cloudAmount*.72);
color+=vec3(.34,.52,.68)*fresnel*.38;float shine=pow(max(dot(normal,normalize(l+vec3(0.,0.,1.))),0.),40.);color+=vec3(.85,.91,1.)*shine*.08;
color=mix(texture2D(image,uv).rgb,color,smoothstep(0.,.018,z));}
gl_FragColor=vec4(color,1.);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Globe shader link failed');gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
gl.uniform1i(gl.getUniformLocation(program,'image'),0);
const globeTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,globeTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,earth);gl.uniform1i(gl.getUniformLocation(program,'earth'),1);
const cloudTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,cloudTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,clouds);gl.uniform1i(gl.getUniformLocation(program,'clouds'),2);
// Render at a capped density; retain the high-resolution source texture.
resizeSurface();
uniforms.angle=gl.getUniformLocation(program,'angle');uniforms.light=gl.getUniformLocation(program,'light');gl.uniform1f(uniforms.angle,0);gl.uniform2f(uniforms.light,0,0);gl.drawArrays(gl.TRIANGLES,0,6);canvas.classList.add('ready');wake();
}catch(error){canvas.classList.remove('ready');gl=null;console.warn('Using still globe fallback:',error.message)}};
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.classList.remove('ready');gl=null});
const earth=new Image();earth.onload=()=>{source.src=horizon.querySelector('img.art').src};earth.onerror=()=>console.warn('Earth texture unavailable; retaining still fallback.');const clouds=new Image();clouds.onload=()=>{earth.src='images/earth-surface-4k.jpg'};clouds.onerror=()=>console.warn('Cloud texture unavailable; retaining still fallback.');clouds.src='images/earth-clouds-4k.png';
})();
