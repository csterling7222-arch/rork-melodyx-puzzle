import { Melody } from '@/utils/melodies';

export interface ThemeEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  startDate: string;
  endDate: string;
  theme: string;
  backgroundColor: string;
  accentColor: string;
  songs: Melody[];
  rewards: EventReward[];
}

export interface EventReward {
  id: string;
  type: 'badge' | 'hint' | 'skin' | 'coins';
  name: string;
  icon: string;
  requirement: number;
  description: string;
}

export const THEMED_EVENTS: ThemeEvent[] = [
  {
    id: 'new_year_2025',
    name: 'New Year Beats',
    description: 'Ring in the new year with celebratory tunes!',
    icon: '🎆',
    startDate: '2025-12-30',
    endDate: '2026-01-07',
    theme: 'celebration',
    backgroundColor: '#1a1a2e',
    accentColor: '#FFD700',
    songs: [
      {
        name: 'Auld Lang Syne',
        notes: ['F', 'A#', 'A#', 'A#', 'D', 'C', 'A#'],
        extendedNotes: ['F', 'A#', 'A#', 'A#', 'D', 'C', 'A#', 'A#', 'D', 'D', 'F', 'G'],
        hint: 'Should old acquaintance be forgot...',
        category: 'Holiday',
        genre: 'Holiday',
        era: 'Traditional',
        mood: 'nostalgic',
      },
      {
        name: 'Celebration',
        notes: ['G', 'G', 'G', 'G', 'F', 'G', 'A'],
        extendedNotes: ['G', 'G', 'G', 'G', 'F', 'G', 'A', 'G', 'F', 'E', 'D', 'C'],
        hint: 'Kool & The Gang party anthem',
        category: 'Pop',
        genre: 'Pop',
        era: '80s',
        mood: 'upbeat',
      },
    ],
    rewards: [
      { id: 'ny_badge', type: 'badge', name: '2026 Pioneer', icon: '🎊', requirement: 1, description: 'Complete 1 New Year puzzle' },
      { id: 'ny_hint', type: 'hint', name: 'Celebration Hint', icon: '💡', requirement: 3, description: 'Complete 3 puzzles' },
      { id: 'ny_skin', type: 'skin', name: 'Fireworks Keyboard', icon: '🎆', requirement: 5, description: 'Complete all puzzles' },
    ],
  },
  {
    id: 'valentines_2026',
    name: "Valentine's Melodies",
    description: 'Love songs to warm your heart',
    icon: '💕',
    startDate: '2026-02-10',
    endDate: '2026-02-16',
    theme: 'love',
    backgroundColor: '#2d1f3d',
    accentColor: '#FF69B4',
    songs: [
      {
        name: 'My Heart Will Go On',
        notes: ['E', 'F#', 'G#', 'F#', 'G#', 'A', 'G#'],
        extendedNotes: ['E', 'F#', 'G#', 'F#', 'G#', 'A', 'G#', 'F#', 'E', 'F#', 'G#'],
        hint: 'Titanic theme song',
        category: 'Movie',
        genre: 'Movie',
        era: '90s',
        mood: 'dramatic',
      },
      {
        name: 'I Will Always Love You',
        notes: ['A', 'B', 'C#', 'B', 'A', 'F#'],
        extendedNotes: ['A', 'B', 'C#', 'B', 'A', 'F#', 'E', 'D', 'C#', 'B', 'A'],
        hint: 'Whitney Houston classic',
        category: 'Pop',
        genre: 'Pop',
        era: '90s',
        mood: 'dramatic',
      },
    ],
    rewards: [
      { id: 'val_badge', type: 'badge', name: 'Love Struck', icon: '💘', requirement: 1, description: 'Complete 1 Valentine puzzle' },
      { id: 'val_coins', type: 'coins', name: '100 Love Coins', icon: '💰', requirement: 3, description: 'Complete 3 puzzles' },
      { id: 'val_skin', type: 'skin', name: 'Heart Keys', icon: '💕', requirement: 5, description: 'Complete all puzzles' },
    ],
  },
  {
    id: 'summer_vibes',
    name: 'Summer Vibes',
    description: 'Hot summer hits to keep you cool',
    icon: '☀️',
    startDate: '2026-06-21',
    endDate: '2026-06-28',
    theme: 'summer',
    backgroundColor: '#1a3a2f',
    accentColor: '#00CED1',
    songs: [
      {
        name: 'Summer of 69',
        notes: ['D', 'D', 'A', 'A', 'B', 'B', 'A'],
        extendedNotes: ['D', 'D', 'A', 'A', 'B', 'B', 'A', 'G', 'A', 'B', 'D'],
        hint: 'Bryan Adams nostalgic summer',
        category: 'Rock',
        genre: 'Rock',
        era: '80s',
        mood: 'nostalgic',
      },
      {
        name: 'Walking on Sunshine',
        notes: ['E', 'E', 'G', 'A', 'A', 'G', 'E'],
        extendedNotes: ['E', 'E', 'G', 'A', 'A', 'G', 'E', 'D', 'E', 'G', 'A'],
        hint: 'Katrina & The Waves feel-good anthem',
        category: '80s',
        genre: '80s',
        era: '80s',
        mood: 'upbeat',
      },
    ],
    rewards: [
      { id: 'sum_badge', type: 'badge', name: 'Summer Soul', icon: '🌴', requirement: 1, description: 'Complete 1 Summer puzzle' },
      { id: 'sum_hint', type: 'hint', name: 'Beach Hint', icon: '🏖️', requirement: 3, description: 'Complete 3 puzzles' },
      { id: 'sum_skin', type: 'skin', name: 'Tropical Keys', icon: '🌺', requirement: 5, description: 'Complete all puzzles' },
    ],
  },
  {
    id: 'halloween_2026',
    name: 'Spooky Sounds',
    description: 'Creepy melodies for Halloween',
    icon: '🎃',
    startDate: '2026-10-25',
    endDate: '2026-11-01',
    theme: 'spooky',
    backgroundColor: '#1a1a1a',
    accentColor: '#FF6600',
    songs: [
      {
        name: 'Thriller',
        notes: ['C#', 'C#', 'C#', 'C#', 'C#', 'D', 'C#'],
        extendedNotes: ['C#', 'C#', 'C#', 'C#', 'C#', 'D', 'C#', 'B', 'A', 'G#', 'A'],
        hint: "MJ's scary music video",
        category: '80s',
        genre: '80s',
        era: '80s',
        mood: 'mysterious',
      },
      {
        name: 'Ghostbusters',
        notes: ['E', 'D#', 'E', 'B', 'A', 'G#'],
        extendedNotes: ['E', 'D#', 'E', 'B', 'A', 'G#', 'E', 'D#', 'E', 'B', 'E'],
        hint: 'Who you gonna call?',
        category: '80s',
        genre: '80s',
        era: '80s',
        mood: 'playful',
      },
    ],
    rewards: [
      { id: 'hal_badge', type: 'badge', name: 'Ghost Hunter', icon: '👻', requirement: 1, description: 'Complete 1 Halloween puzzle' },
      { id: 'hal_coins', type: 'coins', name: '150 Spooky Coins', icon: '🪙', requirement: 3, description: 'Complete 3 puzzles' },
      { id: 'hal_skin', type: 'skin', name: 'Haunted Keys', icon: '🎃', requirement: 5, description: 'Complete all puzzles' },
    ],
  },
  {
    id: 'christmas_2026',
    name: 'Holiday Harmonies',
    description: 'Festive songs for the holiday season',
    icon: '🎄',
    startDate: '2026-12-20',
    endDate: '2026-12-27',
    theme: 'christmas',
    backgroundColor: '#1a2a1a',
    accentColor: '#FF0000',
    songs: [
      {
        name: 'Silent Night',
        notes: ['G', 'A', 'G', 'E', 'G', 'A', 'G'],
        extendedNotes: ['G', 'A', 'G', 'E', 'G', 'A', 'G', 'E', 'D', 'D', 'B'],
        hint: 'Holy night, peaceful night',
        category: 'Holiday',
        genre: 'Holiday',
        era: 'Traditional',
        mood: 'peaceful',
      },
      {
        name: 'Last Christmas',
        notes: ['D', 'D', 'E', 'D', 'C', 'B', 'A'],
        extendedNotes: ['D', 'D', 'E', 'D', 'C', 'B', 'A', 'G', 'A', 'B', 'C'],
        hint: 'Wham! holiday heartbreak',
        category: 'Holiday',
        genre: 'Pop',
        era: '80s',
        mood: 'nostalgic',
      },
    ],
    rewards: [
      { id: 'xmas_badge', type: 'badge', name: 'Santa\'s Helper', icon: '🎅', requirement: 1, description: 'Complete 1 Holiday puzzle' },
      { id: 'xmas_hint', type: 'hint', name: 'Festive Hint', icon: '🎁', requirement: 3, description: 'Complete 3 puzzles' },
      { id: 'xmas_skin', type: 'skin', name: 'Snowflake Keys', icon: '❄️', requirement: 5, description: 'Complete all puzzles' },
    ],
  },
];

export function getActiveEvent(): ThemeEvent | null {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return THEMED_EVENTS.find(event => {
    return todayStr >= event.startDate && todayStr <= event.endDate;
  }) || null;
}

export function getUpcomingEvents(limit: number = 3): ThemeEvent[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return THEMED_EVENTS
    .filter(event => event.startDate > todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit);
}
