const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion:reduce)'),button=document.querySelector('.motion-toggle');let paused=reduce.matches,frame=0,t=0,last=0,visible=true,scrollTarget=0,scrollCurrent=0;
function motion(){root.classList.toggle('motion-off',paused);button.textContent=paused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));if(!paused)start();else renderOnce?.()}
const paragraphs=[...document.querySelectorAll('.article-body>p')];root.classList.add('motion-ready');const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');reveal.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -35px 0px'});paragraphs.forEach(p=>reveal.observe(p));
let renderOnce=null,render=null;function start(){if(!frame&&render&&visible&&!paused){last=performance.now();frame=requestAnimationFrame(tick)}}function tick(now){frame=0;if(!visible||paused)return;const dt=Math.min((now-last)/1000,.04);last=now;t+=dt;scrollCurrent+=(scrollTarget-scrollCurrent)*(1-Math.exp(-dt*4));render(t,scrollCurrent);start()}
button.addEventListener('click',()=>{paused=!paused;motion()});reduce.addEventListener('change',e=>{paused=e.matches;motion()});document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(frame);frame=0}else start()});
function onScroll(){scrollTarget=Math.min(1,scrollY/Math.max(1,innerHeight*.82));root.style.setProperty('--read-veil',String(Math.min(1,scrollTarget*1.45)));document.querySelector('.reading-progress').style.transform=`scaleX(${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)})`;if(paused){scrollCurrent=scrollTarget;renderOnce?.()}}
addEventListener('scroll',onScroll,{passive:true});onScroll();motion();
try{
 const THREE=await import('./vendor/three.module.js');const canvas=document.querySelector('#fabric-scene');const renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#1d2f4e');renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=2;
 const texture=await new THREE.TextureLoader().loadAsync('/assets/fabric-feature/hero.png');texture.colorSpace=THREE.SRGBColorSpace;
 // Animate the approved artwork on a fine surface, using the existing cloth's
 // low-frequency wind profile. This is an image-surface study, not a new drape.
 const uniforms={uMap:{value:texture},uTime:{value:0},uScroll:{value:0},uAspect:{value:1},uImageAspect:{value:texture.image.width/texture.image.height},uClear:{value:.45}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:`
 varying vec2 vUv;
 void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
 `,fragmentShader:`
 uniform sampler2D uMap;
 uniform float uTime,uScroll,uAspect,uImageAspect,uClear;
 varying vec2 vUv;
 void main(){
   vec2 uv=vUv;
   float cover=uAspect/uImageAspect;
   if(cover<1.)uv.x=(uv.x-.5)*cover+.5;else uv.y=(uv.y-.5)/cover+.5;
   // Slow, overlapping waves travel through the existing illustrated weave.
   // A small overscan prevents borders appearing as the material drifts.
   uv=(uv-.5)*.91+.5;
   float anchor=sin(uv.x*3.14159)*sin(uv.y*3.14159);
   float breath=sin(uTime*.24);
   uv.x+=anchor*(.012*sin(uv.y*5.4+uTime*.26)+.005*sin(uv.y*11.-uTime*.17));
   uv.y+=anchor*(.019*sin(uv.x*4.6+uTime*.21)+.006*cos(uv.x*9.-uTime*.29));
   uv+=vec2(.010*sin(uTime*.13)+uScroll*.035,.009*breath-uScroll*.028);
   vec3 art=texture2D(uMap,uv).rgb;
   vec3 navy=vec3(.0123,.0284,.0762);
   float light=1.10+.065*sin(uTime*.24+uv.x*3.);
   art*=light;
   // Continuous translucent textile from the very first frame. No cut-out
   // title panel or opaque reading corridor: retain weave beneath the words.
   float luma=dot(art,vec3(.2126,.7152,.0722));
   art/=1.+luma*mix(.65,1.25,uScroll);
   // Soften the brightest fabric threads by up to 12%, preserving navy shadows.
   float highlight=smoothstep(.08,.35,dot(art,vec3(.2126,.7152,.0722)));
   art*=1.-.12*highlight;
   float mask=mix(.66,.54,uScroll);
   gl_FragColor=vec4(mix(navy,art,mask),1.);
   #include <colorspace_fragment>
 }
 `});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2.03,2.03,72,48),material);scene.add(mesh);
 function resize(){renderer.setSize(innerWidth,innerHeight);uniforms.uAspect.value=innerWidth/innerHeight;uniforms.uClear.value=1-(document.querySelector(".standfirst").getBoundingClientRect().bottom+scrollY+18)/innerHeight;renderer.render(scene,camera)}addEventListener('resize',resize);resize();document.fonts.ready.then(resize);render=(time,scroll)=>{uniforms.uTime.value=time;uniforms.uScroll.value=scroll;renderer.render(scene,camera)};renderOnce=()=>render(t,scrollCurrent);renderOnce();root.classList.add('webgl-ready');start();canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;render=null;root.classList.remove('webgl-ready')});
}catch(error){console.warn('Fabric motion unavailable; the approved still image remains visible.',error)}
