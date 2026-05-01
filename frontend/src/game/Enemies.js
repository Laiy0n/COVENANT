import * as THREE from 'three';

const ENEMY_TYPES = {
  crawler: {
    color: 0x4a1a4a,
    emissive: 0x330033,
    size: [0.6, 0.8, 0.8],
    speed: 5,
    health: 60,
    damage: 10
  },
  spitter: {
    color: 0x1a4a1a,
    emissive: 0x003300,
    size: [0.7, 1.2, 0.7],
    speed: 3,
    health: 80,
    damage: 15
  },
  brute: {
    color: 0x4a1a1a,
    emissive: 0x440000,
    size: [1.2, 1.8, 1.2],
    speed: 2,
    health: 150,
    damage: 30
  }
};

export function createEnemies(scene, count) {
  const enemies = [];
  const types = ['crawler', 'spitter', 'brute'];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const config = ENEMY_TYPES[type];
    
    // Create alien mesh
    const group = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.SphereGeometry(config.size[0], 12, 12);
    // Distort for organic look
    const positions = bodyGeo.attributes.position;
    for (let j = 0; j < positions.count; j++) {
      const x = positions.getX(j);
      const y = positions.getY(j);
      const z = positions.getZ(j);
      const noise = Math.sin(x * 5) * Math.cos(y * 3) * 0.15;
      positions.setX(j, x * (1 + noise));
      positions.setY(j, y * config.size[1] / config.size[0] + noise * 0.1);
      positions.setZ(j, z * (1 + noise));
    }
    bodyGeo.computeVertexNormals();
    
    const bodyMat = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.7,
      metalness: 0.2,
      emissive: config.emissive,
      emissiveIntensity: 0.4
    });
    
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    
    // Eyes (glowing)
    const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-0.2, 0.3, -0.5);
    group.add(eye1);
    
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(0.2, 0.3, -0.5);
    group.add(eye2);
    
    // Legs/appendages
    for (let l = 0; l < 4; l++) {
      const legAngle = (Math.PI / 2) * l + Math.PI / 4;
      const legGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.8, 6);
      const legMat = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.8
      });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(
        Math.cos(legAngle) * 0.4,
        -0.5,
        Math.sin(legAngle) * 0.4
      );
      leg.rotation.z = Math.cos(legAngle) * 0.3;
      leg.rotation.x = Math.sin(legAngle) * 0.3;
      group.add(leg);
    }
    
    // Position enemy
    const angle = (Math.PI * 2 / count) * i;
    const dist = 15 + Math.random() * 15;
    group.position.set(
      Math.cos(angle) * dist,
      1.5,
      Math.sin(angle) * dist - 10
    );
    
    group.castShadow = true;
    scene.add(group);
    
    enemies.push({
      id: i,
      mesh: group,
      type: type,
      health: config.health,
      maxHealth: config.health,
      speed: config.speed + Math.random() * 1.5,
      damage: config.damage,
      alive: true,
      lastAttack: 0
    });
  }
  
  return enemies;
}

export function updateEnemies(enemies, playerPosition, delta) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    
    const dir = new THREE.Vector3()
      .subVectors(playerPosition, enemy.mesh.position)
      .normalize();
    
    const dist = enemy.mesh.position.distanceTo(playerPosition);
    
    if (dist > 2.5) {
      enemy.mesh.position.add(dir.multiplyScalar(enemy.speed * delta));
      enemy.mesh.lookAt(playerPosition);
    }
  }
}
