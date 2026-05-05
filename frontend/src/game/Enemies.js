import * as THREE from 'three';

// Enemy configs keyed by alien operator ID
// These ARE the alien operators — same IDs, same visual identity
const ENEMY_CONFIGS = {
  ravager:    { color:0xaa1040, emissive:0x550020, speed:5.0,  health:120, armor:20,  damage:20, preferDist:8,  shootCooldown:1.4, spread:0.07, shootRange:14 },
  broodmother:{ color:0x6600aa, emissive:0x330055, speed:2.5,  health:110, armor:40,  damage:16, preferDist:10, shootCooldown:2.0, spread:0.05, shootRange:16 },
  specter:    { color:0x007755, emissive:0x003322, speed:5.5,  health:80,  armor:10,  damage:14, preferDist:9,  shootCooldown:1.2, spread:0.09, shootRange:15 },
  colossus:   { color:0xaa3300, emissive:0x551100, speed:1.8,  health:220, armor:80,  damage:35, preferDist:5,  shootCooldown:2.5, spread:0.12, shootRange:10 },
  hive:       { color:0xaaaa00, emissive:0x555500, speed:3.5,  health:85,  armor:15,  damage:15, preferDist:11, shootCooldown:1.8, spread:0.06, shootRange:18 },
};

// Visual scale per type
const SCALES = {
  ravager:    { h:1.15, w:1.0 },
  broodmother:{ h:1.1,  w:1.05 },
  specter:    { h:1.05, w:0.9 },
  colossus:   { h:1.5,  w:1.4 },
  hive:       { h:1.0,  w:0.95 },
};

function buildBody(type, cfg) {
  const s   = SCALES[type] || { h:1, w:1 };
  const h   = s.h, w = s.w;
  const col = cfg.color, em = cfg.emissive;

  const bodyMat = new THREE.MeshStandardMaterial({ color:col, roughness:0.55, metalness:0.2, emissive:em, emissiveIntensity:0.7 });
  const darkMat = new THREE.MeshStandardMaterial({ color:0x050008, roughness:0.9 });
  const boneMat = new THREE.MeshStandardMaterial({ color:0x9a7050, roughness:0.85 });
  const eyeMat  = new THREE.MeshBasicMaterial({ color: {
    ravager:0xff0033, broodmother:0xdd00ff, specter:0x00ffaa, colossus:0xff5500, hive:0xffff00
  }[type] || 0xff2200 });

  const g = new THREE.Group();

  // ── Torso ──────────────────────────────────────────────────────────────────
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46*w, 0.52*h, 0.28*w), bodyMat);
  torso.position.y = 0.9*h;
  g.add(torso);

  // ── Pelvis ─────────────────────────────────────────────────────────────────
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38*w, 0.22*h, 0.24*w), bodyMat);
  pelvis.position.y = 0.58*h;
  g.add(pelvis);

  // ── Head ───────────────────────────────────────────────────────────────────
  let headGeo;
  if      (type === 'colossus')   headGeo = new THREE.BoxGeometry(0.42*w, 0.38*h, 0.36*w);
  else if (type === 'broodmother') headGeo = new THREE.SphereGeometry(0.22*w, 8, 6);
  else                            headGeo = new THREE.IcosahedronGeometry(0.19*w, 1);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 1.32*h;
  g.add(head);

  // ── Eyes ───────────────────────────────────────────────────────────────────
  const numEyes = type === 'hive' ? 4 : type === 'colossus' ? 4 : 2;
  const eyeGeo  = new THREE.SphereGeometry(0.05*w, 6, 6);
  for (let i = 0; i < numEyes; i++) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    if (numEyes === 2) {
      eye.position.set((i===0?-1:1)*0.09*w, 1.34*h, -0.18*w);
    } else {
      const a = (Math.PI*2/numEyes)*i;
      eye.position.set(Math.cos(a)*0.13*w, 1.33*h+Math.sin(a)*0.08*h, -0.17*w);
    }
    g.add(eye);
  }

  // ── Type-specific details ──────────────────────────────────────────────────
  if (type === 'ravager') {
    // Blade-like dorsal fin
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06*w, 0.5*h, 0.08*w), boneMat);
    fin.position.set(0, 1.1*h, 0.16*w); fin.rotation.x = -0.2;
    g.add(fin);
  }
  if (type === 'broodmother') {
    // Tendril crown
    for (let t = 0; t < 5; t++) {
      const a = (Math.PI*2/5)*t;
      const tendril = new THREE.Mesh(new THREE.ConeGeometry(0.03*w, 0.28*h, 5), bodyMat);
      tendril.position.set(Math.cos(a)*0.18*w, 1.52*h, Math.sin(a)*0.18*w);
      tendril.rotation.z = Math.cos(a)*0.5; tendril.rotation.x = Math.sin(a)*0.5;
      g.add(tendril);
    }
  }
  if (type === 'specter') {
    // Semi-transparent wing-like appendages
    const wingMat = new THREE.MeshStandardMaterial({ color:0x00ff99, transparent:true, opacity:0.35, side:THREE.DoubleSide });
    for (let s2 = -1; s2 <= 1; s2+=2) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.6*w, 0.7*h, 0.02), wingMat);
      wing.position.set(s2*0.5*w, 0.9*h, 0.05);
      wing.rotation.y = s2*0.3;
      g.add(wing);
    }
  }
  if (type === 'colossus') {
    // Shoulder armour plates
    for (let s2 = -1; s2 <= 1; s2+=2) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28*w, 0.22*h, 0.32*w), bodyMat);
      plate.position.set(s2*0.42*w, 1.1*h, 0);
      g.add(plate);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06*w, 0.38*h, 6), boneMat);
      horn.position.set(s2*0.34*w, 1.32*h, 0); horn.rotation.z = s2*0.5;
      g.add(horn);
    }
  }
  if (type === 'hive') {
    // Antenna pair
    for (let s2 = -1; s2 <= 1; s2+=2) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015*w, 0.015*w, 0.36*h, 5), bodyMat);
      ant.position.set(s2*0.1*w, 1.62*h, 0); ant.rotation.z = s2*0.25;
      g.add(ant);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.04*w, 6, 6), eyeMat);
      ball.position.set(s2*0.12*w, 1.82*h, 0); g.add(ball);
    }
  }

  // ── Arms ───────────────────────────────────────────────────────────────────
  for (let s2 = -1; s2 <= 1; s2+=2) {
    const ua = new THREE.Mesh(new THREE.CylinderGeometry(0.07*w, 0.06*w, 0.36*h, 6), bodyMat);
    ua.position.set(s2*0.3*w, 0.88*h, 0); ua.rotation.z = s2*0.3;
    g.add(ua);
    const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.055*w, 0.04*w, 0.32*h, 6), darkMat);
    fa.position.set(s2*0.38*w, 0.64*h, 0.03); fa.rotation.x = 0.15;
    g.add(fa);
    // Claw
    for (let f = 0; f < 3; f++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.025*w, 0.15*h, 4), boneMat);
      claw.position.set(s2*(0.4+(f-1)*0.04)*w, 0.46*h, -0.05+f*0.05); claw.rotation.x = 0.7;
      g.add(claw);
    }
  }

  // ── Legs ───────────────────────────────────────────────────────────────────
  for (let s2 = -1; s2 <= 1; s2+=2) {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09*w, 0.075*w, 0.38*h, 6), bodyMat);
    thigh.position.set(s2*0.14*w, 0.5*h, 0); g.add(thigh);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.065*w, 0.045*w, 0.35*h, 6), darkMat);
    shin.position.set(s2*0.15*w, 0.22*h, 0.03); g.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1*w, 0.07*h, 0.2*w), boneMat);
    foot.position.set(s2*0.15*w, 0.04*h, 0.04); g.add(foot);
  }

  return g;
}

export function createEnemies(scene, count, options = {}) {
  const enemies = [];
  // Cycle through all 5 alien operator types
  const typeKeys = ['ravager', 'broodmother', 'specter', 'colossus', 'hive'];

  for (let i = 0; i < count; i++) {
    const type = typeKeys[i % typeKeys.length];
    const cfg  = ENEMY_CONFIGS[type];
    const mesh = buildBody(type, cfg);

    const angle  = (Math.PI*2/count)*i + (Math.random()-0.5)*1.2;
    const spread = 8 + Math.random()*10;
    const baseZ  = options.side === 'alien' ? 20 : -26;
    mesh.position.set(
      Math.cos(angle)*spread*0.7, 0,
      baseZ + Math.sin(angle)*spread*0.5
    );
    scene.add(mesh);

    enemies.push({
      id: i, mesh, type, config: cfg,
      health: cfg.health, maxHealth: cfg.health,
      speed: cfg.speed + Math.random()*0.5,
      damage: cfg.damage, alive: true,
      lastAttack: 0, stunned: false, stunTime: 0,
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