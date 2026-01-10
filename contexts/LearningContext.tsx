import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NOTE_SCALE } from '@/utils/melodies';
import { generateText } from '@rork-ai/toolkit-sdk';


export type PracticeMode = 'standard' | 'mirror' | 'harmony' | 'improvisation' | 'speed' | 'zen';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'master';
export type SkillCategory = 'earTraining' | 'rhythm' | 'melodyRecognition' | 'noteAccuracy' | 'improvisation' | 'harmony';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  accuracy: number;
  bestStreak: number;
  attempts: number;
  lastAttemptDate: string;
  starsEarned: number;
  timeSpentSeconds: number;
  modesCompleted: PracticeMode[];
  perfectRuns: number;
}

export interface SkillLevel {
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  category: SkillCategory;
}

export interface SessionAnalytics {
  date: string;
  lessonsCompleted: number;
  averageAccuracy: number;
  totalTimeMinutes: number;
  notesPlayed: number;
  mistakePatterns: { note: string; correctNote: string; count: number }[];
  skillGains: Partial<Record<SkillCategory, number>>;
}

export interface LearningStats {
  totalLessonsCompleted: number;
  totalPracticeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  totalXp: number;
  currentLevel: number;
  skillLevels: Record<SkillCategory, SkillLevel>;
  badges: string[];
  certificates: string[];
  lastPracticeDate: string | null;
  weeklyGoal: number;
  weeklyProgress: number;
  perfectLessons: number;
  totalNotesPlayed: number;
  favoriteInstrument: string;
  preferredDifficulty: DifficultyLevel;
  sessionHistory: SessionAnalytics[];
  aiCoachEnabled: boolean;
  adaptiveDifficultyEnabled: boolean;
}

export interface LessonVariation {
  id: string;
  name: string;
  transform: 'transpose' | 'tempo' | 'harmony' | 'improvise' | 'mirror' | 'speed';
  description: string;
  modifier: number;
  unlockXp: number;
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  category: string;
  skillFocus: SkillCategory[];
  targetNotes: string[];
  tempo: number;
  requiredAccuracy: number;
  xpReward: number;
  hints: string[];
  variations: LessonVariation[];
  prerequisites: string[];
  theoryTip?: string;
  videoUrl?: string;
  practiceGoals: { mode: PracticeMode; target: number }[];
}

export interface Curriculum {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  lessons: Lesson[];
  unlockRequirement: number;
  isPremium: boolean;
  estimatedHours: number;
  skillFocus: SkillCategory[];
}

export interface RepetitionAttempt {
  notes: string[];
  accuracy: number;
  timing: number[];
  feedback: ('correct' | 'wrong' | 'close')[];
  mode: PracticeMode;
  tempoUsed: number;
  timestamp: number;
}

export interface AICoachFeedback {
  message: string;
  suggestions: string[];
  encouragement: string;
  nextSteps: string[];
  focusAreas: SkillCategory[];
}

export interface LearningGameState {
  currentLessonId: string | null;
  currentVariation: LessonVariation | null;
  currentMode: PracticeMode;
  attempts: RepetitionAttempt[];
  currentAttempt: string[];
  isListening: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  gamePhase: 'ready' | 'listening' | 'repeating' | 'feedback' | 'complete' | 'coaching';
  accuracy: number;
  streak: number;
  currentTempo: number;
  harmonyNotes: string[];
  aiCoachFeedback: AICoachFeedback | null;
  pitchDetectionActive: boolean;
  confidenceThreshold: number;
  comboMultiplier: number;
  sessionXpGained: number;
}

const STORAGE_KEYS = {
  LEARNING_STATS: 'melodyx_learning_stats_v2',
  LESSON_PROGRESS: 'melodyx_lesson_progress_v2',
  LEARNING_GAME: 'melodyx_learning_game_v2',
};

const DEFAULT_SKILL_LEVELS: Record<SkillCategory, SkillLevel> = {
  earTraining: { name: 'Ear Training', level: 1, xp: 0, maxXp: 100, category: 'earTraining' },
  rhythm: { name: 'Rhythm', level: 1, xp: 0, maxXp: 100, category: 'rhythm' },
  melodyRecognition: { name: 'Melody Recognition', level: 1, xp: 0, maxXp: 100, category: 'melodyRecognition' },
  noteAccuracy: { name: 'Note Accuracy', level: 1, xp: 0, maxXp: 100, category: 'noteAccuracy' },
  improvisation: { name: 'Improvisation', level: 1, xp: 0, maxXp: 150, category: 'improvisation' },
  harmony: { name: 'Harmony', level: 1, xp: 0, maxXp: 150, category: 'harmony' },
};

const DEFAULT_STATS: LearningStats = {
  totalLessonsCompleted: 0,
  totalPracticeMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  averageAccuracy: 0,
  totalXp: 0,
  currentLevel: 1,
  skillLevels: DEFAULT_SKILL_LEVELS,
  badges: [],
  certificates: [],
  lastPracticeDate: null,
  weeklyGoal: 30,
  weeklyProgress: 0,
  perfectLessons: 0,
  totalNotesPlayed: 0,
  favoriteInstrument: 'piano',
  preferredDifficulty: 'beginner',
  sessionHistory: [],
  aiCoachEnabled: true,
  adaptiveDifficultyEnabled: true,
};

const DEFAULT_GAME_STATE: LearningGameState = {
  currentLessonId: null,
  currentVariation: null,
  currentMode: 'standard',
  attempts: [],
  currentAttempt: [],
  isListening: false,
  isPlaying: false,
  isRecording: false,
  gamePhase: 'ready',
  accuracy: 0,
  streak: 0,
  currentTempo: 500,
  harmonyNotes: [],
  aiCoachFeedback: null,
  pitchDetectionActive: false,
  confidenceThreshold: 0.7,
  comboMultiplier: 1,
  sessionXpGained: 0,
};

export const EXPANDED_CURRICULA: Curriculum[] = [
  {
    id: 'ear_training_foundations',
    name: 'Ear Training Foundations',
    description: 'Build your musical ear from scratch with progressive exercises',
    icon: '👂',
    color: '#A78BFA',
    unlockRequirement: 0,
    isPremium: false,
    estimatedHours: 3,
    skillFocus: ['earTraining', 'noteAccuracy'],
    lessons: [
      {
        id: 'single_notes_1',
        name: 'Single Note Recognition',
        description: 'Listen and repeat individual notes - the foundation of ear training',
        difficulty: 'beginner',
        category: 'Ear Training',
        skillFocus: ['earTraining', 'noteAccuracy'],
        targetNotes: ['C', 'E', 'G'],
        tempo: 800,
        requiredAccuracy: 70,
        xpReward: 50,
        hints: ['Start with the easiest notes', 'Listen for the pitch height', 'C is your anchor note'],
        theoryTip: 'These three notes form a C Major chord - the most fundamental chord in music!',
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 80 }],
        variations: [
          { id: 'transpose_up', name: 'Higher Octave', transform: 'transpose', description: 'Try one octave higher', modifier: 1, unlockXp: 100 },
        ],
      },
      {
        id: 'simple_intervals',
        name: 'Simple Intervals',
        description: 'Learn to hear the distance between notes',
        difficulty: 'beginner',
        category: 'Ear Training',
        skillFocus: ['earTraining', 'melodyRecognition'],
        targetNotes: ['C', 'G'],
        tempo: 700,
        requiredAccuracy: 75,
        xpReward: 75,
        hints: ['A perfect fifth sounds bright', 'Think of Star Wars opening', 'The interval feels open and spacious'],
        theoryTip: 'A perfect fifth (C to G) is 7 semitones. It\'s called "perfect" because of its pure, consonant sound.',
        prerequisites: ['single_notes_1'],
        practiceGoals: [{ mode: 'standard', target: 85 }, { mode: 'speed', target: 75 }],
        variations: [
          { id: 'octave_jump', name: 'Octave Jump', transform: 'transpose', description: 'Try one octave higher', modifier: 1, unlockXp: 150 },
          { id: 'faster', name: 'Quick Fire', transform: 'tempo', description: 'Double speed challenge', modifier: 0.5, unlockXp: 200 },
        ],
      },
      {
        id: 'three_note_patterns',
        name: 'Three Note Patterns',
        description: 'Recognize and repeat 3-note melodies with confidence',
        difficulty: 'beginner',
        category: 'Ear Training',
        skillFocus: ['earTraining', 'melodyRecognition', 'noteAccuracy'],
        targetNotes: ['C', 'D', 'E'],
        tempo: 600,
        requiredAccuracy: 75,
        xpReward: 100,
        hints: ['Focus on the direction - up or down?', 'Sing along in your head', 'These notes are all neighbors'],
        theoryTip: 'C-D-E are the first three notes of the C Major scale. Moving step by step is called "stepwise motion".',
        prerequisites: ['simple_intervals'],
        practiceGoals: [{ mode: 'standard', target: 85 }, { mode: 'mirror', target: 70 }],
        variations: [
          { id: 'reverse', name: 'Mirror Mode', transform: 'mirror', description: 'Play in reverse order', modifier: -1, unlockXp: 150 },
          { id: 'add_harmony', name: 'With Harmony', transform: 'harmony', description: 'Add bass support', modifier: 1, unlockXp: 200 },
        ],
      },
      {
        id: 'ascending_scales',
        name: 'Ascending Patterns',
        description: 'Master upward melodic movement',
        difficulty: 'beginner',
        category: 'Ear Training',
        skillFocus: ['earTraining', 'melodyRecognition'],
        targetNotes: ['C', 'D', 'E', 'F', 'G'],
        tempo: 550,
        requiredAccuracy: 75,
        xpReward: 125,
        hints: ['Each note is one step higher', 'Think "Do Re Mi Fa Sol"', 'Keep the rhythm steady'],
        theoryTip: 'The first 5 notes of the major scale. This pattern appears in countless melodies!',
        prerequisites: ['three_note_patterns'],
        practiceGoals: [{ mode: 'standard', target: 85 }, { mode: 'speed', target: 75 }],
        variations: [],
      },
      {
        id: 'descending_patterns',
        name: 'Descending Patterns',
        description: 'Navigate downward melodic movements',
        difficulty: 'beginner',
        category: 'Ear Training',
        skillFocus: ['earTraining', 'melodyRecognition'],
        targetNotes: ['G', 'F', 'E', 'D', 'C'],
        tempo: 550,
        requiredAccuracy: 75,
        xpReward: 125,
        hints: ['Each note goes down one step', 'Like walking down stairs', 'Ending on C feels like "home"'],
        theoryTip: 'Descending scales create a sense of resolution, especially when landing on the root note.',
        prerequisites: ['ascending_scales'],
        practiceGoals: [{ mode: 'standard', target: 85 }],
        variations: [],
      },
    ],
  },
  {
    id: 'melody_mastery',
    name: 'Melody Mastery',
    description: 'Master famous melodies through focused repetition',
    icon: '🎵',
    color: '#22C55E',
    unlockRequirement: 100,
    isPremium: false,
    estimatedHours: 5,
    skillFocus: ['melodyRecognition', 'noteAccuracy', 'rhythm'],
    lessons: [
      {
        id: 'nursery_rhymes',
        name: 'Twinkle Twinkle',
        description: 'Classic children\'s song everyone knows - perfect for beginners',
        difficulty: 'beginner',
        category: 'Melody',
        skillFocus: ['melodyRecognition', 'noteAccuracy'],
        targetNotes: ['C', 'C', 'G', 'G', 'A', 'A', 'G'],
        tempo: 500,
        requiredAccuracy: 80,
        xpReward: 100,
        hints: ['Think "Twinkle Twinkle"', 'First 7 notes repeat a pattern', 'Two same notes, then two higher, then two higher, then back'],
        theoryTip: 'This melody uses only 3 different notes (C, G, A) but creates a memorable tune through repetition and rhythm.',
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 90 }, { mode: 'harmony', target: 80 }],
        variations: [
          { id: 'faster_tempo', name: 'Faster Tempo', transform: 'tempo', description: 'Play at 1.5x speed', modifier: 1.5, unlockXp: 200 },
          { id: 'with_bass', name: 'With Bass Line', transform: 'harmony', description: 'Add accompanying bass', modifier: 1, unlockXp: 250 },
        ],
      },
      {
        id: 'happy_birthday',
        name: 'Happy Birthday',
        description: 'The most sung song in the world - master its opening phrase',
        difficulty: 'beginner',
        category: 'Melody',
        skillFocus: ['melodyRecognition', 'rhythm'],
        targetNotes: ['G', 'G', 'A', 'G', 'C', 'B'],
        tempo: 500,
        requiredAccuracy: 80,
        xpReward: 100,
        hints: ['Start with two same notes', 'The melody rises then falls', 'The jump to C is the highest point'],
        theoryTip: 'This melody demonstrates the power of rhythmic patterns - the repeated note at the start builds anticipation.',
        prerequisites: ['nursery_rhymes'],
        practiceGoals: [{ mode: 'standard', target: 90 }],
        variations: [],
      },
      {
        id: 'ode_to_joy',
        name: 'Ode to Joy',
        description: 'Beethoven\'s timeless masterpiece - a stepping stone to classical',
        difficulty: 'intermediate',
        category: 'Classical',
        skillFocus: ['melodyRecognition', 'noteAccuracy', 'rhythm'],
        targetNotes: ['E', 'E', 'F', 'G', 'G', 'F', 'E', 'D'],
        tempo: 500,
        requiredAccuracy: 85,
        xpReward: 150,
        hints: ['Step-wise motion mostly', 'Mirror pattern in the melody', 'Notice how it goes up then comes back down'],
        theoryTip: 'Beethoven wrote this in his 9th Symphony, while completely deaf. The stepwise motion makes it singable by everyone.',
        prerequisites: ['happy_birthday'],
        practiceGoals: [{ mode: 'standard', target: 90 }, { mode: 'mirror', target: 80 }, { mode: 'harmony', target: 85 }],
        variations: [
          { id: 'add_harmony', name: 'With Orchestra', transform: 'harmony', description: 'Add harmonic support', modifier: 1, unlockXp: 300 },
          { id: 'mirror', name: 'Mirror Play', transform: 'mirror', description: 'Play the melody backwards', modifier: -1, unlockXp: 350 },
        ],
      },
      {
        id: 'canon_in_d',
        name: 'Canon in D Theme',
        description: 'Pachelbel\'s famous progression',
        difficulty: 'intermediate',
        category: 'Classical',
        skillFocus: ['melodyRecognition', 'harmony'],
        targetNotes: ['F#', 'E', 'D', 'C#', 'B', 'A', 'B', 'C#'],
        tempo: 600,
        requiredAccuracy: 80,
        xpReward: 175,
        hints: ['Mostly descending pattern', 'Listen for the stepwise motion', 'The last three notes turn around'],
        theoryTip: 'This piece uses a ground bass - a repeating bass pattern that hundreds of pop songs have borrowed.',
        prerequisites: ['ode_to_joy'],
        practiceGoals: [{ mode: 'standard', target: 85 }, { mode: 'harmony', target: 80 }],
        variations: [],
      },
    ],
  },
  {
    id: 'pop_hits',
    name: 'Pop Song Hooks',
    description: 'Learn catchy hooks from chart-topping hits',
    icon: '🎤',
    color: '#EF4444',
    unlockRequirement: 300,
    isPremium: false,
    estimatedHours: 6,
    skillFocus: ['melodyRecognition', 'rhythm', 'noteAccuracy'],
    lessons: [
      {
        id: 'shape_of_you_hook',
        name: 'Shape of You',
        description: 'Ed Sheeran\'s viral tropical house hit',
        difficulty: 'intermediate',
        category: 'Pop',
        skillFocus: ['melodyRecognition', 'rhythm'],
        targetNotes: ['C#', 'C#', 'B', 'A', 'B', 'C#'],
        tempo: 450,
        requiredAccuracy: 85,
        xpReward: 150,
        hints: ['Syncopated rhythm', 'Minor key feeling', 'The hook is infectious because of its simplicity'],
        theoryTip: 'This song uses a minor key (C# minor) which gives it that moody, groove-heavy feel.',
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 90 }, { mode: 'speed', target: 80 }],
        variations: [
          { id: 'original_key', name: 'Full Hook', transform: 'transpose', description: 'Extended version', modifier: 0, unlockXp: 300 },
        ],
      },
      {
        id: 'bad_guy_hook',
        name: 'Bad Guy',
        description: 'Billie Eilish\'s signature bass-heavy hook',
        difficulty: 'intermediate',
        category: 'Pop',
        skillFocus: ['noteAccuracy', 'rhythm'],
        targetNotes: ['G', 'G', 'D#', 'D', 'D', 'A#'],
        tempo: 400,
        requiredAccuracy: 85,
        xpReward: 175,
        hints: ['Low, punchy notes', 'Sparse melody', 'The gaps are as important as the notes'],
        theoryTip: 'This song breaks traditional rules by using unusual intervals and minimal production. Less can be more!',
        prerequisites: ['shape_of_you_hook'],
        practiceGoals: [{ mode: 'standard', target: 90 }],
        variations: [],
      },
      {
        id: 'blinding_lights',
        name: 'Blinding Lights',
        description: 'The Weeknd\'s 80s-inspired synthwave anthem',
        difficulty: 'intermediate',
        category: 'Pop',
        skillFocus: ['melodyRecognition', 'rhythm'],
        targetNotes: ['F', 'D#', 'F', 'G', 'G#', 'G'],
        tempo: 420,
        requiredAccuracy: 85,
        xpReward: 175,
        hints: ['80s synth vibes', 'The melody bounces', 'Notice the chromatic movement'],
        theoryTip: 'This song\'s retro sound comes from its synth arpeggios and the specific chord voicings from 80s music.',
        prerequisites: ['bad_guy_hook'],
        practiceGoals: [{ mode: 'standard', target: 90 }, { mode: 'speed', target: 85 }],
        variations: [
          { id: 'speed_run', name: 'Dance Tempo', transform: 'speed', description: 'Full BPM challenge', modifier: 1.5, unlockXp: 350 },
        ],
      },
    ],
  },
  {
    id: 'rhythm_fundamentals',
    name: 'Rhythm Fundamentals',
    description: 'Master timing, tempo, and rhythmic precision',
    icon: '🥁',
    color: '#F59E0B',
    unlockRequirement: 200,
    isPremium: false,
    estimatedHours: 4,
    skillFocus: ['rhythm', 'noteAccuracy'],
    lessons: [
      {
        id: 'steady_beat',
        name: 'Steady Beat',
        description: 'Learn to keep perfect time with quarter notes',
        difficulty: 'beginner',
        category: 'Rhythm',
        skillFocus: ['rhythm'],
        targetNotes: ['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C'],
        tempo: 600,
        requiredAccuracy: 80,
        xpReward: 75,
        hints: ['Keep the timing steady', 'Tap your foot to the beat', 'All notes should be evenly spaced'],
        theoryTip: 'A steady beat is the foundation of all music. Count "1-2-3-4" in your head.',
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 90 }],
        variations: [
          { id: 'faster', name: 'Double Time', transform: 'tempo', description: 'Twice as fast', modifier: 2, unlockXp: 150 },
        ],
      },
      {
        id: 'alternating_notes',
        name: 'Note Alternation',
        description: 'Switch between two notes while keeping rhythm',
        difficulty: 'beginner',
        category: 'Rhythm',
        skillFocus: ['rhythm', 'noteAccuracy'],
        targetNotes: ['C', 'G', 'C', 'G', 'C', 'G', 'C', 'G'],
        tempo: 550,
        requiredAccuracy: 80,
        xpReward: 100,
        hints: ['Alternate evenly', 'The rhythm is as important as the notes', 'Think "low-high-low-high"'],
        theoryTip: 'Alternating bass patterns like this are the foundation of many musical styles from rock to classical.',
        prerequisites: ['steady_beat'],
        practiceGoals: [{ mode: 'standard', target: 90 }, { mode: 'speed', target: 80 }],
        variations: [],
      },
      {
        id: 'syncopation_intro',
        name: 'Intro to Syncopation',
        description: 'Learn off-beat accents that make music groove',
        difficulty: 'intermediate',
        category: 'Rhythm',
        skillFocus: ['rhythm'],
        targetNotes: ['C', 'E', 'G', 'C', 'E', 'G'],
        tempo: 450,
        requiredAccuracy: 75,
        xpReward: 150,
        hints: ['Accent the off-beats', 'Feel the groove', 'The unexpected timing creates energy'],
        theoryTip: 'Syncopation is when emphasis falls on unexpected beats. It\'s what makes jazz, funk, and pop music feel alive!',
        prerequisites: ['alternating_notes'],
        practiceGoals: [{ mode: 'standard', target: 85 }],
        variations: [],
      },
    ],
  },
  {
    id: 'jazz_foundations',
    name: 'Jazz Foundations',
    description: 'Learn to improvise with jazz scales and patterns',
    icon: '🎷',
    color: '#8B5CF6',
    unlockRequirement: 500,
    isPremium: true,
    estimatedHours: 8,
    skillFocus: ['improvisation', 'harmony', 'melodyRecognition'],
    lessons: [
      {
        id: 'blues_scale',
        name: 'Blues Scale',
        description: 'The foundation of jazz and blues improvisation',
        difficulty: 'advanced',
        category: 'Jazz',
        skillFocus: ['improvisation', 'melodyRecognition'],
        targetNotes: ['C', 'D#', 'F', 'F#', 'G', 'A#', 'C'],
        tempo: 400,
        requiredAccuracy: 80,
        xpReward: 200,
        hints: ['Blue notes add tension', 'Feel the groove', 'The flat 5 (F#) is the secret sauce'],
        theoryTip: 'The blues scale adds "blue notes" (b3, b5, b7) to create that soulful sound. These notes bend between major and minor.',
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 85 }, { mode: 'improvisation', target: 70 }],
        variations: [
          { id: 'improvise', name: 'Improvise Ending', transform: 'improvise', description: 'Create your own ending', modifier: 1, unlockXp: 400 },
        ],
      },
      {
        id: 'jazz_lick_1',
        name: 'Classic Jazz Lick',
        description: 'A timeless bebop pattern used by the masters',
        difficulty: 'advanced',
        category: 'Jazz',
        skillFocus: ['improvisation', 'rhythm'],
        targetNotes: ['G', 'A', 'B', 'D', 'C', 'A', 'G'],
        tempo: 350,
        requiredAccuracy: 80,
        xpReward: 250,
        hints: ['Swing the rhythm', 'Emphasize off-beats', 'Let the notes flow naturally'],
        theoryTip: 'This lick outlines a G major arpeggio with passing tones. Jazz players learn hundreds of these "vocabulary" licks.',
        prerequisites: ['blues_scale'],
        practiceGoals: [{ mode: 'standard', target: 85 }, { mode: 'speed', target: 75 }],
        variations: [],
      },
      {
        id: 'ii_v_i_pattern',
        name: 'II-V-I Progression',
        description: 'The most important chord progression in jazz',
        difficulty: 'advanced',
        category: 'Jazz',
        skillFocus: ['harmony', 'melodyRecognition'],
        targetNotes: ['D', 'F', 'A', 'G', 'B', 'D', 'C', 'E', 'G'],
        tempo: 400,
        requiredAccuracy: 75,
        xpReward: 300,
        hints: ['Three chords, three arpeggios', 'This progression appears everywhere', 'Listen for the resolution'],
        theoryTip: 'The II-V-I is jazz\'s "money progression." Once you hear it, you\'ll notice it in thousands of songs!',
        prerequisites: ['jazz_lick_1'],
        practiceGoals: [{ mode: 'standard', target: 80 }, { mode: 'harmony', target: 75 }, { mode: 'improvisation', target: 70 }],
        variations: [],
      },
    ],
  },
  {
    id: 'harmony_builder',
    name: 'Harmony Building',
    description: 'Learn to hear and create harmonies',
    icon: '🎼',
    color: '#06B6D4',
    unlockRequirement: 400,
    isPremium: true,
    estimatedHours: 6,
    skillFocus: ['harmony', 'earTraining'],
    lessons: [
      {
        id: 'thirds_harmony',
        name: 'Thirds Harmony',
        description: 'Learn the most common harmony interval',
        difficulty: 'intermediate',
        category: 'Harmony',
        skillFocus: ['harmony', 'earTraining'],
        targetNotes: ['C', 'E', 'D', 'F', 'E', 'G'],
        tempo: 550,
        requiredAccuracy: 80,
        xpReward: 150,
        hints: ['Each pair is a third apart', 'Major thirds sound bright', 'This is the basis of vocal harmonies'],
        theoryTip: 'A third is 4 semitones (major) or 3 semitones (minor). Most vocal harmonies use thirds.',
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 85 }, { mode: 'harmony', target: 80 }],
        variations: [],
      },
      {
        id: 'chord_tones',
        name: 'Chord Tones',
        description: 'Hear the notes that make up chords',
        difficulty: 'intermediate',
        category: 'Harmony',
        skillFocus: ['harmony', 'melodyRecognition'],
        targetNotes: ['C', 'E', 'G', 'C', 'F', 'A', 'C', 'G', 'B', 'D'],
        tempo: 500,
        requiredAccuracy: 75,
        xpReward: 175,
        hints: ['Three notes form each chord', 'Listen for major vs minor', 'The root note is the "name" of the chord'],
        theoryTip: 'A chord is built by stacking thirds. C-E-G is C major (root-major third-fifth).',
        prerequisites: ['thirds_harmony'],
        practiceGoals: [{ mode: 'standard', target: 85 }, { mode: 'harmony', target: 80 }],
        variations: [],
      },
    ],
  },
  {
    id: 'world_music',
    name: 'World Melodies',
    description: 'Explore music from around the globe',
    icon: '🌍',
    color: '#10B981',
    unlockRequirement: 350,
    isPremium: false,
    estimatedHours: 5,
    skillFocus: ['melodyRecognition', 'earTraining'],
    lessons: [
      {
        id: 'sakura_japan',
        name: 'Sakura',
        description: 'Traditional Japanese cherry blossom melody',
        difficulty: 'intermediate',
        category: 'World',
        skillFocus: ['melodyRecognition', 'earTraining'],
        targetNotes: ['D', 'D', 'F', 'D', 'D', 'F'],
        tempo: 600,
        requiredAccuracy: 85,
        xpReward: 150,
        hints: ['Pentatonic scale', 'Cherry blossom imagery', 'The repetition creates a meditative feel'],
        theoryTip: 'Japanese traditional music often uses the "In" scale, which creates its distinctive Eastern sound.',
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 90 }, { mode: 'zen', target: 85 }],
        variations: [],
      },
      {
        id: 'arirang_korea',
        name: 'Arirang',
        description: 'Beloved Korean folk song with deep emotional resonance',
        difficulty: 'intermediate',
        category: 'World',
        skillFocus: ['melodyRecognition', 'rhythm'],
        targetNotes: ['G', 'A', 'C', 'D', 'E', 'D'],
        tempo: 550,
        requiredAccuracy: 85,
        xpReward: 150,
        hints: ['Flowing melody', 'Emotional expression', 'The pentatonic scale creates a folk feel'],
        theoryTip: 'Arirang is considered one of Korea\'s most important cultural assets, with over 3,000 variations.',
        prerequisites: ['sakura_japan'],
        practiceGoals: [{ mode: 'standard', target: 90 }],
        variations: [],
      },
      {
        id: 'la_cucaracha',
        name: 'La Cucaracha',
        description: 'Famous Mexican folk song with infectious rhythm',
        difficulty: 'beginner',
        category: 'World',
        skillFocus: ['rhythm', 'melodyRecognition'],
        targetNotes: ['C', 'C', 'C', 'F', 'A', 'C', 'C', 'C', 'F', 'A'],
        tempo: 400,
        requiredAccuracy: 80,
        xpReward: 125,
        hints: ['Lively tempo', 'Repeated pattern', 'Feel the Latin rhythm'],
        theoryTip: 'This song uses a simple major scale pattern but the rhythm gives it its characteristic Latin flavor.',
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 90 }, { mode: 'speed', target: 85 }],
        variations: [],
      },
    ],
  },
  {
    id: 'video_game_themes',
    name: 'Game Soundtracks',
    description: 'Master iconic melodies from video games',
    icon: '🎮',
    color: '#EC4899',
    unlockRequirement: 250,
    isPremium: false,
    estimatedHours: 4,
    skillFocus: ['melodyRecognition', 'noteAccuracy'],
    lessons: [
      {
        id: 'mario_theme',
        name: 'Super Mario Bros',
        description: 'The most recognizable video game melody ever',
        difficulty: 'intermediate',
        category: 'Gaming',
        skillFocus: ['melodyRecognition', 'rhythm'],
        targetNotes: ['E', 'E', 'E', 'C', 'E', 'G'],
        tempo: 350,
        requiredAccuracy: 85,
        xpReward: 150,
        hints: ['Bouncy rhythm', 'The pause before the high G', 'Think of jumping for coins'],
        theoryTip: 'Koji Kondo composed this in C major - the simplest key - making it instantly memorable.',
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 90 }, { mode: 'speed', target: 85 }],
        variations: [],
      },
      {
        id: 'zelda_theme',
        name: 'Zelda Main Theme',
        description: 'Epic adventure theme from Hyrule',
        difficulty: 'intermediate',
        category: 'Gaming',
        skillFocus: ['melodyRecognition', 'noteAccuracy'],
        targetNotes: ['A', 'E', 'A', 'A', 'B', 'C#', 'D'],
        tempo: 400,
        requiredAccuracy: 85,
        xpReward: 175,
        hints: ['Heroic and adventurous', 'The rising pattern builds excitement', 'Feel the epic scale'],
        theoryTip: 'This theme uses a fanfare-like pattern common in adventure music - rising intervals that suggest triumph.',
        prerequisites: ['mario_theme'],
        practiceGoals: [{ mode: 'standard', target: 90 }],
        variations: [],
      },
      {
        id: 'tetris_theme',
        name: 'Tetris Theme (Korobeiniki)',
        description: 'Russian folk song made famous by Tetris',
        difficulty: 'intermediate',
        category: 'Gaming',
        skillFocus: ['melodyRecognition', 'rhythm'],
        targetNotes: ['E', 'B', 'C', 'D', 'C', 'B', 'A'],
        tempo: 350,
        requiredAccuracy: 85,
        xpReward: 175,
        hints: ['Minor key creates tension', 'Fast-paced like the game', 'Originally a Russian folk song'],
        theoryTip: 'This song is actually "Korobeiniki," a 19th-century Russian folk song about a peddler!',
        prerequisites: ['mario_theme'],
        practiceGoals: [{ mode: 'standard', target: 90 }, { mode: 'speed', target: 85 }],
        variations: [],
      },
    ],
  },
];

export const PRACTICE_MODE_INFO: Record<PracticeMode, { name: string; description: string; icon: string; xpBonus: number }> = {
  standard: { name: 'Standard', description: 'Listen and repeat the melody exactly', icon: '🎵', xpBonus: 1 },
  mirror: { name: 'Mirror Mode', description: 'Play the melody in reverse order', icon: '🪞', xpBonus: 1.5 },
  harmony: { name: 'Harmony Builder', description: 'Add your own harmony to the melody', icon: '🎼', xpBonus: 1.75 },
  improvisation: { name: 'Improv Jam', description: 'Create variations on the theme', icon: '🎸', xpBonus: 2 },
  speed: { name: 'Speed Run', description: 'Master the melody at increasing tempos', icon: '⚡', xpBonus: 1.5 },
  zen: { name: 'Zen Practice', description: 'Relaxed, mindful practice with no time pressure', icon: '🧘', xpBonus: 1.25 },
};

export const DIFFICULTY_MULTIPLIERS: Record<DifficultyLevel, number> = {
  beginner: 1.0,
  intermediate: 1.5,
  advanced: 2.0,
  master: 3.0,
};

export const BADGES = [
  { id: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '🌟', requirement: { type: 'lessons', value: 1 } },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day practice streak', icon: '🔥', requirement: { type: 'streak', value: 7 } },
  { id: 'streak_30', name: 'Month Master', description: '30 day practice streak', icon: '💎', requirement: { type: 'streak', value: 30 } },
  { id: 'perfect_10', name: 'Perfect 10', description: '10 lessons with 100% accuracy', icon: '🎯', requirement: { type: 'perfect', value: 10 } },
  { id: 'ear_master', name: 'Golden Ear', description: 'Reach level 10 in Ear Training', icon: '👂', requirement: { type: 'skill', value: 10, skill: 'earTraining' } },
  { id: 'melody_maestro', name: 'Melody Maestro', description: 'Complete 50 melody lessons', icon: '🎵', requirement: { type: 'lessons', value: 50 } },
  { id: 'improv_star', name: 'Improv Star', description: 'Complete 10 improvisation sessions', icon: '🌟', requirement: { type: 'mode', value: 10, mode: 'improvisation' } },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete 20 speed runs', icon: '⚡', requirement: { type: 'mode', value: 20, mode: 'speed' } },
  { id: 'harmony_hero', name: 'Harmony Hero', description: 'Reach level 5 in Harmony', icon: '🎼', requirement: { type: 'skill', value: 5, skill: 'harmony' } },
  { id: 'world_traveler', name: 'World Traveler', description: 'Complete all world music lessons', icon: '🌍', requirement: { type: 'curriculum', value: 'world_music' } },
  { id: 'jazz_cat', name: 'Jazz Cat', description: 'Complete jazz curriculum', icon: '🎷', requirement: { type: 'curriculum', value: 'jazz_foundations' } },
  { id: 'level_10', name: 'Rising Star', description: 'Reach level 10', icon: '⭐', requirement: { type: 'level', value: 10 } },
  { id: 'level_25', name: 'Expert', description: 'Reach level 25', icon: '🏆', requirement: { type: 'level', value: 25 } },
  { id: 'xp_1000', name: 'Dedicated Learner', description: 'Earn 1,000 XP', icon: '📚', requirement: { type: 'xp', value: 1000 } },
  { id: 'xp_10000', name: 'Master Musician', description: 'Earn 10,000 XP', icon: '🎓', requirement: { type: 'xp', value: 10000 } },
];

function calculateAccuracy(attempt: string[], target: string[]): number {
  if (attempt.length === 0) return 0;
  let correct = 0;
  const len = Math.min(attempt.length, target.length);
  for (let i = 0; i < len; i++) {
    if (attempt[i] === target[i]) correct++;
  }
  return Math.round((correct / target.length) * 100);
}

function getFeedbackForAttempt(attempt: string[], target: string[]): ('correct' | 'wrong' | 'close')[] {
  return attempt.map((note, i) => {
    if (i >= target.length) return 'wrong';
    if (note === target[i]) return 'correct';
    const noteIndex = NOTE_SCALE.indexOf(note);
    const targetIndex = NOTE_SCALE.indexOf(target[i]);
    if (Math.abs(noteIndex - targetIndex) <= 1) return 'close';
    return 'wrong';
  });
}

function transformNotesForMode(notes: string[], mode: PracticeMode, variation?: LessonVariation): string[] {
  let result = [...notes];
  
  if (mode === 'mirror' || variation?.transform === 'mirror') {
    result = result.reverse();
  }
  
  if (variation?.transform === 'transpose' && variation.modifier !== 0) {
    result = result.map(note => {
      const idx = NOTE_SCALE.indexOf(note);
      if (idx === -1) return note;
      const newIdx = (idx + (variation.modifier > 0 ? 12 : -12)) % 12;
      return NOTE_SCALE[newIdx < 0 ? newIdx + 12 : newIdx];
    });
  }
  
  return result;
}

function calculateTempoForMode(baseTempo: number, mode: PracticeMode, variation?: LessonVariation): number {
  let tempo = baseTempo;
  
  if (mode === 'speed') {
    tempo = Math.max(200, baseTempo * 0.6);
  } else if (mode === 'zen') {
    tempo = baseTempo * 1.5;
  }
  
  if (variation?.transform === 'tempo') {
    tempo = tempo / variation.modifier;
  }
  
  return tempo;
}

export const [LearningProvider, useLearning] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<LearningGameState>(DEFAULT_GAME_STATE);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const sessionNotesRef = useRef<number>(0);

  const statsQuery = useQuery({
    queryKey: ['learningStatsV2'],
    queryFn: async (): Promise<LearningStats> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_STATS);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_STATS, ...parsed };
        }
      } catch (error) {
        console.log('[Learning] Error loading stats:', error);
      }
      return DEFAULT_STATS;
    },
  });

  const progressQuery = useQuery({
    queryKey: ['lessonProgressV2'],
    queryFn: async (): Promise<LessonProgress[]> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.LESSON_PROGRESS);
        if (stored) return JSON.parse(stored);
      } catch (error) {
        console.log('[Learning] Error loading progress:', error);
      }
      return [];
    },
  });

  const { mutate: saveStats } = useMutation({
    mutationFn: async (stats: LearningStats) => {
      await AsyncStorage.setItem(STORAGE_KEYS.LEARNING_STATS, JSON.stringify(stats));
      return stats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningStatsV2'] });
    },
  });

  const { mutate: saveProgress } = useMutation({
    mutationFn: async (progress: LessonProgress[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify(progress));
      return progress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonProgressV2'] });
    },
  });

  const stats = statsQuery.data ?? DEFAULT_STATS;
  const lessonProgress = useMemo(() => progressQuery.data ?? [], [progressQuery.data]);

  const currentLesson = useMemo<Lesson | null>(() => {
    if (!gameState.currentLessonId) return null;
    for (const curriculum of EXPANDED_CURRICULA) {
      const lesson = curriculum.lessons.find(l => l.id === gameState.currentLessonId);
      if (lesson) return lesson;
    }
    return null;
  }, [gameState.currentLessonId]);

  const currentTargetNotes = useMemo<string[]>(() => {
    if (!currentLesson) return [];
    return transformNotesForMode(currentLesson.targetNotes, gameState.currentMode, gameState.currentVariation || undefined);
  }, [currentLesson, gameState.currentMode, gameState.currentVariation]);

  const unlockedCurricula = useMemo(() => {
    return EXPANDED_CURRICULA.filter(c => stats.totalXp >= c.unlockRequirement);
  }, [stats.totalXp]);

  const getLessonProgress = useCallback((lessonId: string): LessonProgress | null => {
    return lessonProgress.find(p => p.lessonId === lessonId) ?? null;
  }, [lessonProgress]);

  const getSkillLevel = useCallback((category: SkillCategory): SkillLevel => {
    return stats.skillLevels[category] ?? DEFAULT_SKILL_LEVELS[category];
  }, [stats.skillLevels]);

  const generateAICoachFeedback = useCallback(async (accuracy: number, attempts: number, lesson: Lesson): Promise<AICoachFeedback | null> => {
    if (!stats.aiCoachEnabled) return null;
    
    setIsGeneratingFeedback(true);
    try {
      const prompt = `You are Melody, a friendly and encouraging music coach in a melody learning app. 
A student just completed "${lesson.name}" (${lesson.difficulty} difficulty) with ${accuracy}% accuracy after ${attempts} attempts.
The lesson focused on: ${lesson.skillFocus.join(', ')}.
${lesson.theoryTip ? `Theory context: ${lesson.theoryTip}` : ''}

Generate personalized, encouraging feedback in this exact JSON format:
{"message": "your main feedback message", "suggestions": ["tip 1", "tip 2"], "encouragement": "encouraging phrase", "nextSteps": ["next step 1"], "focusAreas": ["${lesson.skillFocus[0]}"]}

Be warm, specific, and motivating. Keep it concise. Only output valid JSON.`;

      const result = await generateText(prompt);
      
      try {
        const parsed = JSON.parse(result) as {
          message: string;
          suggestions: string[];
          encouragement: string;
          nextSteps: string[];
          focusAreas: string[];
        };
        return {
          message: parsed.message || 'Great effort!',
          suggestions: parsed.suggestions || ['Keep practicing'],
          encouragement: parsed.encouragement || 'You\'re doing great!',
          nextSteps: parsed.nextSteps || ['Try the next lesson'],
          focusAreas: (parsed.focusAreas || lesson.skillFocus) as SkillCategory[],
        };
      } catch {
        return {
          message: accuracy >= 80 ? 'Great job! You\'re making excellent progress!' : 'Keep practicing, you\'re improving with every attempt!',
          suggestions: ['Try listening one more time before playing', 'Focus on the rhythm'],
          encouragement: 'Every practice session makes you better!',
          nextSteps: ['Try the next lesson', 'Practice this one again for mastery'],
          focusAreas: lesson.skillFocus,
        };
      }
    } catch (error) {
      console.log('[Learning] AI Coach error:', error);
      return {
        message: accuracy >= 80 ? 'Great job! You\'re making excellent progress!' : 'Keep practicing, you\'re improving with every attempt!',
        suggestions: ['Try listening one more time before playing', 'Focus on the rhythm'],
        encouragement: 'Every practice session makes you better!',
        nextSteps: ['Try the next lesson', 'Practice this one again for mastery'],
        focusAreas: lesson.skillFocus,
      };
    } finally {
      setIsGeneratingFeedback(false);
    }
  }, [stats.aiCoachEnabled]);

  const startLesson = useCallback((lesson: Lesson, mode: PracticeMode = 'standard', variation?: LessonVariation) => {
    console.log('[Learning] Starting lesson:', lesson.name, 'Mode:', mode);
    setSessionStartTime(Date.now());
    sessionNotesRef.current = 0;
    
    const tempo = calculateTempoForMode(lesson.tempo, mode, variation);
    
    setGameState({
      currentLessonId: lesson.id,
      currentVariation: variation || null,
      currentMode: mode,
      attempts: [],
      currentAttempt: [],
      isListening: false,
      isPlaying: false,
      isRecording: false,
      gamePhase: 'ready',
      accuracy: 0,
      streak: 0,
      currentTempo: tempo,
      harmonyNotes: [],
      aiCoachFeedback: null,
      pitchDetectionActive: false,
      confidenceThreshold: 0.7,
      comboMultiplier: 1,
      sessionXpGained: 0,
    });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const startListening = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'listening',
      isListening: true,
    }));
  }, []);

  const finishListening = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'repeating',
      isListening: false,
      currentAttempt: [],
    }));
  }, []);

  const addNoteToAttempt = useCallback((note: string) => {
    if (!currentLesson || gameState.gamePhase !== 'repeating') return;
    
    sessionNotesRef.current++;
    
    setGameState(prev => {
      const newAttempt = [...prev.currentAttempt, note];
      if (newAttempt.length > currentTargetNotes.length) return prev;
      return { ...prev, currentAttempt: newAttempt };
    });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentLesson, gameState.gamePhase, currentTargetNotes.length]);

  const removeNoteFromAttempt = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentAttempt: prev.currentAttempt.slice(0, -1),
    }));
  }, []);

  const submitAttempt = useCallback(async () => {
    if (!currentLesson || gameState.currentAttempt.length !== currentTargetNotes.length) return;

    const accuracy = calculateAccuracy(gameState.currentAttempt, currentTargetNotes);
    const feedback = getFeedbackForAttempt(gameState.currentAttempt, currentTargetNotes);
    
    const attempt: RepetitionAttempt = {
      notes: gameState.currentAttempt,
      accuracy,
      timing: [],
      feedback,
      mode: gameState.currentMode,
      tempoUsed: gameState.currentTempo,
      timestamp: Date.now(),
    };

    const newAttempts = [...gameState.attempts, attempt];
    const avgAccuracy = Math.round(newAttempts.reduce((acc, a) => acc + a.accuracy, 0) / newAttempts.length);
    const isComplete = accuracy >= currentLesson.requiredAccuracy || newAttempts.length >= 5;

    const newStreak = accuracy === 100 ? gameState.streak + 1 : 0;
    const newMultiplier = newStreak >= 5 ? 2.5 : newStreak >= 3 ? 2 : newStreak >= 2 ? 1.5 : 1;

    let aiCoachFeedback: AICoachFeedback | null = null;
    if (isComplete && stats.aiCoachEnabled) {
      aiCoachFeedback = await generateAICoachFeedback(avgAccuracy, newAttempts.length, currentLesson);
    }

    setGameState(prev => ({
      ...prev,
      attempts: newAttempts,
      currentAttempt: [],
      gamePhase: isComplete ? (aiCoachFeedback ? 'coaching' : 'complete') : 'feedback',
      accuracy: avgAccuracy,
      streak: newStreak,
      comboMultiplier: newMultiplier,
      aiCoachFeedback,
    }));

    if (isComplete) {
      const timeSpent = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
      const existingProgress = getLessonProgress(currentLesson.id);
      const starsEarned = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : accuracy >= currentLesson.requiredAccuracy ? 1 : 0;
      
      const completedModes = existingProgress?.modesCompleted || [];
      if (!completedModes.includes(gameState.currentMode)) {
        completedModes.push(gameState.currentMode);
      }
      
      const newProgress: LessonProgress = {
        lessonId: currentLesson.id,
        completed: accuracy >= currentLesson.requiredAccuracy,
        accuracy: Math.max(existingProgress?.accuracy ?? 0, avgAccuracy),
        bestStreak: Math.max(existingProgress?.bestStreak ?? 0, newStreak),
        attempts: (existingProgress?.attempts ?? 0) + newAttempts.length,
        lastAttemptDate: new Date().toISOString(),
        starsEarned: Math.max(existingProgress?.starsEarned ?? 0, starsEarned),
        timeSpentSeconds: (existingProgress?.timeSpentSeconds ?? 0) + timeSpent,
        modesCompleted: completedModes,
        perfectRuns: (existingProgress?.perfectRuns ?? 0) + (accuracy === 100 ? 1 : 0),
      };

      const updatedProgress = lessonProgress.filter(p => p.lessonId !== currentLesson.id);
      updatedProgress.push(newProgress);
      saveProgress(updatedProgress);

      if (accuracy >= currentLesson.requiredAccuracy) {
        const modeBonus = PRACTICE_MODE_INFO[gameState.currentMode].xpBonus;
        const difficultyBonus = DIFFICULTY_MULTIPLIERS[currentLesson.difficulty];
        const xpGained = Math.round(currentLesson.xpReward * difficultyBonus * modeBonus * newMultiplier * (accuracy / 100));
        const isFirstComplete = !existingProgress?.completed;
        
        const skillXpGains: Partial<Record<SkillCategory, number>> = {};
        currentLesson.skillFocus.forEach(skill => {
          skillXpGains[skill] = Math.round(xpGained * 0.2);
        });

        const newSkillLevels = { ...stats.skillLevels };
        Object.entries(skillXpGains).forEach(([skill, xp]) => {
          const skillLevel = newSkillLevels[skill as SkillCategory];
          if (skillLevel && xp) {
            skillLevel.xp += xp;
            while (skillLevel.xp >= skillLevel.maxXp) {
              skillLevel.xp -= skillLevel.maxXp;
              skillLevel.level++;
              skillLevel.maxXp = Math.round(skillLevel.maxXp * 1.5);
            }
          }
        });

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const lastPractice = stats.lastPracticeDate?.split('T')[0];
        
        let newStreak = stats.currentStreak;
        if (lastPractice === today) {
          // Same day, keep streak
        } else if (lastPractice === yesterday) {
          newStreak++;
        } else {
          newStreak = 1;
        }

        const newStats: LearningStats = {
          ...stats,
          totalLessonsCompleted: isFirstComplete ? stats.totalLessonsCompleted + 1 : stats.totalLessonsCompleted,
          totalPracticeMinutes: stats.totalPracticeMinutes + Math.ceil(timeSpent / 60),
          totalXp: stats.totalXp + (isFirstComplete ? xpGained : Math.round(xpGained * 0.2)),
          averageAccuracy: Math.round((stats.averageAccuracy * stats.totalLessonsCompleted + avgAccuracy) / (stats.totalLessonsCompleted + 1)),
          lastPracticeDate: new Date().toISOString(),
          currentStreak: newStreak,
          longestStreak: Math.max(stats.longestStreak, newStreak),
          skillLevels: newSkillLevels,
          totalNotesPlayed: stats.totalNotesPlayed + sessionNotesRef.current,
          perfectLessons: stats.perfectLessons + (accuracy === 100 && isFirstComplete ? 1 : 0),
        };

        const xpForLevel = (level: number) => Math.round(100 * Math.pow(1.5, level - 1));
        while (newStats.totalXp >= xpForLevel(newStats.currentLevel)) {
          newStats.currentLevel++;
        }

        setGameState(prev => ({
          ...prev,
          sessionXpGained: isFirstComplete ? xpGained : Math.round(xpGained * 0.2),
        }));

        saveStats(newStats);
      }

      if (Platform.OS !== 'web') {
        if (accuracy >= currentLesson.requiredAccuracy) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    } else {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [currentLesson, currentTargetNotes, gameState, sessionStartTime, lessonProgress, stats, getLessonProgress, saveProgress, saveStats, generateAICoachFeedback]);

  const retryLesson = useCallback(() => {
    setSessionStartTime(Date.now());
    sessionNotesRef.current = 0;
    setGameState(prev => ({
      ...prev,
      attempts: [],
      currentAttempt: [],
      gamePhase: 'ready',
      accuracy: 0,
      streak: 0,
      aiCoachFeedback: null,
      comboMultiplier: 1,
    }));
  }, []);

  const exitLesson = useCallback(() => {
    setGameState(DEFAULT_GAME_STATE);
    setSessionStartTime(null);
    sessionNotesRef.current = 0;
  }, []);

  const continueToNextPhase = useCallback(() => {
    if (gameState.gamePhase === 'feedback') {
      setGameState(prev => ({
        ...prev,
        gamePhase: 'ready',
        currentAttempt: [],
      }));
    } else if (gameState.gamePhase === 'coaching') {
      setGameState(prev => ({
        ...prev,
        gamePhase: 'complete',
      }));
    }
  }, [gameState.gamePhase]);

  const setMode = useCallback((mode: PracticeMode) => {
    if (!currentLesson) return;
    const tempo = calculateTempoForMode(currentLesson.tempo, mode, gameState.currentVariation || undefined);
    setGameState(prev => ({
      ...prev,
      currentMode: mode,
      currentTempo: tempo,
    }));
  }, [currentLesson, gameState.currentVariation]);

  const adjustTempo = useCallback((delta: number) => {
    setGameState(prev => ({
      ...prev,
      currentTempo: Math.max(200, Math.min(1000, prev.currentTempo + delta)),
    }));
  }, []);

  const getRecommendedLesson = useCallback((): Lesson | null => {
    for (const curriculum of unlockedCurricula) {
      for (const lesson of curriculum.lessons) {
        const progress = getLessonProgress(lesson.id);
        if (!progress?.completed) return lesson;
      }
    }
    return unlockedCurricula[0]?.lessons[0] ?? null;
  }, [unlockedCurricula, getLessonProgress]);

  const getDailyChallenge = useCallback((): Lesson | null => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const allLessons = EXPANDED_CURRICULA.flatMap(c => c.lessons);
    return allLessons[seed % allLessons.length];
  }, []);

  const getWeeklyProgress = useCallback((): { completed: number; goal: number; percentage: number } => {
    const goal = stats.weeklyGoal;
    const completed = stats.weeklyProgress;
    return { completed, goal, percentage: Math.min(100, Math.round((completed / goal) * 100)) };
  }, [stats.weeklyGoal, stats.weeklyProgress]);

  const getSkillBreakdown = useCallback((): { category: SkillCategory; level: number; progress: number }[] => {
    return Object.entries(stats.skillLevels).map(([category, skill]) => ({
      category: category as SkillCategory,
      level: skill.level,
      progress: Math.round((skill.xp / skill.maxXp) * 100),
    }));
  }, [stats.skillLevels]);

  const toggleAICoach = useCallback(() => {
    const newStats = { ...stats, aiCoachEnabled: !stats.aiCoachEnabled };
    saveStats(newStats);
  }, [stats, saveStats]);

  const toggleAdaptiveDifficulty = useCallback(() => {
    const newStats = { ...stats, adaptiveDifficultyEnabled: !stats.adaptiveDifficultyEnabled };
    saveStats(newStats);
  }, [stats, saveStats]);

  const getCurriculumProgress = useCallback((curriculumId: string): { completed: number; total: number; percentage: number } => {
    const curriculum = EXPANDED_CURRICULA.find(c => c.id === curriculumId);
    if (!curriculum) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = curriculum.lessons.filter(l => getLessonProgress(l.id)?.completed).length;
    return {
      completed,
      total: curriculum.lessons.length,
      percentage: Math.round((completed / curriculum.lessons.length) * 100),
    };
  }, [getLessonProgress]);

  return {
    stats,
    lessonProgress,
    gameState,
    currentLesson,
    currentTargetNotes,
    unlockedCurricula,
    curricula: EXPANDED_CURRICULA,
    isLoading: statsQuery.isLoading || progressQuery.isLoading,
    isGeneratingFeedback,
    practiceModes: PRACTICE_MODE_INFO,
    badges: BADGES,
    getLessonProgress,
    getSkillLevel,
    startLesson,
    startListening,
    finishListening,
    addNoteToAttempt,
    removeNoteFromAttempt,
    submitAttempt,
    retryLesson,
    exitLesson,
    continueToNextPhase,
    setMode,
    adjustTempo,
    getRecommendedLesson,
    getDailyChallenge,
    getWeeklyProgress,
    getSkillBreakdown,
    getCurriculumProgress,
    toggleAICoach,
    toggleAdaptiveDifficulty,
  };
});
