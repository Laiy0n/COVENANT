import * as THREE from 'three';

const wallMat      = new THREE.MeshStandardMaterial({ color:0x1a1d2b, roughness:0.75, metalness:0.35 });
const metalMat     = new THREE.MeshStandardMaterial({ color:0x252840, roughness:0.25, metalness:0.85 });
const floorMat     = new THREE.MeshStandardMaterial({ color:0x0e1018, roughness:0.9,  metalness:0.05 });
const ceilMat      = new THREE.MeshStandardMaterial({ color:0x070910, roughness:0.95, metalness:0.02 });
const pipeMat      = new THREE.MeshStandardMaterial({ color:0x18263a, roughness:0.4,  metalness:0.9  });
const hazardMat    = new THREE.MeshStandardMaterial({ color:0xbb3300, roughness:0.5,  emissive:0x3a0a00, emissiveIntensity:0.4 });
const heartRoomMat = new THREE.MeshStandardMaterial({ color:0x280808, roughness:0.8,  metalness:0.2, emissive:0x0f0000, emissiveIntensity:0.25 });

function box(scene, objects, x, y, z, w, h, d, mat = wallMat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.userData = { isWall: true };
  scene.add(mesh);
  objects.push(mesh);
  return mesh;
}

function crate(scene, objects, x, z, s = 1.1, h = 1.3) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(s, h, s), metalMat);
  m.position.set(x, h / 2, z);
  m.rotation.y = (Math.random() - 0.5) * 0.5;
  m.userData = { isWall: true };
  scene.add(m); objects.push(m);
}

function barricade(scene, objects, x, z, rotY = 0, w = 2.2, h = 1.0, d = 0.18) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), metalMat);
  m.position.set(x, h / 2, z);
  m.rotation.y = rotY;
  m.userData = { isWall: true };
  scene.add(m); objects.push(m);
}

export function createMap(scene) {
  const objects = [];

  // Floor & Ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 120), floorMat);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(150, 120), ceilMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.5; scene.add(ceil);

  // Outer hull
  box(scene, objects,   0, 2.25,  50, 120, 4.5,  1);
  box(scene, objects,   0, 2.25, -55, 120, 4.5,  1, heartRoomMat);
  box(scene, objects, -55, 2.25,   0,   1, 4.5, 106);
  box(scene, objects,  55, 2.25,   0,   1, 4.5, 106);

  // Spawn dividers (gap at centre for mid lane access)
  box(scene, objects, -14, 2.25, 38, 20, 4.5, 1);
  box(scene, objects,  14, 2.25, 38, 20, 4.5, 1);
  for (const [x, z] of [[-8,42],[8,42],[-20,42],[20,42],[-4,34],[4,34]]) crate(scene,objects,x,z);

  // A corridor walls (left, X -35..-18)
  box(scene, objects, -35, 2.25,  7.5,  1, 4.5, 45);
  box(scene, objects, -18, 2.25,  7.5,  1, 4.5, 45);
  box(scene, objects, -26, 2.25,  30,  18, 4.5,  1);
  box(scene, objects, -26, 2.25, -15,  18, 4.5,  1);

  // B corridor walls (right, X +18..+35)
  box(scene, objects,  35, 2.25,  7.5,  1, 4.5, 45);
  box(scene, objects,  18, 2.25,  7.5,  1, 4.5, 45);
  box(scene, objects,  26, 2.25,  30,  18, 4.5,  1);
  box(scene, objects,  26, 2.25, -15,  18, 4.5,  1);

  // Mid lane walls (X -9..+9)
  box(scene, objects, -9, 2.25,  7.5,  1, 4.5, 45);
  box(scene, objects,  9, 2.25,  7.5,  1, 4.5, 45);
  box(scene, objects,  0, 2.25,  30,  18, 4.5,  1);
  box(scene, objects, -4, 2.25, -10,   6, 4.5,  1);
  box(scene, objects,  4, 2.25, -10,   6, 4.5,  1);

  // Corridor cover
  for (const [x, z] of [[-26,-2],[-26,10],[-26,22],[-22,-6],[-30,-6]]) crate(scene,objects,x,z);
  for (const [x, z] of [[ 26,-2],[ 26,10],[ 26,22],[ 22,-6],[ 30,-6]]) crate(scene,objects,x,z);
  for (const [x, z] of [[0,5],[0,18],[0,-4],[-4,14],[4,14]]) crate(scene,objects,x,z);
  barricade(scene, objects, 0, 22);
  barricade(scene, objects, 0, -5, 0.3);

  // Junction area (Z -15..-28)
  box(scene, objects, -46, 2.25, -21, 18, 4.5,  1);
  box(scene, objects,  46, 2.25, -21, 18, 4.5,  1);
  box(scene, objects, -46, 2.25, -14,  1, 4.5, 14);
  box(scene, objects,  46, 2.25, -14,  1, 4.5, 14);
  box(scene, objects, -46, 2.25, -27,  1, 4.5, 12);
  box(scene, objects,  46, 2.25, -27,  1, 4.5, 12);
  for (const [x, z] of [[-36,-18],[-36,-24],[36,-18],[36,-24],[0,-20],[-14,-22],[14,-22]]) crate(scene,objects,x,z,1.3,1.5);
  barricade(scene, objects, -20, -18,  0.15);
  barricade(scene, objects,  20, -18, -0.15);

  // Heart chamber front wall — 3 sections, 3 openings
  // Left gap X -42..-28 (14u), mid gap X -6..+6 (12u), right gap X +28..+42 (14u)
  box(scene, objects, -48, 2.25, -28, 12, 4.5,  1, heartRoomMat);
  box(scene, objects, -17, 2.25, -28, 22, 4.5,  1, heartRoomMat);
  box(scene, objects,  17, 2.25, -28, 22, 4.5,  1, heartRoomMat);
  box(scene, objects,  48, 2.25, -28, 12, 4.5,  1, heartRoomMat);

  // Chamber side walls
  box(scene, objects, -54, 2.25, -41, 1, 4.5, 26, heartRoomMat);
  box(scene, objects,  54, 2.25, -41, 1, 4.5, 26, heartRoomMat);

  // Funnel walls at doorways
  box(scene, objects, -41, 2.25, -24, 1, 4.5, 8, heartRoomMat);
  box(scene, objects,  41, 2.25, -24, 1, 4.5, 8, heartRoomMat);

  // Heart chamber cover
  for (const [x, z] of [
    [-20,-32],[20,-32],[-38,-36],[38,-36],
    [-12,-40],[12,-40],[-28,-44],[28,-44],
    [-8,-48],[8,-48],[-20,-50],[20,-50],
  ]) crate(scene, objects, x, z, 1.4, 1.6);
  barricade(scene, objects,  0, -34,  0,    4.0, 1.1, 0.2);
  barricade(scene, objects,-18, -42,  0.4,  2.0, 0.9, 0.2);
  barricade(scene, objects, 18, -42, -0.4,  2.0, 0.9, 0.2);

  // Biomass pillars
  for (const [x, z] of [[-18,-36],[18,-36],[-18,-48],[18,-48]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 4.5, 8), heartRoomMat);
    p.position.set(x, 2.25, z);
    p.userData = { isWall: true };
    scene.add(p); objects.push(p);
  }

  // Engine pillars
  for (const [x, z] of [[-26,0],[26,0],[-26,-8],[26,-8]]) {
    box(scene, objects, x, 2.25, z, 1.8, 4.5, 1.8, metalMat);
  }

  // Pipes (visual)
  for (const [x, z] of [[-8,5],[8,5],[-8,-18],[8,-18],[-8,-38],[8,-38]]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 50, 8), pipeMat);
    pipe.position.set(x, 4.2, z); scene.add(pipe);
  }

  // Hazard strips near heart
  for (let i = -5; i <= 5; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 10), hazardMat);
    s.rotation.x = -Math.PI / 2; s.position.set(i * 2, 0.01, -43); scene.add(s);
  }

  // Floor grid
  const gridMat = new THREE.MeshBasicMaterial({ color:0x161b28 });
  for (let i = -55; i <= 55; i += 8) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(110, 0.04), gridMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0.005, i); scene.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 110), gridMat);
    v.rotation.x = -Math.PI / 2; v.position.set(i, 0.005, 0); scene.add(v);
  }

  // Zone lights
  { const l = new THREE.PointLight(0x0088ff, 0.8, 20); l.position.set(-26,3,20); scene.add(l); }
  { const l = new THREE.PointLight(0x0088ff, 0.8, 20); l.position.set(26,3,20); scene.add(l); }
  { const l = new THREE.PointLight(0xff2200, 1.5, 30); l.position.set(0,3.5,-44); scene.add(l); }

  return objects;
}

export const HEART_POSITION = new THREE.Vector3(0, 3, -46);
export const PLANT_POSITION = new THREE.Vector3(0, 0, -38);