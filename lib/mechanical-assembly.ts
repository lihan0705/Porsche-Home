import * as THREE from 'three';
import type { CarPart } from './car-geometry';

// Illustrative mechanical assembly, not manufacturer engineering/CAD data.
export function createMechanicalAssembly() {
  const group = new THREE.Group(), parts: CarPart[] = [];
  const alloy = new THREE.MeshStandardMaterial({ color: '#b8bec3', metalness: .82, roughness: .3 });
  const steel = new THREE.MeshStandardMaterial({ color: '#555e65', metalness: .85, roughness: .32 });
  const dark = new THREE.MeshStandardMaterial({ color: '#22282d', metalness: .6, roughness: .4 });
  const red = new THREE.MeshStandardMaterial({ color: '#ad2922', metalness: .45, roughness: .3 });
  function part(name: string, at: number[], offset: number[], phase = .28) {
    const g = new THREE.Group(); g.position.set(...at as [number,number,number]);
    g.userData.part = name; g.userData.phase = phase; group.add(g);
    parts.push({ group: g, origin: g.position.clone(), offset: new THREE.Vector3(...offset as [number,number,number]) }); return g;
  }
  function mesh(g: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, x=0,y=0,z=0) {
    const m = new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow = m.receiveShadow = true; g.add(m); return m;
  }
  function box(g:THREE.Group,w:number,h:number,d:number,x=0,y=0,z=0,mat=alloy) { return mesh(g,new THREE.BoxGeometry(w,h,d),mat,x,y,z); }
  function cyl(g:THREE.Group,r:number,h:number,x=0,y=0,z=0,mat=alloy,axis='y') {
    const m=mesh(g,new THREE.CylinderGeometry(r,r,h,24),mat,x,y,z);
    if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m;
  }
  function bolts(g:THREE.Group,x:number,y:number,z:number) {
    for(const s of [-1,1])for(const t of [-1,1])cyl(g,.018,.04,x+s*.12,y,z+t*.12,steel);
  }
  const frame=part('chassis',[0,.24,0],[0,.02,0],.1);
  for(const s of [-1,1])box(frame,.075,.10,3.5,s*.57,0,0,steel);
  for(const z of [-1.5,-.5,.6,1.5]){box(frame,1.2,.08,.08,0,0,z,steel);bolts(frame,0,.06,z);}
  const block=part('powertrain',[0,.53,-1.25],[0,.65,-1.05]);
  box(block,.35,.35,.83,0,0,0,steel);
  for(let i=0;i<8;i++)box(block,.39,.022,.82,0,-.15+i*.044,0);
  cyl(block,.08,.96,0,0,0,steel,'z');
  for(const s of [-1,1]){
    const bank=part('powertrain',[s*.28,.55,-1.25],[s*1.35,.65,-1.05],.4);
    const head=part('powertrain',[s*.56,.55,-1.25],[s*1.8,1.05,-1.05],.52);
    box(head,.16,.3,.91,0,0,0,steel);
    for(let i=0;i<10;i++)box(head,.18,.017,.91,0,-.14+i*.03,0);
    for(let i=0;i<3;i++){
      const z=(i-1)*.28;
      cyl(bank,.12,.27,0,0,z,alloy,'x');
      for(let j=0;j<5;j++)cyl(bank,.127,.013,s*(-.1+j*.045),0,z,steel,'x');
      const piston=part('powertrain',[s*.28,.55,-1.25+z],[s*.65,.8,-1.05],.48);
      cyl(piston,.088,.1,0,0,0,alloy,'x');box(piston,.23,.035,.035,-s*.12,0,0,steel);
      for(const t of [-1,1])cyl(head,.018,.045,0,t*.10,z,steel,'x');
    }
  }
  const transmission=part('powertrain',[0,.48,-.3],[0,.35,.45],.34);
  for(let i=0;i<8;i++)cyl(transmission,.18-i*.012,.07,0,0,-.25+i*.075,i%2?steel:alloy,'z');
  cyl(transmission,.045,1.2,0,0,.65,steel,'z');
  for(const z of [-1.45,1.4])for(const s of [-1,1]){
    const suspension=part('chassis',[s*.75,.48,z],[s*.7,.13,z>0?.4:-.4],.32);
    cyl(suspension,.21,.045,0,0,0,alloy,'x');
    cyl(suspension,.085,.09,0,0,0,steel,'x');
    for(let i=0;i<12;i++) {const a=i*Math.PI/6; cyl(suspension,.012,.049,0,Math.cos(a)*.16,Math.sin(a)*.16,dark,'x');}
    box(suspension,.09,.19,.09,0,.03,.18,red);
    box(suspension,.42,.045,.055,-s*.2,-.12,.1,steel);
    box(suspension,.42,.045,.055,-s*.2,-.12,-.1,steel);
    cyl(suspension,.035,.48,-s*.14,.28,0,steel);
    const pts=Array.from({length:121},(_,i)=>{const a=i/120*Math.PI*16;return new THREE.Vector3(-s*.14+Math.cos(a)*.075,.1+i/120*.34,Math.sin(a)*.075);});
    mesh(suspension,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,.012,6,false),alloy);
  }
  const exhaust=part('powertrain',[0,.33,-1.6],[0,-.08,-1.5],.38);
  for(const s of [-1,1]){cyl(exhaust,.11,.55,s*.44,0,0,steel,'z');cyl(exhaust,.052,.36,s*.44,0,-.4,alloy,'z');}
  return { group, parts };
}
