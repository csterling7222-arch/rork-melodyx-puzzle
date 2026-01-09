import { Melody } from '@/utils/melodies';

export interface EcoProject {
  id: string;
  name: string;
  description: string;
  icon: string;
  costPerTon: number;
  impact: string;
  region: string;
}

export const ECO_PROJECTS: EcoProject[] = [
  {
    id: 'forest_restore',
    name: 'Forest Restoration',
    description: 'Plant trees in deforested areas to absorb CO2 and restore biodiversity',
    icon: '🌲',
    costPerTon: 15,
    impact: '1 ton = ~50 trees planted',
    region: 'Amazon Basin',
  },
  {
    id: 'ocean_cleanup',
    name: 'Ocean Conservation',
    description: 'Remove plastic from oceans and protect marine ecosystems',
    icon: '🌊',
    costPerTon: 18,
    impact: '1 ton = 100kg plastic removed',
    region: 'Pacific Ocean',
  },
  {
    id: 'renewable_energy',
    name: 'Renewable Energy',
    description: 'Support solar and wind energy projects in developing regions',
    icon: '☀️',
    costPerTon: 12,
    impact: '1 ton = 500kWh clean energy',
    region: 'Sub-Saharan Africa',
  },
];

export const ECO_POINTS_PER_WIN = 10;
export const ECO_POINTS_PER_PERFECT = 25;
export const ECO_POINTS_PER_TON = 1000;

export const ECO_MILESTONES = [
  { points: 100, reward: 'Eco Seed', icon: '🌱', description: 'Started your eco journey' },
  { points: 500, reward: 'Green Sprout', icon: '🌿', description: 'Growing strong' },
  { points: 1000, reward: 'Carbon Neutral', icon: '🌳', description: 'Offset 1 ton of CO2' },
  { points: 2500, reward: 'Eco Champion', icon: '🏆', description: 'Making real impact' },
  { points: 5000, reward: 'Planet Protector', icon: '🌍', description: 'Offset 5 tons of CO2' },
  { points: 10000, reward: 'Eco Legend', icon: '⭐', description: 'Offset 10 tons of CO2' },
];

export const ECO_MELODIES: Melody[] = [
  {
    name: 'Morning Birds',
    notes: ['E', 'G', 'A', 'G', 'E', 'D'],
    extendedNotes: ['E', 'G', 'A', 'G', 'E', 'D', 'C', 'D', 'E', 'G', 'A', 'B'],
    hint: 'Dawn chorus awakens the forest',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'peaceful',
  },
  {
    name: 'Ocean Waves',
    notes: ['C', 'E', 'G', 'E', 'C', 'G'],
    extendedNotes: ['C', 'E', 'G', 'E', 'C', 'G', 'A', 'G', 'E', 'D', 'C', 'E'],
    hint: 'Gentle tides on a pristine beach',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'peaceful',
  },
  {
    name: 'Wind Through Trees',
    notes: ['D', 'F', 'A', 'G', 'F', 'D'],
    extendedNotes: ['D', 'F', 'A', 'G', 'F', 'D', 'E', 'F', 'G', 'A', 'B', 'C'],
    hint: 'Leaves rustling in a gentle breeze',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'peaceful',
  },
  {
    name: 'Rainfall',
    notes: ['G', 'A', 'B', 'A', 'G', 'E'],
    extendedNotes: ['G', 'A', 'B', 'A', 'G', 'E', 'D', 'E', 'G', 'A', 'B', 'D'],
    hint: 'Drops falling on forest canopy',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'peaceful',
  },
  {
    name: 'Flowing River',
    notes: ['A', 'B', 'C', 'B', 'A', 'G'],
    extendedNotes: ['A', 'B', 'C', 'B', 'A', 'G', 'F', 'G', 'A', 'B', 'C', 'D'],
    hint: 'Crystal clear water over stones',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'peaceful',
  },
  {
    name: 'Mountain Echo',
    notes: ['E', 'E', 'G', 'G', 'B', 'B'],
    extendedNotes: ['E', 'E', 'G', 'G', 'B', 'B', 'A', 'G', 'E', 'D', 'E', 'G'],
    hint: 'Sounds bouncing off majestic peaks',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'epic',
  },
  {
    name: 'Honeybee Dance',
    notes: ['F', 'G', 'A', 'G', 'F', 'E'],
    extendedNotes: ['F', 'G', 'A', 'G', 'F', 'E', 'D', 'E', 'F', 'G', 'A', 'B'],
    hint: 'Pollinators at work in the garden',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'playful',
  },
  {
    name: 'Whale Song',
    notes: ['C', 'G', 'E', 'G', 'C', 'E'],
    extendedNotes: ['C', 'G', 'E', 'G', 'C', 'E', 'G', 'B', 'A', 'G', 'E', 'C'],
    hint: 'Deep ocean communication',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'mysterious',
  },
  {
    name: 'Forest Floor',
    notes: ['D', 'E', 'F', 'G', 'F', 'E'],
    extendedNotes: ['D', 'E', 'F', 'G', 'F', 'E', 'D', 'C', 'D', 'E', 'F', 'G'],
    hint: 'Life beneath the canopy',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'peaceful',
  },
  {
    name: 'Aurora Borealis',
    notes: ['B', 'D', 'F#', 'A', 'F#', 'D'],
    extendedNotes: ['B', 'D', 'F#', 'A', 'F#', 'D', 'B', 'C#', 'D', 'E', 'F#', 'G'],
    hint: 'Northern lights dance across the sky',
    category: 'Eco',
    genre: 'Nature',
    era: 'Timeless',
    mood: 'mysterious',
  },
];

export const ECO_THEME_COLORS = {
  primary: '#22C55E',
  secondary: '#10B981',
  accent: '#34D399',
  background: '#064E3B',
  surface: '#065F46',
  text: '#ECFDF5',
  muted: '#6EE7B7',
};

export function getRandomEcoMelody(excludeNames: string[] = []): Melody {
  const available = ECO_MELODIES.filter(m => !excludeNames.includes(m.name));
  const pool = available.length > 0 ? available : ECO_MELODIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function calculateCarbonOffset(ecoPoints: number): number {
  return ecoPoints / ECO_POINTS_PER_TON;
}

export function getEcoMilestone(ecoPoints: number): typeof ECO_MILESTONES[0] | null {
  const achieved = ECO_MILESTONES.filter(m => ecoPoints >= m.points);
  return achieved.length > 0 ? achieved[achieved.length - 1] : null;
}

export function getNextMilestone(ecoPoints: number): typeof ECO_MILESTONES[0] | null {
  return ECO_MILESTONES.find(m => ecoPoints < m.points) || null;
}
