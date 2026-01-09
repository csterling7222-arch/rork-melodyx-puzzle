import { Melody } from '@/utils/melodies';

export interface CampaignWorld {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  chapters: CampaignChapter[];
  unlockRequirement: number;
  backgroundGradient: string[];
}

export interface CampaignChapter {
  id: string;
  name: string;
  puzzles: CampaignPuzzle[];
  isBoss?: boolean;
  storyIntro?: string;
  storyOutro?: string;
}

export interface CampaignPuzzle extends Melody {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'boss';
  maxGuesses: number;
  rewards: PuzzleReward;
  storyText?: string;
}

export interface PuzzleReward {
  coins: number;
  stars: number;
  xp: number;
  badge?: string;
}

export interface CampaignProgress {
  worldId: string;
  chapterId: string;
  puzzleId: string;
  completed: boolean;
  starsEarned: number;
  guessesUsed: number;
  completedAt?: string;
}

export interface PlayerCampaignStats {
  totalStars: number;
  totalCoins: number;
  totalXp: number;
  currentWorld: string;
  completedPuzzles: string[];
  unlockedWorlds: string[];
  badges: string[];
}

export const CAMPAIGN_WORLDS: CampaignWorld[] = [
  {
    id: 'melody_meadows',
    name: 'Melody Meadows',
    description: 'Begin your musical journey in the peaceful meadows',
    icon: '🌸',
    color: '#22C55E',
    unlockRequirement: 0,
    backgroundGradient: ['#134E4A', '#065F46'],
    chapters: [
      {
        id: 'mm_ch1',
        name: 'First Notes',
        storyIntro: 'The wind carries a gentle melody across the meadows. Your journey to become a Melody Master begins here...',
        puzzles: [
          {
            id: 'mm_1',
            name: 'Morning Breeze',
            notes: ['C', 'E', 'G', 'E', 'C'],
            extendedNotes: ['C', 'E', 'G', 'E', 'C', 'D', 'F', 'A'],
            hint: 'A gentle wake-up call',
            category: 'Tutorial',
            genre: 'Tutorial',
            era: 'Timeless',
            mood: 'peaceful',
            difficulty: 'easy',
            maxGuesses: 8,
            rewards: { coins: 50, stars: 3, xp: 100 },
            storyText: 'The meadow awakens with your first melody...'
          },
          {
            id: 'mm_2',
            name: 'Dancing Leaves',
            notes: ['D', 'F', 'A', 'F', 'D', 'C'],
            extendedNotes: ['D', 'F', 'A', 'F', 'D', 'C', 'E', 'G'],
            hint: 'Autumn colors swirl',
            category: 'Tutorial',
            genre: 'Tutorial',
            era: 'Timeless',
            mood: 'playful',
            difficulty: 'easy',
            maxGuesses: 8,
            rewards: { coins: 50, stars: 3, xp: 100 }
          },
          {
            id: 'mm_3',
            name: 'Butterfly Song',
            notes: ['E', 'G', 'B', 'G', 'E', 'D'],
            extendedNotes: ['E', 'G', 'B', 'G', 'E', 'D', 'F', 'A'],
            hint: 'Delicate wings flutter by',
            category: 'Tutorial',
            genre: 'Tutorial',
            era: 'Timeless',
            mood: 'peaceful',
            difficulty: 'easy',
            maxGuesses: 7,
            rewards: { coins: 75, stars: 3, xp: 150 }
          },
        ],
        storyOutro: 'You\'ve mastered the meadow\'s first melodies. The forest beckons...'
      },
      {
        id: 'mm_ch2',
        name: 'Forest Path',
        storyIntro: 'The trees whisper ancient songs as you venture deeper...',
        puzzles: [
          {
            id: 'mm_4',
            name: 'Woodland Waltz',
            notes: ['G', 'B', 'D', 'B', 'G', 'F#'],
            extendedNotes: ['G', 'B', 'D', 'B', 'G', 'F#', 'A', 'C'],
            hint: 'Three-quarter time through trees',
            category: 'Nature',
            genre: 'Classical',
            era: 'Timeless',
            mood: 'peaceful',
            difficulty: 'medium',
            maxGuesses: 6,
            rewards: { coins: 100, stars: 3, xp: 200 }
          },
          {
            id: 'mm_5',
            name: 'Owl\'s Lullaby',
            notes: ['A', 'C', 'E', 'C', 'A', 'G'],
            extendedNotes: ['A', 'C', 'E', 'C', 'A', 'G', 'B', 'D'],
            hint: 'Night falls in the forest',
            category: 'Nature',
            genre: 'Ambient',
            era: 'Timeless',
            mood: 'mysterious',
            difficulty: 'medium',
            maxGuesses: 6,
            rewards: { coins: 100, stars: 3, xp: 200 }
          },
        ]
      },
      {
        id: 'mm_boss',
        name: 'The Meadow Guardian',
        isBoss: true,
        storyIntro: 'The ancient spirit of the meadow awakens to test your skill...',
        puzzles: [
          {
            id: 'mm_boss_1',
            name: 'Guardian\'s Challenge',
            notes: ['C', 'E', 'G', 'B', 'A', 'F', 'D'],
            extendedNotes: ['C', 'E', 'G', 'B', 'A', 'F', 'D', 'C', 'E', 'G'],
            hint: 'The spirit\'s ancient song',
            category: 'Boss',
            genre: 'Epic',
            era: 'Ancient',
            mood: 'epic',
            difficulty: 'boss',
            maxGuesses: 5,
            rewards: { coins: 300, stars: 3, xp: 500, badge: 'meadow_guardian' },
            storyText: 'Prove your worth to proceed beyond the meadows!'
          },
        ],
        storyOutro: 'The Guardian bows in respect. The path to Rhythm Ruins is now open!'
      },
    ],
  },
  {
    id: 'rhythm_ruins',
    name: 'Rhythm Ruins',
    description: 'Ancient temples hold forgotten musical secrets',
    icon: '🏛️',
    color: '#F59E0B',
    unlockRequirement: 6,
    backgroundGradient: ['#78350F', '#92400E'],
    chapters: [
      {
        id: 'rr_ch1',
        name: 'Temple Entrance',
        storyIntro: 'Dusty corridors echo with melodies from centuries past...',
        puzzles: [
          {
            id: 'rr_1',
            name: 'Stone Chimes',
            notes: ['D', 'F#', 'A', 'D', 'C#', 'B'],
            extendedNotes: ['D', 'F#', 'A', 'D', 'C#', 'B', 'A', 'F#'],
            hint: 'Ancient bells ring out',
            category: 'Ancient',
            genre: 'Classical',
            era: 'Ancient',
            mood: 'mysterious',
            difficulty: 'medium',
            maxGuesses: 6,
            rewards: { coins: 125, stars: 3, xp: 250 }
          },
          {
            id: 'rr_2',
            name: 'Pharaoh\'s Hymn',
            notes: ['E', 'G', 'A', 'B', 'A', 'G', 'E'],
            extendedNotes: ['E', 'G', 'A', 'B', 'A', 'G', 'E', 'D', 'E'],
            hint: 'A ruler\'s eternal song',
            category: 'Ancient',
            genre: 'World',
            era: 'Ancient',
            mood: 'epic',
            difficulty: 'medium',
            maxGuesses: 6,
            rewards: { coins: 125, stars: 3, xp: 250 }
          },
          {
            id: 'rr_3',
            name: 'Hidden Chamber',
            notes: ['F', 'A', 'C', 'E', 'D', 'B'],
            extendedNotes: ['F', 'A', 'C', 'E', 'D', 'B', 'G', 'F'],
            hint: 'A secret revealed',
            category: 'Ancient',
            genre: 'Mysterious',
            era: 'Ancient',
            mood: 'mysterious',
            difficulty: 'hard',
            maxGuesses: 5,
            rewards: { coins: 175, stars: 3, xp: 350 }
          },
        ]
      },
      {
        id: 'rr_ch2',
        name: 'Inner Sanctum',
        puzzles: [
          {
            id: 'rr_4',
            name: 'Priest\'s Chant',
            notes: ['G', 'A', 'B', 'D', 'C', 'A'],
            extendedNotes: ['G', 'A', 'B', 'D', 'C', 'A', 'G', 'F#'],
            hint: 'Sacred words in song',
            category: 'Ancient',
            genre: 'Spiritual',
            era: 'Ancient',
            mood: 'peaceful',
            difficulty: 'hard',
            maxGuesses: 5,
            rewards: { coins: 175, stars: 3, xp: 350 }
          },
          {
            id: 'rr_5',
            name: 'Treasure Room',
            notes: ['A', 'C#', 'E', 'G#', 'F#', 'D'],
            extendedNotes: ['A', 'C#', 'E', 'G#', 'F#', 'D', 'B', 'A'],
            hint: 'Gold and glory await',
            category: 'Ancient',
            genre: 'Epic',
            era: 'Ancient',
            mood: 'upbeat',
            difficulty: 'hard',
            maxGuesses: 5,
            rewards: { coins: 200, stars: 3, xp: 400 }
          },
        ]
      },
      {
        id: 'rr_boss',
        name: 'The Sphinx',
        isBoss: true,
        storyIntro: 'Answer the Sphinx\'s musical riddle or be trapped forever...',
        puzzles: [
          {
            id: 'rr_boss_1',
            name: 'Sphinx\'s Riddle',
            notes: ['B', 'D', 'F#', 'A', 'G#', 'E', 'C#'],
            extendedNotes: ['B', 'D', 'F#', 'A', 'G#', 'E', 'C#', 'B', 'D'],
            hint: 'What walks on four legs...',
            category: 'Boss',
            genre: 'Epic',
            era: 'Ancient',
            mood: 'mysterious',
            difficulty: 'boss',
            maxGuesses: 4,
            rewards: { coins: 500, stars: 3, xp: 750, badge: 'sphinx_solver' }
          },
        ],
        storyOutro: 'The Sphinx smiles and crumbles to dust. The Crystal Caverns await!'
      },
    ],
  },
  {
    id: 'crystal_caverns',
    name: 'Crystal Caverns',
    description: 'Shimmering caves where music creates light',
    icon: '💎',
    color: '#8B5CF6',
    unlockRequirement: 15,
    backgroundGradient: ['#4C1D95', '#5B21B6'],
    chapters: [
      {
        id: 'cc_ch1',
        name: 'Crystal Gateway',
        storyIntro: 'Each note you play lights up the cavern with rainbow hues...',
        puzzles: [
          {
            id: 'cc_1',
            name: 'Echo Chamber',
            notes: ['C', 'E', 'G', 'C', 'G', 'E', 'C'],
            extendedNotes: ['C', 'E', 'G', 'C', 'G', 'E', 'C', 'D', 'F'],
            hint: 'Your voice returns threefold',
            category: 'Crystal',
            genre: 'Ambient',
            era: 'Magical',
            mood: 'mysterious',
            difficulty: 'hard',
            maxGuesses: 5,
            rewards: { coins: 200, stars: 3, xp: 400 }
          },
          {
            id: 'cc_2',
            name: 'Prism Light',
            notes: ['D', 'F#', 'A', 'C#', 'B', 'G'],
            extendedNotes: ['D', 'F#', 'A', 'C#', 'B', 'G', 'E', 'D'],
            hint: 'Colors dance on walls',
            category: 'Crystal',
            genre: 'Ambient',
            era: 'Magical',
            mood: 'peaceful',
            difficulty: 'hard',
            maxGuesses: 5,
            rewards: { coins: 200, stars: 3, xp: 400 }
          },
        ]
      },
      {
        id: 'cc_boss',
        name: 'The Crystal Dragon',
        isBoss: true,
        storyIntro: 'A dragon made of living crystal guards the deepest treasures...',
        puzzles: [
          {
            id: 'cc_boss_1',
            name: 'Dragon\'s Roar',
            notes: ['E', 'G#', 'B', 'D', 'F#', 'A', 'C#'],
            extendedNotes: ['E', 'G#', 'B', 'D', 'F#', 'A', 'C#', 'E', 'G#'],
            hint: 'Fire and ice combined',
            category: 'Boss',
            genre: 'Epic',
            era: 'Magical',
            mood: 'epic',
            difficulty: 'boss',
            maxGuesses: 4,
            rewards: { coins: 750, stars: 3, xp: 1000, badge: 'dragon_tamer' }
          },
        ],
        storyOutro: 'The Dragon bows and grants you passage to the Sky Sanctuary!'
      },
    ],
  },
  {
    id: 'sky_sanctuary',
    name: 'Sky Sanctuary',
    description: 'Floating islands where melodies control the winds',
    icon: '☁️',
    color: '#06B6D4',
    unlockRequirement: 24,
    backgroundGradient: ['#0E7490', '#0891B2'],
    chapters: [
      {
        id: 'ss_ch1',
        name: 'Cloud Bridge',
        storyIntro: 'The clouds part as your melodies shape the sky itself...',
        puzzles: [
          {
            id: 'ss_1',
            name: 'Wind Rider',
            notes: ['G', 'A', 'B', 'D', 'E', 'G'],
            extendedNotes: ['G', 'A', 'B', 'D', 'E', 'G', 'F#', 'E'],
            hint: 'Soar above the world',
            category: 'Sky',
            genre: 'Ambient',
            era: 'Ethereal',
            mood: 'peaceful',
            difficulty: 'hard',
            maxGuesses: 5,
            rewards: { coins: 250, stars: 3, xp: 500 }
          },
          {
            id: 'ss_2',
            name: 'Sunbeam Dance',
            notes: ['A', 'C#', 'E', 'F#', 'E', 'C#'],
            extendedNotes: ['A', 'C#', 'E', 'F#', 'E', 'C#', 'A', 'B'],
            hint: 'Light plays through clouds',
            category: 'Sky',
            genre: 'Uplifting',
            era: 'Ethereal',
            mood: 'upbeat',
            difficulty: 'hard',
            maxGuesses: 5,
            rewards: { coins: 250, stars: 3, xp: 500 }
          },
        ]
      },
      {
        id: 'ss_boss',
        name: 'The Storm King',
        isBoss: true,
        storyIntro: 'Thunder rolls as the master of storms descends to challenge you...',
        puzzles: [
          {
            id: 'ss_boss_1',
            name: 'Thunder Symphony',
            notes: ['D', 'F#', 'A', 'C', 'E', 'G', 'B'],
            extendedNotes: ['D', 'F#', 'A', 'C', 'E', 'G', 'B', 'D', 'F#'],
            hint: 'Power of the tempest',
            category: 'Boss',
            genre: 'Epic',
            era: 'Ethereal',
            mood: 'dramatic',
            difficulty: 'boss',
            maxGuesses: 4,
            rewards: { coins: 1000, stars: 3, xp: 1500, badge: 'storm_master' }
          },
        ],
        storyOutro: 'The Storm King nods in respect. You have conquered all realms!'
      },
    ],
  },
];

export const CAMPAIGN_ACHIEVEMENTS = [
  { id: 'first_puzzle', name: 'First Steps', description: 'Complete your first campaign puzzle', icon: '👣', requirement: 1 },
  { id: 'world_1', name: 'Meadow Master', description: 'Complete Melody Meadows', icon: '🌸', requirement: 'melody_meadows' },
  { id: 'world_2', name: 'Ruin Explorer', description: 'Complete Rhythm Ruins', icon: '🏛️', requirement: 'rhythm_ruins' },
  { id: 'world_3', name: 'Crystal Collector', description: 'Complete Crystal Caverns', icon: '💎', requirement: 'crystal_caverns' },
  { id: 'world_4', name: 'Sky Walker', description: 'Complete Sky Sanctuary', icon: '☁️', requirement: 'sky_sanctuary' },
  { id: 'perfect_world', name: 'Perfectionist', description: 'Get 3 stars on every puzzle in a world', icon: '⭐', requirement: 'any_world_perfect' },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat all 4 bosses', icon: '👑', requirement: 4 },
  { id: 'quest_complete', name: 'Melody Quest Champion', description: 'Complete all campaign content', icon: '🏆', requirement: 'all' },
];

export function getTotalCampaignPuzzles(): number {
  let total = 0;
  CAMPAIGN_WORLDS.forEach(world => {
    world.chapters.forEach(chapter => {
      total += chapter.puzzles.length;
    });
  });
  return total;
}

export function getPuzzleById(puzzleId: string): CampaignPuzzle | undefined {
  for (const world of CAMPAIGN_WORLDS) {
    for (const chapter of world.chapters) {
      const puzzle = chapter.puzzles.find(p => p.id === puzzleId);
      if (puzzle) return puzzle;
    }
  }
  return undefined;
}
