// Web Audio API Sound Manager for COVENANT: RECURSION
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.5;
    this.initialized = false;
  }
  
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Resume immediately — browsers require this after user gesture
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not available:', e);
      this.enabled = false;
    }
  }
  
  play(soundName, variant) {
    if (!this.enabled) return;
    // Always try to init on first play (called after user gesture)
    if (!this.initialized) this.init();
    if (!this.ctx) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => this._playSound(soundName, variant)).catch(() => {});
      return;
    }
    this._playSound(soundName, variant);
  }

  _playSound(soundName, variant) {
    try {
      switch (soundName) {
        case 'shoot':
          this.playShoot(variant);
          break;
        case 'reload':
          this.playReload();
          break;
        case 'hit':
          this.playHit();
          break;
        case 'kill':
          this.playKill();
          break;
        case 'wallHit':
          this.playWallHit();
          break;
        case 'playerHit':
          this.playPlayerHit();
          break;
        case 'death':
          this.playDeath();
          break;
        case 'footstep':
          this.playFootstep();
          break;
        case 'ability':
          this.playAbility();
          break;
        default:
          break;
      }
    } catch (e) {
      // Silently fail for audio
    }
  }
  
  playShoot(weaponType) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const noise = this.createNoise(0.08);
    
    osc.connect(gain);
    noise.gainNode.connect(gain);
    gain.connect(this.ctx.destination);
    
    // Different sounds per weapon
    switch (weaponType) {
      case 'rifle':
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        break;
      case 'shotgun':
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(this.volume * 0.6, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        break;
      case 'smg':
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
        break;
      case 'sniper':
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(this.volume * 0.7, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        break;
      default: // pistol
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    }
    
    osc.type = 'sawtooth';
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.3);
  }
  
  playReload() {
    // Mechanical click sounds
    const times = [0, 0.3, 0.6, 0.9];
    times.forEach(t => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + t + 0.05);
      gain.gain.setValueAtTime(this.volume * 0.2, this.ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + t + 0.05);
      osc.type = 'square';
      osc.start(this.ctx.currentTime + t);
      osc.stop(this.ctx.currentTime + t + 0.1);
    });
  }
  
  playHit() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.type = 'sine';
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.15);
  }
  
  playKill() {
    // Kill confirmation - higher pitched ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1600, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.type = 'sine';
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.3);
  }
  
  playWallHit() {
    const noise = this.createNoise(0.05);
    noise.gainNode.connect(this.ctx.destination);
  }
  
  playPlayerHit() {
    // Low thud + pain indicator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(60, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.type = 'sine';
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.25);
  }
  
  playDeath() {
    // Low rumble death sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(40, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(15, this.ctx.currentTime + 1);
    gain.gain.setValueAtTime(this.volume * 0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1);
    osc.type = 'sawtooth';
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 1.2);
  }
  
  playFootstep() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(100 + Math.random() * 50, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(this.volume * 0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
    osc.type = 'sine';
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.05);
  }
  
  playAbility() {
    // Sci-fi ability activation
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(2000, this.ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    osc.type = 'sine';
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.6);
  }
  
  createNoise(duration) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    source.connect(gainNode);
    source.start(this.ctx.currentTime);
    return { source, gainNode };
  }
  
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
  
  dispose() {
    if (this.ctx) {
      this.ctx.close();
    }
  }
}