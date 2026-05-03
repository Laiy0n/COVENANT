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
    this.sensitivity = 0.002;
    
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
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // FIX 1: Increased exposure from 0.8 to 1.4 for much brighter scene
    this.renderer.toneMappingExposure = 1.4;
    this.container.appendChild(this.renderer.domElement);
    
    this.setupLighting();
    this.mapObjects = createMap(this.scene);
    this.createHeart();
    this.enemies = createEnemies(this.scene, 5);
    
    // Initialize weapon system
    this.weaponSystem = new WeaponSystem(this.scene, this.camera, this.operator);
    
    this.setupControls();
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Start round timer
    this.startRound();
    this.animate();
  }
  
  setupLighting() {
    // FIX 1: Significantly brighter ambient light
    const ambient = new THREE.AmbientLight(0x8899cc, 1.8);
    this.scene.add(ambient);
    
    // FIX 1: Stronger directional light
    const dirLight = new THREE.DirectionalLight(0xaabbff, 1.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // FIX 1: Add a second fill light from opposite direction
    const fillLight = new THREE.DirectionalLight(0x334466, 0.8);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);
    
    // Emergency red lights - increased intensity
    const redPositions = [[10, 3, 0], [-10, 3, 10], [15, 3, -15], [-15, 3, 20]];
    redPositions.forEach(pos => {
      const light = new THREE.PointLight(0xff2222, 3.0, 20);
      light.position.set(...pos);
      this.scene.add(light);
    });
    
    // Cyan tech lights - increased intensity and range
    const cyanPositions = [[0, 4, -15], [0, 4, 15], [-20, 4, 0], [20, 4, 0]];
    cyanPositions.forEach(pos => {
      const light = new THREE.PointLight(0x00e5ff, 3.0, 25);
      light.position.set(...pos);
      this.scene.add(light);
    });
    
    // Heart glow
    this.heartLight = new THREE.PointLight(0xff4444, 4, 30);
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
    heartMesh.castShadow = true;
    heartMesh.userData = { type: 'heart' };
    heartGroup.add(heartMesh);
    this.heartMesh = heartMesh;
    
    // Tendrils
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 3, -20),
        new THREE.Vector3(Math.cos(angle) * 5, 2 + Math.random() * 3, -20 + Math.sin(angle) * 5),
        new THREE.Vector3(Math.cos(angle) * 12, 0.5 + Math.random() * 2, -20 + Math.sin(angle) * 12),
      ]);
      
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.2 + Math.random() * 0.4, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x6b1515,
        roughness: 0.8,
        emissive: 0x220000,
        emissiveIntensity: 0.3
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.castShadow = true;
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
      this.isLocked = document.pointerLockElement === this.container;
      if (this.onStateUpdate) this.onStateUpdate({ locked: this.isLocked });
    };
    this._onMouseMove = (e) => {
      if (!this.isLocked) return;
      const sens = this.player.isADS ? this.sensitivity * 0.5 : this.sensitivity;
      this.player.rotation.y -= e.movementX * sens;
      this.player.rotation.x -= e.movementY * sens;
      this.player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.rotation.x));
    };
    this._onKeyDown = (e) => {
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
    const flash = new THREE.PointLight(0xffaa00, 5, 5);
    flash.position.copy(this.camera.position);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    flash.position.add(dir.multiplyScalar(0.5));
    this.scene.add(flash);
    setTimeout(() => this.scene.remove(flash), 40);
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
  
  checkCollision(position) {
    const playerRadius = 0.4;
    for (const obj of this.mapObjects) {
      if (!obj.userData || !obj.userData.isWall) continue;
      const box = new THREE.Box3().setFromObject(obj);
      const playerBox = new THREE.Box3(
        new THREE.Vector3(position.x - playerRadius, 0, position.z - playerRadius),
        new THREE.Vector3(position.x + playerRadius, 2, position.z + playerRadius)
      );
      if (box.intersectsBox(playerBox)) return true;
    }
    return false;
  }
  
  updateEnemyAI(delta) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      
      // Stun check
      if (enemy.stunned) {
        enemy.stunTime -= delta;
        if (enemy.stunTime <= 0) enemy.stunned = false;
        continue;
      }
      
      // Phantom ability - enemies lose player
      if (this.operator?.id === 'phantom' && this.abilityActive) continue;
      
      const dir = new THREE.Vector3().subVectors(this.player.position, enemy.mesh.position).normalize();
      const dist = enemy.mesh.position.distanceTo(this.player.position);
      
      if (dist > 2.5) {
        const moveSpeed = enemy.speed * delta;
        const newPos = enemy.mesh.position.clone().add(dir.clone().multiplyScalar(moveSpeed));
        enemy.mesh.position.copy(newPos);
        enemy.mesh.lookAt(this.player.position);
      } else {
        // Attack
        const currentTime = this.clock.getElapsedTime();
        if (!enemy.lastAttack || currentTime - enemy.lastAttack > 1.0) {
          enemy.lastAttack = currentTime;
          
          // Damage calc with armor
          let damage = enemy.damage;
          if (this.player.armor > 0) {
            const armorAbsorb = Math.min(damage * 0.6, this.player.armor);
            this.player.armor -= armorAbsorb;
            damage -= armorAbsorb;
          }
          this.player.health -= damage;
          
          // Damage indicator
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
      
      // Animate
      enemy.mesh.position.y = (enemy.type === 'crawler' ? 0.8 : 1.5) + Math.sin(this.clock.getElapsedTime() * 3 + enemy.id) * 0.15;
    }
    
    const aliveCount = this.enemies.filter(e => e.alive).length;
    this.gameState.enemiesAlive = aliveCount;
    
    if (aliveCount === 0 && !this.gameState.gameOver) {
      this.gameState.wave++;
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
      damageIndicators: this.damageIndicators
    });
  }
  
  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    const delta = Math.min(this.clock.getDelta(), 0.1);
    
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
    
    this.updateHUD();
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