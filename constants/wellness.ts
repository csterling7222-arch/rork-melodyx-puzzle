import { Melody } from '@/utils/melodies';

export interface ZenMelody extends Melody {
  breathingPattern?: number[];
  ambientSound?: string;
}

export const ZEN_MELODIES: ZenMelody[] = [
  {
    name: "Ocean Waves",
    notes: ["C", "E", "G", "C", "G", "E"],
    extendedNotes: ["C", "E", "G", "C", "G", "E", "C", "D", "E", "G"],
    hint: "The gentle rhythm of the sea",
    category: "Nature",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [4, 4, 4, 4],
    ambientSound: "waves"
  },
  {
    name: "Forest Birds",
    notes: ["E", "G", "A", "E", "D", "E"],
    extendedNotes: ["E", "G", "A", "E", "D", "E", "G", "A", "B", "G"],
    hint: "Morning songbirds in the trees",
    category: "Nature",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [4, 7, 8],
    ambientSound: "birds"
  },
  {
    name: "Rain Drops",
    notes: ["D", "F", "A", "D", "C", "A"],
    extendedNotes: ["D", "F", "A", "D", "C", "A", "F", "D", "E", "F"],
    hint: "Gentle rain on leaves",
    category: "Nature",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [4, 4, 6],
    ambientSound: "rain"
  },
  {
    name: "Mountain Stream",
    notes: ["G", "B", "D", "G", "F#", "E"],
    extendedNotes: ["G", "B", "D", "G", "F#", "E", "D", "B", "G", "A"],
    hint: "Water flowing over rocks",
    category: "Nature",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [5, 5, 5],
    ambientSound: "stream"
  },
  {
    name: "Wind Chimes",
    notes: ["A", "C", "E", "A", "G", "E"],
    extendedNotes: ["A", "C", "E", "A", "G", "E", "C", "A", "B", "C"],
    hint: "Gentle breeze through chimes",
    category: "Nature",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [4, 4, 4, 4],
    ambientSound: "wind"
  },
  {
    name: "Starlight",
    notes: ["F", "A", "C", "F", "E", "D"],
    extendedNotes: ["F", "A", "C", "F", "E", "D", "C", "A", "F", "G"],
    hint: "Peaceful night sky meditation",
    category: "Cosmic",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [6, 6, 6],
    ambientSound: "night"
  },
  {
    name: "Lotus Bloom",
    notes: ["D", "E", "G", "A", "G", "E"],
    extendedNotes: ["D", "E", "G", "A", "G", "E", "D", "C", "D", "E"],
    hint: "A flower opening at dawn",
    category: "Nature",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [4, 7, 8],
    ambientSound: "garden"
  },
  {
    name: "Zen Garden",
    notes: ["E", "G", "B", "E", "D", "B"],
    extendedNotes: ["E", "G", "B", "E", "D", "B", "G", "E", "F#", "G"],
    hint: "Raking sand in stillness",
    category: "Zen",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [5, 5, 5, 5],
    ambientSound: "silence"
  },
  {
    name: "Morning Dew",
    notes: ["C", "D", "E", "G", "E", "D"],
    extendedNotes: ["C", "D", "E", "G", "E", "D", "C", "B", "C", "D"],
    hint: "Fresh drops on petals",
    category: "Nature",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [4, 4, 4],
    ambientSound: "morning"
  },
  {
    name: "Moonrise",
    notes: ["A", "B", "D", "E", "D", "B"],
    extendedNotes: ["A", "B", "D", "E", "D", "B", "A", "G", "A", "B"],
    hint: "Silver light over calm waters",
    category: "Cosmic",
    genre: "Ambient",
    era: "Timeless",
    mood: "peaceful",
    breathingPattern: [6, 6, 6, 6],
    ambientSound: "night"
  },
];

export interface WellnessAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'zen_streak' | 'total_minutes' | 'puzzles_solved' | 'breathing_sessions';
}

export const WELLNESS_ACHIEVEMENTS: WellnessAchievement[] = [
  {
    id: 'zen_beginner',
    name: 'Zen Beginner',
    description: 'Complete your first zen puzzle',
    icon: '🧘',
    requirement: 1,
    type: 'puzzles_solved'
  },
  {
    id: 'zen_week',
    name: 'Zen Week',
    description: 'Maintain a 7-day zen streak',
    icon: '🌸',
    requirement: 7,
    type: 'zen_streak'
  },
  {
    id: 'zen_master',
    name: 'Zen Master',
    description: 'Maintain a 30-day zen streak',
    icon: '🏯',
    requirement: 30,
    type: 'zen_streak'
  },
  {
    id: 'mindful_hour',
    name: 'Mindful Hour',
    description: 'Accumulate 60 minutes of zen time',
    icon: '⏳',
    requirement: 60,
    type: 'total_minutes'
  },
  {
    id: 'deep_breath',
    name: 'Deep Breather',
    description: 'Complete 10 breathing sessions',
    icon: '💨',
    requirement: 10,
    type: 'breathing_sessions'
  },
  {
    id: 'inner_peace',
    name: 'Inner Peace',
    description: 'Accumulate 300 minutes of zen time',
    icon: '☮️',
    requirement: 300,
    type: 'total_minutes'
  },
];

export const BREATHING_PATTERNS = {
  relaxing: { inhale: 4, hold: 4, exhale: 4, name: 'Box Breathing' },
  calming: { inhale: 4, hold: 7, exhale: 8, name: '4-7-8 Technique' },
  energizing: { inhale: 6, hold: 0, exhale: 6, name: 'Deep Breathing' },
  focus: { inhale: 5, hold: 5, exhale: 5, name: 'Triangle Breathing' },
} as const;

export type BreathingPatternKey = keyof typeof BREATHING_PATTERNS;
