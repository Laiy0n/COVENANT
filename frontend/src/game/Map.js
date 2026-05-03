import * as THREE from 'three';

export function createMap(scene) {
  const objects = [];

  // ── Shared materials (Lambert = no PBR = 3-4× faster than MeshStandard) ──
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x2a2d3e });
  const ceilMat  = new THREE.MeshLambertMaterial({ color: 0x1a1c28 });
  const wallMat  = new THREE.MeshLambertMaterial({ color: 0x3a3d52 });
  const metalMat = new THREE.MeshLambertMaterial({ color: 0x4a4e66 });
  const pipeMat  = new THREE.MeshLambertMaterial({ color: 0x555880 });

  // ── Floor ──
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // ── Ceiling ──
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5;
  scene.add(ceiling);

  // ── Walls (shared material = 1 shader bind for all) ──
  const wallConfigs = [
    { pos: [0, 2.5, -35], size: [80, 5, 1] },
    { pos: [0, 2.5,  35], size: [80, 5, 1] },
    { pos: [-35, 2.5, 0], size: [1, 5, 70] },
    { pos: [ 35, 2.5, 0], size: [1, 5, 70] },
    { pos: [-15, 2.5, -10], size: [1, 5, 15] },
    { pos: [-15, 2.5,  15], size: [1, 5, 15] },
    { pos: [-25, 2.5,  -3], size: [1, 5,  6] },
    { pos: [ 15, 2.5, -10], size: [1, 5, 15] },
    { pos: [ 15, 2.5,  15], size: [1, 5, 15] },
    { pos: [ 25, 2.5,  -3], size: [1, 5,  6] },
    { pos: [-5, 2.5, -5],  size: [4, 5, 1] },
    { pos: [ 5, 2.5, -5],  size: [4, 5, 1] },
    { pos: [ 0, 2.5,  8],  size: [8, 5, 1] },
    { pos: [-8, 2.5, -15], size: [1, 5, 8] },
    { pos: [ 8, 2.5, -15], size: [1, 5, 8] },
    { pos: [-4, 2.5, -25], size: [1, 5, 6] },
    { pos: [ 4, 2.5, -25], size: [1, 5, 6] },
  ];
  wallConfigs.forEach(({ pos, size }) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), wallMat);
    wall.position.set(...pos);
    wall.userData = { isWall: true };
    scene.add(wall);
    objects.push(wall);
  });

  // ── Cover crates ──
  const cratePositions = [
    [-8,0.75,5],[8,0.75,5],[-3,0.75,-12],[3,0.75,-12],
    [-12,0.75,0],[12,0.75,0],[-20,0.75,-8],[20,0.75,-8],
    [0,0.75,15],[-6,0.75,20],[6,0.75,20],
  ];
  cratePositions.forEach(pos => {
    const s = 1.1 + (Math.abs(pos[0] + pos[2]) % 3) * 0.15;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(s, 1.5, s), metalMat);
    crate.position.set(...pos);
    crate.userData = { isWall: true };
    scene.add(crate);
    objects.push(crate);
  });

  // ── Pillars (shared geometry!) ──
  const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
  [[-10,2.5,-20],[10,2.5,-20],[-10,2.5,10],[10,2.5,10],[-20,2.5,5],[20,2.5,5]].forEach(pos => {
    const p = new THREE.Mesh(pillarGeo, metalMat);
    p.position.set(...pos);
    p.userData = { isWall: true };
    scene.add(p);
    objects.push(p);
  });

  // ── Decorative pipes (shared geo + mat) ──
  const pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 6);
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 / 10) * i;
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(Math.cos(a) * 33, 2.5, Math.sin(a) * 33);
    scene.add(pipe);
  }

  // ── Lighting: 1 ambient + 1 directional + 4 accent points ──
  // Down from ~9 PointLights to 4 = huge fragment-shader savings
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const sun = new THREE.DirectionalLight(0xaabbff, 1.2);
  sun.position.set(5, 20, 10);
  scene.add(sun);

  [
    { pos: [-15, 4, -15], color: 0xff3333, i: 4,  r: 22 },
    { pos: [ 15, 4, -15], color: 0xff3333, i: 4,  r: 22 },
    { pos: [  0, 4,   8], color: 0x00e5ff, i: 4,  r: 22 },
    { pos: [  0, 4,  20], color: 0x4488ff, i: 3,  r: 20 },
  ].forEach(({ pos, color, i, r }) => {
    const l = new THREE.PointLight(color, i, r);
    l.position.set(...pos);
    scene.add(l);
    const fix = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.08, 0.4),
      new THREE.MeshBasicMaterial({ color })
    );
    fix.position.set(pos[0], 4.9, pos[2]);
    scene.add(fix);
  });

  // ── Stars ──
  const verts = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) {
    const r = 120 + Math.random() * 150, t = Math.random() * Math.PI * 2, p = Math.random() * Math.PI;
    verts[i*3] = r*Math.sin(p)*Math.cos(t); verts[i*3+1] = r*Math.cos(p); verts[i*3+2] = r*Math.sin(p)*Math.sin(t);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 })));

  return objects;
}