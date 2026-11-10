/* The Fabric feature (next). Preview build, loaded only with ?next.
 * The backdrop is the published one: the approved woven artwork, moving on a
 * fine surface. This build keeps that image and deepens how it is lit:
 * the weave's own brightness becomes relief, a slow light crosses it and
 * leans toward the pointer, bright threads sit nearer and travel a little
 * further, and the highlights glow and roll off softly instead of flattening.
 * Copy is untouched.
 */
const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion:reduce)'),button=document.querySelector('.motion-toggle');
let paused=reduce.matches,frame=0,t=0,last=0,visible=true,render=null,renderOnce=null,scrollTarget=0,scrollCurrent=0;
function motion(){root.classList.toggle('motion-off',paused);button.textContent=paused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));if(!paused)start();else renderOnce?.();}
const paragraphs=[...document.querySelectorAll('.article-body>p')];root.classList.add('motion-ready');
const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');reveal.unobserve(e.target);}}),{threshold:.08,rootMargin:'0px 0px -35px 0px'});paragraphs.forEach(p=>reveal.observe(p));
function start(){if(!frame&&render&&visible&&!paused){last=performance.now();frame=requestAnimationFrame(tick);}}
function tick(now){frame=0;if(!visible||paused)return;const dt=Math.min((now-last)/1000,.04);last=now;t+=dt;scrollCurrent+=(scrollTarget-scrollCurrent)*(1-Math.exp(-dt*4));render(dt);start();}
button.addEventListener('click',()=>{paused=!paused;motion();});reduce.addEventListener('change',e=>{paused=e.matches;motion();});
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(frame);frame=0;}else start();});
function onScroll(){
  scrollTarget=Math.min(1,scrollY/Math.max(1,innerHeight*.82));root.style.setProperty('--read-veil',String(Math.min(1,scrollTarget*1.45)));
  document.querySelector('.reading-progress').style.transform=`scaleX(${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)})`;
  if(paused){scrollCurrent=scrollTarget;renderOnce?.();}
}
addEventListener('scroll',onScroll,{passive:true});onScroll();motion();
// The carousel reports how much of it is on screen; the weave settles a little so the chapters read.
const stage={goal:1,level:1};
document.addEventListener('fabric-chapter',e=>{stage.goal=1-.22*Math.min(1,Math.max(0,(e.detail.weight-.25)/.45));if(paused)renderOnce?.();});
// The light leans toward a mouse or pen. Touch has no hover, so phones keep the slow traverse alone.
const pointer={x:0,y:0,goalX:0,goalY:0};
addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointer.goalX=e.clientX/innerWidth*2-1;pointer.goalY=1-e.clientY/innerHeight*2;},{passive:true});
document.addEventListener('pointerleave',()=>{pointer.goalX=pointer.goalY=0;});

try{
  const THREE=await import('./vendor/three.module.js');const canvas=document.querySelector('#fabric-scene');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#1d2f4e');renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=2;
  const texture=await new THREE.TextureLoader().loadAsync('/assets/fabric-feature/hero.png');texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const uniforms={uMap:{value:texture},uTime:{value:0},uScroll:{value:0},uAspect:{value:1},uImageAspect:{value:texture.image.width/texture.image.height},uTexel:{value:new THREE.Vector2(1/texture.image.width,1/texture.image.height)},uPointer:{value:new THREE.Vector2()},uStage:{value:1}};
  const material=new THREE.ShaderMaterial({uniforms,vertexShader:`
  varying vec2 vUv;
  void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
  `,fragmentShader:`
  uniform sampler2D uMap;
  uniform float uTime,uScroll,uAspect,uImageAspect,uStage;
  uniform vec2 uTexel,uPointer;
  varying vec2 vUv;
  float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
  void main(){
    vec2 uv=vUv;
    float cover=uAspect/uImageAspect;
    if(cover<1.)uv.x=(uv.x-.5)*cover+.5;else uv.y=(uv.y-.5)/cover+.5;
    // A small overscan prevents borders appearing as the material drifts.
    uv=(uv-.5)*.90+.5;
    // Slow, overlapping waves travel through the illustrated weave, as before,
    // now under a breeze that gathers and eases, with one broader swell beneath.
    float anchor=sin(uv.x*3.14159)*sin(uv.y*3.14159);
    float gust=.86+.22*sin(uTime*.071+1.3)+.12*sin(uTime*.113+4.1)*sin(uTime*.029+.4);
    vec2 flow=vec2(.012*sin(uv.y*5.4+uTime*.26)+.005*sin(uv.y*11.-uTime*.17)+.005*sin(uv.y*2.3+uv.x*1.7+uTime*.09),
                   .019*sin(uv.x*4.6+uTime*.21)+.006*cos(uv.x*9.-uTime*.29)+.006*sin(uv.x*2.1-uv.y*1.3+uTime*.07))*anchor*gust;
    vec2 base=uv+flow+vec2(.010*sin(uTime*.13)+uScroll*.035,.009*sin(uTime*.24)-uScroll*.028);
    // Depth: brighter threads sit nearer the viewer, so they travel a little
    // further with the breeze and with the pointer than the navy behind them.
    float height=smoothstep(.04,.42,luma(textureLod(uMap,base,2.5).rgb));
    vec2 p=base+(flow*.55+uPointer*vec2(-.007,.007))*height;
    vec3 art=texture2D(uMap,p).rgb;
    // Relief: the weave's own brightness, read as a surface.
    vec2 e=uTexel*3.;
    float slopeX=luma(textureLod(uMap,p+vec2(e.x,0.),1.5).rgb)-luma(textureLod(uMap,p-vec2(e.x,0.),1.5).rgb);
    float slopeY=luma(textureLod(uMap,p+vec2(0.,e.y),1.5).rgb)-luma(textureLod(uMap,p-vec2(0.,e.y),1.5).rgb);
    vec3 n=normalize(vec3(-slopeX*4.,-slopeY*4.,1.));
    // One light, crossing slowly and leaning toward the pointer. It rakes the
    // threads, catches a sheen along them and leaves the far corners deeper.
    vec2 lamp=vec2(.56+.31*sin(uTime*.045+.6),.44+.20*sin(uTime*.061+2.1))+uPointer*.15;
    vec2 toLamp=lamp-vUv;toLamp.x*=uAspect;
    vec3 L=normalize(vec3(toLamp,.46)),H=normalize(L+vec3(0.,0.,1.));
    float pool=exp(-dot(toLamp,toLamp)/.26),rake=dot(n,L)-L.z;
    // Under the article the light stays, but quieter, so the words lead.
    float calm=mix(1.,.42,uScroll);
    float threads=smoothstep(.08,.5,luma(art));
    art*=1.08+.82*rake*calm;
    art*=mix(.84,1.36,pool*calm+(1.-calm)*.30);
    art+=vec3(1.,.90,.72)*pow(max(dot(n,H),0.),20.)*threads*.42*(.3+.7*pool)*calm;
    // Luminance: a soft bloom from the blurred weave, warm where the light rests.
    float soft=luma(textureLod(uMap,p,4.6).rgb);
    art+=vec3(1.,.88,.70)*soft*soft*.62*(.35+.65*pool)*calm;
    art+=vec3(.045,.06,.10)*(1.-threads)*pool*calm;
    // Highlights roll off rather than flatten; navy shadows keep their depth.
    art/=1.+luma(art)*mix(.40,1.10,uScroll);
    art*=1.-.10*smoothstep(.12,.40,luma(art))*uScroll;
    vec3 navy=vec3(.0123,.0284,.0762);
    vec3 color=mix(navy,art,mix(.76,.55,uScroll));
    vec2 corner=(vUv-.5)*vec2(1.08,1.22);
    color*=1.-.30*smoothstep(.36,.95,length(corner));
    // The title keeps a quieter field behind it, so the lockup stays crisp.
    vec2 title=(vUv-vec2(.5,.80))*vec2(uAspect*.9,1.6);
    color*=1.-.20*exp(-dot(title,title)/.16)*(1.-uScroll);
    color*=mix(.74,1.,uStage);
    float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
    gl_FragColor=vec4(color+(grain-.5)/255.,1.);
    #include <colorspace_fragment>
  }
  `});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2.03,2.03,1,1),material);scene.add(mesh);
  function resize(){renderer.setSize(innerWidth,innerHeight);uniforms.uAspect.value=innerWidth/innerHeight;renderOnce?.();}
  render=dt=>{
    const ease=dt?1-Math.exp(-dt*1.6):1;
    pointer.x+=(pointer.goalX-pointer.x)*ease;pointer.y+=(pointer.goalY-pointer.y)*ease;stage.level+=(stage.goal-stage.level)*ease;
    uniforms.uTime.value=t;uniforms.uScroll.value=scrollCurrent;uniforms.uPointer.value.set(pointer.x,pointer.y);uniforms.uStage.value=stage.level;
    renderer.render(scene,camera);
  };
  renderOnce=()=>render(0);
  addEventListener('resize',resize);resize();document.fonts.ready.then(resize);renderOnce();root.classList.add('webgl-ready');start();
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;render=null;root.classList.remove('webgl-ready');});
}catch(error){console.warn('Fabric motion unavailable; the approved still image remains visible.',error);}
