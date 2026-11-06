import * as THREE from 'three';

export function makeGardenPet(kind: 'cat' | 'dog') {
  const cat = kind === 'cat';
  const group = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color: cat ? '#cb8e55' : '#b69065', roughness: .86 });
  const cream = new THREE.MeshStandardMaterial({ color: '#f0e0c6', roughness: .83 });
  const dark = new THREE.MeshStandardMaterial({ color: '#372922', roughness: .73 });
  const collar = new THREE.MeshStandardMaterial({ color: '#a8323a', roughness: .65 });
  const sphere = new THREE.SphereGeometry(1, 10, 7);
  const blob = (material: THREE.Material, size: [number, number, number], position: [number, number, number]) => {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.scale.set(...size);
    mesh.position.set(...position);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };
  blob(coat, [.25, .28, .42], [0, .42, -.09]);
  blob(cream, [.17, .24, .25], [0, .42, .14]);
  blob(collar, [.205, .09, .2], [0, .62, .21]);
  blob(coat, [.24, .21, .24], [0, .78, .28]);
  blob(cream, [.14, .105, .12], [0, .72, .46]);
  blob(dark, [.05, .035, .034], [0, .755, .565]);
  for (const side of [-1, 1]) {
    blob(dark, [.032, .04, .028], [side * .105, .82, .48]);
    blob(coat, [.082, .19, .09], [side * .14, .21, -.31]);
    blob(cream, [.078, .1, .105], [side * .14, .15, .22]);
    if (cat) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.105, .25, 4), coat);
      ear.position.set(side * .145, .993, .245);
      ear.rotation.z = -side * .19;
      group.add(ear);
    } else {
      const ear = blob(dark, [.105, .19, .105], [side * .22, .79, .23]);
      ear.rotation.z = side * .26;
    }
  }
  const tail = new THREE.Group();
  tail.position.set(0, .48, -.42);
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(), new THREE.Vector3(.02, .05, -.22), new THREE.Vector3(.08, cat ? .48 : .28, -.36),
  );
  tail.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, cat ? .048 : .072, 6, false), coat));
  group.add(tail);
  group.scale.setScalar(cat ? 1.05 : 1.3);
  group.position.set(.4, .25, 6.6);
  group.rotation.y = .45;
  return { group, tail };
}
