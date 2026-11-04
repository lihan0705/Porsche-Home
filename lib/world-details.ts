import * as THREE from 'three';

/** Code-native landscape details and original 911-inspired exhibition graphics. */
export function addWorldDetails(world:THREE.Group,home:THREE.Group) {
  const textures:THREE.Texture[]=[];
  const mat=(color:string,roughness=.78,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const cream=mat('#ded4ba'),stone=mat('#a59b81'),wood=mat('#7e6148'),dark=mat('#303b34'),red=mat('#ad2332'),leaf=mat('#566d48');
  const glow=new THREE.MeshStandardMaterial({color:'#f8e2ac',emissive:'#fbd797',emissiveIntensity:.65});
  const add=(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x:number,y:number,z:number)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const box=(p:THREE.Object3D,m:THREE.Material,w:number,h:number,d:number,x:number,y:number,z:number)=>add(new THREE.BoxGeometry(w,h,d),m,p,x,y,z);
  function graphic(title:string,subtitle:string,w:number,h:number,x:number,y:number,z:number,parent:THREE.Group,rotation=0,theme='dark'){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=384;const c=canvas.getContext('2d')!;
    c.fillStyle=theme==='dark'?'#25352d':'#ede7d7';c.fillRect(0,0,1024,384);c.fillStyle=theme==='dark'?'#e8e4d7':'#334a3b';
    c.font='500 94px Arial';c.textAlign='center';c.fillText(title,512,169);c.fillStyle='#b52635';c.fillRect(462,206,100,5);
    c.fillStyle=theme==='dark'?'#aebbac':'#788773';c.font='26px Arial';c.fillText(subtitle,512,273);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
    const o=add(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}),parent,x,y,z);o.rotation.y=rotation;o.castShadow=false;return o;
  }
  graphic('PORSCHE','PRIVATE ATELIER  /  911',5.9,2.2,27.6,3.15,-11.61,world);
  graphic('911','CURVES BECOME MEMORIES',2.8,1.05,-22,4.05,-18.64,world,0,'light');
  graphic('WELCOME HOME','A PLACE FOR YOUR PASSION',2.25,.84,-3.7,2.4,-1.72,home,0,'light');
  graphic('LETTERS FROM THE ROAD','LEAVE A LITTLE MEMORY',2.2,.83,-25,2.7,14.42,world,0,'light');
  // A restrained red racing line ties the architecture to the vehicle.
  box(world,red,12,.028,.12,26,.304,-.2);box(world,cream,12,.028,.045,26,.306,.02);
  box(home,red,.08,.028,6.2,5.1,.33,3.2);box(home,cream,.04,.028,6.2,5.28,.33,3.2);
  for(let i=0;i<4;i++){const tire=add(new THREE.TorusGeometry(.39,.13,9,24),dark,world,21.25,.43+i*.27,-9.1);tire.rotation.x=Math.PI/2;}
  box(world,red,1.15,.68,.6,22.1,.84,-9.7);box(world,wood,1.25,.08,.72,22.1,1.23,-9.7);
  for(let i=0;i<3;i++)box(world,cream,.7,.025,.025,22.1,.7+i*.15,-9.385);
  for(const x of[21.7,22.5])for(const z of[-9.9,-9.5]){const wheel=add(new THREE.CylinderGeometry(.09,.09,.05,12),dark,world,x,.43,z);wheel.rotation.z=Math.PI/2;}
  // A sweeping private driveway: painted curbs and dashed lane markings.
  const curve=new THREE.CatmullRomCurve3([[26,-18],[35,-14],[38,-3],[33,13],[20,24],[8,26]].map(([x,z])=>new THREE.Vector3(x,.054,z)));
  const positions:number[]=[],indices:number[]=[];const width=2.65;
  for(let i=0;i<=90;i++){const t=i/90,p=curve.getPoint(t),d=curve.getTangent(t),n=new THREE.Vector3(-d.z,0,d.x).multiplyScalar(width/2);positions.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);if(i<90){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}
  const roadGeometry=new THREE.BufferGeometry();roadGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));roadGeometry.setIndex(indices);roadGeometry.computeVertexNormals();
  const road=add(roadGeometry,mat('#626b60'),world,0,0,0);road.castShadow=false;
  const curbWhite=new THREE.InstancedMesh(new THREE.BoxGeometry(.22,.065,.62),cream,90),curbRed=new THREE.InstancedMesh(new THREE.BoxGeometry(.22,.065,.62),red,90);
  const dash=new THREE.InstancedMesh(new THREE.BoxGeometry(.07,.012,.64),cream,40);const dummy=new THREE.Object3D();
  for(let i=0;i<90;i++){const t=i/89,p=curve.getPoint(t),d=curve.getTangent(t);for(const side of[-1,1]){const offset=new THREE.Vector3(-d.z,0,d.x).multiplyScalar(side*(width/2+.03));dummy.position.copy(p).add(offset);dummy.position.y=.087;dummy.rotation.set(0,Math.atan2(d.x,d.z),0);dummy.updateMatrix();(i%2?curbRed:curbWhite).setMatrixAt(Math.floor(i/2)*2+(side===1?1:0),dummy.matrix);}}
  for(let i=0;i<40;i++){const p=curve.getPoint(i/39),d=curve.getTangent(i/39);dummy.position.copy(p);dummy.position.y=.067;dummy.rotation.set(0,Math.atan2(d.x,d.z),0);dummy.updateMatrix();dash.setMatrixAt(i,dummy.matrix);}world.add(curbWhite,curbRed,dash);
  graphic('911 PRIVATE DRIVE','ENJOY THE CURVES',2.4,.9,28.4,1.8,-18.3,world,-.4,'light');box(world,wood,.07,1.35,.07,28.4,.8,-18.3);
  // Flower borders use a handful of instanced meshes rather than hundreds of draw calls.
  const beds:[number,number,number,number][]=[[-12,-4,2.1,.85],[-12,5,1.9,.7],[-10,14,2.8,.8],[-29,-16,1.8,.95],[-25,-23,3.1,1.1],[-17,-21,1.7,.8],[-29,18,1.8,.85],[-22,27,3.2,.9],[-14,23,1.8,.9],[18,-13,2.2,.7],[32,-16,2.5,.85],[18,5,2,.7],[10,-16,2.3,.8],[4,16,2.4,.8],[6,-19,2.1,.9]];
  let seed=911;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const flowersPerBed=40,total=beds.length*flowersPerBed;
  const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.013,.018,1,4),leaf,total);
  const colors=['#d6b7af','#e6dfbf','#b8a3c4','#d0bc75'];
  const heads=colors.map(c=>new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.105,1),mat(c),Math.ceil(total/4)));
  const tufts=new THREE.InstancedMesh(new THREE.ConeGeometry(.16,.62,4),leaf,beds.length*15);
  let f=0,g=0;
  for(const[x,z,rx,rz]of beds){
    const rim=add(new THREE.TorusGeometry(1,.055,5,40),stone,world,x,.07,z);rim.rotation.x=Math.PI/2;rim.scale.set(rx,rz,1);rim.castShadow=false;
    for(let i=0;i<flowersPerBed;i++){
      const a=random()*Math.PI*2,r=Math.sqrt(random())*.88,px=x+Math.cos(a)*r*rx,pz=z+Math.sin(a)*r*rz,h=.25+random()*.36;
      dummy.position.set(px,.08+h/2,pz);dummy.rotation.set(0,0,0);dummy.scale.set(1,h,1);dummy.updateMatrix();stems.setMatrixAt(f,dummy.matrix);
      dummy.position.y=.09+h;dummy.scale.setScalar(.7+random()*.6);dummy.updateMatrix();heads[f%4].setMatrixAt(Math.floor(f/4),dummy.matrix);f++;
    }
    for(let i=0;i<15;i++){const a=random()*Math.PI*2;dummy.position.set(x+Math.cos(a)*rx*.86,.28,z+Math.sin(a)*rz*.86);dummy.rotation.set((random()-.5)*.3,a,.1);dummy.scale.setScalar(.7+random()*.6);dummy.updateMatrix();tufts.setMatrixAt(g++,dummy.matrix);}
  }
  world.add(stems,tufts,...heads);
  // A small reflecting pool and timber footbridge add a quiet place between visits.
  const pond=new THREE.Group();pond.position.set(-8.8,0,-18);world.add(pond);
  const basin=add(new THREE.CylinderGeometry(3.1,3.25,.12,48),stone,pond,0,.06,0);basin.scale.z=.62;
  const pool=add(new THREE.CircleGeometry(2.98,48),new THREE.MeshPhysicalMaterial({color:'#6d9e98',metalness:.2,roughness:.18,clearcoat:1}),pond,0,.13,0);pool.rotation.x=-Math.PI/2;pool.scale.y=.61;pool.castShadow=false;
  for(let i=0;i<14;i++)box(pond,wood,4.7,.09,.2,0,.35,-1.37+i*.21);
  for(const x of[-2.3,2.3]){box(pond,wood,.055,.055,3.1,x,1.02,0);for(const z of[-1.4,0,1.4])box(pond,wood,.055,.7,.055,x,.69,z);}
  for(const[x,z,s]of[[-2.8,-1.1,.5],[2.7,1.2,.45],[2.1,-1.5,.36]] as number[][]){const rock=add(new THREE.IcosahedronGeometry(s,1),stone,pond,x,.19,z);rock.scale.y=.6;}
  // String lights and tiny postcards make the guest terrace feel inhabited.
  const stringPoints=[];for(let i=0;i<=24;i++){const t=i/24;stringPoints.push(new THREE.Vector3(-25.6+t*8,3.85-Math.sin(t*Math.PI)*.55,17.35));}
  const wire=add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stringPoints),24,.016,4,false),dark,world,0,0,0);wire.castShadow=false;
  for(let i=1;i<12;i++){const p=stringPoints[i*2];add(new THREE.SphereGeometry(.055,6,5),glow,world,p.x,p.y-.08,p.z);}
  for(let i=0;i<3;i++){const card=box(world,i===1?red:cream,.28,.012,.18,-21.6+i*.28,1.4,17.05);card.rotation.y=i*.4;}
  // Direction signs create discoveries at the path junctions.
  for(const[x,z,text]of[[-13,9,'HOME / FRIENDS'],[13,-4,'ATELIER / 911'],[-13,-12,'MEMORIES / HOME']] as [number,number,string][]){box(world,wood,.07,1.45,.07,x,.75,z);graphic(text,'FOLLOW YOUR CURIOSITY',1.95,.73,x,1.75,z,world,.18,'light');}
  return {dispose:()=>textures.forEach(t=>t.dispose())};
}
