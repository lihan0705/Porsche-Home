'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { HomeConfig } from '../lib/home-config';
import { createConceptCar } from '../lib/car-geometry';
import { loadDisplayCar, type DisplayCar } from '../lib/import-car';
import { addWorldDetails } from '../lib/world-details';
import type { PetKind } from '../lib/demo-world';
import { makeGardenPet } from '../lib/garden-pet';

export type ScenePlace = 'entry'|'map'|'home'|'workshop'|'memories'|'terrace';
type Props = {config:HomeConfig; view:ScenePlace; explode:number; pet?:PetKind; active?:boolean; onReady?:()=>void; onPartSelect?:(part:string)=>void; onPlaceSelect?:(place:ScenePlace)=>void; onLoadingProgress?:(value:number,stage:string)=>void};
type Runtime = {setConfig:(config:HomeConfig)=>void; setView:(view:Props['view'])=>void; setExplode:(n:number)=>void};
const DESTINATIONS: {id:Exclude<ScenePlace,'map'|'entry'>;name:string;subtitle:string;position:[number,number,number]}[] = [
  {id:'home',name:'庭院之家',subtitle:'YOUR HOME',position:[-2,6,-4]},
  {id:'workshop',name:'工程工坊',subtitle:'THE WORKSHOP',position:[26,5.8,-7]},
  {id:'memories',name:'记忆展亭',subtitle:'MEMORY PAVILION',position:[-22,5.4,-16]},
  {id:'terrace',name:'来客露台',subtitle:'GUEST TERRACE',position:[-21,4.2,18]},
];

export default function GardenScene({config,view,explode,pet='none',active=true,onReady,onPartSelect,onPlaceSelect,onLoadingProgress}:Props) {
  const host=useRef<HTMLDivElement>(null), runtime=useRef<Runtime|null>(null);
  const hotspots=useRef<Record<string,HTMLButtonElement|null>>({});
  const latest=useRef({config,view,explode,pet,active,onReady,onPartSelect,onPlaceSelect,onLoadingProgress}); latest.current={config,view,explode,pet,active,onReady,onPartSelect,onPlaceSelect,onLoadingProgress};
  useEffect(()=>{
    if(!host.current)return;
    const container=host.current;
    latest.current.onLoadingProgress?.(8,'正在铺开山野与道路');
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{container.dataset.webgl='unavailable';latest.current.onLoadingProgress?.(100,'基础布置已就绪');latest.current.onReady?.();return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.8)); renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';container.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#c1c5b7');scene.fog=new THREE.Fog('#c1c5b7',44,115);
    const pmrem=new THREE.PMREMGenerator(renderer),roomEnvironment=new RoomEnvironment();
    const environment=pmrem.fromScene(roomEnvironment,.04);scene.environment=environment.texture;scene.environmentIntensity=.42;roomEnvironment.dispose();pmrem.dispose();
    const camera=new THREE.PerspectiveCamera(38,1,.1,500);camera.position.set(21,16,25);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.1,0);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=6;controls.maxDistance=240;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.18;controls.enablePan=true;controls.screenSpacePanning=false;controls.panSpeed=.7;
    const ambient=new THREE.HemisphereLight('#e5e6d7','#596344',1.15);scene.add(ambient);
    const sunlight=new THREE.DirectionalLight('#fff1cd',3.35);sunlight.position.set(-13,24,9);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-50;sunlight.shadow.camera.right=50;sunlight.shadow.camera.top=50;sunlight.shadow.camera.bottom=-50;sunlight.shadow.normalBias=.04;sunlight.shadow.bias=-.00015;scene.add(sunlight);
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
    const world=new THREE.Group();scene.add(world);
    // The house is one address in a connected landscape, with several places to discover.
    const outline=new THREE.Shape();outline.moveTo(-37,-29);outline.bezierCurveTo(-47,-19,-43,12,-34,27);outline.bezierCurveTo(-21,37,4,34,23,29);outline.bezierCurveTo(43,24,47,5,41,-17);outline.bezierCurveTo(36,-32,14,-37,-5,-33);outline.bezierCurveTo(-21,-38,-33,-36,-37,-29);
    const landscape=mesh(new THREE.ExtrudeGeometry(outline,{depth:.55,bevelEnabled:false,curveSegments:12}),[grass,edgeStone] as unknown as THREE.Material,world,0,-.575,0);landscape.rotation.x=-Math.PI/2;landscape.castShadow=false;
    const pathMat=standard('#b7a88c'),pathEdge=standard('#9c947b');
    function path(points:[number,number][],width=1.65){
      const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,.035,z))),positions:number[]=[],indices:number[]=[];
      for(let i=0;i<=70;i++){
        const t=i/70,p=curve.getPoint(t),direction=curve.getTangent(t),normal=new THREE.Vector3(-direction.z,0,direction.x).multiplyScalar(width/2);
        positions.push(p.x+normal.x,p.y,p.z+normal.z,p.x-normal.x,p.y,p.z-normal.z);
        if(i<70){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
      const ribbon=mesh(geo,pathMat,world);ribbon.castShadow=false;
      for(const side of[-1,1]){
        const edgePoints=Array.from({length:45},(_,i)=>{const t=i/44,p=curve.getPoint(t),d=curve.getTangent(t);return p.add(new THREE.Vector3(-d.z,0,d.x).multiplyScalar(side*width/2));});
        const edging=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edgePoints),44,.045,5,false),pathEdge,world);edging.castShadow=false;
      }
    }
    path([[10,-4],[15,-4],[18,-8],[23,-8]],2.1);
    path([[-9,-7],[-14,-9],[-16,-12],[-22,-11]],1.9);
    path([[-5,9],[-9,12],[-12,17],[-18,18]],2);
    path([[-23,-20],[-15,-26],[2,-25],[17,-23],[27,-15]],1.45);
    path([[-19,24],[-8,28],[7,25],[20,19],[29,9],[28,1]],1.6);
    // A freestanding workshop: the open forecourt keeps all exploded parts in view.
    const workshop=new THREE.Group();workshop.position.set(26,0,-6);world.add(workshop);
    box(workshop,edgeStone,14,.24,16,0,.06,0);box(workshop,stone,13.6,.1,15.6,0,.23,0);
    box(workshop,concrete,12,4.1,.25,0,2.35,-5.8);box(workshop,wood,12.6,.22,4.6,0,4.58,-4.15);
    box(workshop,dark,.16,4.3,4.7,-5.9,2.4,-4.15);box(workshop,glass,.06,4.1,5.3,5.9,2.35,-3.35);
    for(let i=0;i<10;i++)box(workshop,woodLight,.13,.1,4.4,-5.6+i*1.24,4.42,-4.15);
    box(workshop,warmGlow,10.7,.035,.055,0,4.23,-5.6);glow(workshop,0,3.4,-4,8);
    box(workshop,wood,4.3,.17,1.05,-2.4,1.25,-4.65);for(const x of[-4.15,-.65])box(workshop,dark,.08,1.08,.7,x,.64,-4.65);
    box(workshop,dark,2.6,1.8,1.1,3.3,1.2,-4.7);for(let i=0;i<5;i++)box(workshop,brass,.65,.025,.04,3.3,.56+i*.29,-4.13);
    box(workshop,dark,3.8,1.6,.08,-2.4,2.7,-5.62);for(let i=0;i<7;i++){box(workshop,brass,.06,.46,.06,-3.8+i*.47,2.85,-5.51);cylinder(workshop,brass,.07,.12,-3.8+i*.47,1.4,-4.5,10);}
    cylinder(workshop,standard('#7e8676'),4.7,.15,0,.36,2.05,64);cylinder(workshop,standard('#b7b4a4'),4.45,.035,0,.46,2.05,64);
    for(const x of[-5.8,5.8]){box(workshop,dark,.09,2.5,.09,x,1.55,4.5);box(workshop,warmGlow,.34,.09,.34,x,2.83,4.5);}
    // Glass memory pavilion: empty landscape panels are symbolic frames for the owner's stories.
    const pavilion=new THREE.Group();pavilion.position.set(-22,0,-16);world.add(pavilion);
    box(pavilion,edgeStone,10,.25,10,0,.08,0);box(pavilion,concrete,9.6,.16,9.6,0,.28,0);
    for(const x of[-4.3,4.3])for(const z of[-4.1,4.1])box(pavilion,dark,.12,4.5,.12,x,2.6,z);
    box(pavilion,glass,8.6,4.2,.03,0,2.55,-4.1);box(pavilion,glass,.03,4.2,8.2,-4.3,2.55,0);
    box(pavilion,glass,.03,4.2,8.2,4.3,2.55,0);box(pavilion,glass,8.9,.055,8.5,0,4.87,0);
    for(let i=0;i<6;i++)box(pavilion,dark,.055,.09,8.7,-4.45+i*1.78,4.9,0);
    for(const z of[-4.35,4.35])box(pavilion,dark,9,.09,.055,0,4.9,z);
    const frameColors=['#9aaa8e','#c1a77f','#799c99'];
    for(let i=0;i<3;i++){
      const x=(i-1)*2.7;box(pavilion,wood,2.06,2.5,.13,x,2.45,-2.8);box(pavilion,standard(frameColors[i]),1.82,2.26,.045,x,2.45,-2.71);
      // Geometric contours suggest a landscape without inventing any personal photographs.
      const contour=mesh(new THREE.CircleGeometry(.72,28,0,Math.PI),standard(i===1?'#a18b68':'#627f6b'),pavilion,x+.13,2.2,-2.67);contour.scale.y=.48;
      box(pavilion,brass,1.2,.045,.03,x,1.03,-2.69);box(pavilion,warmGlow,1.85,.035,.055,x,3.91,-2.63);
    }
    cylinder(pavilion,wood,.65,.1,0,.95,1.1,32);cylinder(pavilion,dark,.12,.55,0,.65,1.1,12);
    // The collectible case anchors the gallery beside the owner's memory frames.
    box(pavilion, dark, 2.35, .65, 1.45, 2.5, .69, 1.9);
    box(pavilion, brass, 2.45, .055, 1.55, 2.5, 1.04, 1.9);
    const collectible = createConceptCar('#8d3038').group;
    collectible.scale.setScalar(.29);
    collectible.position.set(2.5, 1.075, 1.9);
    collectible.rotation.y = Math.PI / 3;
    pavilion.add(collectible);
    box(pavilion, glass, 2.42, .035, 1.52, 2.5, 1.63, 1.9);
    for (const x of [1.3, 3.7]) box(pavilion, glass, .025, .57, 1.52, x, 1.34, 1.9);
    for (const z of [1.15, 2.65]) box(pavilion, glass, 2.42, .57, .025, 2.5, 1.34, z);
    box(pavilion,woodLight,2.1,.19,.55,-2.5,.73,2.3);for(const x of[-3.3,-1.7])box(pavilion,dark,.07,.4,.4,x,.46,2.3);
    glow(pavilion,0,4.1,-1.3,6);box(pavilion,stone,5,.12,1,0,.19,5.2);box(pavilion,stone,5.6,.1,1,0,.07,6.1);
    // A separate garden terrace is the social address: chairs, tea, cards and a mailbox.
    const terrace=new THREE.Group();terrace.position.set(-21,0,18);world.add(terrace);
    cylinder(terrace,edgeStone,8,.25,0,.06,0,64);cylinder(terrace,stone,7.75,.12,0,.24,0,64);
    box(terrace,woodLight,8.5,.14,6.3,-.6,.38,-.6);
    for(const x of[-4.6,3.4])for(const z of[-3.5,2.2])box(terrace,wood,.15,3.4,.15,x,2.1,z);
    for(let i=0;i<13;i++)box(terrace,wood,.13,.17,6.6,-4.8+i*.7,3.9,-.65);
    for(const z of[-3.65,2.35])box(terrace,wood,9.3,.17,.14,-.6,3.75,z);
    cylinder(terrace,concrete,1.35,.12,-.6,1.32,-.6,48);cylinder(terrace,dark,.15,.85,-.6,.84,-.6,16);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3,x=-.6+Math.cos(a)*2.1,z=-.6+Math.sin(a)*2.1;
      cylinder(terrace,wood,.43,.12,x,.91,z,20);for(const dx of[-.25,.25])for(const dz of[-.22,.22])box(terrace,dark,.045,.46,.045,x+dx,.62,z+dz);
      const chairBack=box(terrace,woodLight,.82,.65,.09,x+Math.cos(a)*.33,1.28,z+Math.sin(a)*.33);chairBack.rotation.y=Math.PI/2-a;
    }
    cylinder(terrace,brass,.19,.27,-.65,1.52,-.6,24);sphere(terrace,leaf,.23,-.65,1.8,-.6,.9,1.1,.9);
    for(const[x,z]of[[-1.2,-.6],[.2,-.9],[-.6,.2]] as number[][]){cylinder(terrace,concrete,.11,.14,x,1.48,z,18);cylinder(terrace,stone,.17,.025,x,1.4,z,24);}
    const mailbox=new THREE.Group();mailbox.position.set(6.6,0,-2.4);terrace.add(mailbox);
    box(mailbox,wood,.13,1.25,.13,0,.9,0);box(mailbox,standard('#526b58'),.9,.63,.65,0,1.74,0);box(mailbox,brass,.55,.045,.03,0,1.82,.34);box(mailbox,stone,.37,.23,.025,.1,1.75,.36);
    const flag=box(mailbox,standard('#a86248'),.3,.15,.045,.52,2.04,0);flag.rotation.z=.15;
    box(terrace,wood,2.8,.16,.65,1.8,.83,5.6);for(const x of[.7,2.9])box(terrace,dark,.07,.5,.5,x,.5,5.6);
    glow(terrace,-.6,3.35,-.6,5);for(const x of[-3.6,2.4])box(terrace,warmGlow,.2,.15,.2,x,3.59,-.6);
    // Reused instanced forest geometry keeps the larger map affordable to render.
    const forestPositions:[number,number,number][]=[];
    for(let i=0;i<58;i++){
      const a=i/58*Math.PI*2,r=30+rand()*9;const x=Math.cos(a)*r,z=Math.sin(a)*(25+rand()*7);
      if((x>17&&z>-15&&z<3)||(x<-15&&z>-23&&z<-8)||(x<-12&&z>10&&z<27))continue;
      forestPositions.push([x,z,.8+rand()*.65]);
    }
    forestPositions.push([-14,-18,1.2],[-11,-18,.9],[9,-17,1.35],[15,-13,1],[13,10,.9],[-14,5,1.1],[-28,5,1.3],[34,6,1.2],[-32,-10,1.1]);
    // Keep the desktop and portrait workshop approach clear of foreground canopy.
    for(let i=forestPositions.length-1;i>=0;i--){const[x,z]=forestPositions[i];if((x>24&&x<43&&z>0&&z<18)||(x>-1&&x<15&&z>23))forestPositions.splice(i,1);}
    const forestTrunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.19,2.9,7),wood,forestPositions.length);
    const forestCanopies=new THREE.InstancedMesh(new THREE.ConeGeometry(1.15,2.4,8),leaf,forestPositions.length*3);
    const forestDummy=new THREE.Object3D(),forestColor=new THREE.Color();
    forestPositions.forEach(([x,z,s],i)=>{
      forestDummy.position.set(x,1.43*s,z);forestDummy.rotation.set(0,0,0);forestDummy.scale.set(s,s,s);forestDummy.updateMatrix();forestTrunks.setMatrixAt(i,forestDummy.matrix);
      for(let j=0;j<3;j++){forestDummy.position.set(x,(2.15+j*.7)*s,z);forestDummy.rotation.y=i*.63;forestDummy.scale.setScalar(s*(1-j*.17));forestDummy.updateMatrix();forestCanopies.setMatrixAt(i*3+j,forestDummy.matrix);forestColor.set(i%3?'#687f50':'#526b48');forestCanopies.setColorAt(i*3+j,forestColor);}
    });forestTrunks.castShadow=true;forestCanopies.castShadow=true;world.add(forestTrunks,forestCanopies);
    for(const[x,z]of[[14,-4],[-13,-9],[-10,13],[-9,-25],[10,-24],[26,-17],[28,10],[9,25],[-13,27]] as number[][]){cylinder(world,dark,.045,1.45,x,.72,z,8);box(world,warmGlow,.22,.085,.22,x,1.48,z);}
    for(const[x,z,s]of[[-31,-21,1.3],[35,-16,1.5],[-30,28,1.3],[-10,-30,1.1]] as number[][]){sphere(world,edgeStone,1,x,.38,z,s,.55*s,s*.8);sphere(world,leaf,.7,x+1.2,.25,z+.5,1,.6,1);}
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
    const worldDetails=addWorldDetails(world,island);
    const pets = { cat: makeGardenPet('cat'), dog: makeGardenPet('dog') };
    for (const animal of Object.values(pets)) {
      animal.group.visible = false;
      island.add(animal.group);
    }
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    latest.current.onLoadingProgress?.(35,'正在唤醒你的 911');
    let displayCar:DisplayCar|null=null;
    const guideMaterial = new THREE.LineDashedMaterial({ color: '#d87c60', dashSize: .1, gapSize: .08, transparent: true, opacity: .85, depthWrite: false });
    const guides: { part: DisplayCar['parts'][number]; line: THREE.Line; anchor: THREE.Vector3 }[] = [];
    let readyPending=false;
    const engineRoot=new THREE.Group();engineRoot.position.copy(car.group.position);engineRoot.rotation.copy(car.group.rotation);engineRoot.visible=false;island.add(engineRoot);
    loadDisplayCar(latest.current.config.carColor,fraction=>{if(!stopped)latest.current.onLoadingProgress?.(38+Math.min(1,fraction)*47,'正在载入 911 Carrera 4S');}).then(loaded=>{
      if(stopped){loaded.group.traverse(n=>{if(n instanceof THREE.Mesh)n.geometry.dispose();});return;}
      displayCar=loaded;loaded.group.position.copy(car.group.position);loaded.group.rotation.copy(car.group.rotation);island.add(loaded.group);car.group.visible=false;
      for (const part of loaded.parts) {
        const anchor = new THREE.Box3().setFromObject(part.group).getCenter(new THREE.Vector3());
        loaded.group.worldToLocal(anchor);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([anchor, anchor]), guideMaterial);
        line.geometry.setAttribute('lineDistance', new THREE.BufferAttribute(new Float32Array(2), 1));
        line.visible = false;
        line.frustumCulled = false;
        loaded.group.add(line);
        guides.push({ part, line, anchor });
      }
      const engine=car.parts.find(p=>p.group.userData.part==='powertrain');if(engine){car.group.remove(engine.group);engineRoot.add(engine.group);}
      loaded.paint.color.set(latest.current.config.carColor);loaded.rims.forEach(m=>m.color.set(latest.current.config.wheels==='black'?'#353a36':'#c0c5c3'));
      container.dataset.carModel='carrera-4s';
      latest.current.onLoadingProgress?.(96,'正在点亮车库与庭院');readyPending=true;
    }).catch(()=>{if(stopped)return;container.dataset.carModel='concept-fallback';latest.current.onLoadingProgress?.(96,'概念车型已就绪');readyPending=true;});
    // Rain and stars remain light enough for a laptop browser.
    const rainCount=1000,rainPositions=new Float32Array(rainCount*6);
    for(let i=0;i<rainCount;i++){const x=(rand()-.5)*88,y=rand()*17,z=(rand()-.5)*76;rainPositions.set([x,y,z,x-.05,y-.38,z+.02],i*6);}
    const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
    const rain=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:'#c8d7cf',transparent:true,opacity:.38}));scene.add(rain);
    const starsPositions=new Float32Array(230*3);for(let i=0;i<230;i++)starsPositions.set([(rand()-.5)*140,20+rand()*65,-30-rand()*65],i*3);
    const starsGeometry=new THREE.BufferGeometry();starsGeometry.setAttribute('position',new THREE.BufferAttribute(starsPositions,3));
    const stars=new THREE.Points(starsGeometry,new THREE.PointsMaterial({color:'#e8e8d1',size:.11,transparent:true,opacity:.8}));scene.add(stars);
    let currentView=latest.current.view,desiredExplode=latest.current.explode,actualExplode=desiredExplode,transition=true,entranceStarted=false,gateOpen=0;
    const desiredCamera=new THREE.Vector3(),desiredTarget=new THREE.Vector3();
    const sunTarget=new THREE.Color(),fogTarget=new THREE.Color();let ambientTarget=1.15,sunIntensity=3.35,exposureTarget=1.02;
    function setView(v:Props['view']){
      currentView=v;transition=true;const narrow=container.clientWidth<650,aspect=container.clientWidth/Math.max(container.clientHeight,1);
      camera.fov=v==='entry'&&narrow?54:38;camera.updateProjectionMatrix();
      controls.maxDistance=350;controls.minDistance=v==='map'?30:5;
      if(v==='entry'){
        if(entranceStarted){desiredCamera.set(narrow?8:10.5,3.35,narrow?55:43);desiredTarget.set(4.5,1.9,25);}
        else{desiredCamera.set(narrow?10:12,3.5,narrow?63:50);desiredTarget.set(5,2,29);}
        controls.minDistance=7;controls.maxDistance=70;
      }else if(v==='map'){
        const fit=Math.max(1,.98/aspect);desiredCamera.set(72*fit,65*fit,87*fit);desiredTarget.set(-1,1,0);
      }else if(v==='workshop'){
        desiredCamera.set(narrow?37:34,narrow?9:6.3,narrow?12:6.5);desiredTarget.set(26,1.35,-4);
      }else if(v==='memories'){
        desiredCamera.set(narrow?-8:-11,narrow?10:8,narrow?5:-2);desiredTarget.set(-22,1.55,-16);
      }else if(v==='terrace'){
        desiredCamera.set(narrow?-6:-9,narrow?12:9,narrow?38:33);desiredTarget.set(-21,1.3,18);
      }else{
        desiredCamera.set(narrow?27:21,narrow?23:16,narrow?34:25);desiredTarget.set(0,1.1,0);controls.minDistance=14;
      }
      if(scene.fog instanceof THREE.Fog){scene.fog.near=v==='map'?230:52;scene.fog.far=v==='map'?470:175;}
      car.group.position.set(v==='workshop'?26:3.12,v==='workshop'?.49:.255,v==='workshop'?-3.95:4.3);
      displayCar?.group.position.copy(car.group.position);engineRoot.position.copy(car.group.position);
    }
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
    const resize=()=>{const width=container.clientWidth||1,height=container.clientHeight||1;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();setView(currentView);};
    const observer=new ResizeObserver(resize);observer.observe(container);resize();
    let pointerStart={x:0,y:0};const down=(event:PointerEvent)=>{pointerStart={x:event.clientX,y:event.clientY};transition=false;};
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    const up=(event:PointerEvent)=>{if(currentView!=='workshop'||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const roots=displayCar?[displayCar.group,...(engineRoot.visible?[engineRoot]:[])]:[car.group];const hits=raycaster.intersectObjects(roots,true);if(hits.length){let node:THREE.Object3D|null=hits[0].object;while(node&&!node.userData.part)node=node.parent;if(node?.userData.part)latest.current.onPartSelect?.(node.userData.part);}};
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
    let stopped=false,frame=0,lastTime=0,hasDrawnFrame=false;
    const render=(time:number)=>{
      if(stopped)return;frame=requestAnimationFrame(render);const delta=Math.min((time-lastTime)/1000,.05)||.016;lastTime=time;
      if(!latest.current.active&&hasDrawnFrame&&!readyPending)return;
      for (const kind of ['cat', 'dog'] as const) {
        const animal = pets[kind];
        animal.group.visible = latest.current.pet === kind;
        if (animal.group.visible && !reducedMotion) animal.tail.rotation.y = Math.sin(time * .004) * .42;
      }
      if(latest.current.active){
        gateOpen=THREE.MathUtils.lerp(gateOpen,1,1-Math.exp(-delta*1.4));worldDetails.setGateOpen(gateOpen);
        if(currentView==='entry'&&!entranceStarted){entranceStarted=true;setView('entry');if(matchMedia('(prefers-reduced-motion: reduce)').matches){camera.position.copy(desiredCamera);controls.target.copy(desiredTarget);gateOpen=1;worldDetails.setGateOpen(1);transition=false;}}
      }
      if(transition){camera.position.lerp(desiredCamera,1-Math.exp(-delta*3.2));controls.target.lerp(desiredTarget,1-Math.exp(-delta*3.2));if(camera.position.distanceTo(desiredCamera)<.025)transition=false;}
      actualExplode=THREE.MathUtils.lerp(actualExplode,desiredExplode,1-Math.exp(-delta*7));
      car.parts.forEach(p=>p.group.position.copy(p.origin).addScaledVector(p.offset,actualExplode));
      displayCar?.parts.forEach(p=>p.group.position.copy(p.origin).addScaledVector(p.offset,actualExplode));engineRoot.visible=!!displayCar&&currentView==='workshop'&&actualExplode>.08;
      for (const { part, line, anchor } of guides) {
        line.visible = currentView === 'workshop' && actualExplode > .09;
        if (!line.visible) continue;
        const shift = part.offset;
        const position = line.geometry.getAttribute('position');
        position.setXYZ(1, anchor.x + shift.x * actualExplode, anchor.y + shift.y * actualExplode, anchor.z + shift.z * actualExplode);
        position.needsUpdate = true;
        const distance = line.geometry.getAttribute('lineDistance');
        distance.setX(1, shift.length() * actualExplode);
        distance.needsUpdate = true;
      }
      scene.background instanceof THREE.Color&&scene.background.lerp(fogTarget,.025);if(scene.fog instanceof THREE.Fog)scene.fog.color.copy(scene.background as THREE.Color);
      sunlight.color.lerp(sunTarget,.025);sunlight.intensity=THREE.MathUtils.lerp(sunlight.intensity,sunIntensity,.025);ambient.intensity=THREE.MathUtils.lerp(ambient.intensity,ambientTarget,.025);renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,exposureTarget,.025);
      if(rain.visible){const points=rainGeometry.attributes.position.array as Float32Array;for(let i=0;i<rainCount;i++){points[i*6+1]-=delta*9;points[i*6+4]-=delta*9;if(points[i*6+1]<0){points[i*6+1]+=17;points[i*6+4]+=17;}}rainGeometry.attributes.position.needsUpdate=true;}
      controls.update();renderer.render(scene,camera);
      hasDrawnFrame=true;
      if(readyPending){readyPending=false;latest.current.onLoadingProgress?.(100,'欢迎回家。');latest.current.onReady?.();}
      const placed:{x:number;y:number;width:number;height:number}[]=[];
      DESTINATIONS.forEach(place=>{
        const button=hotspots.current[place.id];if(!button)return;
        if(currentView!=='map'){button.style.visibility='hidden';return;}
        const projected=new THREE.Vector3(...place.position).project(camera);
        if(projected.z>1||projected.z<0||Math.abs(projected.x)>1.15||Math.abs(projected.y)>1.15){button.style.visibility='hidden';return;}
        const width=container.clientWidth,height=container.clientHeight,bw=button.offsetWidth||116,bh=button.offsetHeight||52;
        let x=THREE.MathUtils.clamp((projected.x*.5+.5)*width,bw/2+8,width-bw/2-8),y=THREE.MathUtils.clamp((-projected.y*.5+.5)*height,125,height-145);
        for(let pass=0;pass<5;pass++){
          const collision=placed.find(p=>Math.abs(p.x-x)<(p.width+bw)/2+5&&Math.abs(p.y-y)<(p.height+bh)/2+5);
          if(!collision)break;y=Math.min(height-145,collision.y+(collision.height+bh)/2+9);
        }
        placed.push({x,y,width:bw,height:bh});button.style.visibility='visible';button.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-100%)`;
      });
    };
    frame=requestAnimationFrame(render);
    return()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);scene.traverse(node=>{if(node instanceof THREE.Mesh||node instanceof THREE.Points||node instanceof THREE.Line){node.geometry.dispose();const mats=Array.isArray(node.material)?node.material:[node.material];mats.forEach(m=>m.dispose());}});guideMaterial.dispose();worldDetails.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();runtime.current=null;};
  },[]);
  useEffect(()=>{runtime.current?.setConfig(config);},[config]);
  useEffect(()=>{runtime.current?.setView(view);},[view]);
  useEffect(()=>{runtime.current?.setExplode(explode);},[explode]);
  return <div ref={host} className="garden-canvas" style={{width:'100%',height:'100%',position:'relative'}} aria-label="可拖动、缩放和平移探索的保时捷之家地图，包含庭院、独立工坊、记忆展亭与来客露台；车型为 Porsche 911 Carrera 4S，动力总成为示意">
    {DESTINATIONS.map(place=><button key={place.id} ref={node=>{hotspots.current[place.id]=node;}} type="button" className="world-hotspot" aria-label={`进入${place.name}`} onClick={()=>latest.current.onPlaceSelect?.(place.id)} style={{position:'absolute',zIndex:5,top:0,left:0,visibility:'hidden',pointerEvents:'auto',cursor:'pointer',border:'1px solid rgba(255,255,255,.7)',background:'rgba(248,246,236,.94)',color:'#354b38',borderRadius:14,padding:'11px 15px',boxShadow:'0 7px 25px rgba(37,50,31,.15)',fontFamily:'inherit',backdropFilter:'blur(10px)',whiteSpace:'nowrap',textAlign:'left'}}>
      <span style={{display:'block',fontSize:13,fontWeight:600,letterSpacing:'.035em'}}><span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#7e9567',marginRight:7,verticalAlign:'middle'}}/>{place.name}<span aria-hidden="true" style={{marginLeft:8,fontSize:12,opacity:.5}}>↗</span></span>
      <span style={{display:'block',marginTop:4,fontSize:8,letterSpacing:'.13em',opacity:.58}}>{place.subtitle}</span>
    </button>)}
  </div>;
}
