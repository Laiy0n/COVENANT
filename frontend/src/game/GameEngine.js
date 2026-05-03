import * as THREE from 'three';
import { createMap } from './Map';
import { createEnemies } from './Enemies';
import { WeaponSystem } from './Weapons';
import { SoundManager } from './SoundManager';

export class GameEngine {
  constructor(container, onStateUpdate, config = {}) {
    this.container = container;
    this.onStateUpdate = onStateUpdate;
    this.config = config;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.enemies = [];
    this.heartMesh = null;
    this.mapObjects = [];
    this.isLocked = false;
    this.animationId = null;
    this.sounds = new SoundManager();
    
    // FIX 2: Hit effects tracked in main loop instead of individual RAF loops
    this.hitEffects = [];
    
    // Player state - R6 Siege style
    this.player = {
      position: new THREE.Vector3(0, 1.6, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
      health: 100,
      maxHealth: 100,
      armor: 50,
      maxArmor: 50,
      kills: 0,
      deaths: 0,
      isAlive: true,
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      isSprinting: false,
      isCrouching: false,
      isLeaning: 0, // -1 left, 0 none, 1 right
      isADS: false, // aim down sights
      leanAngle: 0,
      crouchHeight: 1.6,
      targetCrouchHeight: 1.6,
      headBob: 0,
      stepTimer: 0
    };
    
    // Game state
    this.gameState = {
      heartHealth: 1000,
      heartMaxHealth: 1000,
      enemiesAlive: 0,
      wave: 1,
      gameOver: false,
      winner: null,
      round: 1,
      maxRounds: 5,
      roundTime: 180,
      roundTimeLeft: 180,
      roundActive: false,
      score: { humans: 0, aliens: 0 },
      mode: config.mode || 'singleplayer'
    };
    
    // Weapon system
    this.weaponSystem = null;
    
    // Damage indicators
    this.damageIndicators = [];
    
    this.raycaster = new THREE.Raycaster();
    // Read sensitivity from SettingsPanel localStorage
    const savedSens = parseFloat(localStorage.getItem('covenantSettings') && JSON.parse(localStorage.getItem('covenantSettings')).sensitivity || 20);
    this.sensitivity = (savedSens / 100) * 0.004; // 5→0.0002 … 100→0.004

    // ── Pre-allocated scratch vectors (NEVER new THREE.Vector3 inside loops) ──
    this._fwd    = new THREE.Vector3();  // movement forward
    this._right  = new THREE.Vector3();  // movement right
    this._dir    = new THREE.Vector3();  // movement direction
    this._newPos = new THREE.Vector3();  // candidate position
    this._lean   = new THREE.Vector3();  // lean offset
    this._axis   = new THREE.Vector3(0, 1, 0); // constant Y axis
    this._eDir   = new THREE.Vector3();  // enemy→player direction
    this._eMove  = new THREE.Vector3();  // enemy movement delta
    this._pBox   = new THREE.Box3();     // player collision box (reused)
    
    // HUD throttle: only push React state updates ~15x/s instead of 60x/s
    this._hudTimer = 0;
    this._hudInterval = 1 / 15;
    // Cache wall bounding boxes to avoid recreating Box3 every frame
    this._wallBoxCache = null;
    
    // Character/operator abilities
    this.operator = config.operator || null;
    this.abilityCharge = 100;
    this.abilityActive = false;
    this.abilityCooldown = 0;
    
    this.init();
  }
  
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050508);
    this.scene.fog = new THREE.Fog(0x050508, 25, 70);
    
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.copy(this.player.position);
    
    // Load saved settings
    let _cfg = {};
    try { _cfg = JSON.parse(localStorage.getItem('covenantSettings') || '{}'); } catch {}
    const _brightness  = _cfg.brightness  ?? 60;
    const _shadows     = _cfg.shadows     ?? false;
    const _antialias   = _cfg.antialiasing ?? true;

    this.renderer = new THREE.WebGLRenderer({ antialias: _antialias, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = _shadows;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6 + (_brightness / 100) * 1.6; // 10→0.76 … 100→2.2
    this.container.appendChild(this.renderer.domElement);
    
    this.setupLighting();
    this.mapObjects = createMap(this.scene);
    this.createHeart();
    this.enemies = createEnemies(this.scene, 5);
    
    // Camera must be in the scene so weapon meshes (children of camera) render
    this.scene.add(this.camera);

    // Initialize weapon system
    this.weaponSystem = new WeaponSystem(this.scene, this.camera, this.operator);
    
    // Single reusable muzzle flash light — toggled on/off instead of creating new each shot
    this.muzzleFlash = new THREE.PointLight(0xffaa00, 0, 6);
    this.scene.add(this.muzzleFlash);
    this._muzzleTimeout = null;
    
    this.setupControls();
    // Pre-cache all wall bounding boxes so checkCollision doesn't allocate every frame
    this._wallBoxCache = this.mapObjects
      .filter(o => o.userData?.isWall)
      .map(o => ({ box: new THREE.Box3().setFromObject(o) }));
    
    this._onResize = this.onResize.bind(this); window.addEventListener('resize', this._onResize);
    
    // Start round timer
    this.startRound();
    this.animate();
  }
  
  setupLighting() {
    // Map.js now owns all scene-wide lighting (ambient + directional + accent points).
    // Engine only adds the heart-reactive glow light here to keep it in sync with
    // gameState.heartHealth in updateHeart().
    this.heartLight = new THREE.PointLight(0xff4444, 5, 35);
    this.heartLight.position.set(0, 3, -20);
    this.scene.add(this.heartLight);
  }
  
  createHeart() {
    const heartGroup = new THREE.Group();
    
    const heartGeo = new THREE.SphereGeometry(3, 32, 32);
    const positions = heartGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const noise = Math.sin(x * 3) * Math.cos(y * 2) * Math.sin(z * 4) * 0.5;
      positions.setX(i, x + noise * 0.3);
      positions.setY(i, y + noise * 0.2);
      positions.setZ(i, z + noise * 0.3);
    }
    
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0x8b2020,
      roughness: 0.6,
      metalness: 0.2,
      emissive: 0x330000,
      emissiveIntensity: 0.5
    });
    
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.position.set(0, 3, -20);
    heartMesh.userData = { type: 'heart' };
    heartGroup.add(heartMesh);
    this.heartMesh = heartMesh;
    
    // Tendrils — reduced to 6, simpler tube (8 segments instead of 20, 6-sided instead of 8)
    // Shared material for all tendrils = 1 draw call vs 10
    const tubeMat = new THREE.MeshLambertMaterial({ color: 0x6b1515, emissive: 0x220000 });
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 3, -20),
        new THREE.Vector3(Math.cos(angle) * 4, 2 + Math.random() * 2, -20 + Math.sin(angle) * 4),
        new THREE.Vector3(Math.cos(angle) * 10, 0.5, -20 + Math.sin(angle) * 10),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 8, 0.25, 6, false);
      heartGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
    }
    
    this.scene.add(heartGroup);
    this.heartGroup = heartGroup;
  }
  
  setupControls() {
    this._onClick = () => {
      if (!this.isLocked) this.container.requestPointerLock();
    };
    this._onPointerLockChange = () => {
      // Only update internal isLocked flag; GameView owns the React state
      this.isLocked = document.pointerLockElement === this.container;
    };
    this._onMouseMove = (e) => {
      if (!this.isLocked) return;
      const sens = this.player.isADS ? this.sensitivity * 0.5 : this.sensitivity;
      this.player.rotation.y -= e.movementX * sens;
      this.player.rotation.x -= e.movementY * sens;
      this.player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.rotation.x));
    };
    this._onKeyDown = (e) => {
      if (e.code === 'Escape') {
        if (document.pointerLockElement) document.exitPointerLock();
        // GameView listens to pointerlockchange and handles pause itself
        return;
      }
      if (!this.isLocked) return;
      switch (e.code) {
        case 'KeyW': this.player.moveForward = true; break;
        case 'KeyS': this.player.moveBackward = true; break;
        case 'KeyA': this.player.moveLeft = true; break;
        case 'KeyD': this.player.moveRight = true; break;
        case 'ShiftLeft': this.player.isSprinting = true; break;
        case 'KeyC':
        case 'ControlLeft':
          this.player.isCrouching = !this.player.isCrouching;
          this.player.targetCrouchHeight = this.player.isCrouching ? 1.0 : 1.6;
          break;
        case 'KeyQ': this.player.isLeaning = -1; break;
        case 'KeyE': this.player.isLeaning = 1; break;
        case 'KeyR': this.reload(); break;
        case 'Digit1': this.weaponSystem?.switchWeapon(0); break;
        case 'Digit2': this.weaponSystem?.switchWeapon(1); break;
        case 'Digit3': this.weaponSystem?.switchWeapon(2); break;
        case 'KeyF': this.useAbility(); break;
        default: break;
      }
    };
    this._onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': this.player.moveForward = false; break;
        case 'KeyS': this.player.moveBackward = false; break;
        case 'KeyA': this.player.moveLeft = false; break;
        case 'KeyD': this.player.moveRight = false; break;
        case 'ShiftLeft': this.player.isSprinting = false; break;
        case 'KeyQ': if (this.player.isLeaning === -1) this.player.isLeaning = 0; break;
        case 'KeyE': if (this.player.isLeaning === 1) this.player.isLeaning = 0; break;
        default: break;
      }
    };
    this._onMouseDown = (e) => {
      if (!this.isLocked || !this.player.isAlive) return;
      if (e.button === 0) this.shoot();
      if (e.button === 2) {
        this.player.isADS = true;
        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();
      }
    };
    this._onMouseUp = (e) => {
      if (e.button === 2) {
        this.player.isADS = false;
        this.camera.fov = 75;
        this.camera.updateProjectionMatrix();
      }
    };
    this._onContextMenu = (e) => e.preventDefault();
    this._onWheel = (e) => {
      if (!this.isLocked) return;
      if (e.deltaY > 0) this.weaponSystem?.nextWeapon();
      else this.weaponSystem?.prevWeapon();
    };

    this.container.addEventListener('click', this._onClick);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    this.container.addEventListener('contextmenu', this._onContextMenu);
    document.addEventListener('wheel', this._onWheel);
  }
  
  shoot() {
    if (!this.weaponSystem) return;
    if (!this.weaponSystem.canShoot()) return;
    
    const weapon = this.weaponSystem.getCurrentWeapon();
    if (!weapon || weapon.ammo <= 0 || weapon.isReloading) return;
    
    weapon.ammo--;
    this.sounds.play('shoot', weapon.type);
    this.weaponSystem.playShootAnimation();
    
    // Apply recoil
    this.player.rotation.x -= weapon.recoil * (this.player.isADS ? 0.5 : 1);
    
    // Raycasting with spread
    const spread = this.player.isADS ? weapon.spread * 0.3 : weapon.spread;
    const spreadX = (Math.random() - 0.5) * spread;
    const spreadY = (Math.random() - 0.5) * spread;
    
    const direction = new THREE.Vector2(spreadX, spreadY);
    this.raycaster.setFromCamera(direction, this.camera);
    
    const enemyMeshes = this.enemies.filter(e => e.alive).map(e => e.mesh);
    const heartMeshes = this.heartMesh ? [this.heartMesh] : [];
    const allTargets = [...enemyMeshes, ...heartMeshes, ...this.mapObjects];
    
    const intersects = this.raycaster.intersectObjects(allTargets, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitObj = hit.object;
      
      // Check enemy hit
      const enemy = this.enemies.find(e => {
        if (!e.alive) return false;
        let obj = hitObj;
        while (obj) {
          if (obj === e.mesh) return true;
          obj = obj.parent;
        }
        return false;
      });
      
      if (enemy) {
        const damage = weapon.damage * (this.player.isADS ? 1.2 : 1);
        enemy.health -= damage;
        this.createHitEffect(hit.point, 0xff0000);
        this.sounds.play('hit');
        
        if (enemy.health <= 0) {
          enemy.alive = false;
          enemy.mesh.visible = false;
          this.player.kills++;
          this.sounds.play('kill');
        }
      } else if (hitObj.userData && hitObj.userData.type === 'heart') {
        this.gameState.heartHealth -= weapon.damage;
        this.createHitEffect(hit.point, 0xff4444);
        this.sounds.play('hit');
        
        if (this.gameState.heartHealth <= 0) {
          this.gameState.heartHealth = 0;
          this.winRound('humans');
        }
      } else {
        // Hit wall - spark effect
        this.createHitEffect(hit.point, 0xffaa00);
        this.sounds.play('wallHit');
      }
    }
    
    this.createMuzzleFlash();
    this.updateHUD();
  }
  
  reload() {
    if (!this.weaponSystem) return;
    const weapon = this.weaponSystem.getCurrentWeapon();
    if (!weapon || weapon.ammo === weapon.maxAmmo || weapon.isReloading) return;
    
    weapon.isReloading = true;
    this.sounds.play('reload');
    
    setTimeout(() => {
      weapon.ammo = weapon.maxAmmo;
      weapon.isReloading = false;
      this.updateHUD();
    }, weapon.reloadTime);
    
    this.updateHUD();
  }
  
  useAbility() {
    if (!this.operator || this.abilityCharge < 100 || this.abilityActive) return;
    
    this.abilityActive = true;
    this.abilityCharge = 0;
    this.sounds.play('ability');
    
    switch (this.operator.id) {
      case 'vanguard':
        // Speed boost + flash nearby enemies
        this.player.isSprinting = true;
        this.enemies.forEach(e => {
          if (e.alive && e.mesh.position.distanceTo(this.player.position) < 10) {
            e.stunned = true;
            e.stunTime = 3;
          }
        });
        setTimeout(() => { this.abilityActive = false; }, 5000);
        break;
        
      case 'sentinel':
        // Deploy shield wall
        this.deployShield();
        setTimeout(() => { this.abilityActive = false; }, 8000);
        break;
        
      case 'phantom':
        // Temporary invisibility - enemies lose target
        this.enemies.forEach(e => { e.target = null; });
        setTimeout(() => { this.abilityActive = false; }, 4000);
        break;
        
      case 'medic':
        // Heal to full
        this.player.health = this.player.maxHealth;
        this.player.armor = this.player.maxArmor;
        setTimeout(() => { this.abilityActive = false; }, 1000);
        break;
        
      case 'hacker':
        // Reveal enemies through walls (handled in render)
        setTimeout(() => { this.abilityActive = false; }, 6000);
        break;
        
      default:
        this.abilityActive = false;
    }
    
    this.updateHUD();
  }
  
  deployShield() {
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
    const shieldPos = this.player.position.clone().add(forward.multiplyScalar(2));
    
    const shieldGeo = new THREE.BoxGeometry(3, 2.5, 0.2);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.4,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.3
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.copy(shieldPos);
    shield.position.y = 1.25;
    shield.rotation.y = this.player.rotation.y;
    shield.userData = { isWall: true };
    this.scene.add(shield);
    this.mapObjects.push(shield);
    
    setTimeout(() => {
      this.scene.remove(shield);
      const idx = this.mapObjects.indexOf(shield);
      if (idx > -1) this.mapObjects.splice(idx, 1);
    }, 8000);
  }
  
  // FIX 2: Hit effects are now added to an array and updated in the main game loop.
  // Previously each hit created its own requestAnimationFrame loop that was never
  // cleaned up, causing hundreds of parallel RAF loops and massive FPS loss.
  createHitEffect(position, color) {
    const geo = new THREE.SphereGeometry(0.12, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.hitEffects.push({ mesh, geo, mat, elapsed: 0, duration: 0.3 });
  }

  // FIX 2: Called once per frame from animate() to update all active hit effects
  updateHitEffects(delta) {
    for (let i = this.hitEffects.length - 1; i >= 0; i--) {
      const fx = this.hitEffects[i];
      fx.elapsed += delta;
      if (fx.elapsed >= fx.duration) {
        this.scene.remove(fx.mesh);
        fx.geo.dispose();
        fx.mat.dispose();
        this.hitEffects.splice(i, 1);
      } else {
        fx.mat.opacity = 1 - (fx.elapsed / fx.duration);
        fx.mesh.scale.setScalar(1 + fx.elapsed * 3);
      }
    }
  }
  
  createMuzzleFlash() {
    // Reuse the single muzzle light — never allocates new objects
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.muzzleFlash.position.copy(this.camera.position).addScaledVector(dir, 0.5);
    this.muzzleFlash.intensity = 5;
    if (this._muzzleTimeout) clearTimeout(this._muzzleTimeout);
    this._muzzleTimeout = setTimeout(() => { this.muzzleFlash.intensity = 0; }, 40);
  }
  
  updateMovement(delta) {
    if (!this.player.isAlive) return;

    // R6 Siege speed tiers
    let speed = 5.5;
    if (this.player.isSprinting && !this.player.isADS) speed = 9;
    if (this.player.isCrouching) speed = 3;
    if (this.player.isADS)       speed = 3.5;
    if (this.operator?.id === 'vanguard' && this.abilityActive) speed *= 1.5;

    // ── Zero-allocation movement using pre-allocated scratch vectors ──
    this._fwd.set(0, 0, -1).applyAxisAngle(this._axis, this.player.rotation.y);
    this._right.set(1, 0, 0).applyAxisAngle(this._axis, this.player.rotation.y);
    this._dir.set(0, 0, 0);

    if (this.player.moveForward)  this._dir.add(this._fwd);
    if (this.player.moveBackward) this._dir.sub(this._fwd);
    if (this.player.moveRight)    this._dir.add(this._right);
    if (this.player.moveLeft)     this._dir.sub(this._right);

    const prevStep = this.player.stepTimer;
    if (this._dir.lengthSq() > 0) {
      this._dir.normalize();
      this._newPos.copy(this.player.position).addScaledVector(this._dir, speed * delta);

      if (!this.checkCollision(this._newPos)) {
        this.player.position.copy(this._newPos);
      }

      this.player.stepTimer += delta * speed * 0.5;
      this.player.headBob = Math.sin(this.player.stepTimer * 2) * (this.player.isSprinting ? 0.06 : 0.03);

      if (Math.floor(this.player.stepTimer) !== Math.floor(prevStep)) {
        this.sounds.play('footstep');
      }
    } else {
      this.player.headBob *= 0.9;
    }

    // Smooth crouch
    this.player.crouchHeight += (this.player.targetCrouchHeight - this.player.crouchHeight) * delta * 10;
    this.player.position.y = this.player.crouchHeight + this.player.headBob;

    // ── R6-style lean: pronounced angle + lateral offset + soft-cap rotation + speed penalty ──
    const isLeaning = this.player.isLeaning !== 0;
    const targetLean = this.player.isLeaning * 0.22;
    this.player.leanAngle += (targetLean - this.player.leanAngle) * delta * 10;
    if (isLeaning) speed = Math.min(speed, 3.5);
    if (isLeaning) {
      if (!this.player.leanBaseY) this.player.leanBaseY = this.player.rotation.y;
      const maxLeanRot = Math.PI / 3;
      const rotDelta = this.player.rotation.y - this.player.leanBaseY;
      if (Math.abs(rotDelta) > maxLeanRot)
        this.player.rotation.y = this.player.leanBaseY + Math.sign(rotDelta) * maxLeanRot;
    } else {
      this.player.leanBaseY = null;
    }

    // Update camera (zero allocations)
    this.camera.position.copy(this.player.position);
    this._lean.set(this.player.leanAngle * 2.5, this.player.leanAngle * -0.08, 0)
      .applyAxisAngle(this._axis, this.player.rotation.y);
    this.camera.position.add(this._lean);
    this.camera.rotation.set(this.player.rotation.x, this.player.rotation.y, this.player.leanAngle, 'YXZ');
  }
  
  checkCollision(position) {
    // Reuse pre-allocated Box3 — zero allocations per call
    const r = 0.4;
    this._pBox.min.set(position.x - r, 0,         position.z - r);
    this._pBox.max.set(position.x + r, 2, position.z + r);
    if (!this._wallBoxCache) return false;
    for (const { box } of this._wallBoxCache) {
      if (box.intersectsBox(this._pBox)) return true;
    }
    return false;
  }
  
  updateEnemyAI(delta) {
    const now = this.clock.getElapsedTime();
    const isPhantom = this.operator?.id === 'phantom' && this.abilityActive;
    let aliveCount = 0;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      aliveCount++;

      if (enemy.stunned) {
        enemy.stunTime -= delta;
        if (enemy.stunTime <= 0) enemy.stunned = false;
        continue;
      }
      if (isPhantom) continue;

      // ── Zero-allocation direction + distance ──
      this._eDir.subVectors(this.player.position, enemy.mesh.position);
      const dist = this._eDir.length();
      this._eDir.divideScalar(dist); // manual normalize avoids sqrt twice

      if (dist > 2.5) {
        // ── Zero-allocation move: reuse _eMove ──
        this._eMove.copy(this._eDir).multiplyScalar(enemy.speed * delta);
        enemy.mesh.position.add(this._eMove);
        enemy.mesh.lookAt(this.player.position);
      } else {
        if (now - (enemy.lastAttack || 0) > 1.0) {
          enemy.lastAttack = now;
          let damage = enemy.damage;
          if (this.player.armor > 0) {
            const absorb = Math.min(damage * 0.6, this.player.armor);
            this.player.armor -= absorb;
            damage -= absorb;
          }
          this.player.health -= damage;
          this.addDamageIndicator(enemy.mesh.position);
          this.sounds.play('playerHit');
          if (this.onStateUpdate) this.onStateUpdate({ damaged: true });
          if (this.player.health <= 0) {
            this.player.health = 0;
            this.player.isAlive = false;
            this.player.deaths++;
            this.sounds.play('death');
            this.winRound('aliens');
          }
        }
      }

      // Animate bob (cheap — no allocation)
      enemy.mesh.position.y = (enemy.type === 'crawler' ? 0.8 : 1.5) + Math.sin(now * 3 + enemy.id) * 0.15;
    }

    this.gameState.enemiesAlive = aliveCount;

    if (aliveCount === 0 && !this.gameState.gameOver) {
      this.gameState.wave++;
      this.enemies = this.enemies.filter(e => {
        if (!e.alive) { this.scene.remove(e.mesh); return false; }
        return true;
      });
      const newEnemies = createEnemies(this.scene, Math.min(12, 3 + this.gameState.wave * 2));
      this.enemies.push(...newEnemies);
    }
  }
  
  addDamageIndicator(sourcePos) {
    const angle = Math.atan2(
      sourcePos.x - this.player.position.x,
      sourcePos.z - this.player.position.z
    ) - this.player.rotation.y;
    
    this.damageIndicators.push({
      angle: angle,
      time: 2.0,
      intensity: 1.0
    });
  }
  
  updateDamageIndicators(delta) {
    this.damageIndicators = this.damageIndicators.filter(ind => {
      ind.time -= delta;
      ind.intensity = ind.time / 2.0;
      return ind.time > 0;
    });
  }
  
  updateHeart(delta) {
    if (!this.heartMesh) return;
    const scale = 1 + Math.sin(this.clock.getElapsedTime() * 2) * 0.05;
    this.heartMesh.scale.setScalar(scale);
    
    const healthRatio = this.gameState.heartHealth / this.gameState.heartMaxHealth;
    if (this.heartLight) {
      this.heartLight.intensity = 4 + (1 - healthRatio) * 5;
    }
    this.heartMesh.material.emissiveIntensity = 0.5 + (1 - healthRatio) * 1.5;
  }
  
  startRound() {
    if (this.roundInterval) clearInterval(this.roundInterval);
    this.gameState.roundActive = true;
    this.gameState.roundTimeLeft = this.gameState.roundTime;
    this.roundInterval = setInterval(() => {
      if (this.gameState.roundActive && !this.gameState.gameOver) {
        this.gameState.roundTimeLeft--;
        if (this.gameState.roundTimeLeft <= 0) {
          this.winRound('aliens'); // Time's up, aliens win
        }
        this.updateHUD();
      }
    }, 1000);
  }
  
  winRound(winner) {
    this.gameState.roundActive = false;
    this.gameState.score[winner]++;
    
    if (this.gameState.score[winner] >= Math.ceil(this.gameState.maxRounds / 2)) {
      this.gameState.gameOver = true;
      this.gameState.winner = winner;
      // FIX 3: Release pointer lock when game is over so the player can click
      // the "Redeploy" / "Main Menu" buttons without needing to press ESC first
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } else {
      // Next round after delay
      setTimeout(() => this.nextRound(), 3000);
    }
    this.updateHUD();
  }
  
  nextRound() {
    this.gameState.round++;
    this.gameState.heartHealth = this.gameState.heartMaxHealth;
    this.player.health = this.player.maxHealth;
    this.player.armor = this.player.maxArmor;
    this.player.isAlive = true;
    this.player.position.set(0, 1.6, 0);
    this.abilityCharge = 100;
    
    // Reset enemies
    for (const enemy of this.enemies) {
      this.scene.remove(enemy.mesh);
    }
    this.enemies = createEnemies(this.scene, 5 + this.gameState.round);
    this.gameState.wave = 1;
    
    // Reload weapons
    if (this.weaponSystem) this.weaponSystem.reloadAll();
    
    this.gameState.roundActive = true;
    this.gameState.roundTimeLeft = this.gameState.roundTime;
    this.updateHUD();
  }
  
  updateAbility(delta) {
    if (this.abilityCharge < 100 && !this.abilityActive) {
      this.abilityCharge = Math.min(100, this.abilityCharge + delta * 5); // Recharge over 20s
    }
  }
  
  updateHUD() {
    if (!this.onStateUpdate) return;
    const weapon = this.weaponSystem?.getCurrentWeapon();
    this.onStateUpdate({
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      armor: this.player.armor,
      maxArmor: this.player.maxArmor,
      ammo: weapon?.ammo || 0,
      maxAmmo: weapon?.maxAmmo || 0,
      weaponName: weapon?.name || 'None',
      weaponType: weapon?.type || 'rifle',
      isReloading: weapon?.isReloading || false,
      kills: this.player.kills,
      deaths: this.player.deaths,
      heartHealth: this.gameState.heartHealth,
      heartMaxHealth: this.gameState.heartMaxHealth,
      enemiesAlive: this.gameState.enemiesAlive,
      wave: this.gameState.wave,
      gameOver: this.gameState.gameOver,
      winner: this.gameState.winner,
      isAlive: this.player.isAlive,
      round: this.gameState.round,
      maxRounds: this.gameState.maxRounds,
      roundTimeLeft: this.gameState.roundTimeLeft,
      score: this.gameState.score,
      isCrouching: this.player.isCrouching,
      isADS: this.player.isADS,
      isSprinting: this.player.isSprinting,
      leaning: this.player.isLeaning,
      abilityCharge: this.abilityCharge,
      abilityActive: this.abilityActive,
      operatorId: this.operator?.id,
      damageIndicators: this.damageIndicators,
      fps: this._fps || 0
    });
  }
  
  updateSettings(settings) {
    // Called by SettingsPanel in real-time via engineRef.current.updateSettings(settings)
    if (settings.sensitivity !== undefined) {
      this.sensitivity = (settings.sensitivity / 100) * 0.004;
    }
    if (settings.brightness !== undefined) {
      this.renderer.toneMappingExposure = 0.6 + (settings.brightness / 100) * 1.6;
    }
    if (settings.fov !== undefined) {
      this.camera.fov = settings.fov;
      this.camera.updateProjectionMatrix();
    }
    if (settings.volume !== undefined && this.sounds) {
      this.sounds.setVolume(settings.volume / 100);
    }
    if (settings.shadows !== undefined) {
      this.renderer.shadowMap.enabled = settings.shadows;
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // FPS counter — updates once per second
    this._fpsFrames = (this._fpsFrames || 0) + 1;
    this._fpsTimer  = (this._fpsTimer  || 0) + delta;
    if (this._fpsTimer >= 1.0) {
      this._fps = Math.round(this._fpsFrames / this._fpsTimer);
      this._fpsFrames = 0;
      this._fpsTimer  = 0;
    }
    
    if (this.isLocked && !this.gameState.gameOver) {
      this.updateMovement(delta);
      this.updateEnemyAI(delta);
      this.updateHeart(delta);
      this.updateDamageIndicators(delta);
      this.updateAbility(delta);
      this.weaponSystem?.update(delta);
      
      // Hacker ability - outline enemies
      if (this.operator?.id === 'hacker' && this.abilityActive) {
        this.enemies.forEach(e => {
          if (e.alive && e.mesh.children[0]) {
            e.mesh.children[0].material.emissiveIntensity = 2;
          }
        });
      }
    }
    
    // FIX 2: Update hit effects every frame in the main loop (not separate RAF loops)
    this.updateHitEffects(delta);
    
    // FIX: Throttle HUD updates to ~15/s to avoid 60 React re-renders/second
    this._hudTimer += delta;
    if (this._hudTimer >= this._hudInterval) {
      this._hudTimer = 0;
      this.updateHUD();
    }
    this.renderer.render(this.scene, this.camera);
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.roundInterval) clearInterval(this.roundInterval);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    
    // Remove all stored event listeners
    if (this._onClick) this.container.removeEventListener('click', this._onClick);
    if (this._onPointerLockChange) document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    if (this._onMouseMove) document.removeEventListener('mousemove', this._onMouseMove);
    if (this._onKeyDown) document.removeEventListener('keydown', this._onKeyDown);
    if (this._onKeyUp) document.removeEventListener('keyup', this._onKeyUp);
    if (this._onMouseDown) document.removeEventListener('mousedown', this._onMouseDown);
    if (this._onMouseUp) document.removeEventListener('mouseup', this._onMouseUp);
    if (this._onContextMenu) this.container.removeEventListener('contextmenu', this._onContextMenu);
    if (this._onWheel) document.removeEventListener('wheel', this._onWheel);

    if (this._muzzleTimeout) clearTimeout(this._muzzleTimeout);
    if (this.muzzleFlash) { this.scene.remove(this.muzzleFlash); this.muzzleFlash = null; }

    // Clean up any remaining hit effects
    for (const fx of this.hitEffects) {
      this.scene.remove(fx.mesh);
      fx.geo.dispose();
      fx.mat.dispose();
    }
    this.hitEffects = [];

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
    this.sounds.dispose();
  }
  
  restart() {
    if (this.roundInterval) clearInterval(this.roundInterval);
    this.player.health = this.player.maxHealth;
    this.player.armor = this.player.maxArmor;
    this.player.kills = 0;
    this.player.deaths = 0;
    this.player.isAlive = true;
    this.player.position.set(0, 1.6, 0);
    this.gameState.heartHealth = this.gameState.heartMaxHealth;
    this.gameState.gameOver = false;
    this.gameState.winner = null;
    this.gameState.wave = 1;
    this.gameState.round = 1;
    this.gameState.score = { humans: 0, aliens: 0 };
    this.abilityCharge = 100;
    this.abilityActive = false;

    // Clean up any remaining hit effects on restart
    for (const fx of this.hitEffects) {
      this.scene.remove(fx.mesh);
      fx.geo.dispose();
      fx.mat.dispose();
    }
    this.hitEffects = [];
    
    for (const enemy of this.enemies) this.scene.remove(enemy.mesh);
    this.enemies = createEnemies(this.scene, 5);
    if (this.weaponSystem) this.weaponSystem.reloadAll();
    this.startRound();
    this.updateHUD();
  }
}