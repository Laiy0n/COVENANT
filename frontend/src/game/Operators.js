// COVENANT: RECURSION - Operator/Character definitions
export const OPERATORS = [
  {
    id: 'vanguard',
    name: 'VANGUARD',
    role: 'Assault',
    description: 'Front-line attacker with speed boost and flash capability',
    ability: {
      name: 'Overdrive',
      description: 'Speed boost + stun nearby enemies for 3s',
      cooldown: 25,
      icon: 'zap'
    },
    stats: {
      health: 100,
      armor: 40,
      speed: 1.1
    },
    weapons: ['rifle', 'pistol', 'smg'],
    color: '#00E5FF'
  },
  {
    id: 'sentinel',
    name: 'SENTINEL',
    role: 'Defender',
    description: 'Heavy defender who can deploy energy shield walls',
    ability: {
      name: 'Barrier Protocol',
      description: 'Deploy energy shield wall for 8s',
      cooldown: 30,
      icon: 'shield'
    },
    stats: {
      health: 130,
      armor: 70,
      speed: 0.85
    },
    weapons: ['shotgun', 'pistol', 'smg'],
    color: '#39FF14'
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    role: 'Stealth',
    description: 'Invisible operative who can bypass enemy detection',
    ability: {
      name: 'Void Cloak',
      description: 'Become invisible to enemies for 4s',
      cooldown: 20,
      icon: 'eye-off'
    },
    stats: {
      health: 85,
      armor: 30,
      speed: 1.15
    },
    weapons: ['smg', 'pistol', 'sniper'],
    color: '#9B59B6'
  },
  {
    id: 'medic',
    name: 'PATCH',
    role: 'Support',
    description: 'Field medic who can instantly heal and restore armor',
    ability: {
      name: 'Emergency Protocol',
      description: 'Restore full health and armor instantly',
      cooldown: 35,
      icon: 'heart'
    },
    stats: {
      health: 100,
      armor: 50,
      speed: 1.0
    },
    weapons: ['rifle', 'pistol', 'shotgun'],
    color: '#FFB800'
  },
  {
    id: 'hacker',
    name: 'CIPHER',
    role: 'Intel',
    description: 'Cyber specialist who reveals enemy positions through walls',
    ability: {
      name: 'Neural Scan',
      description: 'Reveal all enemies through walls for 6s',
      cooldown: 22,
      icon: 'scan'
    },
    stats: {
      health: 90,
      armor: 40,
      speed: 1.0
    },
    weapons: ['smg', 'pistol', 'rifle'],
    color: '#FF2A2A'
  }
];

export function getOperator(id) {
  return OPERATORS.find(op => op.id === id) || OPERATORS[0];
}

// ── Alien / Covenant operators ────────────────────────────────────────────────
export const ALIEN_OPERATORS = [
  {
    id: 'ravager',
    name: 'RAVAGER',
    role: 'Predator',
    team: 'alien',
    description: 'The apex hunter. Charges at targets with explosive speed, leaving a trail of acidic blood.',
    ability: {
      name: 'Blood Charge',
      description: 'Dash forward dealing 40 damage to anything in path. Leaves acid pools.',
      cooldown: 18,
      icon: 'zap'
    },
    stats: { health: 120, armor: 20, speed: 1.3 },
    weapons: ['bloodSpit', 'acidBurst', 'clawSlash'],
    color: '#FF2A6D'
  },
  {
    id: 'broodmother',
    name: 'BROODMOTHER',
    role: 'Support',
    team: 'alien',
    description: 'The Heart\'s herald. Heals nearby allies and temporarily boosts their speed.',
    ability: {
      name: 'Pulse of the Heart',
      description: 'Emit a pulse that heals nearby aliens for 40HP and boosts speed for 5s.',
      cooldown: 30,
      icon: 'heart'
    },
    stats: { health: 100, armor: 40, speed: 0.9 },
    weapons: ['bloodSpit', 'tendrilWhip', 'bloodSpit'],
    color: '#CC00FF'
  },
  {
    id: 'specter',
    name: 'SPECTER',
    role: 'Infiltrator',
    team: 'alien',
    description: 'Phase-shifts through cover. Near-invisible when standing still.',
    ability: {
      name: 'Phase Veil',
      description: 'Become invisible when stationary. Lasts until you move or attack.',
      cooldown: 20,
      icon: 'eye-off'
    },
    stats: { health: 80, armor: 10, speed: 1.2 },
    weapons: ['bloodSpit', 'bloodSpit', 'acidBurst'],
    color: '#00FF99'
  },
  {
    id: 'colossus',
    name: 'COLOSSUS',
    role: 'Tank',
    team: 'alien',
    description: 'Massive bio-armored brute. Absorbs enormous damage and can destroy the planted device instantly.',
    ability: {
      name: 'Carapace',
      description: 'Harden exoskeleton for 6s: take 75% less damage and become immune to stun.',
      cooldown: 35,
      icon: 'shield'
    },
    stats: { health: 200, armor: 80, speed: 0.75 },
    weapons: ['bloodSpit', 'acidBurst', 'bloodSpit'],
    color: '#FF6600'
  },
  {
    id: 'hive',
    name: 'HIVE',
    role: 'Recon',
    team: 'alien',
    description: 'Hive-mind scout. Sends a swarm pulse that reveals all enemies through walls for 8s.',
    ability: {
      name: 'Swarm Sense',
      description: 'Ping all humans through walls for 8s. Allies can see them too.',
      cooldown: 22,
      icon: 'scan'
    },
    stats: { health: 85, armor: 15, speed: 1.1 },
    weapons: ['bloodSpit', 'bloodSpit', 'acidBurst'],
    color: '#FFEE00'
  }
];

export function getAlienOperator(id) {
  return ALIEN_OPERATORS.find(o => o.id === id) || ALIEN_OPERATORS[0];
}