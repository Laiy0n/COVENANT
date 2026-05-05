import * as THREE from 'three';

// ── Enemy type configs ────────────────────────────────────────────────────────
const ENEMY_TYPES = {
  crawler: { color:0x4a1060, emissive:0x220033, scaleY:0.85, scaleXZ:0.9,  speed:4.5,  health:60,  damage:12 },
  spitter: { color:0x1a4a1a, emissive:0x003300, scaleY:1.1,  scaleXZ:0.95, speed:2.8,  health:80,  damage:18 },
  brute:   { color:0x6a1010, emissive:0x440000, scaleY:1.5,  scaleXZ:1.4,  speed:1.8,  health:220, damage:40 },
  lurker:  { color:0x1a0a3a, emissive:0x150025, scaleY:0.9,  scaleXZ:0.85, speed:6.5,  health:45,  damage:9  },
};

// Build a low-poly humanoid mesh for the enemy
function buildAlienBody(type, cfg) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness:0.5, metalness:0.2, emissive:cfg.emissive, emissiveIntensity:0.7 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0010, roughness:0.8 });
  const eyeMat  = new THREE.MeshBasicMaterial({ color: type === 'lurker' ? 0xff00ff : type === 'spitter' ? 0x00ff44 : 0xff2200 });
  const boneMat = new THREE.MeshStandardMaterial({ color: 0x8a6040, roughness:0.9, metalness:0.1 });

  const h = cfg.scaleY, w = cfg.scaleXZ;

  // ── Torso ──────────────────────────────────────────────────────────────────
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45*w, 0.5*h, 0.28*w), bodyMat);
  torso.position.y = 0.9*h;
  group.add(torso);

  // ── Head ───────────────────────────────────────────────────────────────────
  const headGeo = type === 'brute'
    ? new THREE.BoxGeometry(0.38*w, 0.36*h, 0.35*w)
    : new THREE.IcosahedronGeometry(0.18*w, 1);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 1.32*h;
  if (type === 'crawler') head.position.z = -0.04; // slightly tilted forward
  group.add(head);

  // ── Spine spikes (crawlers & lurkers) ─────────────────────────────────────
  if (type === 'crawler' || type === 'lurker') {
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035*w, 0.22*h, 5), boneMat);
      spike.position.set(0, 1.05*h + i*0.14*h, -0.16*w);
      spike.rotation.x = -0.5;
      group.add(spike);
    }
  }

  // ── Eyes ───────────────────────────────────────────────────────────────────
  const eyeGeo = new THREE.SphereGeometry(0.055*w, 8, 8);
  const numEyes = type === 'brute' ? 4 : type === 'hive' ? 6 : 2;
  for (let i = 0; i < numEyes; i++) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    if (numEyes === 2) {
      eye.position.set((i===0?-1:1)*0.08*w, 1.34*h, -0.17*w);
    } else {
      const a = (Math.PI * 2 / numEyes) * i;
      eye.position.set(Math.cos(a)*0.12*w, 1.32*h + Math.sin(a)*0.08*h, -0.16*w);
    }
    group.add(eye);
  }

  // ── Arms ───────────────────────────────────────────────────────────────────
  for (let side = -1; side <= 1; side += 2) {
    // Upper arm
    const ua = new THREE.Mesh(new THREE.CylinderGeometry(0.065*w, 0.055*w, 0.38*h, 6), bodyMat);
    ua.position.set(side*0.3*w, 0.88*h, 0);
    ua.rotation.z = side * (type === 'brute' ? 0.6 : 0.3);
    group.add(ua);

    // Forearm + claw
    const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.05*w, 0.035*w, 0.32*h, 6), bodyMat);
    fa.position.set(side*0.38*w, 0.62*h, 0.04*w);
    fa.rotation.z = side * 0.15; fa.rotation.x = 0.2;
    group.add(fa);

    // Claw fingers
    for (let f = 0; f < 3; f++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.025*w, 0.16*h, 4), boneMat);
      claw.position.set(side*(0.38+f*0.04)*w, 0.44*h, (-0.06+f*0.06)*w);
      claw.rotation.x = 0.6 + f*0.1;
      group.add(claw);
    }
  }

  // ── Legs ───────────────────────────────────────────────────────────────────
  for (let side = -1; side <= 1; side += 2) {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085*w, 0.07*w, 0.4*h, 6), bodyMat);
    thigh.position.set(side*0.14*w, 0.52*h, 0);
    group.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.06*w, 0.04*w, 0.38*h, 6), darkMat);
    shin.position.set(side*0.15*w, 0.22*h, type==='lurker'?0.06:0.02);
    group.add(shin);

    // Foot claw
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1*w, 0.06*h, 0.22*w), boneMat);
    foot.position.set(side*0.15*w, 0.04*h, 0.05*w);
    group.add(foot);
  }

  // ── Brute: shoulder horns ─────────────────────────────────────────────────
  if (type === 'brute') {
    for (let s = -1; s <= 1; s+=2) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06*w, 0.4*h, 6), boneMat);
      horn.position.set(s*0.32*w, 1.25*h, 0);
      horn.rotation.z = s*0.6;
      group.add(horn);
    }
  }

  // ── Spitter: organic tube mouth ───────────────────────────────────────────
  if (type === 'spitter') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05*w, 0.09*w, 0.28*h, 8), new THREE.MeshStandardMaterial({color:0x2a5a2a,emissive:0x003300,emissiveIntensity:0.5}));
    tube.rotation.x = Math.PI/2;
    tube.position.set(0, 1.28*h, -0.24*w);
    group.add(tube);
  }

  return group;
}

export function createEnemies(scene, count, options = {}) {
  const enemies  = [];
  const typeKeys = ['crawler', 'spitter', 'brute', 'lurker'];

  for (let i = 0; i < count; i++) {
    const type   = typeKeys[i % typeKeys.length];
    const cfg    = ENEMY_TYPES[type];
    const group  = buildAlienBody(type, cfg);

    // Spawn on opposite side from player
    const angle  = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 1.2;
    const spread = 8 + Math.random() * 10;
    const baseZ  = options.side === 'alien' ? 18 : -28;
    group.position.set(
      Math.cos(angle) * spread * 0.7,
      0,
      baseZ + Math.sin(angle) * spread * 0.5
    );
    scene.add(group);

    enemies.push({
      id: i, mesh: group, type, config: cfg,
      health: cfg.health, maxHealth: cfg.health,
      speed: cfg.speed + Math.random() * 0.6,
      damage: cfg.damage,
      alive: true, lastAttack: 0,
      stunned: false, stunTime: 0,
      projectiles: [],
    });
  }
  return enemies;
}

// ── Projectile system ─────────────────────────────────────────────────────────
const BLOOD_MAT = new THREE.MeshBasicMaterial({ color: 0x8b0000 });

export function createProjectile(scene, origin, direction) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), BLOOD_MAT);
  mesh.position.copy(origin);
  scene.add(mesh);
  return { mesh, direction: direction.clone().normalize(), speed: 18, traveled: 0, maxRange: 22, alive: true };
}

export function updateProjectiles(scene, projectiles, playerPos, delta) {
  let damage = 0;
  for (const p of projectiles) {
    if (!p.alive) continue;
    const move = p.speed * delta;
    p.mesh.position.addScaledVector(p.direction, move);
    p.traveled += move;
    if (p.mesh.position.distanceTo(playerPos) < 0.65) {
      p.alive = false; scene.remove(p.mesh); damage += 14; continue;
    }
    if (p.traveled >= p.maxRange) { p.alive = false; scene.remove(p.mesh); }
  }
  return damage;
}