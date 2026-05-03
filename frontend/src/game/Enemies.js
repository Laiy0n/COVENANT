import * as THREE from 'three';

const ENEMY_TYPES = {
  crawler: { color: 0x4a1a4a, emissive: 0x330033, scale: 0.7,  speed: 5.0, health: 50,  damage: 10, attackRange: 1.8, attackType: 'melee'      },
  spitter: { color: 0x1a4a1a, emissive: 0x003300, scale: 0.9,  speed: 2.5, health: 70,  damage: 18, attackRange: 18,  attackType: 'projectile'  },
  brute:   { color: 0x5a1a1a, emissive: 0x440000, scale: 1.6,  speed: 1.8, health: 200, damage: 35, attackRange: 2.2, attackType: 'melee'      },
  lurker:  { color: 0x2a0a3a, emissive: 0x200030, scale: 0.75, speed: 7.0, health: 40,  damage: 8,  attackRange: 1.5, attackType: 'melee'      },
};

export function createEnemies(scene, count) {
  const enemies = [];
  const typeKeys = ['crawler', 'crawler', 'spitter', 'lurker', 'brute'];

  for (let i = 0; i < count; i++) {
    const type   = typeKeys[i % typeKeys.length];
    const config = ENEMY_TYPES[type];
    const group  = new THREE.Group();

    // Body — organic blob
    const bodyGeo = new THREE.IcosahedronGeometry(config.scale * 0.55, 2);
    const pos     = bodyGeo.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j);
      const n = Math.sin(x * 4 + j) * Math.cos(y * 3) * 0.12;
      pos.setX(j, x * (1 + n)); pos.setY(j, y * (1 + n * 0.5)); pos.setZ(j, z * (1 + n));
    }
    bodyGeo.computeVertexNormals();
    const bodyMat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.6, metalness: 0.2, emissive: config.emissive, emissiveIntensity: 0.6 });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: type === 'spitter' ? 0x00ff44 : 0xff2200 });
    const eyeGeo = new THREE.SphereGeometry(0.07 * config.scale, 8, 8);
    [-0.14, 0.14].forEach(xOff => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(xOff * config.scale, 0.18 * config.scale, -0.42 * config.scale);
      group.add(eye);
    });

    // Limbs
    const numLimbs = type === 'crawler' ? 6 : type === 'brute' ? 4 : 4;
    const limbMat  = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.8 });
    for (let l = 0; l < numLimbs; l++) {
      const a   = (Math.PI * 2 / numLimbs) * l;
      const leg = new THREE.Mesh(new THREE.ConeGeometry(0.04 * config.scale, 0.55 * config.scale, 6), limbMat);
      leg.position.set(Math.cos(a) * 0.34 * config.scale, -0.28 * config.scale, Math.sin(a) * 0.34 * config.scale);
      leg.rotation.z = Math.cos(a) * 0.4; leg.rotation.x = Math.sin(a) * 0.4;
      group.add(leg);
    }

    // Spitter: add protruding organic tube/mouth
    if (type === 'spitter') {
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a, emissive: 0x003300, emissiveIntensity: 0.4 });
      const tube    = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.5, 8), tubeMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, 0, -0.7);
      group.add(tube);
    }

    // Spawn: push towards heart (Z negative), scattered in corridors
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.6;
    const dist  = 18 + Math.random() * 20;
    group.position.set(
      Math.cos(angle) * dist * 0.6,
      type === 'crawler' || type === 'lurker' ? 0.7 : 1.5,
      -15 + Math.sin(angle) * dist * 0.6
    );
    scene.add(group);

    enemies.push({
      id: i, mesh: group, type, config,
      health: config.health, maxHealth: config.health,
      speed: config.speed + Math.random() * 0.8,
      damage: config.damage,
      attackRange: config.attackRange,
      attackType: config.attackType,
      alive: true, lastAttack: 0,
      stunTime: 0,
      // Projectile state for spitters
      projectiles: [],
    });
  }
  return enemies;
}

// ── Projectile system for spitters ──────────────────────────────────────────
const BLOOD_MAT = new THREE.MeshBasicMaterial({ color: 0x8b0000 });

export function createProjectile(scene, origin, direction) {
  const geo  = new THREE.SphereGeometry(0.18, 8, 8);
  const mesh = new THREE.Mesh(geo, BLOOD_MAT);
  mesh.position.copy(origin);
  scene.add(mesh);
  return { mesh, direction: direction.clone().normalize(), speed: 16, traveled: 0, maxRange: 20, alive: true };
}

export function updateProjectiles(scene, projectiles, playerPos, delta) {
  let damage = 0;
  for (const p of projectiles) {
    if (!p.alive) continue;
    const move = p.speed * delta;
    p.mesh.position.addScaledVector(p.direction, move);
    p.traveled += move;

    // Hit player?
    if (p.mesh.position.distanceTo(playerPos) < 0.7) {
      p.alive = false;
      scene.remove(p.mesh);
      damage += 15;
      continue;
    }
    // Out of range
    if (p.traveled >= p.maxRange) {
      p.alive = false;
      scene.remove(p.mesh);
    }
  }
  return damage;
}