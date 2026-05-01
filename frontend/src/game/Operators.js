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
