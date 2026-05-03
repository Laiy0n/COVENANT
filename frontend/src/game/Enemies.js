import * as THREE from 'three';

const ENEMY_TYPES = {
  crawler: {
    color: 0x4a1a4a,
    emissive: 0x330033,
    scale: 0.7,
    speed: 4.4,
    health: 50,
    damage: 12
  },
  spitter: {
    color: 0x1a4a1a,
    emissive: 0x003300,
    scale: 1.0,
    speed: 2.8,
    health: 80,
    damage: 18
  },
  brute: {
    color: 0x4a1a1a,
    emissive: 0x440000,
    scale: 1.5,
    speed: 1.6,
    health: 180,
    damage: 35
  }
};

export function createEnemies(scene, count) {
  const enemies = [];
  const types = ['crawler', 'crawler', 'spitter', 'spitter', 'brute'];
  
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const config = ENEMY_TYPES[type];
    
    const group = new THREE.Group();
    
    // Body - organic blob shape
    const bodyGeo = new THREE.IcosahedronGeometry(config.scale * 0.6, 2);
    const positions = bodyGeo.attributes.position;
    for (let j = 0; j < positions.count; j++) {
      const x = positions.getX(j);
      const y = positions.getY(j);
      const z = positions.getZ(j);
      const noise = Math.sin(x * 4 + j) * Math.cos(y * 3) * 0.12;
      positions.setX(j, x * (1 + noise));
      positions.setY(j, y * (1 + noise * 0.5));
      positions.setZ(j, z * (1 + noise));
    }
    bodyGeo.computeVertexNormals();
    
    const bodyMat = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.6,
      metalness: 0.2,
      emissive: config.emissive,
      emissiveIntensity: 0.5
    });
    
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    
    // Glowing eyes
    const eyeGeo = new THREE.SphereGeometry(0.08 * config.scale, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-0.15 * config.scale, 0.2 * config.scale, -0.4 * config.scale);
    group.add(eye1);
    
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(0.15 * config.scale, 0.2 * config.scale, -0.4 * config.scale);
    group.add(eye2);
    
    // Appendages
    const numLegs = type === 'crawler' ? 6 : type === 'brute' ? 4 : 3;
    for (let l = 0; l < numLegs; l++) {
      const legAngle = (Math.PI * 2 / numLegs) * l;
      const legGeo = new THREE.ConeGeometry(0.04 * config.scale, 0.6 * config.scale, 6);
      const legMat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.8 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(
        Math.cos(legAngle) * 0.35 * config.scale,
        -0.3 * config.scale,
        Math.sin(legAngle) * 0.35 * config.scale
      );
      leg.rotation.z = Math.cos(legAngle) * 0.4;
      leg.rotation.x = Math.sin(legAngle) * 0.4;
      group.add(leg);
    }
    
    // Spawn position - scattered around the map, farther out
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const dist = 20 + Math.random() * 25;
    group.position.set(
      Math.cos(angle) * dist,
      type === 'crawler' ? 0.8 : 1.5,
      Math.sin(angle) * dist - 8
    );
    
    group.castShadow = true;
    scene.add(group);
    
    enemies.push({
      id: i,
      mesh: group,
      type,
      health: config.health,
      maxHealth: config.health,
      speed: config.speed + Math.random() * 1.0,
      damage: config.damage,
      alive: true,
      lastAttack: 0,
      stunned: false,
      stunTime: 0,
      target: null
    });
  }
  
  return enemies;
}
