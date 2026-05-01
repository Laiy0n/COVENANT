import * as THREE from 'three';
import { createMap } from './Map';
import { createEnemies, updateEnemies } from './Enemies';

export class GameEngine {
  constructor(container, onStateUpdate) {
    this.container = container;
    this.onStateUpdate = onStateUpdate;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.enemies = [];
    this.bullets = [];
    this.heartMesh = null;
    this.mapObjects = [];
    this.isLocked = false;
    this.animationId = null;
    
    // Player state
    this.player = {
      position: new THREE.Vector3(0, 1.6, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
      health: 100,
      ammo: 30,
      maxAmmo: 30,
      kills: 0,
      isAlive: true,
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      isSprinting: false
    };
    
    // Game state
    this.gameState = {
      heartHealth: 1000,
      heartMaxHealth: 1000,
      enemiesAlive: 0,
      wave: 1,
      gameOver: false,
      winner: null
    };
    
    this.raycaster = new THREE.Raycaster();
    this.mouseMovement = { x: 0, y: 0 };
    this.sensitivity = 0.002;
    
    this.init();
  }
  
  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050508);
    this.scene.fog = new THREE.Fog(0x050508, 20, 60);
    
    // Camera (FPS)
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.copy(this.player.position);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.container.appendChild(this.renderer.domElement);
    
    // Lighting
    this.setupLighting();
    
    // Map
    this.mapObjects = createMap(this.scene);
    
    // Heart (objective)
    this.createHeart();
    
    // Enemies
    this.enemies = createEnemies(this.scene, 5);
    
    // Event listeners
    this.setupControls();
    
    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Start loop
    this.animate();
  }
  
  setupLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x1a1a2e, 0.4);
    this.scene.add(ambient);
    
    // Main directional light (simulating ship emergency lights)
    const dirLight = new THREE.DirectionalLight(0x4466ff, 0.3);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);
    
    // Red emergency lights
    const redLight1 = new THREE.PointLight(0xff2222, 1.5, 15);
    redLight1.position.set(10, 3, 0);
    this.scene.add(redLight1);
    
    const redLight2 = new THREE.PointLight(0xff2222, 1.5, 15);
    redLight2.position.set(-10, 3, 10);
    this.scene.add(redLight2);
    
    // Cyan tech lights
    const cyanLight = new THREE.PointLight(0x00e5ff, 2, 20);
    cyanLight.position.set(0, 4, -15);
    this.scene.add(cyanLight);
    
    // Heart glow
    const heartLight = new THREE.PointLight(0xff4444, 3, 25);
    heartLight.position.set(0, 3, -20);
    this.scene.add(heartLight);
    this.heartLight = heartLight;
  }
  
  createHeart() {
    // The Heart - flesh monster objective
    const heartGroup = new THREE.Group();
    
    // Main body
    const heartGeo = new THREE.SphereGeometry(3, 32, 32);
    // Distort vertices for organic look
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
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 3, -20),
        new THREE.Vector3(Math.cos(angle) * 5, 2 + Math.random() * 3, -20 + Math.sin(angle) * 5),
        new THREE.Vector3(Math.cos(angle) * 10, 1 + Math.random() * 2, -20 + Math.sin(angle) * 10),
      ]);
      
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.3 + Math.random() * 0.3, 8, false);
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
    // Pointer lock
    this.container.addEventListener('click', () => {
      if (!this.isLocked) {
        this.container.requestPointerLock();
      }
    });
    
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.container;
      if (this.onStateUpdate) {
        this.onStateUpdate({ locked: this.isLocked });
      }
    });
    
    // Mouse move
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;
      this.player.rotation.y -= e.movementX * this.sensitivity;
      this.player.rotation.x -= e.movementY * this.sensitivity;
      this.player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.rotation.x));
    });
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!this.isLocked) return;
      switch (e.code) {
        case 'KeyW': this.player.moveForward = true; break;
        case 'KeyS': this.player.moveBackward = true; break;
        case 'KeyA': this.player.moveLeft = true; break;
        case 'KeyD': this.player.moveRight = true; break;
        case 'ShiftLeft': this.player.isSprinting = true; break;
        case 'KeyR': this.reload(); break;
        default: break;
      }
    });
    
    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.player.moveForward = false; break;
        case 'KeyS': this.player.moveBackward = false; break;
        case 'KeyA': this.player.moveLeft = false; break;
        case 'KeyD': this.player.moveRight = false; break;
        case 'ShiftLeft': this.player.isSprinting = false; break;
        default: break;
      }
    });
    
    // Shoot
    document.addEventListener('mousedown', (e) => {
      if (!this.isLocked || e.button !== 0) return;
      this.shoot();
    });
  }
  
  shoot() {
    if (this.player.ammo <= 0 || !this.player.isAlive) return;
    
    this.player.ammo--;
    
    // Raycasting from center of screen
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // Check hits against enemies
    const enemyMeshes = this.enemies.filter(e => e.alive).map(e => e.mesh);
    const heartMeshes = this.heartMesh ? [this.heartMesh] : [];
    const allTargets = [...enemyMeshes, ...heartMeshes];
    
    const intersects = this.raycaster.intersectObjects(allTargets, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitObj = hit.object;
      
      // Check if hit enemy
      const enemy = this.enemies.find(e => e.mesh === hitObj || (hitObj.parent && e.mesh === hitObj.parent));
      if (enemy && enemy.alive) {
        enemy.health -= 25;
        this.createHitEffect(hit.point, 0xff0000);
        if (enemy.health <= 0) {
          enemy.alive = false;
          enemy.mesh.visible = false;
          this.player.kills++;
        }
      }
      
      // Check if hit heart
      if (hitObj.userData && hitObj.userData.type === 'heart') {
        this.gameState.heartHealth -= 25;
        this.createHitEffect(hit.point, 0xff4444);
        if (this.gameState.heartHealth <= 0) {
          this.gameState.heartHealth = 0;
          this.gameState.gameOver = true;
          this.gameState.winner = 'humans';
        }
      }
    }
    
    // Muzzle flash effect
    this.createMuzzleFlash();
    
    this.updateHUD();
  }
  
  createHitEffect(position, color) {
    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    this.scene.add(mesh);
    
    // Fade out
    const startTime = this.clock.getElapsedTime();
    const animate = () => {
      const elapsed = this.clock.getElapsedTime() - startTime;
      if (elapsed > 0.3) {
        this.scene.remove(mesh);
        geo.dispose();
        mat.dispose();
        return;
      }
      mat.opacity = 1 - (elapsed / 0.3);
      mesh.scale.setScalar(1 + elapsed * 3);
      requestAnimationFrame(animate);
    };
    animate();
  }
  
  createMuzzleFlash() {
    const flash = new THREE.PointLight(0xffaa00, 3, 5);
    flash.position.copy(this.camera.position);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    flash.position.add(dir.multiplyScalar(1));
    this.scene.add(flash);
    
    setTimeout(() => {
      this.scene.remove(flash);
    }, 50);
  }
  
  reload() {
    this.player.ammo = this.player.maxAmmo;
    this.updateHUD();
  }
  
  updateMovement(delta) {
    if (!this.player.isAlive) return;
    
    const speed = this.player.isSprinting ? 12 : 7;
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
      
      // Simple collision detection with walls
      if (!this.checkCollision(newPos)) {
        this.player.position.copy(newPos);
      }
    }
    
    // Keep Y fixed (no jumping for now)
    this.player.position.y = 1.6;
    
    // Update camera
    this.camera.position.copy(this.player.position);
    this.camera.rotation.set(this.player.rotation.x, this.player.rotation.y, 0, 'YXZ');
  }
  
  checkCollision(position) {
    // Simple AABB collision with map objects
    const playerRadius = 0.5;
    
    for (const obj of this.mapObjects) {
      if (!obj.userData || !obj.userData.isWall) continue;
      
      const box = new THREE.Box3().setFromObject(obj);
      const playerBox = new THREE.Box3(
        new THREE.Vector3(position.x - playerRadius, 0, position.z - playerRadius),
        new THREE.Vector3(position.x + playerRadius, 2, position.z + playerRadius)
      );
      
      if (box.intersectsBox(playerBox)) {
        return true;
      }
    }
    return false;
  }
  
  updateEnemyAI(delta) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      
      // Move toward player
      const dir = new THREE.Vector3().subVectors(this.player.position, enemy.mesh.position).normalize();
      const dist = enemy.mesh.position.distanceTo(this.player.position);
      
      if (dist > 2.5) {
        enemy.mesh.position.add(dir.multiplyScalar(enemy.speed * delta));
        enemy.mesh.lookAt(this.player.position);
      } else {
        // Attack
        if (!enemy.lastAttack || this.clock.getElapsedTime() - enemy.lastAttack > 1.0) {
          enemy.lastAttack = this.clock.getElapsedTime();
          this.player.health -= enemy.damage;
          if (this.onStateUpdate) {
            this.onStateUpdate({ damaged: true });
          }
          if (this.player.health <= 0) {
            this.player.health = 0;
            this.player.isAlive = false;
            this.gameState.gameOver = true;
            this.gameState.winner = 'aliens';
          }
        }
      }
      
      // Animate enemy (bobbing)
      enemy.mesh.position.y = 1.5 + Math.sin(this.clock.getElapsedTime() * 3 + enemy.id) * 0.2;
    }
    
    // Check if all enemies dead - spawn more
    const aliveCount = this.enemies.filter(e => e.alive).length;
    this.gameState.enemiesAlive = aliveCount;
    
    if (aliveCount === 0 && !this.gameState.gameOver) {
      this.gameState.wave++;
      const newEnemies = createEnemies(this.scene, 3 + this.gameState.wave * 2);
      this.enemies.push(...newEnemies);
    }
  }
  
  updateHeart(delta) {
    if (!this.heartMesh) return;
    
    // Pulsing effect
    const scale = 1 + Math.sin(this.clock.getElapsedTime() * 2) * 0.05;
    this.heartMesh.scale.setScalar(scale);
    
    // Glow intensity based on health
    const healthRatio = this.gameState.heartHealth / this.gameState.heartMaxHealth;
    if (this.heartLight) {
      this.heartLight.intensity = 3 + (1 - healthRatio) * 5;
    }
    this.heartMesh.material.emissiveIntensity = 0.5 + (1 - healthRatio) * 1.5;
  }
  
  updateHUD() {
    if (this.onStateUpdate) {
      this.onStateUpdate({
        health: this.player.health,
        ammo: this.player.ammo,
        maxAmmo: this.player.maxAmmo,
        kills: this.player.kills,
        heartHealth: this.gameState.heartHealth,
        heartMaxHealth: this.gameState.heartMaxHealth,
        enemiesAlive: this.gameState.enemiesAlive,
        wave: this.gameState.wave,
        gameOver: this.gameState.gameOver,
        winner: this.gameState.winner,
        isAlive: this.player.isAlive
      });
    }
  }
  
  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    const delta = Math.min(this.clock.getDelta(), 0.1);
    
    if (this.isLocked && !this.gameState.gameOver) {
      this.updateMovement(delta);
      this.updateEnemyAI(delta);
      this.updateHeart(delta);
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
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize.bind(this));
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
  
  respawn() {
    this.player.health = 100;
    this.player.ammo = this.player.maxAmmo;
    this.player.isAlive = true;
    this.player.position.set(0, 1.6, 0);
    this.gameState.gameOver = false;
    this.gameState.winner = null;
    this.updateHUD();
  }
  
  restart() {
    // Reset everything
    this.player.health = 100;
    this.player.ammo = this.player.maxAmmo;
    this.player.kills = 0;
    this.player.isAlive = true;
    this.player.position.set(0, 1.6, 0);
    this.gameState.heartHealth = this.gameState.heartMaxHealth;
    this.gameState.gameOver = false;
    this.gameState.winner = null;
    this.gameState.wave = 1;
    this.gameState.enemiesAlive = 0;
    
    // Remove old enemies
    for (const enemy of this.enemies) {
      this.scene.remove(enemy.mesh);
    }
    this.enemies = createEnemies(this.scene, 5);
    this.updateHUD();
  }
}
