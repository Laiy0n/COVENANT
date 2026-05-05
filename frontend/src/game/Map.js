import * as THREE from 'three';

const wallMat   = new THREE.MeshStandardMaterial({ color: 0x1e2030, roughness: 0.7, metalness: 0.4 });
const metalMat  = new THREE.MeshStandardMaterial({ color: 0x2a2d40, roughness: 0.3, metalness: 0.8 });
const floorMat  = new THREE.MeshStandardMaterial({ color: 0x12141e, roughness: 0.9, metalness: 0.1 });
const ceilMat   = new THREE.MeshStandardMaterial({ color: 0x080a12, roughness: 0.95, metalness: 0.05 });
const pipeMat   = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.4, metalness: 0.9 });
const hazardMat = new THREE.MeshStandardMaterial({ color: 0xcc4400, roughness: 0.5, emissive: 0x440000, emissiveIntensity: 0.3 });
const heartRoomMat = new THREE.MeshStandardMaterial({ color: 0x2a0a0a, roughness: 0.8, metalness: 0.2, emissive: 0x110000, emissiveIntensity: 0.2 });

function wall(scene, objects, x, y, z, w, h, d, mat = wallMat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.userData = { isWall: true };
  scene.add(mesh); objects.push(mesh);
  return mesh;
}

function crate(scene, objects, x, z, s = 1.2, h = 1.4) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, h, s), metalMat);
  mesh.position.set(x, h / 2, z);
  mesh.rotation.y = (Math.random() - 0.5) * 0.4;
  mesh.userData = { isWall: true };
  scene.add(mesh); objects.push(mesh);
}

export function createMap(scene) {
  const objects = [];

  // Floor & Ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), floorMat);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), ceilMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = 5; scene.add(ceil);

  // ═══════════════════════════════════════════════════════════
  //  MAP LAYOUT (top-down, Z goes negative toward heart)
  //
  //   Z=+45 ┌──────────────────────────┐  Spawn / Control room
  //         │  [SPAWN ZONE near Z=+32] │
  //   Z=+15 │  Main Open Area          │
  //         │                          │
  //   Z= 0  │  Cross junction          │
  //         │     Left │ Right wing    │
  //   Z=-25 │  Approach corridor       │
  //         │    L door    R door      │
  //   Z=-30 └──┐                   ┌──┘  Two entrances into heart room
  //            │  Heart Chamber    │
  //   Z=-50    └───────────────────┘   Heart at (0,3,-44)
  // ═══════════════════════════════════════════════════════════

  // ── Outer hull ────────────────────────────────────────────
  wall(scene, objects,   0, 2.5,  50, 110, 5, 1); // north spawn wall
  wall(scene, objects,   0, 2.5, -52, 110, 5, 1); // south heart wall
  wall(scene, objects, -52, 2.5,   0,   1, 5,104); // west hull
  wall(scene, objects,  52, 2.5,   0,   1, 5,104); // east hull

  // ── Main corridor walls (stop at Z=-25, not blocking heart room) ──
  wall(scene, objects, -10, 2.5,  10, 1, 5, 50); // left wall  Z=-15..+35
  wall(scene, objects,  10, 2.5,  10, 1, 5, 50); // right wall Z=-15..+35

  // ── Left & right wings ────────────────────────────────────
  wall(scene, objects, -10, 2.5,  22, 50, 5, 1); // left wing top
  wall(scene, objects,  10, 2.5,  22, 50, 5, 1); // right wing top
  wall(scene, objects, -32, 2.5,  10, 1, 5, 26); // left outer
  wall(scene, objects,  32, 2.5,  10, 1, 5, 26); // right outer
  wall(scene, objects, -22, 2.5,  -3, 1, 5, 12); // left inner divider
  wall(scene, objects,  22, 2.5,  -3, 1, 5, 12); // right inner divider

  // ── Approach corridor to heart (X=-10..+10, Z=-15..-30) ──
  wall(scene, objects, -10, 2.5, -22, 1, 5, 16); // left approach Z=-14..-30
  wall(scene, objects,  10, 2.5, -22, 1, 5, 16); // right approach

  // ── Cross-junction walls ──────────────────────────────────
  wall(scene, objects, -4, 2.5,  -2, 4, 5, 1);   // centre left barrier
  wall(scene, objects,  4, 2.5,  -2, 4, 5, 1);   // centre right barrier
  wall(scene, objects,  0, 2.5,  10, 8, 5, 1);   // top junction wall

  // ── Heart Chamber ─────────────────────────────────────────
  // Two entrances: left (X around -8) and right (X around +8)
  // Front wall of chamber has TWO GAPS, each 5 units wide
  //  Left section:  X = -25..-14  (11 units)
  //  Gap L:         X = -14..-9   (5 units gap — entrance)
  //  Centre block:  X = -9..+9    (18 units)
  //  Gap R:         X = +9..+14   (5 units gap — entrance)
  //  Right section: X = +14..+25  (11 units)
  wall(scene, objects, -19.5, 2.5, -30, 11, 5, 1, heartRoomMat); // left section
  wall(scene, objects,   0,   2.5, -30, 18, 5, 1, heartRoomMat); // centre block
  wall(scene, objects,  19.5, 2.5, -30, 11, 5, 1, heartRoomMat); // right section

  // Chamber side walls
  wall(scene, objects, -25, 2.5, -41, 1, 5, 22, heartRoomMat); // left side
  wall(scene, objects,  25, 2.5, -41, 1, 5, 22, heartRoomMat); // right side

  // Short approach walls funnel players toward the gaps
 wall(scene, objects, -10, 2.5, -27, 1, 5, 6);  // left funnel
 wall(scene, objects,  10, 2.5, -27, 1, 5, 6);  // right funnel

  // ── Control Room (spawn side) ─────────────────────────────
  wall(scene, objects,   0, 2.5, 38, 20, 5, 1);
  wall(scene, objects, -10, 2.5, 44,  1, 5, 12);
  wall(scene, objects,  10, 2.5, 44,  1, 5, 12);

  // ── Engine pillars ────────────────────────────────────────
  [[-20,-38],[20,-38],[-20,-20],[20,-20],[-35,5],[35,5]].forEach(([x,z]) => {
    wall(scene, objects, x, 2.5, z, 2, 5, 2, metalMat);
  });

  // ── Cover crates ──────────────────────────────────────────
  // Central corridor
  [[-3,5],[3,5],[-3,-5],[3,-5],[-3,14],[3,14]].forEach(([x,z]) => crate(scene,objects,x,z));
  // Left wing
  [[-16,-1],[-22,5],[-16,-12],[-24,-14],[-38,-10],[-38,6],[-28,16]].forEach(([x,z]) => crate(scene,objects,x,z));
  // Right wing
  [[16,-1],[22,5],[16,-12],[24,-14],[38,-10],[38,6],[28,16]].forEach(([x,z]) => crate(scene,objects,x,z));
  // Approach to heart
  [[-6,-20],[6,-20],[-6,-26],[6,-26]].forEach(([x,z]) => crate(scene,objects,x,z));
  // Heart chamber cover
  [[-18,-36],[18,-36],[-18,-44],[18,-44],[-8,-40],[8,-40]].forEach(([x,z]) => crate(scene,objects,x,z));
  // Spawn zone
  [[-6,34],[6,34],[-14,28],[14,28]].forEach(([x,z]) => crate(scene,objects,x,z));

  // ── Pipes (visual) ────────────────────────────────────────
  [[-8,0],[8,0],[-8,-20],[8,-20]].forEach(([x,z]) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,40,8), pipeMat);
    pipe.position.set(x, 4.5, z); scene.add(pipe);
  });

  // ── Hazard floor strips near heart ────────────────────────
  for (let i = -3; i <= 3; i++) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 8), hazardMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(i * 1.5, 0.01, -38); scene.add(strip);
  }

  // ── Floor grid lines (visual) ─────────────────────────────
  const gridMat = new THREE.MeshBasicMaterial({ color: 0x1a2030 });
  for (let i = -50; i <= 50; i += 10) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(100, 0.04), gridMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0.005, i); scene.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 100), gridMat);
    v.rotation.x = -Math.PI / 2; v.position.set(i, 0.005, 0); scene.add(v);
  }

  return objects;
}

// Exported positions used by GameEngine
export const HEART_POSITION = new THREE.Vector3(0, 3, -44);
export const PLANT_POSITION = new THREE.Vector3(0, 0, -39); // in front of heart, accessible