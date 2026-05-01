import * as THREE from 'three';

export function createMap(scene) {
  const objects = [];
  
  // Floor
  const floorGeo = new THREE.PlaneGeometry(80, 80);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.9,
    metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Ceiling
  const ceilingGeo = new THREE.PlaneGeometry(80, 80);
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a15,
    roughness: 0.95,
    metalness: 0.05
  });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5;
  scene.add(ceiling);
  
  // Wall material
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a3e,
    roughness: 0.7,
    metalness: 0.3
  });
  
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a4e,
    roughness: 0.4,
    metalness: 0.7
  });
  
  // Create spaceship interior layout
  // Main corridor walls (outer boundary)
  const wallConfigs = [
    // Outer walls
    { pos: [0, 2.5, -35], size: [80, 5, 1] },
    { pos: [0, 2.5, 35], size: [80, 5, 1] },
    { pos: [-35, 2.5, 0], size: [1, 5, 70] },
    { pos: [35, 2.5, 0], size: [1, 5, 70] },
    
    // Interior corridors
    // Left wing
    { pos: [-15, 2.5, -10], size: [1, 5, 15] },
    { pos: [-15, 2.5, 15], size: [1, 5, 15] },
    { pos: [-25, 2.5, -3], size: [1, 5, 6] },
    
    // Right wing  
    { pos: [15, 2.5, -10], size: [1, 5, 15] },
    { pos: [15, 2.5, 15], size: [1, 5, 15] },
    { pos: [25, 2.5, -3], size: [1, 5, 6] },
    
    // Central barriers
    { pos: [-5, 2.5, -5], size: [4, 5, 1] },
    { pos: [5, 2.5, -5], size: [4, 5, 1] },
    { pos: [0, 2.5, 8], size: [8, 5, 1] },
    
    // Near heart area
    { pos: [-8, 2.5, -15], size: [1, 5, 8] },
    { pos: [8, 2.5, -15], size: [1, 5, 8] },
    { pos: [-4, 2.5, -25], size: [1, 5, 6] },
    { pos: [4, 2.5, -25], size: [1, 5, 6] },
  ];
  
  wallConfigs.forEach(config => {
    const geo = new THREE.BoxGeometry(...config.size);
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(...config.pos);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData = { isWall: true };
    scene.add(wall);
    objects.push(wall);
  });
  
  // Cover objects (crates, consoles)
  const cratePositions = [
    [-8, 0.75, 5], [8, 0.75, 5], [-3, 0.75, -12],
    [3, 0.75, -12], [-12, 0.75, 0], [12, 0.75, 0],
    [-20, 0.75, -8], [20, 0.75, -8], [0, 0.75, 15],
    [-6, 0.75, 20], [6, 0.75, 20]
  ];
  
  cratePositions.forEach(pos => {
    const size = 1 + Math.random() * 0.5;
    const geo = new THREE.BoxGeometry(size, 1.5, size);
    const crate = new THREE.Mesh(geo, metalMat);
    crate.position.set(...pos);
    crate.castShadow = true;
    crate.receiveShadow = true;
    crate.userData = { isWall: true };
    scene.add(crate);
    objects.push(crate);
  });
  
  // Pillars
  const pillarPositions = [
    [-10, 2.5, -20], [10, 2.5, -20],
    [-10, 2.5, 10], [10, 2.5, 10],
    [-20, 2.5, 5], [20, 2.5, 5],
  ];
  
  pillarPositions.forEach(pos => {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
    const pillar = new THREE.Mesh(geo, metalMat);
    pillar.position.set(...pos);
    pillar.castShadow = true;
    pillar.userData = { isWall: true };
    scene.add(pillar);
    objects.push(pillar);
  });
  
  // Add some sci-fi details (pipes along walls)
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i;
    const pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 6);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x444466,
      metalness: 0.8,
      roughness: 0.2,
      emissive: i % 3 === 0 ? 0x002244 : 0x000000,
      emissiveIntensity: 0.5
    });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(Math.cos(angle) * 33, 2.5, Math.sin(angle) * 33);
    scene.add(pipe);
  }
  
  // Emergency lights (point lights scattered around)
  const lightPositions = [
    { pos: [-15, 4, -15], color: 0xff2222, intensity: 1 },
    { pos: [15, 4, -15], color: 0xff2222, intensity: 1 },
    { pos: [0, 4, 0], color: 0x00e5ff, intensity: 1.5 },
    { pos: [-20, 4, 10], color: 0x2222ff, intensity: 0.8 },
    { pos: [20, 4, 10], color: 0x2222ff, intensity: 0.8 },
    { pos: [0, 4, 20], color: 0x00e5ff, intensity: 1 },
  ];
  
  lightPositions.forEach(config => {
    const light = new THREE.PointLight(config.color, config.intensity, 15);
    light.position.set(...config.pos);
    scene.add(light);
    
    // Light fixture mesh
    const fixtureGeo = new THREE.BoxGeometry(0.5, 0.1, 0.5);
    const fixtureMat = new THREE.MeshBasicMaterial({ color: config.color });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(config.pos[0], 4.9, config.pos[2]);
    scene.add(fixture);
  });
  
  // Stars/space visible through gaps (skybox substitute)
  const starGeo = new THREE.BufferGeometry();
  const starVertices = [];
  for (let i = 0; i < 2000; i++) {
    const r = 100 + Math.random() * 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    starVertices.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
  
  return objects;
}
