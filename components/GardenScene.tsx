'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { HomeConfig } from '../lib/home-config';
import { createConceptCar } from '../lib/car-geometry';
import { loadDisplayCar, type DisplayCar } from '../lib/import-car';

type Props = {config:HomeConfig; view:'home'|'workshop'; explode:number; onReady?:()=>void; onPartSelect?:(part:string)=>void};
type Runtime = {setConfig:(config:HomeConfig)=>void; setView:(view:Props['view'])=>void; setExplode:(n:number)=>void};

export default function GardenScene({config,view,explode,onReady,onPartSelect}:Props) {
  const host=useRef<HTMLDivElement>(null), runtime=useRef<Runtime|null>(null);
  const latest=useRef({config,view,explode,onReady,onPartSelect}); latest.current={config,view,explode,onReady,onPartSelect};
  useEffect(()=>{
    if(!host.current)return;
    const container=host.current;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{container.dataset.webgl='unavailable';latest.current.onReady?.();return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.8)); renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';container.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#c1c5b7');scene.fog=new THREE.Fog('#c1c5b7',44,115);
    const pmrem=new THREE.PMREMGenerator(renderer),roomEnvironment=new RoomEnvironment();
    const environment=pmrem.fromScene(roomEnvironment,.04);scene.environment=environment.texture;scene.environmentIntensity=.42;roomEnvironment.dispose();pmrem.dispose();
    const camera=new THREE.PerspectiveCamera(38,1,.1,250);camera.position.set(21,16,25);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.1,0);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=6;controls.maxDistance=44;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.18;controls.enablePan=false;
    const ambient=new THREE.HemisphereLight('#e5e6d7','#596344',1.15);scene.add(ambient);
    const sunlight=new THREE.DirectionalLight('#fff1cd',3.35);sunlight.position.set(-13,24,9);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-22;sunlight.shadow.camera.right=22;sunlight.shadow.camera.top=22;sunlight.shadow.camera.bottom=-22;sunlight.shadow.normalBias=.04;sunlight.shadow.bias=-.00015;scene.add(sunlight);
    const fill=new THREE.DirectionalLight('#b9d2d7',.45);fill.position.set(12,9,-10);scene.add(fill);
    const materials:THREE.Material[]=[];
    const standard=(color:string,roughness=.85,metalness=0)=>{const mat=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.push(mat);return mat;};
    const stone=standard('#b9ad95'),edgeStone=standard('#a69c83'),concrete=standard('#c8c0ae'),wood=standard('#725b43'),woodLight=standard('#ac9570'),dark=standard('#373b32'),soil=standard('#6b6753'),grass=standard('#788363'),leaf=standard('#465f3e'),leafLight=standard('#677b4e'),brass=standard('#88784b',.4,.7);
    const glass=new THREE.MeshPhysicalMaterial({color:'#7c9690',roughness:.1,metalness:.12,transparent:true,opacity:.34,side:THREE.DoubleSide});materials.push(glass);
    const warmGlow=new THREE.MeshStandardMaterial({color:'#f5d9a0',emissive:'#ffd78d',emissiveIntensity:1.2,roughness:.7});materials.push(warmGlow);
    const water=new THREE.MeshPhysicalMaterial({color:'#6a9b96',roughness:.19,metalness:.25,transparent:true,opacity:.87,clearcoat:1});materials.push(water);
    const allFixtures:THREE.PointLight[]=[];
    function mesh(geometry:THREE.BufferGeometry,material:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,shadow=true){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
    function box(parent:THREE.Object3D,material:THREE.Material,w:number,h:number,d:number,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z);}
    function cylinder(parent:THREE.Object3D,material:THREE.Material,r:number,h:number,x=0,y=0,z=0,segments=12){return mesh(new THREE.CylinderGeometry(r,r,h,segments),material,parent,x,y,z);}
    function sphere(parent:THREE.Object3D,material:THREE.Material,r:number,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=mesh(new THREE.IcosahedronGeometry(r,1),material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
    function line(parent:THREE.Object3D,material:THREE.Material,a:THREE.Vector3,b:THREE.Vector3,r=.05){const v=b.clone().sub(a);const m=cylinder(parent,material,r,v.length());m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
    let seed=83;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
    const terrain=new THREE.Group();scene.add(terrain);
    const ground=mesh(new THREE.CircleGeometry(150,80),standard('#899577'),terrain,0,-.49,0,false);ground.rotation.x=-Math.PI/2;
    // A horizon of quiet rolling hills gives the tiny home a larger world.
    for(let i=0;i<17;i++) {const a=i/17*Math.PI*2;const hill=sphere(terrain,standard(i%2?'#879776':'#94a183'),1,Math.cos(a)*(47+rand()*14),-3.6,Math.sin(a)*(48+rand()*12),10+rand()*11,6+rand()*8,9+rand()*12);hill.castShadow=false;}
    const island=new THREE.Group();scene.add(island);
    box(island,edgeStone,24,.5,21,0,-.21,0);box(island,grass,23.8,.12,20.8,0,.07,0);
    // Crisp travertine edges, an inset pool, and staggered pavers.
    box(island,stone,10.3,.13,9.2,2.9,.16,3.2);
    box(island,concrete,4.3,.2,7.6,-5.65,.18,2.1);box(island,standard('#506e69'),3.7,.09,6.95,-5.65,.29,2.1);box(island,water,3.56,.03,6.82,-5.65,.35,2.1);
    for(let i=0;i<9;i++)box(island,standard('#9cbdb1'),3.43,.012,.025,-5.65,.372,-1.04+i*.78);
    for(let i=0;i<3;i++)box(island,stone,3.5,.1,.45,-5.65,.31,-.98+i*.5);
    const poolEdge=box(island,concrete,4.7,.16,.3,-5.65,.25,-1.85);poolEdge.castShadow=false;
    for(let i=0;i<10;i++) {const z=9.6-i*.83;const x=7.7-Math.sin(i*.32)*1.65;box(island,concrete,1.6,.10,.62,x,.18,z);}
    for(let i=0;i<7;i++)box(island,stone,1.13,.12,.7,-1.5-i*.84,.15,5.45+i*.2);
    for(let i=0;i<9;i++)box(island,concrete,.95,.07,.52,-6.8+i*1.08,.14,8.8);
    const architecture=new THREE.Group();island.add(architecture);
    const buildings:Record<HomeConfig['architecture'],THREE.Group>={courtyard:new THREE.Group(),pavilion:new THREE.Group(),alpine:new THREE.Group()};
    function glow(parent:THREE.Object3D,x:number,y:number,z:number,intensity=5){const p=new THREE.PointLight('#ffdca3',intensity,7,2);p.position.set(x,y,z);parent.add(p);allFixtures.push(p);return p;}
    function room(parent:THREE.Group,x:number,z:number,w:number,d:number,h=3.8,roofMaterial=concrete){
      box(parent,stone,w+.55,.3,d+.55,x,.37,z);
      box(parent,concrete,w,.18,d,x,h+.45,z);
      box(parent,roofMaterial,w+.6,.22,d+.5,x,h+.64,z);
      box(parent,woodLight,w,.15,d,x,.61,z);
      box(parent,concrete,w,h,.19,x,h/2+.56,z-d/2);
      box(parent,concrete,.19,h,d,x-w/2,h/2+.56,z);
      box(parent,glass,w-.25,h-.2,.025,x,h/2+.56,z+d/2-.08);
      box(parent,glass,.025,h-.2,d-.2,x+w/2-.08,h/2+.56,z);
      const divisions=Math.max(2,Math.round(w/1.5));for(let j=0;j<=divisions;j++)box(parent,dark,.045,h,.06,x-w/2+j*w/divisions,h/2+.56,z+d/2-.07);
      for(let j=0;j<=Math.round(d/1.5);j++)box(parent,dark,.06,h,.045,x+w/2-.07,h/2+.56,z-d/2+j*d/Math.round(d/1.5));
      box(parent,dark,w,.06,.055,x,.6,z+d/2-.065);box(parent,dark,w,.06,.055,x,h+.45,z+d/2-.065);
      box(parent,warmGlow,w-.4,.025,.055,x,h+.34,z+d/2-.25);glow(parent,x,h-.2,z,7);
      // The interiors remain legible through the large windows.
      const sofaMat=standard('#b9b2a0');box(parent,sofaMat,Math.min(w-1,2.8),.55,.9,x,.93,z-.55);box(parent,sofaMat,Math.min(w-1,2.8),.6,.22,x,1.26,z-.94);
      box(parent,wood,1.2,.12,.65,x,1,z+.75);for(const a of[-1,1])for(const b of[-1,1])box(parent,dark,.04,.43,.04,x+a*.49,.76,z+.75+b*.23);
      cylinder(parent,stone,.45,.06,x+.8,1.07,z+.65,24);cylinder(parent,brass,.07,.2,x+.8,1.2,z+.65);
    }
    function buildVilla(kind:HomeConfig['architecture']){
      const b=buildings[kind];architecture.add(b);
      if(kind==='courtyard'){
        room(b,-3.8,-4,7.2,4.5);room(b,1.85,-5.1,4.1,6.7,3.8);
        box(b,wood,2.2,3.65,.24,-6.2,2.36,-1.65);for(let i=0;i<13;i++)box(b,woodLight,.045,3.58,.09,-7.2+i*.15,2.36,-1.49);
        box(b,concrete,1.6,.2,5.3,4.75,4.16,-4.3);box(b,concrete,.22,3.9,.22,5.35,2.18,-1.9);
        box(b,stone,3.8,.18,1.5,-2.4,.43,-1);box(b,stone,4.2,.15,.75,-2.4,.27,.1);
      } else if(kind==='pavilion'){
        room(b,-2.1,-4.8,11,5.7,3.5);box(b,wood,11.3,.24,1.2,-2.1,4.25,-1.5);
        for(let i=0;i<12;i++)box(b,woodLight,.14,.15,2.7,-7.3+i*.94,4.32,-.7);
        box(b,stone,11.5,.2,2,-2.1,.42,-.75);box(b,stone,12,.16,1,-2.1,.26,.65);
      }else{
        room(b,-3.4,-4.4,7.3,5.7,3.2,wood);
        const roof1=box(b,standard('#535a4b'),4.9,.25,6.65,-5.25,4.82,-4.4);roof1.rotation.z=.42;
        const roof2=box(b,standard('#535a4b'),4.9,.25,6.65,-1.55,4.82,-4.4);roof2.rotation.z=-.42;
        room(b,2.05,-5.3,3.4,4.4,2.6,wood);box(b,stone,8,.2,1.6,-3.4,.4,-.65);
        for(let i=0;i<18;i++)box(b,woodLight,.05,2.8,.08,-6.8+i*.39,2,-7.35);
      }
      // Chimney and a shaded entrance.
      box(b,edgeStone,.85,4.8,.9,-6.1,2.9,-6);box(b,wood,.9,1.9,.07,-3.4,1.6,-6.11);
      return b;
    }
    buildVilla('courtyard');buildVilla('pavilion');buildVilla('alpine');
    // Open carport doubles as the small private workshop.
    const carport=new THREE.Group();carport.position.set(3.15,0,.25);island.add(carport);
    box(carport,stone,5.1,.14,6.3,0,.18,0);
    for(const x of[-2.35,2.35])for(const z of[-2.8,2.8])box(carport,dark,.12,3.2,.12,x,1.95,z);
    box(carport,wood,5.2,.18,6.4,0,3.64,0);box(carport,concrete,5.6,.14,6.8,0,3.81,0);
    for(let i=0;i<15;i++)box(carport,woodLight,5.0,.08,.09,0,3.49,-2.9+i*.41);
    for(const x of[-1.9,1.9])box(carport,warmGlow,.035,.018,5.8,x,3.47,0);
    glow(carport,0,3.13,0,9);
    const workbench=box(island,wood,2.1,.16,.8,6.6,1.15,-1.4);workbench.castShadow=true;
    for(const x of[5.7,7.5])box(island,dark,.07,.94,.07,x,.65,-1.4);
    box(island,dark,.75,.31,.38,6.7,1.4,-1.4);cylinder(island,brass,.09,.17,5.95,1.33,-1.3);
    // Planter edges and layered planting bring softness to the architecture.
    const plantsRoot=new THREE.Group();island.add(plantsRoot);
    const plantTypes:Record<HomeConfig['plants'],THREE.Group>={pine:new THREE.Group(),olive:new THREE.Group(),cypress:new THREE.Group()};
    function tree(parent:THREE.Object3D,kind:HomeConfig['plants'],x:number,z:number,size:number){
      const g=new THREE.Group();g.position.set(x,.16,z);g.scale.setScalar(size);parent.add(g);
      cylinder(g,wood,.12,2.5,0,1.25,0,8);
      if(kind==='pine'){
        for(let i=0;i<4;i++){const cone=mesh(new THREE.ConeGeometry(1.25-i*.23,1.8,9),i%2?leaf:leafLight,g,0,1.9+i*.7,0);cone.rotation.y=i*.6;}
      }else if(kind==='cypress'){
        sphere(g,leaf,1,0,2.6,0,.61,2,.63);sphere(g,leafLight,.7,.08,3.5,0,.6,1.55,.6);
      }else{
        const branchPoints=[[-.7,2.35,.1],[.65,2.5,.2],[0,2.7,-.6]];
        for(const p of branchPoints){line(g,wood,new THREE.Vector3(0,1.4,0),new THREE.Vector3(...p as [number,number,number]),.075);sphere(g,leafLight,1.06,p[0],p[1]+.34,p[2],1,.76,.85);sphere(g,leaf,.75,p[0]+.23,p[1]+.55,p[2]-.12,1,.76,.85);}
      }
      return g;
    }
    const treePositions=[[-9,-6,1.4],[-9,0,1.15],[-9.3,5.6,.95],[-7.3,-8.2,1.2],[-2.8,-8.8,1.25],[3.4,-8.6,1.3],[8.7,-6,1.4],[9,-1.3,1.2],[9.5,5.6,.9],[-1.3,8.5,.8]];
    for(const kind of['pine','olive','cypress'] as const){plantsRoot.add(plantTypes[kind]);treePositions.forEach(([x,z,s])=>tree(plantTypes[kind],kind,x,z,s));}
    const flowerMats=['#b5b48b','#e3ceb0','#a88b8a','#cbb98c'].map(c=>standard(c));
    for(let i=0;i<26;i++){
      const side=i<13?-1:1,x=side*(8.8+rand()*.7),z=-8.4+(i%13)*1.32;
      sphere(island,i%2?leaf:leafLight,.38+rand()*.28,x,.47,z,1,.65,1);
      if(i%3===0){for(let j=0;j<6;j++){const px=x+(rand()-.5)*.55,pz=z+(rand()-.5)*.55;cylinder(island,leaf,.015,.4,px,.4,pz,5);sphere(island,flowerMats[i%4],.08,px,.64+rand()*.1,pz);}}
    }
    for(const [x,z]of[[-7.8,7],[-2.5,6.5],[7.9,-5.8]] as number[][]){cylinder(island,standard('#ad8062'),.36,.65,x,.5,z,16);sphere(island,leaf,.58,x,1.03,z,1,.8,1);}
    // A quiet sitting place beside the water.
    const loungeMat=standard('#e2daca');
    for(const z of[.6,3.3]){
      box(island,wood,1.2,.1,2.05,-8,.53,z);const cushion=box(island,loungeMat,1.08,.17,1.87,-8,.65,z);cushion.rotation.x=-.05;
      const back=box(island,loungeMat,1.08,.15,.7,-8,.84,z-.65);back.rotation.x=-.45;
      for(const x of[-8.43,-7.57])for(const dz of[-.75,.75])box(island,wood,.06,.3,.06,x,.34,z+dz);
    }
    cylinder(island,concrete,.47,.5,-8,.45,5.3,32);cylinder(island,brass,.12,.13,-8,.78,5.3,20);
    for(const[x,z]of[[-3,7.8],[5.7,7.4],[8,-5],[-8,-3]] as number[][]){cylinder(island,dark,.055,1.1,x,.65,z,8);box(island,warmGlow,.22,.1,.22,x,1.22,z);glow(island,x,1.3,z,1.8);}
    // Small ground cover stones, clustered rather than noisy random decoration.
    const pebbleGeo=new THREE.IcosahedronGeometry(.12,0),pebbleMat=standard('#d0c8b4');
    const pebbles=new THREE.InstancedMesh(pebbleGeo,pebbleMat,140);const dummy=new THREE.Object3D();
    for(let i=0;i<140;i++){dummy.position.set(-10.1+rand()*1.3,.19,-9+rand()*18);dummy.scale.set(1+rand(),.5,1+rand());dummy.updateMatrix();pebbles.setMatrixAt(i,dummy.matrix);}island.add(pebbles);
    const car=createConceptCar(latest.current.config.carColor);car.group.position.set(3.12,.255,4.3);car.group.rotation.y=-.06;island.add(car.group);
    let displayCar:DisplayCar|null=null;
    const engineRoot=new THREE.Group();engineRoot.position.copy(car.group.position);engineRoot.rotation.copy(car.group.rotation);engineRoot.visible=false;island.add(engineRoot);
    loadDisplayCar(latest.current.config.carColor).then(loaded=>{
      if(stopped){loaded.group.traverse(n=>{if(n instanceof THREE.Mesh)n.geometry.dispose();});return;}
      displayCar=loaded;loaded.group.position.copy(car.group.position);loaded.group.rotation.copy(car.group.rotation);island.add(loaded.group);car.group.visible=false;
      const engine=car.parts.find(p=>p.group.userData.part==='powertrain');if(engine){car.group.remove(engine.group);engineRoot.add(engine.group);}
      loaded.paint.color.set(latest.current.config.carColor);loaded.rims.forEach(m=>m.color.set(latest.current.config.wheels==='black'?'#353a36':'#c0c5c3'));
      container.dataset.carModel='carrera-4s';
    }).catch(()=>{container.dataset.carModel='concept-fallback';});
    // Rain and stars remain light enough for a laptop browser.
    const rainPositions=new Float32Array(600*6);
    for(let i=0;i<600;i++){const x=(rand()-.5)*31,y=rand()*17,z=(rand()-.5)*29;rainPositions.set([x,y,z,x-.05,y-.38,z+.02],i*6);}
    const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
    const rain=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:'#c8d7cf',transparent:true,opacity:.38}));scene.add(rain);
    const starsPositions=new Float32Array(230*3);for(let i=0;i<230;i++)starsPositions.set([(rand()-.5)*140,20+rand()*65,-30-rand()*65],i*3);
    const starsGeometry=new THREE.BufferGeometry();starsGeometry.setAttribute('position',new THREE.BufferAttribute(starsPositions,3));
    const stars=new THREE.Points(starsGeometry,new THREE.PointsMaterial({color:'#e8e8d1',size:.11,transparent:true,opacity:.8}));scene.add(stars);
    let currentView=latest.current.view,desiredExplode=latest.current.explode,actualExplode=desiredExplode,transition=true;
    const desiredCamera=new THREE.Vector3(),desiredTarget=new THREE.Vector3();
    const sunTarget=new THREE.Color(),fogTarget=new THREE.Color();let ambientTarget=1.15,sunIntensity=3.35,exposureTarget=1.02;
    function setView(v:Props['view']){currentView=v;transition=true;const narrow=container.clientWidth<650;if(v==='workshop'){desiredCamera.set(11,6.3,14.5);desiredTarget.set(3.1,1.25,4.2);controls.minDistance=4.7;controls.maxDistance=20;}else{desiredCamera.set(narrow?27:21,narrow?23:16,narrow?34:25);desiredTarget.set(0,1.1,0);controls.minDistance=16;controls.maxDistance=44;}}
    function setConfig(c:HomeConfig){
      Object.entries(buildings).forEach(([key,b])=>b.visible=key===c.architecture);Object.entries(plantTypes).forEach(([key,p])=>p.visible=key===c.plants);
      car.paint.color.set(c.carColor);car.rims.color.set(c.wheels==='black'?'#353a36':'#c0c5c3');
      if(displayCar){displayCar.paint.color.set(c.carColor);displayCar.rims.forEach(m=>m.color.set(c.wheels==='black'?'#353a36':'#c0c5c3'));}
      const night=c.time==='night',day=c.time==='day',wet=c.weather==='rain';
      sunTarget.set(night?'#b7c8e0':day?'#fff7e5':'#ffe4ae');fogTarget.set(night?'#25382f':wet?'#8e9f98':day?'#c6d4c3':'#c1c5b7');
      ambientTarget=night?.45:wet?1.3:day?1.55:1.15;sunIntensity=night?.45:wet?1.7:day?3.3:3.35;exposureTarget=night?.94:day?1.08:1.02;
      scene.environmentIntensity=night?.2:day?.5:.42;
      sunlight.position.set(day?-10:-16,day?26:night?18:16,day?7:10);
      rain.visible=wet;stars.visible=night&&!wet;allFixtures.forEach(l=>l.intensity=night?9:day?.3:4);warmGlow.emissiveIntensity=night?2:day?.15:.8;
      stone.roughness=wet?.48:.85;concrete.roughness=wet?.54:.85;
    }
    runtime.current={setConfig,setView,setExplode:n=>{desiredExplode=THREE.MathUtils.clamp(n,0,1);}};
    setConfig(latest.current.config);setView(latest.current.view);
    camera.position.copy(desiredCamera);controls.target.copy(desiredTarget);transition=false;
    const resize=()=>{const width=container.clientWidth||1,height=container.clientHeight||1;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(container);resize();
    let pointerStart={x:0,y:0};const down=(event:PointerEvent)=>{pointerStart={x:event.clientX,y:event.clientY};transition=false;};
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    const up=(event:PointerEvent)=>{if(currentView!=='workshop'||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const roots=displayCar?[displayCar.group,...(engineRoot.visible?[engineRoot]:[])]:[car.group];const hits=raycaster.intersectObjects(roots,true);if(hits.length){let node:THREE.Object3D|null=hits[0].object;while(node&&!node.userData.part)node=node.parent;if(node?.userData.part)latest.current.onPartSelect?.(node.userData.part);}};
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
    let stopped=false,frame=0,lastTime=0;
    const render=(time:number)=>{
      if(stopped)return;frame=requestAnimationFrame(render);const delta=Math.min((time-lastTime)/1000,.05)||.016;lastTime=time;
      if(transition){camera.position.lerp(desiredCamera,1-Math.exp(-delta*3.2));controls.target.lerp(desiredTarget,1-Math.exp(-delta*3.2));if(camera.position.distanceTo(desiredCamera)<.025)transition=false;}
      actualExplode=THREE.MathUtils.lerp(actualExplode,desiredExplode,1-Math.exp(-delta*7));
      car.parts.forEach(p=>p.group.position.copy(p.origin).addScaledVector(p.offset,actualExplode));
      displayCar?.parts.forEach(p=>p.group.position.copy(p.origin).addScaledVector(p.offset,actualExplode));engineRoot.visible=!!displayCar&&actualExplode>.08;
      scene.background instanceof THREE.Color&&scene.background.lerp(fogTarget,.025);if(scene.fog instanceof THREE.Fog)scene.fog.color.copy(scene.background as THREE.Color);
      sunlight.color.lerp(sunTarget,.025);sunlight.intensity=THREE.MathUtils.lerp(sunlight.intensity,sunIntensity,.025);ambient.intensity=THREE.MathUtils.lerp(ambient.intensity,ambientTarget,.025);renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,exposureTarget,.025);
      if(rain.visible){const points=rainGeometry.attributes.position.array as Float32Array;for(let i=0;i<600;i++){points[i*6+1]-=delta*9;points[i*6+4]-=delta*9;if(points[i*6+1]<0){points[i*6+1]+=17;points[i*6+4]+=17;}}rainGeometry.attributes.position.needsUpdate=true;}
      controls.update();renderer.render(scene,camera);
    };
    frame=requestAnimationFrame(render);latest.current.onReady?.();
    return()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);scene.traverse(node=>{if(node instanceof THREE.Mesh||node instanceof THREE.Points||node instanceof THREE.LineSegments){node.geometry.dispose();const mats=Array.isArray(node.material)?node.material:[node.material];mats.forEach(m=>m.dispose());}});environment.dispose();renderer.dispose();renderer.domElement.remove();runtime.current=null;};
  },[]);
  useEffect(()=>{runtime.current?.setConfig(config);},[config]);
  useEffect(()=>{runtime.current?.setView(view);},[view]);
  useEffect(()=>{runtime.current?.setExplode(explode);},[explode]);
  return <div ref={host} className="garden-canvas" style={{width:'100%',height:'100%',position:'relative'}} aria-label="可拖动旋转的庭院、住宅与 Porsche 911 Carrera 4S 三维场景；车型加载失败时显示概念模型，动力总成为示意"/>;
}
