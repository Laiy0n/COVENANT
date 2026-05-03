import * as THREE from 'three';

// ── Shared geometries per type (created once, reused by all instances) ──
const _geoCache = {};
const _matCache = {};

function getSharedGeo(type, scale) {
  if (_geoCache[type]) return _geoCache[type];
  // IcosahedronGeometry detail 1 = 80 faces (was detail 2 = 320 faces per enemy)
  const geo = new THREE.IcosahedronGeometry(scale * 0.6, 1);
  const pos = geo.attributes.position;
  for (let j = 0; j < pos.count; j++) {
    const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j);
    const n = Math.sin(x * 4 + j) * Math.cos(y * 3) * 0.1;
    pos.setXYZ(j, x * (1 + n), y * (1 + n * 0.5), z * (1 + n));
  }
  geo.computeVertexNormals();
  _geoCache[type] = geo;
  return geo;
}

function getSharedBodyMat(color, emissive) {
  const key = `${color}_${emissive}`;
  if (_matCache[key]) return _matCache[key];
  // MeshLambertMaterial: no PBR specular calc — 2-3× faster than MeshStandard
  const mat = new THREE.MeshLambertMaterial({
    color,
    emissive,
    emissiveIntensity: 0.6,
  });
  _matCache[key] = mat;
  return mat;
}

const EYE_GEO = new THREE.SphereGeometry(0.07, 6, 6); // shared across all enemies
const EYE_MAT = new THREE.MeshBasicMaterial({ color: 0xff0000 });

const ENEMY_TYPES = {
  crawler: { color: 0x5a2a5a, emissive: 0x330033, scale: 0.7, speed: 4.4, health: 50,  damage: 12, legs: 6 },
  spitter: { color: 0x1a5a1a, emissive: 0x003300, scale: 1.0, speed: 2.8, health: 80,  damage: 18, legs: 3 },
  brute:   { color: 0x5a1a1a, emissive: 0x440000, scale: 1.5, speed: 1.6, health: 180, damage: 35, legs: 4 },
};

// Shared leg geometry per type (keyed by type+legs)
const _legGeoCache = {};

export function createEnemies(scene, count) {
  const enemies = [];
  const typeList = ['crawler', 'crawler', 'spitter', 'spitter', 'brute'];

  for (let i = 0; i < count; i++) {
    const type = typeList[i % typeList.length];
    const cfg  = ENEMY_TYPES[type];

    const group = new THREE.Group();

    // Body — shared geometry, shared material per type
    const body = new THREE.Mesh(getSharedGeo(type, cfg.scale), getSharedBodyMat(cfg.color, cfg.emissive));
    group.add(body);

    // Eyes — shared geo + mat
    const e1 = new THREE.Mesh(EYE_GEO, EYE_MAT);
    e1.position.set(-0.14 * cfg.scale, 0.2 * cfg.scale, -0.38 * cfg.scale);
    group.add(e1);
    const e2 = new THREE.Mesh(EYE_GEO, EYE_MAT);
    e2.position.set( 0.14 * cfg.scale, 0.2 * cfg.scale, -0.38 * cfg.scale);
    group.add(e2);

    // Legs — shared geometry per type
    const legKey = `${type}_${cfg.legs}`;
    if (!_legGeoCache[legKey]) {
      _legGeoCache[legKey] = new THREE.ConeGeometry(0.04 * cfg.scale, 0.55 * cfg.scale, 5);
    }
    const legMat = getSharedBodyMat(cfg.color, cfg.emissive); // reuse body mat
    for (let l = 0; l < cfg.legs; l++) {
      const a = (Math.PI * 2 / cfg.legs) * l;
      const leg = new THREE.Mesh(_legGeoCache[legKey], legMat);
      leg.position.set(Math.cos(a) * 0.33 * cfg.scale, -0.3 * cfg.scale, Math.sin(a) * 0.33 * cfg.scale);
      leg.rotation.z = Math.cos(a) * 0.4;
      leg.rotation.x = Math.sin(a) * 0.4;
      group.add(leg);
    }

    // Spawn — spread out, away from player start
    const angle = (Math.PI * 2 / count) * i + 0.3;
    const dist  = 20 + (i % 5) * 5;
    group.position.set(
      Math.cos(angle) * dist,
      type === 'crawler' ? 0.8 : 1.5,
      Math.sin(angle) * dist - 8
    );

    scene.add(group);

    enemies.push({
      id: i,
      mesh: group,
      type,
      health:    cfg.health,
      maxHealth: cfg.health,
      speed:     cfg.speed + (i % 3) * 0.3, // deterministic spread, no Math.random
      damage:    cfg.damage,
      alive:     true,
      lastAttack: 0,
      stunned:   false,
      stunTime:  0,
      target:    null,
    });
  }

  return enemies;
}