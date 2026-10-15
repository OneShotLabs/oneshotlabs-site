/* LUMEN — a suspended textile. The camera orbits; the structural anchors never move.
 * Version-pinned Three.js is shared with the standalone HTML export.
 * No photographic silhouette, screen-space particles, or draggable cloth pins.
 */
(()=>{'use strict';
const section=document.querySelector('.fabric'),canvas=document.querySelector('#fabric-breath');
if(!section||!canvas)return;
Promise.all([import('three'),import('three/addons/controls/OrbitControls.js')])
  .then(([THREE,{OrbitControls}])=>mount(THREE,OrbitControls)).catch(fallback);
function fallback(error){document.documentElement.classList.remove('ai-intro');section.dataset.clothReady='false';section.dataset.lumen='fallback';console.warn('LUMEN: still image fallback',error);}

function mount(T,OrbitControls){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  const clearColor=new T.Color('#1d2f4e');
  renderer.setClearColor(clearColor);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.025,60),rig=new T.Group();scene.add(rig);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.04;controls.rotateSpeed=.384;
  // Keep the page's vertical wheel/touch gestures native so visitors can
  // continue from the expanded system to the AI Curve. Keyboard zoom remains
  // available without trapping the primary scrolling gesture on the canvas.
  controls.enablePan=false;controls.enableZoom=false;
  controls.zoomSpeed=.35;controls.minDistance=.55;
  controls.minPolarAngle=.22;controls.maxPolarAngle=Math.PI-.22;
  controls.mouseButtons={LEFT:T.MOUSE.ROTATE,MIDDLE:T.MOUSE.ROTATE,RIGHT:T.MOUSE.ROTATE};
  controls.touches={ONE:T.TOUCH.ROTATE,TWO:T.TOUCH.DOLLY_ROTATE};
  // Normal mobile browsing stays scrollable until Explore is explicitly open.
  // On phones the system panel is not offered, so the hero itself keeps the
  // gestures: a sideways swipe turns the silk (vertical swipes still scroll,
  // via touch-action:pan-y) and two fingers pinch to zoom.
  const phoneGestures=matchMedia('(max-width:700px)');
  const clothTouches=new Set();
  canvas.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch')return;
    clothTouches.add(event.pointerId);
    // Two fingers zoom the textile while one finger remains native page scroll.
    controls.enableZoom=clothTouches.size>=2;
    if(!document.body.classList.contains('exploring-system')&&!phoneGestures.matches)event.stopImmediatePropagation();
  },{capture:true});
  const releaseClothTouch=event=>{
    if(event.pointerType!=='touch')return;
    clothTouches.delete(event.pointerId);
    if(clothTouches.size<2)controls.enableZoom=false;
  };
  canvas.addEventListener('pointerup',releaseClothTouch,{capture:true});
  canvas.addEventListener('pointercancel',releaseClothTouch,{capture:true});
  // A denser presentation mesh resolves gathered creases without faceted rims.
  // Bounded, coherent displacement preserves this authored drape while the
  // free fabric breathes. No pointer forces or accumulated simulation drift.
  const NX=128,NY=80,N=(NX+1)*(NY+1),positions=new Float32Array(N*3),rest=new Float32Array(N*3),uv=new Float32Array(N*2),freedom=new Float32Array(N);
  const pins=new Set([54*(NX+1)+64,12*(NX+1)+98]),thickness=new Float32Array(N);
  const index=(x,y)=>y*(NX+1)+x;
  for(let y=0;y<=NY;y++)for(let x=0;x<=NX;x++){
    const n=index(x,y),u=x/NX,v=y/NY;
    // Two gathered interior points, not a four-corner hammock. Radial folds
    // widen away from each gather and become broad, unrestrained hems.
    const px=(u-.5)*7.2,pz=(v-.5)*3.3;
    const dx=px,dz=pz-(.675-.5)*3.3;
    const bx=px-(.765625-.5)*7.2,bz=pz-(.15-.5)*3.3;
    const r=Math.hypot(dx*.78,dz),rearR=Math.hypot(bx*.85,bz);
    const front=2.12-1.65*Math.pow(r,.72),back=1.45-1.60*Math.pow(rearR,.72);
    const blend=1/(1+Math.exp((back-front)*5));
    const theta=Math.atan2(dz,dx),rearTheta=Math.atan2(bz,bx);
    const gather=1-Math.exp(-Math.min(r,rearR)*1.7);
    const folds=gather*(blend*(.18*Math.sin(theta*9+r*1.8)+.045*Math.sin(theta*17-r))+(1-blend)*.13*Math.sin(rearTheta*9+rearR*2));
    const fineFold=gather*(blend*.026*Math.sin(theta*27+r*4)+(1-blend)*.025*Math.sin(rearTheta*23+rearR*3));
    const hem=Math.max(0,(v-.675)/(1-.675)),hang=hem*hem*(3-2*hem);
    const suspended=Math.log(Math.exp(front*5)+Math.exp(back*5))/5;
    // An asymmetric rolled fold crosses the lower span. Its turned-over lip
    // creates genuine overlapping geometry, not a painted highlight.
    const sweep=.79+.065*Math.sin(u*5.5+.4),width=.075;
    const roll=Math.exp(-Math.pow((v-sweep)/width,2))*Math.pow(Math.sin(Math.PI*u),2)*gather;
    const pocket=Math.exp(-Math.pow((v-sweep+.075)/.11,2))*Math.sin(Math.PI*u)*gather;
    positions[n*3]=px;
    positions[n*3+1]=suspended*(1-hang)+(-1.45+.23*Math.sin(u*7+.3))*hang+folds+fineFold*.4+.27*roll-.12*pocket;
    positions[n*3+2]=pz+folds*.85+fineFold+.43*roll;
    thickness[n]=.43+.18*roll+.14*Math.exp(-Math.min(r,rearR)*3);
    uv[n*2]=u;uv[n*2+1]=v;
    const distance=Math.min(r,rearR),weight=Math.min(1,distance/.9);
    freedom[n]=pins.has(n)?0:weight*weight*(3-2*weight);
  }
  rest.set(positions);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
  geometry.setAttribute('thickness',new T.BufferAttribute(thickness,1));
  // Rest coordinates give the visitor's light a material-space metric, so it
  // travels along the silk and folds with it rather than across the screen.
  geometry.setAttribute('restPosition',new T.BufferAttribute(rest,3));
  const indices=[];for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){const a=index(x,y),b=a+1,c=a+NX+1,d=c+1;indices.push(a,c,b,b,c,d);}geometry.setIndex(indices);geometry.computeVertexNormals();
  const nodeUniforms=Array.from({length:20},()=>new T.Vector4(.5,.5,0,0));
  // Sample fine fibre detail from a textile-only patch of the existing site
  // image. Local contrast removes its photographed folds and baked lighting;
  // the new sculpture keeps its own silhouette and spatial illumination.
  const fibreTexture=new T.TextureLoader().load(section.querySelector('img.art').src,()=>{
    material.uniforms.uFabricReady.value=1;section.dataset.lumenMaterial='woven-silk';wake();
  },undefined,()=>{section.dataset.lumenMaterial='procedural-fallback';wake();});
  fibreTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  fibreTexture.colorSpace=T.NoColorSpace;
  // A distance cubemap measures which folds obstruct the INTERNAL light.
  // It is refreshed at 12.5 Hz; the slow fabric needs no six-pass render on
  // every display frame. Half float avoids quantized shadow bands.
  const lightOrigin=new T.Vector3(-.5,.8,.2);
  const floatLight=renderer.extensions.has('EXT_color_buffer_float');
  const lightTarget=new T.WebGLCubeRenderTarget(innerWidth<=700?128:256,{type:floatLight?T.HalfFloatType:T.UnsignedByteType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});
  const lightCamera=new T.CubeCamera(.025,20,lightTarget);lightCamera.position.copy(lightOrigin);
  const distanceMaterial=new T.ShaderMaterial({side:T.DoubleSide,toneMapped:false,uniforms:{uOrigin:{value:lightOrigin}},
    vertexShader:`varying vec3 world;void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader:`uniform vec3 uOrigin;varying vec3 world;void main(){gl_FragColor=vec4(vec3(length(world-uOrigin)/20.),1.);}`});
  const material=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,forceSinglePass:false,depthWrite:true,uniforms:{uTime:{value:0},uNodes:{value:nodeUniforms},uFabric:{value:fibreTexture},uFabricReady:{value:0},uLightDepth:{value:lightTarget.texture},uLightOrigin:{value:lightOrigin},uDepthBias:{value:floatLight?.04:.12}},
    vertexShader:`attribute float thickness;attribute vec3 restPosition;varying float vThickness;varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;varying vec3 vRest;
      void main(){vThickness=thickness;vUv=uv;vRest=restPosition;vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;vNormal=normalize((vec4(normalMatrix*normal,0.)*viewMatrix).xyz);gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`precision highp float;
      uniform float uTime;uniform float uNodeStyle;uniform float uNodeMaxPx;uniform float uViewportHeight;uniform float uProjectionY;uniform vec4 uNodes[20];uniform sampler2D uFabric;uniform float uFabricReady;
      uniform samplerCube uLightDepth;uniform vec3 uLightOrigin;uniform float uDepthBias;
      uniform vec4 uNodeClip[20];uniform mat4 uViewProjection;uniform vec2 uViewportSize;
      varying float vThickness;varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;varying vec3 vRest;
      uniform vec4 uHover;uniform vec4 uRipples[4];uniform float uRippleSpeed;uniform float uTouch;uniform float uReveal;
      uniform vec3 uBeamPos;uniform vec3 uBeamDir;uniform vec3 uBeamColor;uniform float uBeamStrength;uniform vec3 uLightTint;
      float caustic(vec2 p,float t){
        // Light through moving water: a few folded sine fields sharpen into bright filaments.
        vec2 i=p;float c=0.;
        for(int n=0;n<4;n++){float tt=t*(1.-3.5/float(n+1));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
          c+=1./length(vec2(p.x/(sin(i.x+tt)/.005),p.y/(cos(i.y+tt)/.005)));}
        c/=4.;c=1.17-pow(c,1.4);return clamp(pow(abs(c),8.),0.,1.);
      }
      float transmitted(vec3 direction,float distance){
        float depth=textureCube(uLightDepth,direction).r*20.;
        float separation=max(0.,distance-depth-uDepthBias);
        // Close overlapping folds retain contact depth; separated layers
        // admit more scattered fill rather than producing hard black bands.
        float scatteredFill=mix(.19,.34,smoothstep(0.,.65,separation));
        return mix(scatteredFill,1.,1.-smoothstep(uDepthBias,uDepthBias+.12,distance-depth));
      }
      float lightThroughFolds(){
        vec3 ray=vWorld-uLightOrigin;float distance=max(length(ray),.0001);vec3 direction=ray/distance;
        vec3 axis=abs(direction.y)<.9?vec3(0.,1.,0.):vec3(1.,0.,0.);
        // A fold close to its blocker casts a tighter shadow; separated
        // layers receive a broader penumbra from the internal area light.
        // This is a bounded soft-shadow approximation, not volume scattering.
        float blocker=textureCube(uLightDepth,direction).r*20.;
        float separation=max(0.,distance-blocker-uDepthBias);
        float radius=mix(.014,.056,smoothstep(0.,1.2,separation));
        vec3 tangent=normalize(cross(direction,axis))*radius,bitangent=normalize(cross(direction,tangent))*radius;
        return (transmitted(direction,distance)*4.+transmitted(direction+tangent,distance)+transmitted(direction-tangent,distance)+transmitted(direction+bitangent,distance)+transmitted(direction-bitangent,distance)+
          .5*(transmitted(direction+(tangent+bitangent)*.7071,distance)+transmitted(direction+(tangent-bitangent)*.7071,distance)+transmitted(direction+(-tangent+bitangent)*.7071,distance)+transmitted(direction-(tangent+bitangent)*.7071,distance)))/10.;
      }
      float fibreLuma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
      // Two verified workflow links: ChatGPT → Claude and Human Judgment.
      // Evaluate on textile fragments so entire paths deform and occlude
      // with the actual cloth, without free-floating world-space chords.
      uniform float uSignalTime;uniform float uAmbientTime;uniform float uManualSignal;uniform float uBeamBrightness;uniform float uNodeArrival[20];
      uniform vec4 uJourney[8];uniform float uJourneyCount;
      uniform float uElectricSegment;
      float branchDistance(vec2 p,vec2 a,vec2 m,vec2 b){
        float nearest=10.;vec2 previous=a;
        for(int k=1;k<=8;k++){
          float t=float(k)/8.;vec2 next=mix(mix(a,m,t),mix(m,b,t),t);
          vec2 line=next-previous;
          float along=clamp(dot(p-previous,line)/max(dot(line,line),.000001),0.,1.);
          nearest=min(nearest,length(p-previous-line*along));previous=next;
        }
        return nearest;
      }
      vec3 connection(vec2 p,vec2 a,vec2 b,float bend,float delay,float textileResponse){
        float electric=uManualSignal>=0.&&uElectricSegment>=0.&&abs(delay-uElectricSegment*1.65)<.01?1.:0.;
        vec2 direction=b-a;vec2 across=vec2(-direction.y,direction.x)/max(length(direction),.0001);
        vec2 mid=(a+b)*.5+vec2(bend,0.);vec2 previous=a;float closest=10.,pathT=0.;
        for(int k=1;k<=12;k++){
          float t=float(k)/12.;vec2 next=mix(mix(a,mid,t),mix(mid,b,t),t);
          next+=across*sin(t*3.14159265)*sin(t*14.-uManualSignal*1.4)*.003*electric;
          vec2 segment=next-previous,delta=p-previous;
          float along=clamp(dot(delta,segment)/max(dot(segment,segment),.000001),0.,1.);
          float distanceToSegment=length(delta-segment*along);
          if(distanceToSegment<closest){closest=distanceToSegment;pathT=(float(k)-1.+along)/12.;}
          previous=next;
        }
        // Screen-footprint floor keeps the main trace legible when the
        // textile is foreshortened. Material coordinates still bind it to
        // the folds; hidden sections remain correctly occluded.
        float aa=max(length(vec2(dFdx(closest),dFdy(closest))),.00015);
        float threadWidth=max(.00090,aa*1.35);
        float filament=1.-smoothstep(threadWidth,threadWidth+aa,closest);
        // Illuminate the whole connection together, like gold thread
        // catching light. No spatial chase, bright head, or trailing particle.
        float phase=(uManualSignal>=0.?uManualSignal:mod(uSignalTime,max(9.,(uJourneyCount-1.)*1.65+2.4)))-delay;
        float passage=smoothstep(0.,.20,phase)*(1.-smoothstep(.65,1.85,phase));
        float glowWidth=max(.0036,aa*3.0);
        float closeGlow=exp(-closest*closest/(glowWidth*glowWidth));
        // Gold shoulder separates the luminous core from pale silk without
        // a dark outline, enlarged nodes, or a persistent inscribed path.
        vec3 streak=vec3(1.,.76,.28)*filament*1.25
          +vec3(1.,.54,.065)*closeGlow*.24;
        vec3 silkRadiance=vec3(0.);
        if(electric>.5){
          streak=mix(streak,vec3(1.,.84,.46)*filament*1.25+vec3(1.,.60,.12)*closeGlow*.24,.45);
          // A broad wash of transmitted light, not a traveling bright head.
          // Only the chosen connection receives this local material response.
          // The slowly shifting width lets folds breathe without strobing.
          float swell=.5+.5*sin(pathT*5.4-phase*.85);
          float washWidth=mix(.023,.043,swell);
          float innerWash=exp(-pow(closest/washWidth,2.));
          float outerWash=exp(-pow(closest/(washWidth*2.4),2.));
          float endFeather=.35+.65*sin(clamp(pathT,0.,1.)*3.14159265);
          float washEnvelope=smoothstep(0.,.32,phase)*(1.-smoothstep(.65,1.85,phase));
          vec3 champagne=mix(vec3(1.,.77,.40),vec3(1.,.94,.79),innerWash);
          silkRadiance=champagne*(innerWash*.68+outerWash*.16)*endFeather
            *washEnvelope*textileResponse*min(uBeamBrightness,3.);
          // Two quiet offshoots, confined to textile fragments. They end
          // softly rather than flickering or forming an expanding ring.
          for(int k=0;k<2;k++){
            float t=.42+float(k)*.27,side=k==0?1.:-1.;
            vec2 root=mix(mix(a,mid,t),mix(mid,b,t),t);
            vec2 tip=root+direction*.10+across*side*.022;
            vec2 control=mix(root,tip,.5)+across*side*.008;
            float dist=branchDistance(p,root,control,tip);
            float softness=max(fwidth(dist),.0002);
            float thread=1.-smoothstep(.00022,.00022+softness,dist);
            float taper=1.-smoothstep(.25,1.,clamp(dot(p-root,tip-root)/max(dot(tip-root,tip-root),.000001),0.,1.));
            float envelope=smoothstep(.12,.35,phase)*(1.-smoothstep(.50,1.10,phase));
            streak+=vec3(1.,.81,.43)*thread*taper*envelope*.19;
          }
        }
        return streak*passage*2.25*uBeamBrightness+silkRadiance;
      }
      float fibres(vec2 p){
        vec2 tile=1.-abs(mod(p,2.)-1.);
        vec2 atlas=vec2(.405,.575)+tile*vec2(.13,.125);
        float fine=fibreLuma(texture2D(uFabric,atlas).rgb);
        float broad=fibreLuma(textureLod(uFabric,atlas,4.).rgb);
        return clamp((fine-broad)/(.2+broad),-.45,.45)*uFabricReady;
      }
      vec3 bump(vec3 N,float height){
        vec3 px=dFdx(vWorld),py=dFdy(vWorld),rx=cross(py,N),ry=cross(N,px);
        float det=dot(px,rx);vec3 gradient=sign(det)*(dFdx(height)*rx+dFdy(height)*ry);
        vec3 perturbed=abs(det)*N-gradient;
        return dot(perturbed,perturbed)>1e-18?normalize(perturbed):N;
      }
      void main(){
        vec3 N=normalize(vNormal);vec3 V=normalize(cameraPosition-vWorld);if(dot(N,V)<0.)N=-N;
        // Two differently scaled textile samples soften the mirrored repeat.
        // Low-frequency yarn variation becomes legible only at close range.
        float fibre=.72*fibres(vUv*vec2(4.,2.5))+.28*fibres(vUv*vec2(7.13,4.71)+vec2(.37,.61));
        // Footprint-based detail: threads resolve on approach and disappear
        // smoothly before becoming subpixel noise, including grazing views.
        vec2 warp=vUv*vec2(2400.,1680.)+vec2(sin(vUv.y*87.)*.45,sin(vUv.x*110.)*.3);
        vec2 footprint=fwidth(warp);
        vec2 resolved=exp(-.5*footprint*footprint);
        float yarn=.85+.15*sin(vUv.y*193.+sin(vUv.x*37.));
        float warpThread=sin(warp.x)*resolved.x;
        float weftThread=sin(warp.y)*resolved.y;
        float thread=(warpThread*.55+weftThread*.35+warpThread*weftThread*.10)*yarn;
        float detail=max(resolved.x,resolved.y);
        N=bump(N,fibre*mix(.0018,.0026,detail)+thread*.00022);
        float facing=clamp(abs(dot(N,V)),.02,1.),rim=pow(1.-facing,3.);
        // Broad internal lanterns soften through the silk. Cool transmission
        // in the thin fields preserves the navy/ivory palette of the site.
        vec3 L=normalize(uLightOrigin-vWorld),L2=normalize(vec3(1.8,.25,-.65)-vWorld);
        float illumination=lightThroughFolds();
        float wrap=pow(abs(dot(N,L)),1.3);
        float back=pow(max(0.,dot(V,-L)),2.)*.65+pow(max(0.,dot(V,-L2)),2.)*.35;
        // Follow the actual deformed UV warp rather than a fixed world axis.
        // A broad anisotropic lobe reads as silk, not a plastic point highlight.
        vec3 px=dFdx(vWorld),py=dFdy(vWorld);vec2 tx=dFdx(vUv),ty=dFdy(vUv);
        vec3 tangent=px*ty.y-py*tx.y;tangent-=N*dot(N,tangent);
        tangent/=max(length(tangent),.00001);
        vec3 bitangent=cross(N,tangent),halfVector=L+V;
        vec3 H=halfVector/max(length(halfVector),.00001);
        float nh=max(.08,dot(N,H));
        float silkLobe=exp(-(pow(dot(H,tangent)/.62,2.)+pow(dot(H,bitangent)/.28,2.))/(nh*nh));
        // A restrained second, broader yarn lobe gives moving folds a soft
        // shoulder instead of a single plastic-looking specular highlight.
        float yarnLobe=exp(-(pow(dot(H,tangent)/.72,2.)+pow(dot(H,bitangent)/.38,2.))/(nh*nh));
        // Broad, view-dependent pearl highlights follow yarn direction.
        // No animated sparkle: the cloth and camera movement provide shimmer.
        float sheen=(silkLobe*.16+yarnLobe*.085)*(.45+.55*rim);
        float density=clamp(vThickness+fibre*.85+thread*.04,.25,.85);
        // Near-white ivory textile: warmth belongs to the internal light,
        // not a yellow dye across the material, shadows, and edge highlights.
        float transmission=exp(-density*1.45);
        vec3 color=mix(vec3(.061,.062,.064),vec3(.93,.90,.83),.12+wrap*.76*illumination);
        color+=vec3(1.,.88,.68)*back*.48*transmission*illumination;
        // A small environment contribution keeps rear-facing folds readable
        // while the internal light still controls the strongest highlights.
        color+=vec3(.97,.94,.87)*sheen*mix(.22,1.,illumination);
        color+=vec3(.91,.89,.84)*rim*.10+vec3(.071,.070,.068)*(1.-illumination);
        // Keep the weave tactile on approach without over-contrasting its
        // photographic sample into mottling. Thread contrast is footprint
        // filtered above, so distant/grazing yarn does not turn into noise.
        color*=1.+fibre*mix(1.05,1.20,detail)+thread*.020;
        // Diffused light fans through the gathered textile, not through a
        // screen-space overlay. Material coordinates keep it bound to the
        // billowing weave; fold occlusion and density preserve shaded depth.
        vec2 radianceUV=(vUv-uNodes[0].xy)*vec2(1.65,1.);
        float reach=length(radianceUV);
        float spread=atan(radianceUV.y,radianceUV.x);
        float ribbons=pow(.5+.5*sin(spread*9.+sin(spread*3.)*.65),5.);
        float veil=exp(-reach*5.5);
        float feather=exp(-reach*3.8)*smoothstep(.025,.12,reach)*ribbons;
        float breath=.98+.02*sin(uTime*.19);
        float radiance=(veil*.65+feather*.30)*transmission*illumination*(.65+.35*back)*breath;
        color+=mix(vec3(1.,.87,.66),vec3(1.,.97,.91),veil)*radiance;
        vec2 networkUV=vUv*vec2(1.65,1.),hubUV=uNodes[0].xy*vec2(1.65,1.);
        vec3 paths=vec3(0.);
        // Reuse actual fold light, thickness and filtered weave. This is a
        // local scattering approximation, not a screen-space glow overlay.
        float textileResponse=transmission*mix(.30,1.,illumination)*(.72+.28*back)
          *clamp(1.+fibre*.85+thread*.035,.75,1.2);
        // Each complete thread illuminates in order. The previous thread's
        // even fade briefly overlaps the next, without a traveling particle.
        for(int j=0;j<8;j++){
          if(float(j)<uJourneyCount){
            vec4 segment=uJourney[j];
            paths+=connection(networkUV,segment.xy*vec2(1.65,1.),segment.zw*vec2(1.65,1.),.018,float(j)*1.65,textileResponse);
          }
        }
        color+=paths*(.65+.35*transmission);
        // The visitor's light. A lantern pool rests beneath the hand, and each
        // touch sends one soft crest of transmitted light outward through the
        // weave. Both are evaluated on textile fragments in rest space, so
        // folds occlude them and they never cross the cloth silhouette.
        // The key light: one narrow beam the visitor aims. It rakes across the
        // folds at a low angle, revealing their relief, with a silk sheen along
        // the yarn. Outside its cone the textile settles slightly darker, so
        // the beam carves the form rather than flooding it.
        vec3 toBeam=uBeamPos-vWorld;float beamDistance=max(length(toBeam),.001);vec3 Lb=toBeam/beamDistance;
        float cone=smoothstep(.962,.986,dot(-Lb,uBeamDir));
        float rake=pow(max(dot(N,Lb),0.),1.5);
        vec3 Hb=normalize(Lb+V);float nhb=max(.08,dot(N,Hb));
        float beamSheen=exp(-(pow(dot(Hb,tangent)/.55,2.)+pow(dot(Hb,bitangent)/.24,2.))/(nhb*nhb));
        float beamThrough=pow(max(0.,dot(V,-Lb)),2.)*transmission;
        // Barely at rest; when the visitor guides it, the unlit silk falls back.
        color*=1.-.24*uBeamStrength*uBeamStrength*(1.-cone)*(.55+.45*smoothstep(.0,.6,1.-dot(-Lb,uBeamDir)));
        color+=uBeamColor*(rake*.62+beamSheen*.38+beamThrough*.60)*cone*uBeamStrength;
        // Normalised so thin and dense yarn both carry the light, while dense
        // gathers still hold back more of it than open silk.
        float touchResponse=clamp(textileResponse*2.4,.38,1.15);
        // Near-white silk cannot get much brighter, so the visitor's light
        // reads as warmth: a champagne cast through the weave, with a small
        // luminous core. It shares the gold of the system's node pools.
        float hoverDistance=length(vRest-uHover.xyz);
        float lanternCore=exp(-pow(hoverDistance/.20,2.));
        float lantern=lanternCore*.55+exp(-pow(hoverDistance/.42,2.))*.46+exp(-pow(hoverDistance/.95,2.))*.18;
        float warmth=lantern*uHover.w*uTouch*touchResponse,water=0.;
        for(int r=0;r<4;r++){
          vec4 ripple=uRipples[r];
          if(ripple.w<0.)continue;
          float rippleDistance=length(vRest-ripple.xyz),front=rippleDistance-uRippleSpeed*ripple.w;
          float envelope=smoothstep(0.,.35,ripple.w)*exp(-ripple.w/2.2);
          // Broad enough that foreshortened folds never compress it into a line:
          // thin gold lines belong to the system's journeys, broad warmth to the visitor.
          float crest=exp(-front*front/.62)*envelope;
          float kindle=exp(-pow(rippleDistance/.30,2.))*smoothstep(0.,.18,ripple.w)*exp(-ripple.w*1.2);
          // Contact stays warm; the travelling ring becomes faint water light.
          float ripplesOfLight=caustic(vRest.xz*2.1+vec2(vRest.y*.8,0.),ripple.w*1.1+uTime*.12);
          water+=crest*(.12+ripplesOfLight*.95)*uTouch*touchResponse;
          warmth+=kindle*1.1*uTouch*touchResponse;
          lanternCore=max(lanternCore,kindle);
        }
        warmth=min(warmth,1.6);
        color=mix(color,color*vec3(1.03,.88,.64),min(warmth*.75,.78));
        color+=mix(vec3(1.,.74,.38),vec3(1.,.94,.82),lanternCore)*warmth*.62;
        color+=vec3(.86,.93,1.)*min(water,1.2)*.72;
        float edge=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));
        float hem=1.-smoothstep(.001,.004,edge);color+=vec3(.28,.27,.25)*hem;
        // These luminous cores are evaluated ONLY on textile fragments.
        // Even their soft halos cannot cross the geometric cloth silhouette.
        float nodeCoverage=0.;
        float uvDet=tx.x*ty.y-tx.y*ty.x;
        float safeDet=abs(uvDet)<1e-12?(uvDet<0.?-1e-12:1e-12):uvDet;
        vec3 surfaceU=(px*ty.y-py*tx.y)/safeDet,surfaceV=(py*tx.x-px*ty.x)/safeDet;
        for(int i=0;i<20;i++){
          vec4 node=uNodes[i];vec2 delta=vUv-node.xy;
          // Local surface metric sizes the orb to the .031-radius attachment,
          // rather than enlarging it with UV stretching or portrait framing.
          vec3 offset=surfaceU*delta.x+surfaceV*delta.y;
          float viewDepth=max(.025,-(viewMatrix*vec4(vWorld,1.)).z);
          float cappedRadius=min(.031,uNodeMaxPx*viewDepth/(uProjectionY*uViewportHeight));
          vec2 q=vec2(dot(offset,tangent),dot(offset,bitangent))/max(cappedRadius,.000001);
          float radius=length(q),aa=max(fwidth(radius),.08);
          float disc=1.-smoothstep(1.-aa,1.+aa,radius);
          vec3 orbNormal=normalize(vec3(q,sqrt(max(.001,1.-min(dot(q,q),1.)))));
          float highlight=pow(max(0.,dot(orbNormal,normalize(vec3(-.4,.6,1.)))),18.);
          vec3 gold=mix(vec3(.36,.22,.035),vec3(1.,.78,.25),clamp(orbNormal.y*.4+.6,0.,1.));
          float halo=exp(-radius*radius*.65)*(1.-smoothstep(1.4,2.,radius));
          vec3 orb;
          if(uNodeStyle<.5)orb=gold+vec3(1.,.87,.52)*highlight*.8;
          else if(uNodeStyle<1.5)orb=gold*1.3+vec3(1.,.90,.63)*exp(-radius*radius*3.)*1.4;
          else {float ring=exp(-pow((radius-.82)/.13,2.));orb=gold*.8+vec3(1.,.82,.40)*ring*.9+vec3(1.,.94,.74)*highlight*.5;}
          // Shared with the directory: exactly the same arrival envelope.
          float arrival=uNodeArrival[i];
          // A quiet point of discovery; emphasis belongs to the passing light.
          float activity=max(arrival,min(1.,node.w));
          float vitality=1.;
          color+=vec3(1.,.82,.42)*disc*node.z*(.055+activity*.48);
          color+=vec3(1.,.78,.30)*halo*node.z*(.012+activity*.10);
          // Low-energy transmitted light is separate from the approved 3px
          // core. Its material-space footprint follows the silk, never the
          // screen. Yarn density breaks up the light without hiding texture.
          // A small elliptical pool follows the material warp, rather than
          // becoming a circular bloom sticker. Two scales give a soft shoulder
          // and a feathered falloff; neither changes the bright core radius.
          vec2 diffusionUV=delta*vec2(1.65,1.);
          float diffusionDistance=length(diffusionUV*vec2(1.16,.86));
          float nearPool=exp(-pow(diffusionDistance/.042,2.));
          float softPool=exp(-pow(diffusionDistance/.088,2.));
          float diffusion=nearPool*.29+softPool*.065;
          // Dense yarn retains shadow while finer threads catch transmitted
          // gold. Reuse the footprint-filtered weave to avoid zoom shimmer.
          float weaveTransmission=exp(-density*1.8)*clamp(1.+fibre*1.15+thread*.055,.68,1.28);
          float foldTransmission=mix(.42,1.,illumination)*(.78+.22*back);
          vec3 poolColor=mix(vec3(1.,.69,.27),vec3(1.,.89,.65),nearPool);
          color+=poolColor*diffusion*weaveTransmission*foldTransmission*node.z*(.045+activity*.22);
          // Arrival is a fixed, feathered pool through the yarn, never an
          // expanding ring or an enlarged orb. Champagne core, yellow-gold halo.
          color+=vec3(1.,.76,.25)*(nearPool*.42+softPool*.13)*arrival*weaveTransmission*foldTransmission*node.z;
          // Rear nodes read as diffuse light THROUGH the foreground silk,
          // never as sharp x-ray orbs. This is a bounded transmission cue,
          // evaluated only on cloth fragments, not a free-floating overlay.
          vec4 surfaceClip=uViewProjection*vec4(vWorld,1.),sourceClip=uNodeClip[i];
          if(sourceClip.w>.025&&surfaceClip.w>.025){
            vec2 pixelDelta=(surfaceClip.xy/surfaceClip.w-sourceClip.xy/sourceClip.w)*uViewportSize*.5;
            float separation=sourceClip.w-surfaceClip.w;
            float behind=smoothstep(.04,.18,separation)*exp(-max(0.,separation)*.7);
            // More intervening depth broadens and softens the transmitted
            // pool. Area compensation keeps it from becoming a bright blob.
            float scatterRadius=mix(9.,19.,smoothstep(.04,1.4,separation));
            float spot=exp(-dot(pixelDelta,pixelDelta)/(scatterRadius*scatterRadius));
            float scatterEnergy=9./scatterRadius;
            color+=vec3(1.,.79,.32)*spot*scatterEnergy*behind*node.z*(.008+activity*.13)*weaveTransmission;
          }
          // Keep the silk's density unchanged around the point of light.
        }
        float opacity=clamp(1.-exp(-(density+hem*.08)/(facing*.60+.12)),.30,.95);
        opacity=mix(opacity,.99,smoothstep(.08,.65,nodeCoverage));
        // Arrival: the silk condenses out of the navy as its light warms.
        // The hour's light colours the silk, as white fabric takes on its light.
        color*=uLightTint;
        color*=mix(.55,1.,uReveal);
        gl_FragColor=vec4(color,opacity*uReveal);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  material.uniforms.uNodeStyle={value:1};
  material.uniforms.uSignalTime={value:0};
  material.uniforms.uAmbientTime={value:0};
  material.uniforms.uNodeArrival={value:new Float32Array(20)};
  material.uniforms.uManualSignal={value:-1};
  material.uniforms.uElectricSegment={value:-1};
  material.uniforms.uBeamBrightness={value:2.5};
  material.uniforms.uJourney={value:Array.from({length:8},()=>new T.Vector4())};
  material.uniforms.uJourneyCount={value:0};
  material.uniforms.uNodeMaxPx={value:3};
  material.uniforms.uViewportHeight={value:1};
  material.uniforms.uProjectionY={value:camera.projectionMatrix.elements[5]};
  material.uniforms.uNodeClip={value:Array.from({length:20},()=>new T.Vector4())};
  material.uniforms.uViewProjection={value:new T.Matrix4()};
  material.uniforms.uViewportSize={value:new T.Vector2(1,1)};
  material.uniforms.uHover={value:new T.Vector4(0,0,0,0)};
  material.uniforms.uRipples={value:Array.from({length:4},()=>new T.Vector4(0,0,0,-1))};
  material.uniforms.uRippleSpeed={value:.82};
  material.uniforms.uTouch={value:1};
  material.uniforms.uReveal={value:reduced.matches?1:0};
  // ── Time-of-day light ─────────────────────────────────────────────────
  // One palette per visit, from the visitor's local hour: champagne dawn,
  // clean ivory day, amber dusk, moonlit silver night. ?light=dawn|day|dusk|night previews.
  const lightKeys=[[0,'night'],[5,'night'],[6.5,'dawn'],[8.5,'day'],[16,'day'],[18.5,'dusk'],[20.5,'night'],[24,'night']];
  const lightLooks={night:{tint:[.88,.93,1.06],beam:[.76,.85,1.]},dawn:{tint:[1.03,.96,.93],beam:[1.,.86,.80]},day:{tint:[1,1,1],beam:[1.,.96,.90]},dusk:{tint:[1.05,.94,.81],beam:[1.,.80,.56]}};
  const lightOverride=new URLSearchParams(location.search).get('light'),now=new Date();
  const hour=lightOverride&&lightLooks[lightOverride]?{dawn:6.5,day:12,dusk:18.5,night:23}[lightOverride]:now.getHours()+now.getMinutes()/60;
  const lightTint=new T.Vector3(),beamColor=new T.Vector3();
  for(let i=0;i<lightKeys.length-1;i++){const [h0,a]=lightKeys[i],[h1,b]=lightKeys[i+1];if(hour>=h0&&hour<=h1){const t=h1>h0?(hour-h0)/(h1-h0):0,e=t*t*(3-2*t);
    lightTint.fromArray(lightLooks[a].tint).lerp(new T.Vector3().fromArray(lightLooks[b].tint),e);beamColor.fromArray(lightLooks[a].beam).lerp(new T.Vector3().fromArray(lightLooks[b].beam),e);
    section.dataset.lumenLight=e<.5?a:b;break;}}
  material.uniforms.uLightTint={value:lightTint};material.uniforms.uBeamColor={value:beamColor};
  material.uniforms.uBeamPos={value:new T.Vector3(4,6,4)};material.uniforms.uBeamDir={value:new T.Vector3(0,-1,0)};material.uniforms.uBeamStrength={value:0};
  const cloth=new T.Mesh(geometry,material);cloth.frustumCulled=false;rig.add(cloth);
  cloth.layers.enable(1);lightCamera.layers.set(1);for(const c of lightCamera.children)c.layers.set(1);
  let lastLightUpdate=-Infinity;
  const trackedPosition=new T.Vector3(),trackedNormal=new T.Vector3(),samplePosition=new T.Vector3(),sampleNormal=new T.Vector3(),normalTransform=new T.Matrix3();
  function trackInternalLight(){
    // Barycentric sampling matches the index order a,c,b / b,c,d exactly.
    const x=T.MathUtils.clamp(nodeUniforms[0].x,0,.999999)*NX,z=T.MathUtils.clamp(nodeUniforms[0].y,0,.999999)*NY;
    const col=Math.floor(x),row=Math.floor(z),s=x-col,t=z-row,a=row*(NX+1)+col,b=a+1,c=a+NX+1,d=c+1;
    const ids=s+t<=1?[a,c,b]:[b,c,d],weights=s+t<=1?[1-s-t,t,s]:[1-t,1-s,s+t-1];
    trackedPosition.set(0,0,0);trackedNormal.set(0,0,0);
    for(let j=0;j<3;j++){
      trackedPosition.addScaledVector(samplePosition.fromArray(positions,ids[j]*3),weights[j]);
      trackedNormal.addScaledVector(sampleNormal.fromBufferAttribute(geometry.attributes.normal,ids[j]),weights[j]);
    }
    rig.updateWorldMatrix(true,false);normalTransform.getNormalMatrix(rig.matrixWorld);
    trackedPosition.applyMatrix4(rig.matrixWorld);trackedNormal.applyMatrix3(normalTransform).normalize();
    lightOrigin.copy(trackedPosition).addScaledVector(trackedNormal,-.18);lightCamera.position.copy(lightOrigin);
  }
  function updateInternalLight(now){
    if(now-lastLightUpdate<80)return;
    trackInternalLight();
    scene.overrideMaterial=distanceMaterial;renderer.setClearColor(0xffffff);
    try{lightCamera.update(renderer,scene);}finally{scene.overrideMaterial=null;renderer.setClearColor(clearColor);}
    lastLightUpdate=now;
  }
  // Static cables and attachment ferrules share the world-space pins.
  const cableMaterial=new T.LineBasicMaterial({color:'#bfae89',transparent:true,opacity:.38});
  // Gold hardware has its own restrained metallic gradient. Share the
  // textile clock so Pause and reduced motion also stop the shimmer.
  const ferruleGeometry=new T.SphereGeometry(.031,20,14);
  const ferruleMaterial=new T.ShaderMaterial({transparent:true,
    uniforms:{uTime:material.uniforms.uTime,uReveal:material.uniforms.uReveal},
    vertexShader:`varying vec3 goldNormal;varying vec3 goldWorld;
      void main(){vec4 w=modelMatrix*vec4(position,1.);goldWorld=w.xyz;
        goldNormal=normalize((vec4(normalMatrix*normal,0.)*viewMatrix).xyz);
        gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uTime;uniform float uReveal;varying vec3 goldNormal;varying vec3 goldWorld;
      void main(){vec3 N=normalize(goldNormal),V=normalize(cameraPosition-goldWorld);
        vec3 L=normalize(vec3(-.4,.85,1.));
        float gradient=smoothstep(-.65,.85,dot(N,L));
        vec3 gold=mix(vec3(.18,.09,.023),vec3(.78,.52,.16),gradient);
        float highlight=pow(max(0.,dot(N,normalize(L+V))),26.);
        float shimmer=.92+.08*sin(uTime*.32+goldWorld.y*1.7);
        gold+=vec3(1.,.87,.57)*highlight*.48*shimmer;
        gl_FragColor=vec4(gold,smoothstep(.25,.85,uReveal));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  for(const n of pins){const p=new T.Vector3().fromArray(rest,n*3),top=p.clone().add(new T.Vector3(p.x*.06,1.8,p.z*.10));
    rig.add(new T.Line(new T.BufferGeometry().setFromPoints([p,top]),cableMaterial));const ferrule=new T.Mesh(ferruleGeometry,ferruleMaterial);ferrule.position.copy(p);rig.add(ferrule);}


  // Compact scene controls are separate from the website's method navigation.
  const toolbar=document.createElement('div');toolbar.className='lumen-controls';
  const hint=document.createElement('span');hint.textContent='Drag to orbit · Scroll down to continue';toolbar.append(hint);
  const reset=document.createElement('button');reset.type='button';reset.textContent='Reset view';toolbar.append(reset);section.append(toolbar);
  const sendBeam=document.createElement('button');sendBeam.type='button';sendBeam.textContent='Replay journey';toolbar.append(sendBeam);
  sendBeam.addEventListener('click',()=>{
    // Explicit replay also works with the fabric paused, without unpausing it.
    material.uniforms.uManualSignal.value=0;
    idleSince=performance.now();journeyHoldUntil=idleSince+12000;activeUntil=idleSince+16000;wake();
  });
  const motionDefaults={orbit:100,strength:130,speed:155,touch:100,key:100},motionSettings={...motionDefaults};
  let liveStrength=motionDefaults.strength/100,liveSpeed=motionDefaults.speed/100,idleSince=performance.now(),interacting=false;
  const settings=document.createElement('details');settings.className='lumen-settings';
  const settingsSummary=document.createElement('summary');settingsSummary.textContent='Motion settings';settings.append(settingsSummary);
  const settingsPanel=document.createElement('div');settingsPanel.className='lumen-settings-panel';settingsPanel.hidden=true;document.body.append(settingsPanel);toolbar.append(settings);
  const settingInputs=[];
  const beamRow=document.createElement('label'),beamName=document.createElement('span'),beamOutput=document.createElement('output'),beamInput=document.createElement('input');
  beamName.textContent='Beam brightness';beamInput.type='range';beamInput.min='0';beamInput.max='300';beamInput.step='5';beamInput.value='250';beamInput.id='lumen-beam';beamInput.setAttribute('aria-label','Beam brightness');beamOutput.htmlFor=beamInput.id;beamOutput.textContent='250%';
  beamRow.append(beamName,beamOutput,beamInput);settingsPanel.append(beamRow);
  beamInput.addEventListener('input',()=>{material.uniforms.uBeamBrightness.value=Number(beamInput.value)/100;beamOutput.textContent=beamInput.value+'%';wake();});
  for(const [key,title,max] of [['orbit','Automatic orbit',200],['strength','Billow strength',150],['speed','Wave speed',180],['touch','Responsiveness',150],['key','Key light',150]]){
    const row=document.createElement('label'),name=document.createElement('span'),output=document.createElement('output'),input=document.createElement('input');
    name.textContent=title;input.type='range';input.min='0';input.max=String(max);input.step='5';input.value=String(motionSettings[key]);input.id='lumen-'+key;
    input.setAttribute('aria-label',title);output.htmlFor=input.id;output.textContent=input.value+'%';row.append(name,output,input);settingsPanel.append(row);
    input.addEventListener('input',()=>{motionSettings[key]=Number(input.value);output.textContent=input.value+'%';wake();});
    settingInputs.push({key,input,output});
  }
  const restore=document.createElement('button');restore.type='button';restore.textContent='Reset motion';
  restore.addEventListener('click',()=>{Object.assign(motionSettings,motionDefaults);for(const {key,input,output} of settingInputs){input.value=String(motionSettings[key]);output.textContent=input.value+'%';}wake();});settingsPanel.append(restore);
  const note=document.createElement('p');note.textContent='Orbit resumes after 4 seconds idle. Changes last until reload.';settingsPanel.append(note);
  settings.addEventListener('toggle',()=>{settingsPanel.hidden=!settings.open;idleSince=performance.now();wake();});
  function holdOrbit(){idleSince=performance.now();if(journeyHoldUntil)journeyHoldUntil=idleSince+12000;}
  canvas.addEventListener('keydown',holdOrbit);
  reset.addEventListener('click',holdOrbit);
  controls.addEventListener('start',()=>{interacting=true;holdOrbit();});
  controls.addEventListener('end',()=>{interacting=false;holdOrbit();});
  canvas.tabIndex=0;canvas.removeAttribute('aria-hidden');canvas.setAttribute('role','img');canvas.setAttribute('aria-label','LUMEN suspended silk sculpture. Drag to orbit and pinch with two fingers to zoom. The fabric responds to your direction: move across it to guide its light, and click or press Enter to send a swell through it. Scroll down to continue to the AI Curve. Arrow keys rotate, plus and minus zoom, and Home resets the view.');
  controls.enableDamping=!reduced.matches;
  const pause=document.querySelector('#motion-toggle');let paused=reduced.matches,visible=true,contextLost=false,pageHidden=false,frameId=0,last=0,time=0,activeUntil=0,frameCount=0,measureStart=0;
  // Keep all fabric controls in one aligned row on phones, matching the
  // previously approved mobile composition.
  const mobileControls=matchMedia('(max-width:700px)'),pauseHome=pause?.parentNode,pauseNext=pause?.nextSibling;
  const curveLink=document.createElement('a');curveLink.className='lumen-curve-link';curveLink.href='#horizon';curveLink.textContent='Continue to the AI Curve ↓';section.append(curveLink);
  function fitMobileControls(){
    // Phones keep Pause motion in the hero (the system toolbar is not offered there).
    if(mobileControls.matches){if(pause&&pauseHome)pauseHome.insertBefore(pause,pauseNext);hint.textContent='Drag to orbit · Pinch to zoom';}
    else {if(pause&&pauseHome)pauseHome.insertBefore(pause,pauseNext);hint.textContent='Drag to orbit · Scroll down to continue';}
  }
  mobileControls.addEventListener('change',fitMobileControls);fitMobileControls();
  function label(){if(pause){pause.hidden=false;pause.textContent=paused?'Play motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));}section.dataset.motion=paused?'paused':'playing';}
  pause?.addEventListener('click',()=>{paused=!paused;last=0;label();wake();});
  // Long, overlapping waves (roughly 19–37 seconds) travel through the
  // folds. The smooth pin falloff fixes both position and the local tangent.
  // Evaluate from rest each frame: orbit/zoom never add strain or impulses.
  function step(dt){
    // Begin in an established breeze; rendered time prevents return-to-tab jumps.
    const easing=1-Math.exp(-dt*2);
    // An optional score lifts the breeze a little with its own energy.
    liveStrength+=(motionSettings.strength/100*(1+.16*(window.oslMusicLevel||0))-liveStrength)*easing;
    liveSpeed+=(motionSettings.speed/100-liveSpeed)*easing;
    time+=dt*liveSpeed;
    // The visitor's touch: a few millimetres of lift beneath the hand and one
    // travelling swell per click. Like the breeze, both are evaluated from
    // rest, scaled by pin freedom, and return to exactly zero; nothing
    // accumulates and the anchors never move.
    const response=motionSettings.touch/100,lift=touch.strength*.042*response*touch.sign;
    const swells=ripples.filter(r=>r.age<RIPPLE_LIFE);
    for(let n=0;n<N;n++){
      const k=n*3,u=uv[n*2],v=uv[n*2+1],weight=freedom[n];
      let rise=0;
      if(weight>0&&(lift||swells.length)){
        if(lift){const dx=rest[k]-touch.x,dy=rest[k+1]-touch.y,dz=rest[k+2]-touch.z;rise+=lift*Math.exp(-(dx*dx+dy*dy+dz*dz)/.42);}
        for(const r of swells){
          const front=Math.hypot(rest[k]-r.x,rest[k+1]-r.y,rest[k+2]-r.z)-RIPPLE_SPEED*r.age;
          const envelope=T.MathUtils.smoothstep(r.age,0,.35)*Math.exp(-r.age/2.2);
          // A soft crest with a shallow trailing trough reads as air
          // passing beneath silk, not as a rubber-sheet oscillation.
          rise+=r.sign*.12*response*envelope*(Math.exp(-front*front/.24)-.38*Math.exp(-(front+.85)*(front+.85)/.30));
        }
        rise*=weight;
      }
      const swell=Math.sin(time*.23-u*3.8+v*2.2),undertow=Math.sin(time*.17+u*5.1-v*3.4);
      // A quiet counter-wave keeps the hem alive as the broad canopy turns.
      const ripple=.75*Math.sin(time*.33-u*8.0+v*4.2)+.25*Math.sin(time*.41+u*10.2-v*5.3+1.1),hem=.55+.45*v*v;
      // 20% above the previous approved breeze (1.44 × 1.20).
      // Depth-led airflow lifts the folds; restrained lateral travel preserves
      // the silhouette. Keep the slow timing and exact anchor falloff unchanged.
      const breeze=weight*1.728*liveStrength;
      // Touch travels along the breeze's own depth-led airflow. Following
      // surface normals would push the rolled, overlapping lip against itself.
      positions[k]=rest[k]+breeze*(.024*swell+.012*undertow)+.18*rise;
      positions[k+1]=rest[k+1]+breeze*hem*(.075*swell+.025*ripple)+.58*hem*rise;
      positions[k+2]=rest[k+2]+breeze*(.13*swell+.055*undertow+.018*ripple)+rise;
    }
  }
  const RIPPLE_SPEED=material.uniforms.uRippleSpeed.value,RIPPLE_LIFE=7;
  const touch={x:0,y:0,z:0,target:null,strength:0,sign:1},ripples=[];
  let hoverEvent=null;
  const restSample=new T.Vector3(),airflow=new T.Vector3(),cameraLocal=new T.Vector3(),rigInverse=new T.Matrix4();
  // Barycentric sampling of the rest surface, matching the a,c,b / b,c,d index order.
  function sampleRest(u,v){
    const x=T.MathUtils.clamp(u,0,.999999)*NX,y=T.MathUtils.clamp(v,0,.999999)*NY;
    const col=Math.floor(x),row=Math.floor(y),s=x-col,t=y-row,a=row*(NX+1)+col,b=a+1,c=a+NX+1,d=c+1;
    const ids=s+t<=1?[a,c,b]:[b,c,d],weights=s+t<=1?[1-s-t,t,s]:[1-t,1-s,s+t-1];
    restSample.set(0,0,0);
    for(let j=0;j<3;j++){restSample.x+=rest[ids[j]*3]*weights[j];restSample.y+=rest[ids[j]*3+1]*weights[j];restSample.z+=rest[ids[j]*3+2]*weights[j];}
    // Lift toward the viewer along the airflow direction used in step().
    rig.updateWorldMatrix(true,false);rigInverse.copy(rig.matrixWorld).invert();
    cameraLocal.copy(camera.position).applyMatrix4(rigInverse).sub(restSample);
    airflow.set(.18,.58*(.55+.45*v*v),1);
    return {x:restSample.x,y:restSample.y,z:restSample.z,sign:airflow.dot(cameraLocal)>=0?1:-1};
  }
  function surfaceAt(clientX,clientY){
    const r=canvas.getBoundingClientRect();
    pointer.set((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2);
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObject(cloth)[0];
    return hit?.uv?sampleRest(hit.uv.x,hit.uv.y):null;
  }
  function sendLight(point){
    if(point)lastAim={x:point.x,y:point.y,z:point.z};
    if(!point||paused||!motionSettings.touch)return;
    if(ripples.length>=4)ripples.shift();
    ripples.push({...point,age:0});
    activeUntil=performance.now()+RIPPLE_LIFE*1000;wake();
  }
  function updateTouch(dt){
    if(hoverEvent){touch.target=hoverEvent.clear?null:surfaceAt(hoverEvent.x,hoverEvent.y);if(touch.target&&touch.strength<.02)Object.assign(touch,{x:touch.target.x,y:touch.target.y,z:touch.target.z});hoverEvent=null;}
    const want=touch.target&&motionSettings.touch?1:0;
    // The lantern follows with a slight, graceful lag; it fades more slowly than it appears.
    touch.strength+=(want-touch.strength)*(reduced.matches?1:1-Math.exp(-dt*(want?2.6:1.2)));
    if(touch.target){const glide=reduced.matches?1:1-Math.exp(-dt*5.5);touch.x+=(touch.target.x-touch.x)*glide;touch.y+=(touch.target.y-touch.y)*glide;touch.z+=(touch.target.z-touch.z)*glide;touch.sign=touch.target.sign;}
    if(!paused)for(const r of ripples)r.age+=dt;
    while(ripples.length&&ripples[0].age>=RIPPLE_LIFE)ripples.shift();
    material.uniforms.uHover.value.set(touch.x,touch.y,touch.z,touch.strength);
    material.uniforms.uTouch.value=motionSettings.touch/100;
    material.uniforms.uRipples.value.forEach((slot,i)=>{const r=ripples[i];if(r)slot.set(r.x,r.y,r.z,r.age);else slot.w=-1;});
  }
  let width=0,height=0,initial=true,homeDistance=9;
  // Present the reverse three-quarter view on first load: two distinct peaks,
  // a deep central valley, and the broad right-hand fall approved in review.
  const direction=new T.Vector3(-.39,.13,-.91).normalize();
  function resize(){
    const zoomRatio=initial?1:camera.position.distanceTo(controls.target)/homeDistance;
    width=section.clientWidth;height=section.clientHeight;if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
    material.uniforms.uViewportHeight.value=height;
    material.uniforms.uViewportSize.value.set(width,height);
    material.uniforms.uProjectionY.value=camera.projectionMatrix.elements[5];
    // Recompose portrait as a narrower, deep hanging canopy; all pins/cables
    // stay attached because the entire installation receives the same scale.
    rig.scale.x=Math.min(1,Math.max(.37,camera.aspect/1.7));rig.scale.y=1;
    const vertical=3.5,horizontal=7.2*rig.scale.x;
    homeDistance=Math.max(vertical/.88,horizontal/(camera.aspect*.92))/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))+1.55;
    controls.minDistance=homeDistance*.5;
    controls.maxDistance=homeDistance*1.35;
    controls.target.set(0,.10,0);
    const view=initial?direction:camera.position.clone().sub(controls.target).normalize();
    // Preserve the user's relative immersion through orientation/layout changes.
    camera.position.copy(controls.target).addScaledVector(view,T.MathUtils.clamp(homeDistance*zoomRatio,controls.minDistance,controls.maxDistance));
    initial=false;controls.update();wake();
  }
  function resetView(){camera.position.copy(controls.target).addScaledVector(direction,homeDistance);controls.update();activeUntil=performance.now()+2200;wake();}
  reset.addEventListener('click',resetView);
  canvas.addEventListener('keydown',event=>{
    if(event.key==='Home'){event.preventDefault();resetView();return;}
    if(['+','=','-'].includes(event.key)){event.preventDefault();const offset=camera.position.clone().sub(controls.target);const distance=T.MathUtils.clamp(offset.length()*(event.key==='-'?1.12:1/1.12),controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset.setLength(distance));controls.update();wake();return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();
    const spherical=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta+=event.key==='ArrowLeft'?.10:event.key==='ArrowRight'?-.10:0;spherical.phi=T.MathUtils.clamp(spherical.phi+(event.key==='ArrowUp'?-.08:event.key==='ArrowDown'?.08:0),.22,Math.PI-.22);
    camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(spherical));controls.update();wake();
  });
  controls.addEventListener('start',()=>{section.dataset.clothDragging='true';activeUntil=performance.now()+3000;wake();});
  controls.addEventListener('change',()=>{activeUntil=performance.now()+1800;wake();});
  controls.addEventListener('end',()=>{section.dataset.clothDragging='false';activeUntil=performance.now()+2400;wake();});

  // ── Sky ───────────────────────────────────────────────────────────────
  // A deep-blue dome and a sparse field of distant stars give the installation
  // depth. Midnight overhead eases to the site navy at the horizon and below,
  // so the hero still meets the navy page. The stars sit in real 3D space and
  // drift with parallax as the view orbits. They are deliberately few and dim.
  const sky={dusk:{value:reduced.matches||!document.documentElement.classList.contains('ai-intro')?1:0}};
  {
    const dome=new T.Mesh(new T.SphereGeometry(30,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,depthTest:false,toneMapped:false,
      uniforms:{uDusk:sky.dusk,uViewport:material.uniforms.uViewportSize},
      vertexShader:`varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform float uDusk;uniform vec2 uViewport;varying vec3 vDir;
        void main(){
          vec3 midnight=vec3(.030,.056,.122),deep=vec3(.062,.104,.196),navy=vec3(29.,47.,78.)/255.;
          float h=vDir.y;
          vec3 c=mix(navy,deep,smoothstep(-.04,.24,h));c=mix(c,midnight,smoothstep(.22,.80,h));
          // A soft vignette deepens the upper corners; the lower edge stays navy for the page.
          vec2 s=gl_FragCoord.xy/max(uViewport,vec2(1.))-vec2(.5,.38);
          c*=1.-.20*smoothstep(.25,.85,length(s*vec2(1.,1.25)))*smoothstep(.25,.6,gl_FragCoord.y/max(uViewport.y,1.));
          // During the arrival the whole dome holds at midnight before warming.
          c=mix(vec3(.047,.094,.204),c,uDusk);
          float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
          // Display-referred navy values, written directly.
          gl_FragColor=vec4(c+(n-.5)/255.,1.);
        }`}));
    dome.renderOrder=-3;dome.frustumCulled=false;scene.add(dome);sky.dome=dome;
    let seed=1704;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    const COUNT=420,pos=new Float32Array(COUNT*3),star=new Float32Array(COUNT*3);
    for(let i=0;i<COUNT;i++){
      // A few nearer, softer stars in front of a deeper field.
      const near=i<46,r=near?9+5*rnd():15+19*Math.pow(rnd(),.7),th=rnd()*6.2832,y=-.15+1.15*rnd(),rr=Math.sqrt(1-y*y);
      pos[i*3]=Math.cos(th)*rr*r;pos[i*3+1]=y*r*.8+1;pos[i*3+2]=Math.sin(th)*rr*r;
      star[i*3]=near?.16+.10*rnd():.07+.12*Math.pow(rnd(),2.5);star[i*3+1]=rnd();star[i*3+2]=rnd()<.08?1:0;
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('aStar',new T.BufferAttribute(star,3));
    const field=new T.Points(g,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
      uniforms:{uTime:material.uniforms.uTime,uPixel:{value:1},uDusk:sky.dusk},
      vertexShader:`attribute vec3 aStar;uniform float uTime;uniform float uPixel;varying float vAlpha;varying float vGold;varying float vSoft;
        void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
          float depth=-mv.z;gl_PointSize=clamp(aStar.x*uPixel/max(1.,depth),1.4,9.);
          // Farther stars are dimmer; low stars fade so the page edge stays clean navy.
          float far=smoothstep(14.,36.,depth),low=smoothstep(-2.5,2.5,position.y);
          float twinkle=.78+.22*sin(uTime*(.35+aStar.y*.6)+aStar.y*40.);
          vAlpha=mix(.95,.40,far)*low*twinkle;vGold=aStar.z;vSoft=smoothstep(.15,.2,aStar.x);}`,
      fragmentShader:`varying float vAlpha;varying float vGold;varying float vSoft;
        void main(){vec2 q=gl_PointCoord*2.-1.;float d=dot(q,q);if(d>1.)discard;
          vec3 c=mix(vec3(.80,.87,1.),vec3(1.,.84,.55),vGold);
          // Near stars are slightly out of focus, like a lens resolving the silk.
          float glow=mix(exp(-d*4.)+exp(-d*22.)*.6,exp(-d*2.2)*.42,vSoft);
          gl_FragColor=vec4(c*glow*vAlpha,1.);}`}));
    field.renderOrder=-2;field.frustumCulled=false;scene.add(field);
    sky.field=field;
  }
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down=null,nodeButtons=[];
  // One temporary label, attached to the actual deformed surface projection.
  let highlightedNode=-1;
  const nodeLabel=document.createElement('div');nodeLabel.className='lumen-node-label';nodeLabel.hidden=true;section.append(nodeLabel);
  function highlightNode(id){
    if(highlightedNode===id)return;
    highlightedNode=id;
    document.querySelectorAll('.method-entry').forEach((entry,i)=>entry.classList.toggle('lumen-node-highlight',i===id));
    nodeLabel.textContent=id>=0?window.OSL_METHOD?.raw[id]?.[0]||nodeButtons[id]?.textContent||'':'';
    holdOrbit();activeUntil=performance.now()+1800;wake();
  }
  function updateNodeLabel(){
    const clip=material.uniforms.uNodeClip.value[highlightedNode];
    nodeLabel.hidden=!clip||clip.w<=0||Math.abs(clip.x)>clip.w||Math.abs(clip.y)>clip.w||Math.abs(clip.z)>clip.w||!document.body.classList.contains('exploring-system');
    if(nodeLabel.hidden)return;
    const r=canvas.getBoundingClientRect(),parent=section.getBoundingClientRect();
    const x=(clip.x/clip.w*.5+.5)*r.width,y=(.5-clip.y/clip.w*.5)*r.height;
    nodeLabel.style.left=`${r.left-parent.left+Math.max(8,Math.min(r.width-nodeLabel.offsetWidth-8,x+12))}px`;
    nodeLabel.style.top=`${r.top-parent.top+Math.max(8,Math.min(r.height-nodeLabel.offsetHeight-8,y-28))}px`;
  }
  function entryIndex(target){return [...document.querySelectorAll('.method-entry')].indexOf(target.closest?.('.method-entry'));}
  document.addEventListener('pointerover',e=>{const id=entryIndex(e.target);if(id>=0)highlightNode(id);});
  document.addEventListener('pointerout',e=>{if(entryIndex(e.target)>=0&&entryIndex(e.relatedTarget||document)!==entryIndex(e.target))highlightNode(entryIndex(document.activeElement));});
  document.addEventListener('focusin',e=>{const id=entryIndex(e.target);if(id>=0)highlightNode(id);});
  document.addEventListener('focusout',e=>{if(entryIndex(e.target)>=0)highlightNode(-1);});
  controls.addEventListener('start',()=>highlightNode(-1));
  canvas.addEventListener('pointerleave',()=>highlightNode(entryIndex(document.activeElement)));
  canvas.addEventListener('pointercancel',()=>{down=null;highlightNode(-1);});
  canvas.addEventListener('keydown',()=>highlightNode(-1));
  function pickNode(e){
    if(!document.body.classList.contains('exploring-system'))return -1;
    const r=canvas.getBoundingClientRect();let closest=-1,distance=e.pointerType==='touch'?22:14;
    pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObject(cloth)[0];if(!hit?.uv)return -1;
    material.uniforms.uNodeClip.value.forEach((clip,i)=>{
      const node=nodeUniforms[i];
      if(clip.w<=0||Math.abs(clip.z)>clip.w||node.z<=0)return;
      // A foreground fold must not make an unrelated rear node selectable.
      if(Math.hypot((hit.uv.x-node.x)*1.65,hit.uv.y-node.y)>.065)return;
      const d=Math.hypot((clip.x/clip.w*.5+.5)*r.width-(e.clientX-r.left),(.5-clip.y/clip.w*.5)*r.height-(e.clientY-r.top));
      if(d<distance){distance=d;closest=i;}
    });
    return closest;
  }
  canvas.addEventListener('pointermove',e=>{
    if(e.buttons||e.pointerType==='touch')return;
    const closest=pickNode(e);
    highlightNode(closest>=0?closest:entryIndex(document.activeElement));
  });
  // Core-path anchors sit on the foreground free panel, not behind its
  // rolled-over lip. Other filtered tool nodes retain their established UVs.
  // Intent below the main gather; disciplines fan across the middle;
  // preservation/publication rise toward the rear gather. Not random scatter.
  const lightPositions=[[.48,.77],[.67,.66],[.35,.75],[.25,.69],[.23,.53],[.33,.46],[.42,.40],[.58,.39],[.68,.44],[.80,.48],[.83,.36],[.81,.68],[.79,.28],[.72,.21],[.62,.27],[.90,.56],[.18,.43],[.54,.90],[.73,.53],[.64,.18]];
  // Editorial chapters, not an execution log. Only one short route plays at
  // once. Retired tools and supporting experiments remain discoverable but
  // are not presented as mandatory stages of the operating workflow.
  const ambientJourneys=[
    {name:'Intent → Judgment → Creation → Output',ids:[0,17,1,12]}
  ];
  let ambientChapter=0;
  const defaultJourney=ambientJourneys[0].ids;let journeyIds=defaultJourney,journeyHoldUntil=0;
  function resumeAmbient(){
    material.uniforms.uElectricSegment.value=-1;
    setJourney(ambientJourneys[ambientChapter].ids);
    section.dataset.lumenChapter=ambientJourneys[ambientChapter].name;
    material.uniforms.uSignalTime.value=0;
  }
  function setJourney(ids){
    journeyIds=ids;
    const points=[[.5,54/80],...ids.map(i=>lightPositions[i]),[98/128,12/80]];
    const count=ids.length===1?0:Math.min(8,points.length-1);material.uniforms.uJourneyCount.value=count;
    for(let i=0;i<count;i++)material.uniforms.uJourney.value[i].set(...points[i],...points[i+1]);
  }
  resumeAmbient();
  document.addEventListener('lumen-journey',event=>{
    const ids=event.detail?.route;if(!Array.isArray(ids)||!ids.length||ids.some(i=>!Number.isInteger(i)||!lightPositions[i]))return;
    const selectedIndex=ids.indexOf(event.detail?.nodeId);
    material.uniforms.uElectricSegment.value=reduced.matches||ids.length<2?-1:Math.max(1,selectedIndex);
    setJourney(ids);section.dataset.lumenChapter='Selected tool';material.uniforms.uManualSignal.value=0;journeyHoldUntil=performance.now()+12000;activeUntil=performance.now()+16000;wake();
  });
  // Record taps on the section's capture phase so a hero-page touch, whose
  // canvas pointerdown is withheld from the orbit controls, can still light the silk.
  section.addEventListener('pointerdown',e=>{if(e.target===canvas)down={x:e.clientX,y:e.clientY};},{capture:true});
  canvas.addEventListener('pointerup',e=>{
    const origin=down;down=null;if(!origin||Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>7)return;
    const nearest=pickNode(e);
    if(nearest>=0)nodeButtons[nearest]?.click();
    else sendLight(surfaceAt(e.clientX,e.clientY));
  });
  // A mouse or pen carries a lantern across the silk. Touch has no hover,
  // so on phones the light arrives only with a deliberate tap.
  canvas.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    hoverEvent=e.buttons?{clear:true}:{x:e.clientX,y:e.clientY};
    activeUntil=Math.max(activeUntil,performance.now()+2600);wake();
  });
  canvas.addEventListener('pointerleave',()=>{hoverEvent={clear:true};activeUntil=Math.max(activeUntil,performance.now()+2600);wake();});
  // A click keeps its lantern; only an actual orbit drag sets it down.
  controls.addEventListener('change',()=>{if(interacting)hoverEvent={clear:true};});
  // Keyboard parity: Enter or Space sends light outward from the input suspension.
  canvas.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();
    sendLight(sampleRest(nodeUniforms[0].x,nodeUniforms[0].y));
  });
  // Existing method buttons remain the semantic source of truth. Their visible
  // decoration is replaced with material-space lights, including selection.
  function syncNodes(){nodeButtons=[...section.querySelectorAll('.woven-node')];
    if(!nodeButtons.length){[0,1,2,3,4].forEach((i)=>nodeUniforms[i].set(.22+i*.14,.36+(i%2)*.2,1,0));return;}
    nodeButtons.slice(0,20).forEach((b,i)=>{
      const selected=b.getAttribute('aria-pressed')==='true';
      const retired=i===15||i===16;
      nodeUniforms[i].set(...lightPositions[i],i===highlightedNode?1:retired&&!selected?(b.hidden?0:.4):journeyIds.includes(i)?1:b.hidden?.55:1,i===highlightedNode?2:selected?1:0);
    });
  }
  const nodeProjection=new T.Matrix4(),nodeSample=new T.Vector3(),nodeVertex=new T.Vector3();
  function projectNodeLights(){
    camera.updateMatrixWorld();rig.updateWorldMatrix(true,false);
    material.uniforms.uViewProjection.value.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    nodeProjection.multiplyMatrices(material.uniforms.uViewProjection.value,rig.matrixWorld);
    nodeUniforms.forEach((node,i)=>{
      const x=Math.min(.999999,node.x)*NX,y=Math.min(.999999,node.y)*NY;
      const col=Math.floor(x),row=Math.floor(y),s=x-col,t=y-row,a=row*(NX+1)+col,b=a+1,c=a+NX+1,d=c+1;
      const ids=s+t<=1?[a,c,b]:[b,c,d],weights=s+t<=1?[1-s-t,t,s]:[1-t,1-s,s+t-1];
      nodeSample.set(0,0,0);for(let j=0;j<3;j++)nodeSample.addScaledVector(nodeVertex.fromArray(positions,ids[j]*3),weights[j]);
      material.uniforms.uNodeClip.value[i].set(nodeSample.x,nodeSample.y,nodeSample.z,1).applyMatrix4(nodeProjection);
    });
  }
  function canRender(){return visible&&!document.hidden&&!pageHidden&&!contextLost;}
  let arrivalEntries=[];
  function updateNodeArrivals(){
    const levels=material.uniforms.uNodeArrival.value;levels.fill(0);
    const count=material.uniforms.uJourneyCount.value;
    const duration=Math.max(9,(count-1)*1.65+2.4);
    const phase=material.uniforms.uManualSignal.value>=0?material.uniforms.uManualSignal.value:material.uniforms.uSignalTime.value%duration;
    // Segment zero joins the input suspension to the first system node.
    // The final suspension is not a table entry. Selection remains untouched.
    for(let j=0;j<Math.min(journeyIds.length,count);j++){
      const t=phase-j*1.65;
      const level=T.MathUtils.smoothstep(t,.30,.50)*(1-T.MathUtils.smoothstep(t,.65,1.85));
      levels[journeyIds[j]]=Math.max(levels[journeyIds[j]],level);
    }
    if(!arrivalEntries.length)arrivalEntries=[...document.querySelectorAll('.method-entry')];
    arrivalEntries.forEach((entry,i)=>{
      const value=levels[i].toFixed(3);
      if(entry.dataset.lumenArrival===value)return;
      entry.dataset.lumenArrival=value;
      entry.style.setProperty('--lumen-arrival',value);
      entry.style.setProperty('--lumen-arrival-percent',`${(levels[i]*100).toFixed(1)}%`);
      entry.classList.toggle('lumen-arriving',levels[i]>.002);
    });
  }
  function suspend(){cancelAnimationFrame(frameId);frameId=0;last=0;frameCount=0;measureStart=0;}
  function wake(){if(!frameId&&canRender())frameId=requestAnimationFrame(render);}
  function render(now){frameId=0;if(!canRender())return;
    const dt=Math.min(.05,(now-(last||now))/1000);last=now;
    if(material.uniforms.uManualSignal.value>=0.){
      material.uniforms.uManualSignal.value+=dt;
      if(material.uniforms.uManualSignal.value>Math.max(9,(material.uniforms.uJourneyCount.value-1)*1.65+2.4)){material.uniforms.uManualSignal.value=-1;material.uniforms.uSignalTime.value=0;}
    }
    if(journeyHoldUntil&&now>journeyHoldUntil&&material.uniforms.uManualSignal.value<0){journeyHoldUntil=0;resumeAmbient();}
    if(!paused){
      material.uniforms.uAmbientTime.value+=dt;
      material.uniforms.uSignalTime.value+=dt;
      // Advance only after the last thread has fully faded. The cycle length
      // includes a quiet interval; never layer multiple chapters together.
      const chapterDuration=Math.max(9,(material.uniforms.uJourneyCount.value-1)*1.65+2.4);
      if(!journeyHoldUntil&&material.uniforms.uManualSignal.value<0&&material.uniforms.uSignalTime.value>=chapterDuration){
        ambientChapter=(ambientChapter+1)%ambientJourneys.length;resumeAmbient();
      }
      step(dt);geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();
    }
    // Rotate the viewpoint, never the pinned sculpture. Time-based movement
    // is frame-rate independent, with a gentle ramp after manual interaction.
    if(!paused&&!interacting&&highlightedNode<0&&!settings.open&&document.body.classList.contains('exploring-system')){
      const idleRamp=T.MathUtils.clamp((now-idleSince-4000)/3000,0,1);
      const orbitAngle=-.025*(motionSettings.orbit/100)*idleRamp*idleRamp*(3-2*idleRamp)*dt;
      const offset=camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(camera.up,orbitAngle);camera.position.copy(controls.target).add(offset);
    }
    if(galaxy)advanceGalaxy(dt);
    else{
      // Return visits: the silk condenses out of the navy while the camera
      // settles into the approved pose. Any interaction hands control over.
      if(!reduced.matches&&material.uniforms.uReveal.value<1){
        const t=T.MathUtils.clamp((now-mountedAt-250)/2600,0,1);
        material.uniforms.uReveal.value=t*t*(3-2*t);
        if(t>=1)showInvite();
      }else if(material.uniforms.uReveal.value<1){material.uniforms.uReveal.value=1;showInvite();}
      if(arrival){
        if(interacting||reduced.matches)arrival=null;
        else{
          const t=T.MathUtils.clamp((now-mountedAt)/3600,0,1),e=1-Math.pow(1-t,3);
          const home=new T.Spherical().setFromVector3(direction.clone().multiplyScalar(homeDistance));
          home.theta+=(1-e)*.16;home.phi-=(1-e)*.05;home.radius*=1+(1-e)*.085;
          camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(home));
          if(t>=1)arrival=null;
        }
      }
    }
    cableMaterial.opacity=.38*T.MathUtils.smoothstep(material.uniforms.uReveal.value,.25,.85);
    // Unrevealed silk must not write depth and silhouette the stars behind it.
    cloth.visible=material.uniforms.uReveal.value>.002;
    // The dome is a pure direction gradient: it travels with the camera.
    sky.dome.position.copy(camera.position);
    sky.field.material.uniforms.uPixel.value=height*renderer.getPixelRatio()*.5*camera.projectionMatrix.elements[5];
    updateTouch(dt);updateBeam(dt);
    controls.update();syncNodes();updateNodeArrivals();projectNodeLights();updateNodeLabel();material.uniforms.uTime.value=time;updateInternalLight(now);renderer.render(scene,camera);
    canvas.dataset.time=time.toFixed(3);canvas.dataset.drop='1';
    if(!measureStart)measureStart=now;frameCount++;
    if(now-measureStart>2000){section.dataset.lumenFps=(frameCount*1000/(now-measureStart)).toFixed(0);section.dataset.lumenAzimuth=controls.getAzimuthalAngle().toFixed(3);frameCount=0;measureStart=now;}
    if(!paused||now<activeUntil||galaxy||material.uniforms.uReveal.value<1)wake();
  }
  // ── Key light ─────────────────────────────────────────────────────────
  // A stage light rigged high to the right of the approved view. The visitor
  // aims it: the pointer, or a tap, sets where it lands. Left alone it rests
  // on the main peak at a lower level. It never wanders on its own.
  const beamRig={aim:new T.Vector3(),goal:new T.Vector3(),source:new T.Vector3(),level:0,ready:false};
  const shaftMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false,
    uniforms:{uStrength:{value:0},uColor:{value:beamColor}},
    vertexShader:`varying float vAlong;varying vec3 vN;varying vec3 vView;
      void main(){vAlong=.5-position.y;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vView=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uStrength;uniform vec3 uColor;varying float vAlong;varying vec3 vN;varying vec3 vView;
      void main(){float face=pow(abs(dot(normalize(vN),normalize(vView))),2.);
        float a=face*smoothstep(0.,.25,vAlong)*(1.-.55*vAlong)*uStrength*uStrength*.085;
        gl_FragColor=vec4(uColor*a,1.);}`});
  const shaft=new T.Mesh(new T.ConeGeometry(1,1,40,1,true),shaftMaterial);shaft.frustumCulled=false;shaft.renderOrder=2;scene.add(shaft);
  const beamUp=new T.Vector3(0,1,0),beamTmp=new T.Vector3(),beamQuat=new T.Quaternion();
  function restToWorld(p){return beamTmp.set(p.x,p.y,p.z).applyMatrix4(rig.matrixWorld);}
  function updateBeam(dt){
    rig.updateWorldMatrix(true,false);
    const homeOffset=direction.clone().multiplyScalar(homeDistance),forward=homeOffset.clone().negate().normalize();
    const right=new T.Vector3().crossVectors(forward,beamUp).normalize();
    beamRig.source.set(0,.1,0).addScaledVector(right,5.2).addScaledVector(beamUp,5.4).addScaledVector(homeOffset.clone().normalize(),2.4);
    const guided=touch.target&&touch.strength>.05;
    if(guided)beamRig.goal.copy(restToWorld(touch.target));
    else if(lastAim)beamRig.goal.copy(restToWorld(lastAim));
    else{const p=sampleRest(.53,.42);beamRig.goal.copy(restToWorld(p));}
    if(!beamRig.ready){beamRig.aim.copy(beamRig.goal);beamRig.ready=true;}
    const glide=reduced.matches?1:1-Math.exp(-dt*1.6);beamRig.aim.lerp(beamRig.goal,glide);
    const want=(guided?1:.55)*motionSettings.key/100*material.uniforms.uReveal.value*(galaxy?0:1);
    beamRig.level+=(want-beamRig.level)*(reduced.matches?1:1-Math.exp(-dt*1.4));
    const dir=beamRig.aim.clone().sub(beamRig.source),length=dir.length();dir.normalize();
    material.uniforms.uBeamPos.value.copy(beamRig.source);material.uniforms.uBeamDir.value.copy(dir);material.uniforms.uBeamStrength.value=beamRig.level;
    // The visible shaft: apex at the lamp, opening toward the silk.
    const spread=Math.tan(Math.acos(.962))*length;
    shaft.scale.set(spread,length,spread);shaft.position.copy(beamRig.source).addScaledVector(dir,length*.5);
    beamQuat.setFromUnitVectors(beamUp,dir.clone().negate());shaft.quaternion.copy(beamQuat);
    shaftMaterial.uniforms.uStrength.value=beamRig.level;shaft.visible=beamRig.level>.01;
  }
  let lastAim=null;
  const mountedAt=performance.now();let arrival=!reduced.matches;
  // ── Galaxy arrival ────────────────────────────────────────────────────
  // First visit in a session (html.ai-intro, set before first paint): the
  // silk's own fibres begin as a slow spiral of ivory and gold stars in deep
  // space. They stream inward and settle onto the textile, suspension points
  // first and the hem last, and the silk condenses where they land. The
  // headline and navigation arrive after it. Any input completes the passage
  // quickly; reduced motion never plays it.
  const html=document.documentElement;
  let galaxy=null;
  const anchorIds=[...pins];
  // ── Arrival ───────────────────────────────────────────────────────────
  // A slow ballet. One gold node glows in midnight while stars bloom at many
  // depths around it and turn together, unhurried, as the camera glides
  // through them. A single italic word, "introducing", surfaces and
  // dissolves. Then the stars flow down in long, curving phrases into the
  // silk; the second node kindles like a far star; the fabric condenses;
  // and only then does its name rise out of the background.
  function buildGalaxy(){
    let seed=20261004;const rnd=()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
    const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-9))*Math.cos(6.2831853*rnd());
    const fibres=[];for(let y=0;y<=NY;y+=2)for(let x=0;x<=NX;x+=2)fibres.push(index(x,y));
    const F=fibres.length,FIELD=260,HAZE=46,COUNT=F+FIELD+HAZE;
    const start=new Float32Array(COUNT*3),target=new Float32Array(COUNT*3),seedData=new Float32Array(COUNT*4),arm=new Float32Array(COUNT);
    const anchors=anchorIds.map(n=>new T.Vector3().fromArray(rest,n*3));
    const lead=anchors[0].y>=anchors[1].y?0:1;
    for(let i=0;i<COUNT;i++){
      let q;
      if(i<F){
        const n=fibres[i],d0=Math.hypot(rest[n*3]-anchors[0].x,rest[n*3+2]-anchors[0].z),d1=Math.hypot(rest[n*3]-anchors[1].x,rest[n*3+2]-anchors[1].z);
        arm[i]=d0<=d1*1.15?0:1;
        // A loose, softly flattened swirl of stars at many depths around the node.
        const r=2.2+11*Math.pow(rnd(),.75),th=rnd()*6.2832+r*.18,y=gauss()*(1.1+r*.16);
        q=[Math.cos(th)*r,y,Math.sin(th)*r];
        // Anchors first, hem last; a gentle wave rather than a cue.
        seedData[i*4]=.36+.15*freedom[n]+.10*uv[n*2+1]+.06*rnd();
      }else if(i<F+FIELD){
        const r=15+13*rnd(),th=rnd()*6.2832,ph=Math.acos(2*rnd()-1);
        q=[r*Math.sin(ph)*Math.cos(th),r*Math.cos(ph)*.6,r*Math.sin(ph)*Math.sin(th)];
        seedData[i*4]=9;arm[i]=0;
      }else{
        const r=3+9*rnd(),th=rnd()*6.2832;q=[Math.cos(th)*r,gauss()*1.5,Math.sin(th)*r];
        seedData[i*4]=9;arm[i]=0;
      }
      start[i*3]=q[0];start[i*3+1]=q[1];start[i*3+2]=q[2];
      seedData[i*4+1]=i<F?.034+.05*Math.pow(rnd(),3):i<F+FIELD?.05+.08*rnd():.9+1.2*rnd();
      seedData[i*4+2]=i>=F+FIELD?2:rnd()<.14?1:0;
      seedData[i*4+3]=rnd();
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.BufferAttribute(target,3).setUsage(T.DynamicDrawUsage));
    geometry.setAttribute('aStart',new T.BufferAttribute(start,3));
    geometry.setAttribute('aSeed',new T.BufferAttribute(seedData,4));
    geometry.setAttribute('aArm',new T.BufferAttribute(arm,1));
    const uniforms={uIntro:{value:0},uSpin:{value:0},uPixel:{value:1},uTime:{value:0},uRatio:{value:renderer.getPixelRatio()},
      uNode:{value:new T.Vector3()},uAnchorA:{value:new T.Vector3()},uAnchorB:{value:new T.Vector3()},uBeaconA:{value:0},uBeaconB:{value:0},uFlare:{value:0}};
    const starMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
      vertexShader:`attribute vec3 aStart;attribute vec4 aSeed;attribute float aArm;
        uniform float uIntro;uniform float uSpin;uniform float uPixel;uniform float uTime;uniform vec3 uNode;uniform vec3 uAnchorA;uniform vec3 uAnchorB;
        varying float vAlpha;varying float vKind;varying float vSoft;
        vec3 swirl(vec3 p,vec3 c,float a){vec3 q=p-c;float cs=cos(a),sn=sin(a);return c+vec3(cs*q.x+sn*q.z,q.y,-sn*q.x+cs*q.z);}
        void main(){
          bool fibre=aSeed.x<5.,haze=aSeed.z>1.5;
          // Long phrases: each star travels for a third of the arrival, eased at both ends.
          float t=fibre?clamp((uIntro-aSeed.x)/.34,0.,1.):0.;
          float e=t*t*t*(t*(t*6.-15.)+10.);
          // Each star breathes in place with its own slow orbit, so nothing is ever still.
          vec3 drift=vec3(sin(uTime*.21+aSeed.w*40.),cos(uTime*.17+aSeed.w*31.)*.6,cos(uTime*.19+aSeed.w*27.))*.18;
          vec3 s=uNode+swirl(aStart,vec3(0.),uSpin*(.8+.4*aSeed.w))+drift;
          vec3 pivot=aArm<.5?uAnchorA:uAnchorB;
          vec3 goal=fibre?position:s;
          vec3 p=mix(s,goal,e);
          // A rising arc and a spiral about the anchor: a leap, then a soft landing.
          p.y+=sin(3.14159*e)*(.6+.9*aSeed.w)*(fibre?1.:0.);
          p=swirl(p,pivot,(1.-e)*(1.4+.6*aSeed.w)*(fibre?1.:0.));
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
          float px=aSeed.y*(fibre?mix(1.,.72,e):1.)*uPixel/max(.1,-mv.z);
          // Near stars swell and soften, like a lens focused beyond them.
          vSoft=haze?0.:smoothstep(4.,10.,px);
          gl_PointSize=haze?clamp(px,4.,170.):clamp(px,1.2,fibre?14.:6.);
          float twinkle=.76+.24*sin(uTime*(.9+aSeed.w*1.4)+aSeed.w*43.);
          float bloom=smoothstep(.02+aSeed.w*.06,.12+aSeed.w*.06,uIntro);
          vAlpha=haze?.040*smoothstep(.02,.14,uIntro)*(1.-smoothstep(.36,.62,uIntro))
            :fibre?twinkle*bloom*(1.-smoothstep(.86,1.,uIntro))*mix(1.,.38,vSoft)
            :.45*twinkle*bloom*(1.-smoothstep(.62,.95,uIntro));
          vKind=aSeed.z;
        }`,
      fragmentShader:`varying float vAlpha;varying float vKind;varying float vSoft;
        void main(){vec2 q=gl_PointCoord*2.-1.;float d=dot(q,q);if(d>1.)discard;
          float sharp=exp(-d*5.)+exp(-d*28.)*.8,soft=exp(-d*1.8)*(1.-d*.6);
          float glow=vKind>1.5?exp(-d*2.4)*(1.-d):mix(sharp,soft,vSoft);
          vec3 c=vKind>1.5?vec3(.26,.36,.62):mix(vec3(.88,.92,1.),vec3(1.,.80,.44),vKind);
          gl_FragColor=vec4(c*glow*vAlpha,1.);}`});
    const stars=new T.Points(geometry,starMaterial);stars.frustumCulled=false;scene.add(stars);
    // Beacons: 0 the lead node, 1 the distant second node, 2–3 their nebulae.
    const beaconGeometry=new T.BufferGeometry();
    beaconGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(12),3));
    beaconGeometry.setAttribute('aKind',new T.BufferAttribute(new Float32Array([0,1,2,3]),1));
    const beaconMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,toneMapped:false,
      vertexShader:`attribute float aKind;uniform float uRatio;uniform float uTime;uniform float uBeaconA;uniform float uBeaconB;uniform float uFlare;uniform float uIntro;uniform vec3 uAnchorA;uniform vec3 uAnchorB;
        varying float vKind;varying float vAlpha;varying float vFlare;
        void main(){bool b=aKind==1.||aKind==3.;vec3 p=b?uAnchorB:uAnchorA;
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;vKind=aKind;vFlare=b?uFlare:0.;
          float pulse=.86+.14*sin(uTime*1.1+aKind*2.);
          gl_PointSize=(aKind<1.5?(aKind<.5?52.:42.+40.*uFlare):560.)*uRatio;
          vAlpha=aKind<.5?uBeaconA*pulse:aKind<1.5?uBeaconB*pulse*(1.+.9*uFlare)
            :(aKind<2.5?.22*smoothstep(0.,.10,uIntro)*(1.-smoothstep(.5,.9,uIntro)):.16*uBeaconB*(1.-smoothstep(.75,.95,uIntro)));}`,
      fragmentShader:`varying float vKind;varying float vAlpha;varying float vFlare;
        void main(){vec2 q=gl_PointCoord*2.-1.;float d=dot(q,q);if(d>1.)discard;
          vec3 c;
          if(vKind<1.5){float core=exp(-d*110.),halo=exp(-d*10.)*.34+exp(-d*3.)*.08;c=vec3(1.,.95,.82)*core*1.3+vec3(1.,.76,.36)*halo;
            float glint=(exp(-abs(q.y)*60.)*exp(-abs(q.x)*3.5)+exp(-abs(q.x)*60.)*exp(-abs(q.y)*3.5))*vFlare*.55;c+=vec3(1.,.90,.70)*glint;}
          else c=vec3(.20,.32,.60)*exp(-d*3.2)*(1.-d);
          float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
          gl_FragColor=vec4(c*vAlpha+(n-.5)/255.,1.);}`});
    const beacons=new T.Points(beaconGeometry,beaconMaterial);beacons.frustumCulled=false;beacons.renderOrder=-1;scene.add(beacons);
    return {stars,beacons,geometry,beaconGeometry,material:starMaterial,beaconMaterial,uniforms,fibres,anchors,lead,t:0,rate:1,revealed:false,unveiled:false};
  }
  const voidColor=new T.Color('#0c1834'),navyColor=new T.Color('#1d2f4e'),homeTarget=new T.Vector3(0,.10,0);
  // Phones arrive faster: the whole intro rests in about 12 s instead of 18.
  const GALAXY_SECONDS=matchMedia('(max-width:700px)').matches?8.8:13;
  function hurryGalaxy(){if(galaxy&&galaxy.t<.97)galaxy.rate=Math.max(galaxy.rate,(1-galaxy.t)*GALAXY_SECONDS/1.4);}
  // "introducing": one italic word, surfacing and dissolving mid-drift.
  const overture=document.createElement('p');overture.className='lumen-overture';overture.textContent='introducing';overture.setAttribute('aria-hidden','true');section.append(overture);
  const titleCard=section.querySelector('.fabric-title');
  function advanceGalaxy(dt){
    const g=galaxy;g.t=Math.min(1,g.t+dt*g.rate/GALAXY_SECONDS);
    const u=g.t,ease=x=>x*x*x*(x*(x*6-15)+10),U=g.uniforms;
    U.uIntro.value=u;U.uSpin.value+=dt*.05*(1-u*.8);U.uTime.value+=dt;
    U.uPixel.value=height*renderer.getPixelRatio()*.5*camera.projectionMatrix.elements[5];
    rig.updateWorldMatrix(true,false);
    const node=g.anchors[g.lead].clone().applyMatrix4(rig.matrixWorld);
    U.uNode.value.copy(node);
    U.uAnchorA.value.copy(g.anchors[g.lead]).applyMatrix4(rig.matrixWorld);U.uAnchorB.value.copy(g.anchors[1-g.lead]).applyMatrix4(rig.matrixWorld);
    const target=g.geometry.attributes.position.array,m=rig.matrixWorld.elements;
    for(let i=0;i<g.fibres.length;i++){const n=g.fibres[i]*3,x=positions[n],y=positions[n+1],z=positions[n+2];
      target[i*3]=m[0]*x+m[4]*y+m[8]*z+m[12];target[i*3+1]=m[1]*x+m[5]*y+m[9]*z+m[13];target[i*3+2]=m[2]*x+m[6]*y+m[10]*z+m[14];}
    g.geometry.attributes.position.needsUpdate=true;
    U.uBeaconA.value=T.MathUtils.smoothstep(u,0,.05)*(1-T.MathUtils.smoothstep(u,.86,.98));
    const kindle=T.MathUtils.smoothstep(u,.60,.66);
    U.uBeaconB.value=kindle*(1-T.MathUtils.smoothstep(u,.88,.98));
    U.uFlare.value=kindle*(1-T.MathUtils.smoothstep(u,.66,.80));
    material.uniforms.uReveal.value=ease(T.MathUtils.clamp((u-.66)/.26,0,1));
    sky.dusk.value=ease(T.MathUtils.clamp((u-.50)/.44,0,1));
    clearColor.copy(voidColor).lerp(navyColor,sky.dusk.value);renderer.setClearColor(clearColor);
    // One continuous glide: from far above and to the side, through the field,
    // into the approved pose. No holds, no cuts.
    controls.maxDistance=Infinity;
    const k=ease(T.MathUtils.clamp(u/.96,0,1));
    controls.target.copy(node).lerp(homeTarget,ease(T.MathUtils.clamp((u-.25)/.70,0,1)));
    const home=new T.Spherical().setFromVector3(direction.clone().multiplyScalar(homeDistance));
    home.theta+=(1-k)*1.05;home.phi=T.MathUtils.clamp(home.phi-(1-k)*.55,.2,Math.PI-.22);home.radius*=1+(1-k)*1.5;
    camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(home));
    // The overture word: in with the bloom, out before the stars descend.
    const word=T.MathUtils.smoothstep(u,.10,.21)*(1-T.MathUtils.smoothstep(u,.34,.45));
    overture.style.opacity=word.toFixed(3);
    overture.style.filter=`blur(${((1-word)*7).toFixed(2)}px)`;
    overture.style.letterSpacing=`${(.10+(1-T.MathUtils.smoothstep(u,.10,.30))*.10).toFixed(3)}em`;
    // The name rises once the fabric is mostly formed.
    if(u>=.84&&!g.unveiled){g.unveiled=true;unveilTitle();}
    if(u>=.93&&!g.revealed){g.revealed=true;revealPage();}
    if(u>=1)finishGalaxy();
  }
  function unveilTitle(){
    if(!titleCard)return;
    titleCard.classList.add('is-unveiling');
    titleCard.style.opacity='1';
  }
  function revealPage(){
    const enter=[{opacity:0,transform:'translate3d(0,12px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}];
    const header=document.querySelector('.site-header');
    [...section.querySelectorAll('.copy > :not(.fabric-title)')].forEach((el,i)=>el.animate(enter,{duration:1600,delay:900+i*260,easing:'cubic-bezier(.16,.76,.18,1)',fill:'both'}));
    header?.animate([{opacity:0},{opacity:1}],{duration:1600,delay:1400,easing:'ease-out',fill:'both'});
    pause?.animate([{opacity:0},{opacity:1}],{duration:1200,delay:1700,easing:'ease-out',fill:'both'});
    html.classList.remove('ai-intro');
  }
  function finishGalaxy(){
    const g=galaxy;galaxy=null;
    if(!g.unveiled)unveilTitle();
    if(!g.revealed)revealPage();
    scene.remove(g.stars,g.beacons);g.geometry.dispose();g.beaconGeometry.dispose();g.material.dispose();g.beaconMaterial.dispose();
    overture.remove();
    material.uniforms.uReveal.value=1;clearColor.copy(navyColor);renderer.setClearColor(clearColor);sky.dusk.value=1;
    controls.target.copy(homeTarget);controls.maxDistance=homeDistance*1.35;
    arrival=null;showInvite(2600);
  }
  if(html.classList.contains('ai-intro')){
    if(reduced.matches)html.classList.remove('ai-intro');
    else{
      galaxy=buildGalaxy();arrival=null;
      try{sessionStorage.setItem('osl-ai-galaxy','1');}catch{}
      clearColor.copy(voidColor);renderer.setClearColor(clearColor);
      for(const type of ['pointerdown','wheel','keydown','touchstart'])addEventListener(type,hurryGalaxy,{passive:true});
    }
  }
  // ── Invitation ────────────────────────────────────────────────────────
  // One quiet line once the silk has arrived. It leaves after the first
  // gesture and stays away for the rest of the session.
  const invite=document.createElement('p');invite.className='lumen-invite';invite.textContent='The fabric responds to your direction';section.append(invite);
  let inviteShown=false,hoverHold=0;
  function inviteSeen(){try{return sessionStorage.getItem('osl-fabric-invite')==='1';}catch{return false;}}
  function showInvite(delay=600){
    if(inviteShown||inviteSeen())return;inviteShown=true;
    setTimeout(()=>{if(!invite.classList.contains('is-leaving'))invite.classList.add('is-visible');},delay);
  }
  function dismissInvite(){
    if(invite.classList.contains('is-leaving'))return;
    try{sessionStorage.setItem('osl-fabric-invite','1');}catch{}
    if(!invite.classList.contains('is-visible')){inviteShown=true;invite.classList.add('is-leaving');return;}
    invite.classList.add('is-leaving');
  }
  canvas.addEventListener('pointerup',()=>{if(invite.classList.contains('is-visible'))dismissInvite();});
  controls.addEventListener('start',()=>{if(invite.classList.contains('is-visible'))dismissInvite();});
  canvas.addEventListener('pointermove',e=>{
    // A few seconds of guiding the light counts as having understood it.
    if(e.pointerType==='touch'||!invite.classList.contains('is-visible'))return;
    hoverHold+=Math.min(50,e.timeStamp-(canvas._lastMove||e.timeStamp));canvas._lastMove=e.timeStamp;
    if(hoverHold>2600)dismissInvite();
  });
  new ResizeObserver(resize).observe(section);
  // Even a sliver of visible textile keeps moving; pause remains intentional.
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();else suspend();},{threshold:0}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{suspend();if(!document.hidden)wake();});
  window.addEventListener('pagehide',()=>{pageHidden=true;suspend();});
  window.addEventListener('pageshow',()=>{pageHidden=false;suspend();wake();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;last=0;controls.enableDamping=!reduced.matches;label();wake();});
  new MutationObserver(wake).observe(section.querySelector('.woven-nodes')||section,{subtree:true,attributes:true,attributeFilter:['hidden','aria-pressed']});
  new MutationObserver(()=>{controls.enableZoom=false;if(!document.body.classList.contains('exploring-system')){highlightNode(-1);settings.open=false;settingsPanel.hidden=true;}wake();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;suspend();toolbar.hidden=true;fallback('WebGL context lost');});
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;toolbar.hidden=false;section.dataset.lumen='ready';section.dataset.clothReady='true';resize();wake();});
  step(0);geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();
  section.dataset.lumen='ready';section.dataset.clothReady='true';section.dataset.clothDragging='false';label();resize();resetView();wake();
}
})();
