import * as THREE from 'three';
import { createMap, HEART_POSITION, PLANT_SITE_A, PLANT_SITE_B } from './Map';
import { getNextWaypoint } from './Pathfinding';
import { createEnemies, createProjectile, updateProjectiles } from './Enemies';
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
      position: new THREE.Vector3(0, 1.6, 32), // overridden in init() based on team
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
      warmupActive: false,   // CS-style freeze/prepare phase
      warmupTimeLeft: 0,
      score: { humans: 0, aliens: 0 },
      mode: config.mode || 'singleplayer',
      team: config.team || 'human'  // 'human' or 'alien'
    };
    
    // Weapon system
    this.weaponSystem = null;
    
    // Damage indicators
    this.damageIndicators = [];
    // Two plant sites
    this.activeSite = null;    // 'A' or 'B' — whichever player is planting
    this.plantSiteA = { progress:0, planted:false, timer:35, mesh:null };
    this.plantSiteB = { progress:0, planted:false, timer:35, mesh:null };
    // Plant mechanic (legacy single-site compat)
    this.plantProgress = 0;    // 0-100
    this.isPlanting    = false;
    this.plantKey      = false; // G key held (hold G near PLANT_POSITION)
    this.devicePlanted = false;
    this.deviceTimer   = 0;    // countdown after planted
    this.plantMesh     = null;
    // All projectiles from spitters
    this.allProjectiles = [];
    
    this.raycaster = new THREE.Raycaster();
    this.sensitivity = 0.002;
    
    // Rebindable keybinds — loaded once, refreshed via reloadKeybinds()
    this.keybinds = this.loadKeybinds();
    
    // HUD throttle: only push React state updates ~15x/s instead of 60x/s
    this._hudTimer = 0;
    this._hudInterval = 1 / 15;
    // FPS counter — tracked in engine, passed to HUD
    this._fpsFrames = 0;
    this._fpsTimer = 0;
    this._fps = 0;
    // Cache wall bounding boxes to avoid recreating Box3 every frame
    this._wallBoxCache = null;
    
    // Character/operator abilities
    this.team = config.team || 'human';
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
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = false; // shadows off = major FPS gain
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;
    // FIX: outputColorSpace constant only exists in Three.js r152+.
    // In r137–r151 the property exists but THREE.SRGBColorSpace is undefined,
    // so setting it directly would silently leave it as linear, causing
    // ACESFilmicToneMapping to output a near-black scene.
    // Using the string literal 'srgb' works across r137+ without needing the constant.
    if ('outputColorSpace' in this.renderer) {
      this.renderer.outputColorSpace = 'srgb';             // r137+
    } else {
      this.renderer.outputEncoding = THREE.sRGBEncoding;   // r136 and older
    }
    this.container.appendChild(this.renderer.domElement);
    // FIX: Force the canvas to fill its container correctly.
    // Without explicit CSS the canvas is inline-block, which can create
    // sub-pixel gaps and cause GPU compositing layers to occlude it (black screen).
    const cv = this.renderer.domElement;
    cv.style.display  = 'block';
    cv.style.position = 'absolute';
    cv.style.top      = '0';
    cv.style.left     = '0';
    // FIX: Camera must be added to the scene so its children (weapon model) render.
    this.scene.add(this.camera);
    
    // Set spawn position based on team
    if (this.team === 'alien') {
      this.player.position.set(0, 1.6, -36); // near heart
    } else {
      this.player.position.set(0, 1.6, 32);  // spawn side
    }
    this.camera.position.copy(this.player.position);

    this.setupLighting();
    this.mapObjects = createMap(this.scene);
    this.createHeart();
    this.enemies = createEnemies(this.scene, 5, { side: 'alien' });
    this.allies  = [];
    this.createAllyBots();
    
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
    
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Start round timer
    this.startRound();
    this.animate();
  }
  
  setupLighting() {
    // Strong ambient so no shadows needed
    const ambient = new THREE.AmbientLight(0x8899cc, 2.5);
    this.scene.add(ambient);

    // Two directional lights (cheap, no shadows)
    const dirLight = new THREE.DirectionalLight(0xaabbff, 1.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = false;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x334466, 1.0);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);

    // Only 2 point lights instead of 8 — huge FPS gain
    const redLight = new THREE.PointLight(0xff2222, 3.0, 40);
    redLight.position.set(0, 4, 0);
    this.scene.add(redLight);

    // Heart glow (single point light)
    this.heartLight = new THREE.PointLight(0xff4444, 4, 35);
    this.heartLight.position.set(HEART_POSITION.x, HEART_POSITION.y, HEART_POSITION.z);
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
    heartMesh.position.copy(HEART_POSITION); // use the canonical position from Map.js
    heartMesh.userData = { type: 'heart' };
    heartGroup.add(heartMesh);
    this.heartMesh = heartMesh;
    
    // Tendrils — all anchored at HEART_POSITION
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(HEART_POSITION.x, HEART_POSITION.y, HEART_POSITION.z),
        new THREE.Vector3(
          HEART_POSITION.x + Math.cos(angle) * 5,
          2 + Math.random() * 3,
          HEART_POSITION.z + Math.sin(angle) * 5
        ),
        new THREE.Vector3(
          HEART_POSITION.x + Math.cos(angle) * 12,
          0.5 + Math.random() * 2,
          HEART_POSITION.z + Math.sin(angle) * 12
        ),
      ]);
      
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.2 + Math.random() * 0.4, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x6b1515,
        roughness: 0.8,
        emissive: 0x220000,
        emissiveIntensity: 0.3
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      heartGroup.add(tube);
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
        return;
      }
      if (!this.isLocked) return;
      const kb = this.keybinds;
      if (e.code === kb.moveForward)  { this.player.moveForward  = true; return; }
      if (e.code === kb.moveBackward) { this.player.moveBackward = true; return; }
      if (e.code === kb.moveLeft)     { this.player.moveLeft     = true; return; }
      if (e.code === kb.moveRight)    { this.player.moveRight    = true; return; }
      if (e.code === kb.sprint)       { this.player.isSprinting  = true; return; }
      if (e.code === kb.crouch || e.code === 'ControlLeft') {
        this.player.isCrouching = !this.player.isCrouching;
        this.player.targetCrouchHeight = this.player.isCrouching ? 1.0 : 1.6;
        return;
      }
      if (e.code === kb.leanLeft)  { this.player.isLeaning = -1; return; }
      if (e.code === kb.leanRight) { this.player.isLeaning =  1; return; }
      if (e.code === kb.reload)    { this.reload();               return; }
      if (e.code === kb.ability)   { this.useAbility();           return; }
      if (e.code === kb.plant)     { this.plantKey = true;        return; }
      if (e.code === kb.weapon1)   { this.weaponSystem?.switchWeapon(0); return; }
      if (e.code === kb.weapon2)   { this.weaponSystem?.switchWeapon(1); return; }
      if (e.code === kb.weapon3)   { this.weaponSystem?.switchWeapon(2); return; }
    };
    this._onKeyUp = (e) => {
      const kb = this.keybinds;
      if (e.code === kb.moveForward)  { this.player.moveForward  = false; return; }
      if (e.code === kb.moveBackward) { this.player.moveBackward = false; return; }
      if (e.code === kb.moveLeft)     { this.player.moveLeft     = false; return; }
      if (e.code === kb.moveRight)    { this.player.moveRight    = false; return; }
      if (e.code === kb.sprint)       { this.player.isSprinting  = false; return; }
      if (e.code === kb.plant)        { this.plantKey = false; this.isPlanting = false; return; }
      if (e.code === kb.leanLeft  && this.player.isLeaning === -1) { this.player.isLeaning = 0; return; }
      if (e.code === kb.leanRight && this.player.isLeaning ===  1) { this.player.isLeaning = 0; return; }
    };
    this._onMouseDown = (e) => {
      if (!this.isLocked || !this.player.isAlive) return;
      if (e.button === 0) {
        if (this.team === 'alien') this.alienSpit();
        else this.shoot();
      }
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
  
  alienSpit() {
    const now = this.clock.getElapsedTime();
    if (!this._lastSpit) this._lastSpit = 0;
    if (now - this._lastSpit < 0.8) return; // 0.8s cooldown
    this._lastSpit = now;

    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const origin = this.camera.position.clone().addScaledVector(dir, 0.5);
    const proj = createProjectile(this.scene, origin, dir);
    proj.isAlienPlayer = true; // mark as player projectile (hurts enemies? no — hurts other humans in MP)
    this.allProjectiles.push(proj);
    this.createMuzzleFlash(); // reuse for visual feedback
    if (this.onStateUpdate) this.onStateUpdate({ alienSpit: true });
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
        // Heart is IMMUNE to bullets — must use the Neural Disruptor device [F]
        this.createHitEffect(hit.point, 0x440000); // dark hit effect to show it's immune
        // Flash a message
        if (this.onStateUpdate) this.onStateUpdate({ heartImmune: true });
        setTimeout(() => { if (this.onStateUpdate) this.onStateUpdate({ heartImmune: false }); }, 1500);
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
    
    // R6 Siege style speeds
    let speed = 5.5; // Base walk speed
    if (this.player.isSprinting && !this.player.isADS) speed = 9;
    if (this.player.isCrouching) speed = 3;
    if (this.player.isADS) speed = 3.5;
    
    // Vanguard speed boost
    if (this.operator?.id === 'vanguard' && this.abilityActive) speed *= 1.5;
    
    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
    
    if (this.player.moveForward) direction.add(forward);
    if (this.player.moveBackward) direction.sub(forward);
    if (this.player.moveRight) direction.add(right);
    if (this.player.moveLeft) direction.sub(right);
    
    if (direction.length() > 0) {
      direction.normalize();
      const newPos = this.player.position.clone().add(direction.multiplyScalar(speed * delta));
      
      if (!this.checkCollision(newPos)) {
        this.player.position.copy(newPos);
      }
      
      // Head bob
      this.player.stepTimer += delta * speed * 0.5;
      this.player.headBob = Math.sin(this.player.stepTimer * 2) * (this.player.isSprinting ? 0.06 : 0.03);
      
      // Footstep sounds
      if (Math.floor(this.player.stepTimer) !== Math.floor(this.player.stepTimer - delta * speed * 0.5)) {
        this.sounds.play('footstep');
      }
    } else {
      this.player.headBob *= 0.9;
    }
    
    // Smooth crouch
    this.player.crouchHeight += (this.player.targetCrouchHeight - this.player.crouchHeight) * delta * 10;
    this.player.position.y = this.player.crouchHeight + this.player.headBob;
    
    // Smooth lean
    const targetLean = this.player.isLeaning * 0.15;
    this.player.leanAngle += (targetLean - this.player.leanAngle) * delta * 12;
    
    // Update camera
    this.camera.position.copy(this.player.position);
    // Apply lean offset
    const leanOffset = new THREE.Vector3(this.player.leanAngle * 2, 0, 0)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
    this.camera.position.add(leanOffset);
    
    this.camera.rotation.set(this.player.rotation.x, this.player.rotation.y, this.player.leanAngle, 'YXZ');
  }
  
  checkCollision(position, radius = 0.4) {
    const box = new THREE.Box3(
      new THREE.Vector3(position.x - radius, 0,          position.z - radius),
      new THREE.Vector3(position.x + radius, 2, position.z + radius)
    );
    if (!this._wallBoxCache) return false;
    for (const { box: wb } of this._wallBoxCache) {
      if (wb.intersectsBox(box)) return true;
    }
    return false;
  }
  
  updateEnemyAI(delta) {
    // CS-style: enemies are frozen during the warmup/prepare phase
    if (this.gameState.warmupActive) return;

    const currentTime = this.clock.getElapsedTime();

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      if (enemy.stunned) {
        enemy.stunTime -= delta;
        if (enemy.stunTime <= 0) enemy.stunned = false;
        continue;
      }

      if (this.operator?.id === 'phantom' && this.abilityActive) continue;

      const dist = enemy.mesh.position.distanceTo(this.player.position);
      const dir  = new THREE.Vector3().subVectors(this.player.position, enemy.mesh.position).normalize();

      if (enemy.attackType === 'projectile') {
        // Spitter: keep distance, shoot blood balls
        if (dist > enemy.attackRange * 0.6) {
          const newPos = enemy.mesh.position.clone().addScaledVector(dir, enemy.speed * delta * 0.5);
          if (!this.checkCollision(newPos, 0.35)) enemy.mesh.position.copy(newPos);
        }
        enemy.mesh.lookAt(this.player.position);

        if (currentTime - enemy.lastAttack > (enemy.shootCooldown || 2.2) && dist < (enemy.attackRange || 20)) {
          // Line-of-sight check: only shoot if no wall between spitter and player
          const spitterOrigin = enemy.mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0));
          const toPlayer = new THREE.Vector3().subVectors(this.player.position, spitterOrigin);
          const losRay = new THREE.Raycaster(spitterOrigin, toPlayer.clone().normalize(), 0, toPlayer.length());
          const wallHits = losRay.intersectObjects(this.mapObjects, false);
          if (wallHits.length === 0) {
            // Clear line of sight — fire
            enemy.lastAttack = currentTime;
            const proj = createProjectile(this.scene, spitterOrigin, dir);
            enemy.projectiles.push(proj);
            this.allProjectiles.push(proj);
          }
        }
      } else {
        // Melee: charge at player
        if (dist > enemy.attackRange) {
          const newPos = enemy.mesh.position.clone().addScaledVector(dir, enemy.speed * delta);
          // Slide along walls: try X and Z separately if direct path blocked
          if (!this.checkCollision(newPos, 0.35)) {
            enemy.mesh.position.copy(newPos);
          } else {
            const slideX = new THREE.Vector3(newPos.x, enemy.mesh.position.y, enemy.mesh.position.z);
            const slideZ = new THREE.Vector3(enemy.mesh.position.x, enemy.mesh.position.y, newPos.z);
            if (!this.checkCollision(slideX, 0.35)) enemy.mesh.position.copy(slideX);
            else if (!this.checkCollision(slideZ, 0.35)) enemy.mesh.position.copy(slideZ);
          }
          enemy.mesh.lookAt(this.player.position);
        } else if (currentTime - enemy.lastAttack > 1.0) {
          enemy.lastAttack = currentTime;
          let damage = enemy.damage;
          if (this.player.armor > 0) {
            const abs = Math.min(damage * 0.6, this.player.armor);
            this.player.armor -= abs; damage -= abs;
          }
          this.player.health -= damage;
          this.addDamageIndicator(enemy.mesh.position);
          this.sounds.play('playerHit');
          if (this.onStateUpdate) this.onStateUpdate({ damaged: true });
          if (this.player.health <= 0) {
            this.player.health = 0; this.player.isAlive = false; this.player.deaths++;
            this.sounds.play('death'); this.winRound('aliens');
          }
        }
      }

      // Keep enemies on the ground with a subtle idle float
      enemy.mesh.position.y = Math.sin(currentTime * 2 + enemy.id) * 0.06;
    }

    // Update all projectiles and apply damage
    const projDmg = updateProjectiles(this.scene, this.allProjectiles, this.player.position, delta);
    if (projDmg > 0 && this.player.isAlive) {
      this.player.health = Math.max(0, this.player.health - projDmg);
      this.addDamageIndicator(this.player.position.clone().add(new THREE.Vector3(0,0,-5)));
      this.sounds.play('playerHit');
      if (this.onStateUpdate) this.onStateUpdate({ damaged: true });
      if (this.player.health <= 0) {
        this.player.isAlive = false; this.player.deaths++;
        this.winRound('aliens');
      }
    }
    this.allProjectiles = this.allProjectiles.filter(p => p.alive);

    const aliveCount = this.enemies.filter(e => e.alive).length;
    this.gameState.enemiesAlive = aliveCount;

    // R6-STYLE: all aliens dead → humans win round (NO new wave spawning)
    if (aliveCount === 0 && !this.gameState.gameOver && this.gameState.roundActive) {
      this.winRound('humans');
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

    // CS-style: 15-second prepare/freeze phase before the round goes live
    const WARMUP_SECONDS = 15;
    this.gameState.warmupActive   = true;
    this.gameState.warmupTimeLeft = WARMUP_SECONDS;
    this.gameState.roundActive    = false;
    this.gameState.roundTimeLeft  = this.gameState.roundTime;
    this.updateHUD();

    this.roundInterval = setInterval(() => {
      if (this.gameState.gameOver) return;

      // ── Warmup countdown ──────────────────────────────────────────
      if (this.gameState.warmupActive) {
        this.gameState.warmupTimeLeft--;
        if (this.gameState.warmupTimeLeft <= 0) {
          this.gameState.warmupActive = false;
          this.gameState.roundActive  = true;
        }
        this.updateHUD();
        return;
      }

      // ── Normal round timer ────────────────────────────────────────
      if (this.gameState.roundActive) {
        this.gameState.roundTimeLeft--;
        if (this.gameState.roundTimeLeft <= 0) {
          this.winRound('aliens'); // time's up — aliens win
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
    this.abilityCharge = 100;
    
    // Reset enemies
    for (const enemy of this.enemies) this.scene.remove(enemy.mesh);
    this.enemies = createEnemies(this.scene, 5, { side: 'alien' });

    // Reset ally bots
    for (const ally of this.allies) this.scene.remove(ally.mesh);
    this.allies = [];
    this.createAllyBots();

    this.gameState.wave = 1;
    this.plantProgress = 0;
    this.isPlanting = false;
    this.devicePlanted = false;
    this.deviceTimer = 0;
    if (this.plantMesh) { this.scene.remove(this.plantMesh); this.plantMesh = null; }
    this.allProjectiles = [];
    
    const spawnZ = this.team === 'alien' ? -36 : 32;
    this.player.position.set(0, 1.6, spawnZ);
    
    // Reload weapons
    if (this.weaponSystem) this.weaponSystem.reloadAll();

    // startRound handles warmup
    this.startRound();
  }
  
  // ── Keybinds ──────────────────────────────────────────────────────────────
  static get DEFAULT_KEYBINDS() {
    return {
      moveForward:  'KeyW',
      moveBackward: 'KeyS',
      moveLeft:     'KeyA',
      moveRight:    'KeyD',
      sprint:       'ShiftLeft',
      crouch:       'KeyC',
      leanLeft:     'KeyQ',
      leanRight:    'KeyE',
      reload:       'KeyR',
      ability:      'KeyF',
      plant:        'KeyG',
      weapon1:      'Digit1',
      weapon2:      'Digit2',
      weapon3:      'Digit3',
    };
  }

  loadKeybinds() {
    try {
      const saved = JSON.parse(localStorage.getItem('covenantKeyBindings') || '{}');
      return { ...GameEngine.DEFAULT_KEYBINDS, ...saved };
    } catch { return { ...GameEngine.DEFAULT_KEYBINDS }; }
  }

  // Call this from GameView after the settings panel closes so new binds take effect immediately
  reloadKeybinds() { this.keybinds = this.loadKeybinds(); }

  // Called from GameView's PauseMenu whenever a setting changes
  updateSettings(s) {
    if (!s) return;
    if (s.sensitivity !== undefined) {
      this.sensitivity = (s.sensitivity / 100) * 0.004;
    }
    if (s.fov !== undefined) {
      this.camera.fov = s.fov;
      this.camera.updateProjectionMatrix();
    }
    if (s.volume !== undefined && this.sounds) {
      this.sounds.setVolume(s.volume / 100);
    }
    if (s.brightness !== undefined) {
      // Map 10-100 → 0.5-2.5 exposure
      this.renderer.toneMappingExposure = 0.5 + (s.brightness / 100) * 2.0;
    }
  }

  // ── Allied bots ───────────────────────────────────────────────────────────
  createAllyBots() {
    const isAlienTeam = this.team === 'alien';
    const bodyColor   = isAlienTeam ? 0xaa1040 : 0x1a4a8a;
    const helmetColor = isAlienTeam ? 0x550020 : 0x0a2244;
    const spawnZ      = isAlienTeam ? -40 : 32;

    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const bMat = new THREE.MeshStandardMaterial({ color: bodyColor,   roughness: 0.6, metalness: 0.3 });
      const hMat = new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.5, metalness: 0.6 });

      // Torso
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.26), bMat),
        { position: new THREE.Vector3(0, 0.96, 0) }));
      // Head / helmet
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), hMat),
        { position: new THREE.Vector3(0, 1.45, 0) }));
      // Arms
      for (const s of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.42, 0.11), bMat);
        arm.position.set(s * 0.27, 0.88, 0);
        g.add(arm);
      }
      // Legs
      for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 0.16), bMat);
        leg.position.set(s * 0.1, 0.42, 0);
        g.add(leg);
      }

      // Stagger spawn so they don't overlap
      const angle = (Math.PI * 2 / 4) * i;
      g.position.set(Math.cos(angle) * 3, 0, spawnZ + Math.sin(angle) * 3);
      this.scene.add(g);

      this.allies.push({
        id: i, mesh: g,
        health: 100, maxHealth: 100,
        alive: true,
        lastShot: 0,
      });
    }
  }

  updateAllyAI(delta) {
    if (this.gameState.warmupActive || this.gameState.gameOver) return;
    const now = this.clock.getElapsedTime();

    for (const ally of this.allies) {
      if (!ally.alive) continue;

      // ── Find nearest living enemy ────────────────────────────────────────
      let nearest = null, nearestDist = Infinity;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = ally.mesh.position.distanceTo(e.mesh.position);
        if (d < nearestDist) { nearestDist = d; nearest = e; }
      }

      if (nearest && nearestDist < 22) {
        // ── Engage: face enemy, shoot every ~1.8s ───────────────────────────
        ally.mesh.lookAt(nearest.mesh.position.clone().setY(ally.mesh.position.y));
        if (now - ally.lastShot > 1.8) {
          ally.lastShot = now;
          nearest.health -= 22 + Math.random() * 10;
          this.createHitEffect(nearest.mesh.position.clone().setY(1.2), 0xff4400);
          if (nearest.health <= 0) {
            nearest.alive = false;
            nearest.mesh.visible = false;
            this.sounds.play('kill');
            this.player.kills++;
          }
        }
      } else {
        // ── Follow player in a loose formation ───────────────────────────────
        const formationOffset = new THREE.Vector3(
          Math.cos((Math.PI * 2 / 4) * ally.id) * 2.5,
          0,
          Math.sin((Math.PI * 2 / 4) * ally.id) * 2.5
        );
        const target  = this.player.position.clone().add(formationOffset);
        const distToTarget = ally.mesh.position.distanceTo(target);

        if (distToTarget > 1.5) {
          const moveDir = new THREE.Vector3().subVectors(target, ally.mesh.position).normalize();
          const newPos  = ally.mesh.position.clone().addScaledVector(moveDir, 4.5 * delta);
          newPos.y = 0;
          if (!this.checkCollision(newPos, 0.3)) ally.mesh.position.copy(newPos);
          ally.mesh.lookAt(target.clone().setY(ally.mesh.position.y));
        }
      }
      ally.mesh.position.y = 0; // keep on ground
    }
  }

  updateAbility(delta) {
    if (this.abilityCharge < 100 && !this.abilityActive) {
      this.abilityCharge = Math.min(100, this.abilityCharge + delta * 5); // Recharge over 20s
    }
  }
  

  updatePlant(delta) {
    if (!this.player.isAlive || this.gameState.gameOver) return;

    // ── Device countdown — must tick even after planting ──────────────────────
    if (this.devicePlanted) {
      this.deviceTimer -= delta;
      if (this.deviceTimer <= 0) {
        this.deviceTimer = 0;
        this.gameState.heartHealth = 0;
        this.winRound('humans');
      }
      return; // don't re-enter plant logic once planted
    }

    // Check proximity to each site
    const distA = this.player.position.distanceTo(new THREE.Vector3(PLANT_SITE_A.x, this.player.position.y, PLANT_SITE_A.z));
    const distB = this.player.position.distanceTo(new THREE.Vector3(PLANT_SITE_B.x, this.player.position.y, PLANT_SITE_B.z));
    const nearA = distA < 3.5 && !this.plantSiteA.planted;
    const nearB = distB < 3.5 && !this.plantSiteB.planted;
    const nearPlant = nearA || nearB;
    const activeSite = nearA ? this.plantSiteA : (nearB ? this.plantSiteB : null);
    const activeLetter = nearA ? 'A' : (nearB ? 'B' : null);

    const anyPlanted = this.plantSiteA.planted || this.plantSiteB.planted;
    if (this.plantKey && activeSite && !anyPlanted) {
      this.isPlanting = true;
      this.activeSite = activeLetter;
      activeSite.progress += (delta / 5.0) * 100; // 5 seconds to plant
      this.plantProgress = activeSite.progress;
      if (activeSite.progress >= 100) {
        activeSite.progress = 100;
        activeSite.planted = true;
        this.devicePlanted = true;  // compat
        this.isPlanting = false;
        this.deviceTimer = activeSite.timer;
        this._spawnPlantMesh(activeLetter === 'A' ? PLANT_SITE_A : PLANT_SITE_B);
        this.sounds.play('plant');
      }
    } else {
      this.isPlanting = false;
      if (activeSite && activeSite.progress > 0 && !this.plantKey) {
        activeSite.progress = Math.max(0, activeSite.progress - delta * 25);
        this.plantProgress = activeSite.progress;
      }
    }
  }

  _spawnPlantMesh(pos) {
    const geo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const mat = new THREE.MeshStandardMaterial({ color:0x00e5ff, emissive:0x00e5ff, emissiveIntensity:1.5 });
    const m   = new THREE.Mesh(geo, mat);
    m.position.set(pos.x, 0.3, pos.z);
    this.scene.add(m);
    if (!this.plantMesh) this.plantMesh = m; // keep first for compat
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
      fps: this._fps,
      plantProgress: this.plantProgress,
      isPlanting: this.isPlanting,
      devicePlanted: this.devicePlanted,
      deviceTimer: Math.ceil(this.deviceTimer),
      nearSiteA: !this.plantSiteA.planted && this.player.position.distanceTo(new THREE.Vector3(PLANT_SITE_A.x, this.player.position.y, PLANT_SITE_A.z)) < 3.5,
      nearSiteB: !this.plantSiteB.planted && this.player.position.distanceTo(new THREE.Vector3(PLANT_SITE_B.x, this.player.position.y, PLANT_SITE_B.z)) < 3.5,
      nearPlantZone: (!this.plantSiteA.planted && this.player.position.distanceTo(new THREE.Vector3(PLANT_SITE_A.x, this.player.position.y, PLANT_SITE_A.z)) < 3.5)
                  || (!this.plantSiteB.planted && this.player.position.distanceTo(new THREE.Vector3(PLANT_SITE_B.x, this.player.position.y, PLANT_SITE_B.z)) < 3.5),
      siteAPlanted: this.plantSiteA.planted,
      siteBPlanted: this.plantSiteB.planted,
      siteATimer: Math.ceil(this.plantSiteA.timer),
      siteBTimer: Math.ceil(this.plantSiteB.timer),
      activeSite: this.activeSite,
      heartImmune: false,
      team: this.team,
      warmupActive: this.gameState.warmupActive,
      warmupTimeLeft: this.gameState.warmupTimeLeft,
    });
  }
  
  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    const delta = Math.min(this.clock.getDelta(), 0.1);
    
    if (this.isLocked && !this.gameState.gameOver) {
      this.updateMovement(delta);
      this.updateEnemyAI(delta);
      this.updateAllyAI(delta);
      this.updateHeart(delta);
      this.updateDamageIndicators(delta);
      this.updateAbility(delta);
      this.updatePlant(delta);
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
    
    // Count frames for FPS display
    this._fpsFrames++;
    this._fpsTimer += delta;
    if (this._fpsTimer >= 1.0) {
      this._fps = this._fpsFrames;
      this._fpsFrames = 0;
      this._fpsTimer = 0;
    }

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
    window.removeEventListener('resize', this.onResize.bind(this));
    
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
    this.enemies = createEnemies(this.scene, 5, { side: 'alien' });
    for (const ally of this.allies) this.scene.remove(ally.mesh);
    this.allies = [];
    this.createAllyBots();
    this.plantProgress = 0;
    this.isPlanting = false;
    this.devicePlanted = false;
    this.deviceTimer = 0;
    if (this.plantMesh) { this.scene.remove(this.plantMesh); this.plantMesh = null; }
    this.allProjectiles = [];
    const spawnZ = this.team === 'alien' ? -36 : 32;
    this.player.position.set(0, 1.6, spawnZ);
    if (this.weaponSystem) this.weaponSystem.reloadAll();
    this.startRound();
    this.updateHUD();
  }
}