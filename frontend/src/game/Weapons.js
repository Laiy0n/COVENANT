import * as THREE from 'three';

const WEAPONS_DB = {
  rifle: {
    name: 'CR-7 Assault Rifle',
    type: 'rifle',
    damage: 28,
    fireRate: 0.1,
    ammo: 30,
    maxAmmo: 30,
    reloadTime: 2200,
    spread: 0.02,
    recoil: 0.012,
    range: 80,
    isReloading: false
  },
  shotgun: {
    name: 'SG-12 Breacher',
    type: 'shotgun',
    damage: 15, // per pellet, 8 pellets
    fireRate: 0.8,
    ammo: 8,
    maxAmmo: 8,
    reloadTime: 3000,
    spread: 0.08,
    recoil: 0.04,
    pellets: 8,
    range: 20,
    isReloading: false
  },
  smg: {
    name: 'V-9 Vector',
    type: 'smg',
    damage: 20,
    fireRate: 0.07,
    ammo: 35,
    maxAmmo: 35,
    reloadTime: 1800,
    spread: 0.03,
    recoil: 0.008,
    range: 50,
    isReloading: false
  },
  sniper: {
    name: 'LR-50 Longbow',
    type: 'sniper',
    damage: 90,
    fireRate: 1.5,
    ammo: 5,
    maxAmmo: 5,
    reloadTime: 3500,
    spread: 0.005,
    recoil: 0.05,
    range: 150,
    isReloading: false
  },
  pistol: {
    name: 'P-22 Sidearm',
    type: 'pistol',
    damage: 35,
    fireRate: 0.25,
    ammo: 12,
    maxAmmo: 12,
    reloadTime: 1500,
    spread: 0.025,
    recoil: 0.015,
    range: 40,
    isReloading: false
  }
};

// Operator weapon loadouts
const OPERATOR_LOADOUTS = {
  vanguard: ['rifle', 'pistol', 'smg'],
  sentinel: ['shotgun', 'pistol', 'smg'],
  phantom: ['smg', 'pistol', 'sniper'],
  medic: ['rifle', 'pistol', 'shotgun'],
  hacker: ['smg', 'pistol', 'rifle']
};

export class WeaponSystem {
  constructor(scene, camera, operator) {
    this.scene = scene;
    this.camera = camera;
    this.currentIndex = 0;
    this.lastShot = 0;
    this.weaponMesh = null;
    this.shootAnimTime = 0;
    
    // Load weapons based on operator
    const loadout = operator ? OPERATOR_LOADOUTS[operator.id] || ['rifle', 'pistol', 'shotgun'] : ['rifle', 'pistol', 'shotgun'];
    this.weapons = loadout.map(type => ({ ...WEAPONS_DB[type] }));
    
    this.createWeaponModel();
  }
  
  createWeaponModel() {
    if (this.weaponMesh) {
      this.camera.remove(this.weaponMesh);
    }
    
    const weapon = this.getCurrentWeapon();
    if (!weapon) return;
    
    const group = new THREE.Group();
    
    // Different models per weapon type
    let bodyGeo, color;
    switch (weapon.type) {
      case 'rifle':
        bodyGeo = new THREE.BoxGeometry(0.05, 0.06, 0.5);
        color = 0x3a3a4e;
        break;
      case 'shotgun':
        bodyGeo = new THREE.BoxGeometry(0.06, 0.07, 0.55);
        color = 0x4a3a2e;
        break;
      case 'smg':
        bodyGeo = new THREE.BoxGeometry(0.04, 0.05, 0.35);
        color = 0x2a3a4e;
        break;
      case 'sniper':
        bodyGeo = new THREE.BoxGeometry(0.04, 0.05, 0.7);
        color = 0x2a2a3e;
        break;
      case 'pistol':
        bodyGeo = new THREE.BoxGeometry(0.03, 0.08, 0.2);
        color = 0x3a3a3a;
        break;
      default:
        bodyGeo = new THREE.BoxGeometry(0.05, 0.06, 0.4);
        color = 0x3a3a4e;
    }
    
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    
    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -(weapon.type === 'sniper' ? 0.4 : 0.25);
    group.add(barrel);
    
    // Position in view
    group.position.set(0.2, -0.15, -0.4);
    group.rotation.y = Math.PI;
    
    this.camera.add(group);
    this.weaponMesh = group;
    // scene.add(camera) is done once in GameEngine.init() — not here
  }
  
  getCurrentWeapon() {
    return this.weapons[this.currentIndex] || null;
  }
  
  switchWeapon(index) {
    if (index >= 0 && index < this.weapons.length && index !== this.currentIndex) {
      this.currentIndex = index;
      this.createWeaponModel();
    }
  }
  
  nextWeapon() {
    this.switchWeapon((this.currentIndex + 1) % this.weapons.length);
  }
  
  prevWeapon() {
    this.switchWeapon((this.currentIndex - 1 + this.weapons.length) % this.weapons.length);
  }
  
  canShoot() {
    const weapon = this.getCurrentWeapon();
    if (!weapon || weapon.isReloading || weapon.ammo <= 0) return false;
    const now = performance.now() / 1000;
    return (now - this.lastShot) >= weapon.fireRate;
  }
  
  playShootAnimation() {
    this.shootAnimTime = 0.1;
    this.lastShot = performance.now() / 1000;
  }
  
  reloadAll() {
    this.weapons.forEach(w => {
      w.ammo = w.maxAmmo;
      w.isReloading = false;
    });
  }
  
  update(delta) {
    if (!this.weaponMesh) return;
    
    // Shoot animation (recoil kick)
    if (this.shootAnimTime > 0) {
      this.shootAnimTime -= delta;
      const kickBack = Math.max(0, this.shootAnimTime) * 0.5;
      this.weaponMesh.position.z = -0.4 + kickBack;
      this.weaponMesh.rotation.x = kickBack * 2;
    } else {
      // Idle sway
      const time = performance.now() / 1000;
      this.weaponMesh.position.x = 0.2 + Math.sin(time * 1.5) * 0.002;
      this.weaponMesh.position.y = -0.15 + Math.cos(time * 2) * 0.002;
      this.weaponMesh.position.z = -0.4;
      this.weaponMesh.rotation.x = 0;
    }
  }
}