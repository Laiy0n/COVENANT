// ── Human Operators ──────────────────────────────────────────────────────────
export const OPERATORS = [
  {
    id: 'vanguard', name: 'VANGUARD', role: 'Assault', team: 'human',
    description: 'Front-line attacker with speed boost and stun capability.',
    ability: { name: 'Overdrive', description: 'Speed boost + stun nearby enemies for 3s.', cooldown: 25, icon: 'zap' },
    stats: { health: 100, armor: 40, speed: 1.1 },
    weapons: ['rifle', 'pistol', 'smg'],
    color: '#00E5FF'
  },
  {
    id: 'sentinel', name: 'SENTINEL', role: 'Defender', team: 'human',
    description: 'Heavy defender who can deploy energy shield walls.',
    ability: { name: 'Barrier Protocol', description: 'Deploy energy shield wall for 8s.', cooldown: 30, icon: 'shield' },
    stats: { health: 130, armor: 70, speed: 0.85 },
    weapons: ['shotgun', 'pistol', 'smg'],
    color: '#39FF14'
  },
  {
    id: 'phantom', name: 'PHANTOM', role: 'Stealth', team: 'human',
    description: 'Invisible operative who can bypass enemy detection.',
    ability: { name: 'Void Cloak', description: 'Become invisible to enemies for 4s.', cooldown: 20, icon: 'eye-off' },
    stats: { health: 85, armor: 30, speed: 1.15 },
    weapons: ['smg', 'pistol', 'sniper'],
    color: '#9B59B6'
  },
  {
    id: 'medic', name: 'PATCH', role: 'Support', team: 'human',
    description: 'Field medic who can instantly heal and restore armor.',
    ability: { name: 'Emergency Protocol', description: 'Restore full health and armor instantly.', cooldown: 35, icon: 'heart' },
    stats: { health: 100, armor: 50, speed: 1.0 },
    weapons: ['rifle', 'pistol', 'shotgun'],
    color: '#FFB800'
  },
  {
    id: 'hacker', name: 'CIRCUIT', role: 'Recon', team: 'human',
    description: 'Tech specialist who can reveal enemies through walls.',
    ability: { name: 'Neural Scan', description: 'Reveal all enemies through walls for 8s.', cooldown: 22, icon: 'scan' },
    stats: { health: 90, armor: 35, speed: 1.05 },
    weapons: ['smg', 'pistol', 'rifle'],
    color: '#FF6B00'
  }
];

// ── Alien / Covenant Operators ────────────────────────────────────────────────
// These ARE the enemies that spawn — each operator ID matches an enemy type.
export const ALIEN_OPERATORS = [
  {
    id: 'ravager', name: 'RAVAGER', role: 'Predator', team: 'alien',
    description: 'The apex hunter. Charges at targets with explosive speed, leaving a trail of acidic blood.',
    ability: { name: 'Blood Charge', description: 'Dash forward 8m dealing 40 damage to anything in path.', cooldown: 18, icon: 'zap' },
    stats: { health: 120, armor: 20, speed: 1.3 },
    weapons: ['bloodSpit', 'acidBurst', 'bloodSpit'],
    color: '#FF2A6D'
  },
  {
    id: 'broodmother', name: 'BROODMOTHER', role: 'Support', team: 'alien',
    description: "The Heart's herald. Heals nearby allies and temporarily boosts their speed.",
    ability: { name: 'Pulse of the Heart', description: 'Heal nearby aliens for 40HP and boost speed for 5s.', cooldown: 30, icon: 'heart' },
    stats: { health: 110, armor: 40, speed: 0.9 },
    weapons: ['bloodSpit', 'tendrilWhip', 'bloodSpit'],
    color: '#CC00FF'
  },
  {
    id: 'specter', name: 'SPECTER', role: 'Infiltrator', team: 'alien',
    description: 'Phase-shifts through cover. Near-invisible when standing still.',
    ability: { name: 'Phase Veil', description: 'Become invisible when stationary until you move or attack.', cooldown: 20, icon: 'eye-off' },
    stats: { health: 80, armor: 10, speed: 1.25 },
    weapons: ['bloodSpit', 'bloodSpit', 'acidBurst'],
    color: '#00FF99'
  },
  {
    id: 'colossus', name: 'COLOSSUS', role: 'Tank', team: 'alien',
    description: 'Massive bio-armored brute. Absorbs enormous damage and can destroy the planted device instantly.',
    ability: { name: 'Carapace', description: 'Harden exoskeleton for 6s: take 75% less damage, immune to stun.', cooldown: 35, icon: 'shield' },
    stats: { health: 220, armor: 80, speed: 0.75 },
    weapons: ['bloodSpit', 'acidBurst', 'bloodSpit'],
    color: '#FF6600'
  },
  {
    id: 'hive', name: 'HIVE', role: 'Recon', team: 'alien',
    description: 'Hive-mind scout. Sends a swarm pulse that reveals all enemies through walls for 8s.',
    ability: { name: 'Swarm Sense', description: 'Ping all humans through walls for 8s — allies can see them too.', cooldown: 22, icon: 'scan' },
    stats: { health: 85, armor: 15, speed: 1.1 },
    weapons: ['bloodSpit', 'bloodSpit', 'acidBurst'],
    color: '#FFEE00'
  }
];

export function getOperator(id) {
  return [...OPERATORS, ...ALIEN_OPERATORS].find(o => o.id === id) || OPERATORS[0];
}

export function getOperatorsByTeam(team) {
  return team === 'alien' ? ALIEN_OPERATORS : OPERATORS;
}