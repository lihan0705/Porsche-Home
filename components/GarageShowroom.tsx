'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { loadDisplayCar, type DisplayCar } from '@/lib/import-car';

type Props={compact?:boolean;paused?:boolean;onReady?:()=>void};
export default function GarageShowroom({compact=false,paused=false,onReady}:Props){
  const host=useRef<HTMLDivElement>(null),latest=useRef({paused,onReady});latest.current={paused,onReady};
  const replay=useRef<(()=>void)|null>(null);
  const [unavailable,setUnavailable]=useState(false),[assemblyPhase,setAssemblyPhase]=useState('正在准备组件'),[modelReady,setModelReady]=useState(false);
  useEffect(()=>{
    if(!host.current)return;
    const el=host.current;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch{setUnavailable(true);latest.current.onReady?.();return;}
    let stopped=false,frame=0,last=0,notified=false;
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let displayCar:DisplayCar|null=null,assemblyStart:number|null=null,lastPhase='';
    const guides:{line:THREE.Line;center:THREE.Vector3;part:DisplayCar['parts'][number]}[]=[];
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));renderer.setClearColor('#e7ebed',1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none';
    const scene=new THREE.Scene();scene.background=new THREE.Color('#e7ebed');scene.fog=new THREE.Fog('#e7ebed',17,36);
    const camera=new THREE.PerspectiveCamera(compact?34:37,1,.1,60);camera.position.set(compact?6.5:6.8,compact?2.9:3.2,compact?6.5:7.6);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.15,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=6.6;controls.maxDistance=12.5;controls.minPolarAngle=.67;controls.maxPolarAngle=1.43;controls.autoRotate=!reducedMotion;controls.autoRotateSpeed=.18;controls.addEventListener('start',()=>{controls.autoRotate=false;});
    const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.85;room.dispose();pmrem.dispose();
    scene.add(new THREE.HemisphereLight('#f7fbff','#8c9ca9',.9));
    const target=new THREE.Object3D();target.position.set(0,.4,0);scene.add(target);
    function spot(color:string,intensity:number,x:number,y:number,z:number,shadow=false){const light=new THREE.SpotLight(color,intensity,35,.62,.75,1.4);light.position.set(x,y,z);light.target=target;light.castShadow=shadow;if(shadow){light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.0001;light.shadow.normalBias=.025;}scene.add(light);return light;}
    const key=spot('#fff4e6',65,3,8,4,true);spot('#d9e9ff',40,-6,4,2);spot('#fca3ad',18,2,3,-6);
    const metal=new THREE.MeshStandardMaterial({color:'#18232b',metalness:.7,roughness:.3});
    const red=new THREE.MeshStandardMaterial({color:'#b9223b',emissive:'#e82b46',emissiveIntensity:.55});
    const white=new THREE.MeshBasicMaterial({color:'#e3f0ff',toneMapped:false});
    function bar(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);scene.add(m);return m;}
    const mirror=new Reflector(new THREE.PlaneGeometry(36,36),{clipBias:.004,textureWidth:512,textureHeight:512,color:0xa7b2bd});mirror.rotation.x=-Math.PI/2;scene.add(mirror);
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(16,16),new THREE.ShadowMaterial({opacity:.28}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.009;shadow.receiveShadow=true;scene.add(shadow);
    const ring=new THREE.Mesh(new THREE.RingGeometry(3.95,3.97,96),red);ring.rotation.x=-Math.PI/2;ring.position.y=.018;scene.add(ring);
    for(const x of[-5,5]){bar(.09,4.2,.14,x,2.1,-4.7,metal);bar(.022,3.8,.025,x,2.13,-4.6,x>0?red:white);}
    bar(10.1,.08,.16,0,4.22,-4.7,metal);bar(9.7,.022,.025,0,4.16,-4.59,white);
    for(const x of[-2.8,2.8])bar(.065,.035,5.8,x,4.4,-.6,white);
    const grid=new THREE.GridHelper(30,30,'#899caa','#abb9c2');grid.position.y=.012;const gridMaterials=Array.isArray(grid.material)?grid.material:[grid.material];gridMaterials.forEach(m=>{m.transparent=true;m.opacity=.23;});scene.add(grid);
    const rear=new THREE.Mesh(new THREE.PlaneGeometry(17,9),new THREE.MeshBasicMaterial({color:'#e1e7e9'}));rear.position.set(0,3,-7);scene.add(rear);
    const logoCanvas=document.createElement('canvas');logoCanvas.width=1024;logoCanvas.height=256;const ctx=logoCanvas.getContext('2d')!;ctx.font='italic 500 154px Arial';ctx.textAlign='center';ctx.fillStyle='#556b7c';ctx.fillText('911',512,172);ctx.font='19px Arial';ctx.fillStyle='#647b8b';ctx.fillText('C A R R E R A   4 S',512,224);
    const logoTexture=new THREE.CanvasTexture(logoCanvas);logoTexture.colorSpace=THREE.SRGBColorSpace;
    const logo=new THREE.Mesh(new THREE.PlaneGeometry(4.8,1.2),new THREE.MeshBasicMaterial({map:logoTexture,transparent:true,opacity:.3,depthWrite:false}));logo.position.set(-.8,2.65,-6.9);scene.add(logo);
    loadDisplayCar('#8f9fae').then(model=>{
      if(stopped){model.group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});return;}
      const car=model.group;car.position.y=.02;car.rotation.y=-.16;scene.add(car);el.dataset.model='carrera-4s';
      displayCar=model;
      car.updateMatrixWorld(true);
      for(const part of model.parts){
        const center=car.worldToLocal(new THREE.Box3().setFromObject(part.group).getCenter(new THREE.Vector3()));
        const geometry=new THREE.BufferGeometry().setFromPoints([center,center]);
        const line=new THREE.Line(geometry,new THREE.LineDashedMaterial({color:part.group.userData.part==='wheels'?'#b7374d':'#698295',dashSize:.055,gapSize:.04,transparent:true,opacity:.5,depthWrite:false}));
        car.add(line);guides.push({line,center,part});
      }
      replay.current=()=>{assemblyStart=null;lastPhase='';};
      setModelReady(true);
      for(const x of[-.72,.72]){const lamp=new THREE.SpotLight('#d9edff',6,10,.25,.7,1.5);lamp.position.set(x,.59,1.93);const aim=new THREE.Object3D();aim.position.set(x,.03,7);car.add(lamp,aim);lamp.target=aim;}
      if(!notified){notified=true;latest.current.onReady?.();}
    }).catch(()=>{if(stopped)return;setUnavailable(true);if(!notified){notified=true;latest.current.onReady?.();}});
    const resize=()=>{const w=el.clientWidth||1,h=el.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const render=(time:number)=>{
      if(stopped)return;frame=requestAnimationFrame(render);if(latest.current.paused||time-last<32)return;
      const delta=Math.min((time-last)/1000,.1)||.033;last=time;
      if(displayCar){
        if(assemblyStart===null)assemblyStart=time;
        const progress=reducedMotion?1:THREE.MathUtils.clamp((time-assemblyStart-1200)/8400,0,1);
        const phase=progress===1?'组装完成':progress<.12?'组件悬浮展开':progress<.4?'轮组缓缓归位':progress<.72?'车身合拢':'玻璃归位';
        if(phase!==lastPhase){lastPhase=phase;setAssemblyPhase(phase);el.dataset.assembly=progress===1?'complete':'assembling';}
        controls.autoRotateSpeed=progress===1?.33:.12;
        for(const {line,center,part} of guides){
          const kind=part.group.userData.part;
          const delay=kind==='glass'?.42:kind==='body'?.22:kind==='wheels'?.04:0;
          const t=THREE.MathUtils.clamp((progress-delay)/(1-delay),0,1),remaining=1-t*t*(3-2*t);
          part.group.position.copy(part.origin).addScaledVector(part.offset,remaining*(compact?.53:.78));
          const positions=line.geometry.getAttribute('position') as THREE.BufferAttribute;
          positions.setXYZ(1,center.x+part.group.position.x-part.origin.x,center.y+part.group.position.y-part.origin.y,center.z+part.group.position.z-part.origin.z);positions.needsUpdate=true;
          line.computeLineDistances();line.visible=remaining>.025&&!reducedMotion;
        }
      }
      controls.update(delta);renderer.render(scene,camera);
    };frame=requestAnimationFrame(render);
    return()=>{stopped=true;replay.current=null;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();const textureSet=new Set<THREE.Texture>();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{for(const v of Object.values(m))if(v instanceof THREE.Texture)textureSet.add(v);m.dispose();});}});textureSet.forEach(t=>t.dispose());logoTexture.dispose();mirror.getRenderTarget().dispose();key.shadow.map?.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div className={`garage-showroom ${compact?'is-compact':''}`}><div ref={host} className="garage-showroom-canvas" aria-label="Porsche 911 Carrera 4S 外观组件展开与组装的 3D 动画，可拖动旋转"/><div className="garage-showroom-fade" aria-hidden="true"/><div className="assembly-controls"><div className="assembly-status"><i/><span>{unavailable?'车型暂未载入':assemblyPhase}</span><small>911 / ASSEMBLY STUDY</small></div><button type="button" disabled={!modelReady} onClick={()=>replay.current?.()} aria-label="重播 911 组装动画"><span aria-hidden="true">↻</span> 重播组装</button></div><div className="garage-showroom-label"><span>911</span><div>CARRERA 4S<small>YOUR PRIVATE GARAGE</small></div></div><span className="garage-showroom-hint">{unavailable?'仍可继续进入园区':'拖动探索 · 外观组件演绎'}</span></div>;
}
