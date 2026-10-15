import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// Isolated art-direction study. These authored overlapping surfaces explore
// the target silhouette; they are not yet a sewn or simulated cloth asset.
const canvas=document.querySelector('canvas');
const renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor('#142941');renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=.85;renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.05,60);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;
controls.enablePan=false;controls.minDistance=2;controls.maxDistance=18;
controls.target.set(0,0,0);camera.position.set(.25,.45,10.7);
const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();
const environment=pmrem.fromScene(room,.06);scene.environment=environment.texture;
room.dispose();pmrem.dispose();

// Deterministic dedicated woven maps, independent of photographed folds.
const size=512,data=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const k=(y*size+x)*4;
  const warp=Math.pow(.5+.5*Math.cos(x*Math.PI/4),5);
  const weft=Math.pow(.5+.5*Math.cos(y*Math.PI/4),5);
  const crossing=((Math.floor(x/8)+Math.floor(y/8))%2)?warp:weft;
  const grain=Math.sin(x*73.13+y*17.71)*.035;
  const h=Math.round(128+45*(warp+weft)*.5+18*crossing+grain*255);
  data.set([h,h,h,255],k);const r=Math.round(180+25*crossing);rough.set([r,r,r,255],k);
}
function texture(bytes){const t=new T.DataTexture(bytes,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(5,3);t.anisotropy=renderer.capabilities.getMaxAnisotropy();t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
const weave=texture(data),roughness=texture(rough);
const material=new T.MeshPhysicalMaterial({color:'#eeeae0',roughness:.68,metalness:0,
  side:T.DoubleSide,sheen:1,sheenColor:new T.Color('#fff7e7'),sheenRoughness:.65,
  bumpMap:weave,bumpScale:.007,roughnessMap:roughness,
  transparent:true,opacity:.78,depthWrite:false,transmission:.18,thickness:.035,
  attenuationColor:new T.Color('#fff3da'),attenuationDistance:2,envMapIntensity:.55});

const fabricLayers=[];
function panel({left,peak,right,depth,drop,phase,opacity}){
  const nx=240,ny=100,g=new T.PlaneGeometry(1,1,nx,ny),p=g.attributes.position;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/ny,side=u<.52?u/.52:(u-.52)/.48;
    const a=u<.52?left:peak,b=u<.52?peak:right;
    const x=T.MathUtils.lerp(a[0],b[0],side),top=T.MathUtils.lerp(a[1],b[1],side);
    // Broad suspended swags carry pleats, rather than radiating cone noise.
    const swag=Math.pow(Math.sin(Math.PI*side),.85);
    const fan=(u-.52)*(15-8*v)+phase;
    const pleats=(Math.sin(fan*3.2)+.28*Math.sin(fan*6.4+.4))*.065;
    const soften=Math.sin(Math.PI*v*.5);
    // A continuous diagonal hem replaces the repeated scallops. Folds fan
    // down from the gather instead of forming parallel horizontal bands.
    const hem=-drop+.85*u+.32*Math.sin(u*Math.PI*1.6+phase);
    const yy=T.MathUtils.lerp(top-.35*swag,hem,v)+pleats*soften;
    const foldPhase=(u-.52)*(38-17*v)+phase+1.2*Math.sin(v*3+u*4);
    const foldedDepth=(.17*Math.sin(foldPhase)+.045*Math.sin(foldPhase*2.3+.6))
      *Math.sin(Math.PI*v*.85);
    const zz=depth+.65*Math.sin(Math.PI*v)+.36*u*v
      +foldedDepth;
    p.setXYZ(j*(nx+1)+i,x+.07*Math.sin(fan*2)*soften,yy,zz);
  }
  g.computeVertexNormals();const m=material.clone();m.opacity=opacity;
  fabricLayers.push({material:m,baseOpacity:opacity});
  const mesh=new T.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
}
panel({left:[-3.8,.45],peak:[1.9,1.25],right:[4.2,.05],depth:-.7,drop:1.2,phase:.8,opacity:.64});
panel({left:[-4.6,.4],peak:[-.8,2.35],right:[4.5,-.3],depth:.1,drop:2.05,phase:0,opacity:.83});
// Use the front layer's transparency as the readable reference value,
// preserving the rear layer's lighter density while adjusting both together.
const transparencyLabel=document.createElement('label');
transparencyLabel.htmlFor='study-transparency';transparencyLabel.textContent='Fabric transparency ';
const transparencyValue=document.createElement('output');transparencyValue.htmlFor='study-transparency';transparencyValue.textContent='56%';
const transparencyInput=document.createElement('input');transparencyInput.type='range';transparencyInput.id='study-transparency';
transparencyInput.min='0';transparencyInput.max='100';transparencyInput.step='1';transparencyInput.value='56';
for(const layer of fabricLayers)layer.material.opacity=.44*(layer.baseOpacity/.83);
transparencyInput.style.cssText='display:block;width:100%;margin:12px 0;accent-color:#c6a153';
transparencyInput.addEventListener('input',()=>{
  const transparency=Number(transparencyInput.value);transparencyValue.textContent=transparency+'%';
  for(const layer of fabricLayers)layer.material.opacity=(1-transparency/100)*(layer.baseOpacity/.83);
});
transparencyLabel.append(transparencyValue);document.querySelector('aside').append(transparencyLabel,transparencyInput);
const transparencyNote=document.createElement('p');transparencyNote.textContent='0% = most opaque · 100% = invisible. Study only; resets on reload.';document.querySelector('aside').append(transparencyNote);
// Broad light sources reveal silk folds rather than placing bright particles.
scene.add(new T.HemisphereLight('#e9f0ff','#263449',.45));
function areaLike(color,intensity,x,y,z){const light=new T.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);return light;}
const key=areaLike('#fff0d9',2.5,-3,4,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;key.shadow.bias=-.0002;
areaLike('#dce8ff',.65,4,1,3);areaLike('#ffdfa8',2.4,1,3,-4);
const gold=new T.MeshStandardMaterial({color:'#c6a153',metalness:.8,roughness:.3});
for(const [x,y,z] of [[-.8,2.35,.1],[1.9,1.25,-.7]]){
  const ring=new T.Mesh(new T.TorusGeometry(.042,.009,8,32),gold);ring.position.set(x,y+.045,z);scene.add(ring);
  scene.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(x,y+.08,z),new T.Vector3(x+.1,5,z)]),new T.LineBasicMaterial({color:'#998664',transparent:true,opacity:.45})));
}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const distance=Math.max(10.7,10.2/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.aspect));camera.position.set(.25,.45,distance);controls.maxDistance=distance*1.7;}
addEventListener('resize',resize);resize();
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
