import * as THREE from 'three';

const wallMat  = new THREE.MeshStandardMaterial({ color: 0x1e2030, roughness: 0.7, metalness: 0.4 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2d40, roughness: 0.3, metalness: 0.8 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x003344, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.4 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x12141e, roughness: 0.9, metalness: 0.1 });
const ceilMat  = new THREE.MeshStandardMaterial({ color: 0x080a12, roughness: 0.95, metalness: 0.05 });
const pipeMat  = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.4, metalness: 0.9 });
const hazardMat = new THREE.MeshStandardMaterial({ color: 0xcc4400, roughness: 0.5, metalness: 0.2, emissive: 0x440000, emissiveIntensity: 0.3 });

function addWall(scene, objects, x, y, z, w, h, d, mat = wallMat, isWall = true) {
  const geo  = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  if (isWall) mesh.userData = { isWall: true };
  scene.add(mesh);
  objects.push(mesh);
  return mesh;
}

function addCrate(scene, objects, x, z, size = 1.2, h = 1.4) {
  const mesh = addWall(scene, objects, x, h / 2, z, size, h, size, metalMat, true);
  mesh.rotation.y = Math.random() * 0.3;
  return mesh;
}

export function createMap(scene) {
  const objects = [];

  // ── Floor & Ceiling ───────────────────────────────────────────────────────
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 5;
  scene.add(ceil);

  // ── Outer Hull ────────────────────────────────────────────────────────────
  //  The ship is roughly 100×100 units, oriented along Z axis.
  //  Heart is at (0, 3, -42)  →  "bow" of the ship
  //  Players spawn near Z = +35
  const HULL = 52;
  addWall(scene, objects, 0,      2.5, -HULL,  110, 5, 1);  // back wall (heart side)
  addWall(scene, objects, 0,      2.5,  HULL,  110, 5, 1);  // front wall (spawn)
  addWall(scene, objects, -HULL,  2.5,  0,     1,   5, 110); // left hull
  addWall(scene, objects,  HULL,  2.5,  0,     1,   5, 110); // right hull

  // ── Main Corridor (Z axis, centre) ────────────────────────────────────────
  // Left corridor wall
  addWall(scene, objects, -10, 2.5, -10, 1, 5, 60); // Z = -40..+20
  addWall(scene, objects,  10, 2.5, -10, 1, 5, 60);
  // Door gaps at Z = +5 (8 unit gap) and Z = -20 (8 unit gap)

  // ── Left Wing ─────────────────────────────────────────────────────────────
  addWall(scene, objects, -10, 2.5, 10, 60, 5, 1); // connects corridor to left hull at Z=10
  addWall(scene, objects, -30, 2.5, 10, 1, 5, 26); // inner left wing wall Z=10..Z=-16
  addWall(scene, objects, -30, 2.5,-26, 1, 5, 20); // continues to back
  addWall(scene, objects, -20, 2.5, -8, 1, 5, 14); // divider

  // ── Right Wing ────────────────────────────────────────────────────────────
  addWall(scene, objects,  10, 2.5, 10, 60, 5, 1);
  addWall(scene, objects,  30, 2.5, 10, 1, 5, 26);
  addWall(scene, objects,  30, 2.5,-26, 1, 5, 20);
  addWall(scene, objects,  20, 2.5, -8, 1, 5, 14);

  // ── Engine Room (back section) ────────────────────────────────────────────
  addWall(scene, objects,   0, 2.5,-32, 16, 5, 1); // back chamber front wall, gap in middle
  addWall(scene, objects, -14, 2.5,-28, 1, 5, 16);
  addWall(scene, objects,  14, 2.5,-28, 1, 5, 16);

  // ── Control Room (front, near spawn) ─────────────────────────────────────
  addWall(scene, objects,   0, 2.5, 30,  20, 5, 1);
  addWall(scene, objects, -10, 2.5, 36,  1,  5, 14);
  addWall(scene, objects,  10, 2.5, 36,  1,  5, 14);

  // ── Horizontal corridors (cross-passages) ─────────────────────────────────
  addWall(scene, objects, 0, 2.5,  0, 12, 5, 1); // centre cross-wall with gaps on sides
  addWall(scene, objects, 0, 2.5,-18,  8, 5, 1); // choke near heart

  // ── Cover objects ─────────────────────────────────────────────────────────
  const crates = [
    // Central corridor
    [-3,  5], [3,   5], [-3, -5], [3,  -5],
    [-3, 15], [3,  15], [-3,-15], [3, -15],
    // Left wing
    [-16, -2], [-22, 4], [-16, -12], [-24,-14], [-38,-10], [-38, 4],
    // Right wing
    [ 16, -2], [ 22, 4], [ 16,-12], [ 24,-14], [ 38,-10], [ 38, 4],
    // Engine room
    [-6,-34], [6,-34], [-6,-26], [6,-26],
    // Control room
    [-6, 34], [6, 34], [-14, 28], [14, 28],
    // Heart approach
    [-5,-38], [5,-38], [-8,-30], [8,-30],
  ];
  crates.forEach(([x, z]) => addCrate(scene, objects, x, z, 1 + Math.random() * 0.6));

  // ── Engine pillars ────────────────────────────────────────────────────────
  [[-20,-36],[20,-36],[-20,-20],[20,-20]].forEach(([x,z]) => {
    addWall(scene, objects, x, 2.5, z, 2, 5, 2, metalMat, true);
  });

  // ── Pipes along ceiling ────────────────────────────────────────────────────
  [[-8,0],[8,0],[-8,-20],[8,-20]].forEach(([x,z]) => {
    const geo = new THREE.CylinderGeometry(0.15, 0.15, 40, 8);
    const pipe = new THREE.Mesh(geo, pipeMat);
    pipe.position.set(x, 4.5, z);
    scene.add(pipe);
  });

  // ── Hazard strips on floor near heart ─────────────────────────────────────
  for (let i = -4; i <= 4; i++) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 6), hazardMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(i * 1.2, 0.01, -40);
    scene.add(strip);
  }

  // ── Console desks (additional cover, non-wall) ────────────────────────────
  [[-6, 28, 4, 1, 2], [6, 28, 4, 1, 2], [-18, 5, 1, 4, 2], [18, 5, 1, 4, 2]].forEach(([x,z,w,d,h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), metalMat);
    m.position.set(x, h/2, z);
    m.userData = { isWall: true };
    scene.add(m);
    objects.push(m);
  });

  // ── Floor grid lines (visual only) ────────────────────────────────────────
  const gridMat = new THREE.MeshBasicMaterial({ color: 0x1a2030 });
  for (let i = -50; i <= 50; i += 10) {
    const hLine = new THREE.Mesh(new THREE.PlaneGeometry(100, 0.05), gridMat);
    hLine.rotation.x = -Math.PI / 2;
    hLine.position.set(0, 0.005, i);
    scene.add(hLine);
    const vLine = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 100), gridMat);
    vLine.rotation.x = -Math.PI / 2;
    vLine.position.set(i, 0.005, 0);
    scene.add(vLine);
  }

  return objects;
}

// Heart position constant — used by GameEngine too
export const HEART_POSITION = new THREE.Vector3(0, 3, -44);
export const PLANT_POSITION  = new THREE.Vector3(0, 0, -40); // where device is planted