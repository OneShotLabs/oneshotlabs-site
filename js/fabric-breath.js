/* Continuous 2.5D deformation of the original textile plate; no video seam. */
(()=>{'use strict';
const canvas=document.querySelector('#fabric-breath'),section=canvas.closest('section'),button=document.querySelector('#motion-toggle'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let gl,program,time=0,last=0,raf=0,visible=true,paused=false,optIn=false,light=0,target=0,lastPreference=reduced.matches;
const running=()=>!paused&&(!reduced.matches||optIn);
const wake=()=>{if(!raf&&visible&&!document.hidden&&gl)raf=requestAnimationFrame(draw)};
function label(){button.hidden=false;button.textContent=running()?'Pause motion':reduced.matches&&!optIn?'Enable fabric motion':'Play motion';button.setAttribute('aria-pressed',String(!running()));section.dataset.motion=running()?'playing':'paused'}
function draw(now){raf=0;if(lastPreference!==reduced.matches){lastPreference=reduced.matches;optIn=false;label()}const dt=Math.min((now-(last||now))/1000,.05);last=now;if(running()){time+=dt;light+=(target-light)*(1-Math.exp(-dt*1.4))}gl.uniform1f(gl.getUniformLocation(program,'t'),time);gl.uniform1f(gl.getUniformLocation(program,'light'),light);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.time=time.toFixed(3);if(running())wake()}
button.addEventListener('click',()=>{if(running())paused=true;else{paused=false;optIn=true}label();last=0;wake()});
reduced.addEventListener('change',()=>{lastPreference=reduced.matches;optIn=false;label();wake()});
section.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const b=section.getBoundingClientRect();target=(e.clientX-b.left)/b.width*2-1});section.addEventListener('pointerleave',()=>target=0);
new IntersectionObserver(e=>{visible=e[0].isIntersecting;last=0;if(!visible){cancelAnimationFrame(raf);raf=0}else wake()},{threshold:.01}).observe(section);
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0}else wake()});
const img=new Image();img.onload=()=>{try{
gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');
const vs='attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}';
const fs=`precision highp float;varying vec2 uv;uniform sampler2D plate;uniform float t;uniform float light;
float pocket(vec2 p,vec2 c,vec2 spread){vec2 q=(p-c)/spread;return exp(-dot(q,q)*1.7);}
void main(){vec2 p=uv;
float a=pocket(p,vec2(.45,.28),vec2(.22,.28));float b=pocket(p,vec2(.68,.49),vec2(.23,.32));float c=pocket(p,vec2(.85,.64),vec2(.22,.32));
float sa=sin(t*.46+.3),sb=sin(t*.39+2.0),sc=sin(t*.43+4.0);
float dy=.021*a*sa+.029*b*sb+.024*c*sc;
float dx=.006*a*cos(t*.37)+.008*b*sin(t*.32+1.)-.007*c*cos(t*.35+2.);
float ripple=.0024*sin(p.x*18.-t*.66)*sin(p.y*9.+t*.23)*(a+b+c);
// Attenuate at the image boundaries to avoid exposed seams.
float edge=smoothstep(0.,.10,p.x)*(1.-smoothstep(.9,1.,p.x))*smoothstep(0.,.10,p.y);
vec2 sampleAt=clamp(p+vec2(dx,dy+ripple)*edge,vec2(.001),vec2(.999));
vec3 color=texture2D(plate,sampleAt).rgb;
float textile=smoothstep(.18,.45,dot(color,vec3(.2126,.7152,.0722)));
float illumination=.028*(a*sa-b*sb*.6+c*sc*.7)+.035*light*(p.x-.5);
color*=1.+illumination*textile;
// Illustrative connection glints live in the same deformed material coordinates.
// These are an art treatment, not a depiction of a model's internal reasoning.
float phase=fract(t/13.);float head=.38+phase*.55;
float strandY=.12+sampleAt.x*.48+.055*sin(sampleAt.x*8.);
float strand=exp(-pow((sampleAt.y-strandY)/.0018,2.));
float travelling=exp(-pow((sampleAt.x-head)/.055,2.));
float envelope=smoothstep(0.,.12,phase)*(1.-smoothstep(.84,1.,phase));
color+=vec3(.20,.18,.13)*strand*travelling*textile*envelope;
gl_FragColor=vec4(color,1.);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link');gl.useProgram(program);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);
canvas.width=img.width;canvas.height=img.height;gl.viewport(0,0,canvas.width,canvas.height);canvas.style.opacity='1';label();wake();
}catch(e){gl=null;canvas.style.opacity='0';button.hidden=true;section.dataset.motion='unavailable';console.warn('Fabric still fallback:',e.message)}};
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;gl=null;canvas.style.opacity='0';button.hidden=true;section.dataset.motion='unavailable'});
canvas.style.opacity='0';img.src=section.querySelector('img.art').src;
})();
