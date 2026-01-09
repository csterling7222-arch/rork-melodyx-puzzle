import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NOTE_SCALE } from '@/utils/melodies';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  accuracy: number;
  bestStreak: number;
  attempts: number;
  lastAttemptDate: string;
  starsEarned: number;
  timeSpentSeconds: number;
}

export interface SkillLevel {
  name: string;
  level: number;
  xp: number;
  maxXp: number;
}

export interface LearningStats {
  totalLessonsCompleted: number;
  totalPracticeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  totalXp: number;
  currentLevel: number;
  skillLevels: {
    earTraining: SkillLevel;
    rhythm: SkillLevel;
    melodyRecognition: SkillLevel;
    noteAccuracy: SkillLevel;
  };
  badges: string[];
  certificates: string[];
  lastPracticeDate: string | null;
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  category: string;
  targetNotes: string[];
  tempo: number;
  requiredAccuracy: number;
  xpReward: number;
  hints: string[];
  variations: LessonVariation[];
}

export interface LessonVariation {
  name: string;
  transform: 'transpose' | 'tempo' | 'harmony' | 'improvise';
  description: string;
}

export interface Curriculum {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  lessons: Lesson[];
  unlockRequirement: number;
}

export interface RepetitionAttempt {
  notes: string[];
  accuracy: number;
  timing: number[];
  feedback: ('correct' | 'wrong' | 'close')[];
}

export interface LearningGameState {
  currentLessonId: string | null;
  currentVariation: string | null;
  attempts: RepetitionAttempt[];
  currentAttempt: string[];
  isListening: boolean;
  isPlaying: boolean;
  gamePhase: 'ready' | 'listening' | 'repeating' | 'feedback' | 'complete';
  accuracy: number;
  streak: number;
}

const STORAGE_KEYS = {
  LEARNING_STATS: 'melodyx_learning_stats',
  LESSON_PROGRESS: 'melodyx_lesson_progress',
  LEARNING_GAME: 'melodyx_learning_game',
};

const DEFAULT_STATS: LearningStats = {
  totalLessonsCompleted: 0,
  totalPracticeMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  averageAccuracy: 0,
  totalXp: 0,
  currentLevel: 1,
  skillLevels: {
    earTraining: { name: 'Ear Training', level: 1, xp: 0, maxXp: 100 },
    rhythm: { name: 'Rhythm', level: 1, xp: 0, maxXp: 100 },
    melodyRecognition: { name: 'Melody Recognition', level: 1, xp: 0, maxXp: 100 },
    noteAccuracy: { name: 'Note Accuracy', level: 1, xp: 0, maxXp: 100 },
  },
  badges: [],
  certificates: [],
  lastPracticeDate: null,
};

const DEFAULT_GAME_STATE: LearningGameState = {
  currentLessonId: null,
  currentVariation: null,
  attempts: [],
  currentAttempt: [],
  isListening: false,
  isPlaying: false,
  gamePhase: 'ready',
  accuracy: 0,
  streak: 0,
};

export const CURRICULA: Curriculum[] = [
  {
    id: 'ear_training_basics',
    name: 'Ear Training Basics',
    description: 'Learn to recognize notes and intervals',
    icon: '👂',
    color: '#A78BFA',
    unlockRequirement: 0,
    lessons: [
      {
        id: 'single_notes_1',
        name: 'Single Note Recognition',
        description: 'Listen and repeat individual notes',
        difficulty: 'beginner',
        category: 'Ear Training',
        targetNotes: ['C', 'E', 'G'],
        tempo: 800,
        requiredAccuracy: 70,
        xpReward: 50,
        hints: ['Start with the easiest notes', 'Listen for the pitch height'],
        variations: [],
      },
      {
        id: 'simple_intervals',
        name: 'Simple Intervals',
        description: 'Learn to hear the distance between notes',
        difficulty: 'beginner',
        category: 'Ear Training',
        targetNotes: ['C', 'G'],
        tempo: 700,
        requiredAccuracy: 75,
        xpReward: 75,
        hints: ['A perfect fifth sounds bright', 'Think of Star Wars opening'],
        variations: [
          { name: 'Octave Jump', transform: 'transpose', description: 'Try one octave higher' },
        ],
      },
      {
        id: 'three_note_patterns',
        name: 'Three Note Patterns',
        description: 'Recognize and repeat 3-note melodies',
        difficulty: 'beginner',
        category: 'Ear Training',
        targetNotes: ['C', 'D', 'E'],
        tempo: 600,
        requiredAccuracy: 75,
        xpReward: 100,
        hints: ['Focus on the direction - up or down?', 'Sing along in your head'],
        variations: [
          { name: 'Reverse', transform: 'transpose', description: 'Play in reverse order' },
        ],
      },
    ],
  },
  {
    id: 'melody_mastery',
    name: 'Melody Mastery',
    description: 'Master famous melodies through repetition',
    icon: '🎵',
    color: '#22C55E',
    unlockRequirement: 100,
    lessons: [
      {
        id: 'nursery_rhymes',
        name: 'Nursery Rhymes',
        description: 'Classic children\'s songs everyone knows',
        difficulty: 'beginner',
        category: 'Melody',
        targetNotes: ['C', 'C', 'G', 'G', 'A', 'A', 'G'],
        tempo: 500,
        requiredAccuracy: 80,
        xpReward: 100,
        hints: ['Think "Twinkle Twinkle"', 'First 7 notes repeat a pattern'],
        variations: [
          { name: 'Faster Tempo', transform: 'tempo', description: 'Play at 1.5x speed' },
        ],
      },
      {
        id: 'happy_birthday',
        name: 'Happy Birthday',
        description: 'The most sung song in the world',
        difficulty: 'beginner',
        category: 'Melody',
        targetNotes: ['G', 'G', 'A', 'G', 'C', 'B'],
        tempo: 500,
        requiredAccuracy: 80,
        xpReward: 100,
        hints: ['Start with two same notes', 'The melody rises then falls'],
        variations: [],
      },
      {
        id: 'ode_to_joy',
        name: 'Ode to Joy',
        description: 'Beethoven\'s masterpiece',
        difficulty: 'intermediate',
        category: 'Classical',
        targetNotes: ['E', 'E', 'F', 'G', 'G', 'F', 'E'],
        tempo: 500,
        requiredAccuracy: 85,
        xpReward: 150,
        hints: ['Step-wise motion mostly', 'Mirror pattern'],
        variations: [
          { name: 'Add Harmony', transform: 'harmony', description: 'Add bass notes' },
        ],
      },
    ],
  },
  {
    id: 'pop_songs',
    name: 'Pop Song Hooks',
    description: 'Learn catchy hooks from popular songs',
    icon: '🎤',
    color: '#EF4444',
    unlockRequirement: 300,
    lessons: [
      {
        id: 'shape_of_you_hook',
        name: 'Shape of You',
        description: 'Ed Sheeran\'s viral hit',
        difficulty: 'intermediate',
        category: 'Pop',
        targetNotes: ['C#', 'C#', 'B', 'A', 'B', 'C#'],
        tempo: 450,
        requiredAccuracy: 85,
        xpReward: 150,
        hints: ['Syncopated rhythm', 'Minor key feeling'],
        variations: [
          { name: 'Original Key', transform: 'transpose', description: 'Try in C# minor' },
        ],
      },
      {
        id: 'bad_guy_hook',
        name: 'Bad Guy',
        description: 'Billie Eilish\'s signature bass',
        difficulty: 'intermediate',
        category: 'Pop',
        targetNotes: ['G', 'G', 'D#', 'D', 'D', 'A#'],
        tempo: 400,
        requiredAccuracy: 85,
        xpReward: 175,
        hints: ['Low, punchy notes', 'Sparse melody'],
        variations: [],
      },
    ],
  },
  {
    id: 'jazz_improvisation',
    name: 'Jazz Foundations',
    description: 'Learn to improvise with jazz scales',
    icon: '🎷',
    color: '#F59E0B',
    unlockRequirement: 500,
    lessons: [
      {
        id: 'blues_scale',
        name: 'Blues Scale',
        description: 'The foundation of jazz and blues',
        difficulty: 'advanced',
        category: 'Jazz',
        targetNotes: ['C', 'D#', 'F', 'F#', 'G', 'A#', 'C'],
        tempo: 400,
        requiredAccuracy: 80,
        xpReward: 200,
        hints: ['Blue notes add tension', 'Feel the groove'],
        variations: [
          { name: 'Improvise Ending', transform: 'improvise', description: 'Create your own ending' },
        ],
      },
      {
        id: 'jazz_lick_1',
        name: 'Classic Jazz Lick',
        description: 'A timeless bebop pattern',
        difficulty: 'advanced',
        category: 'Jazz',
        targetNotes: ['G', 'A', 'B', 'D', 'C', 'A', 'G'],
        tempo: 350,
        requiredAccuracy: 80,
        xpReward: 250,
        hints: ['Swing the rhythm', 'Emphasize off-beats'],
        variations: [],
      },
    ],
  },
  {
    id: 'world_music',
    name: 'World Melodies',
    description: 'Explore music from around the globe',
    icon: '🌍',
    color: '#06B6D4',
    unlockRequirement: 250,
    lessons: [
      {
        id: 'sakura_japan',
        name: 'Sakura',
        description: 'Traditional Japanese melody',
        difficulty: 'intermediate',
        category: 'World',
        targetNotes: ['D', 'D', 'F', 'D', 'D', 'F'],
        tempo: 600,
        requiredAccuracy: 85,
        xpReward: 150,
        hints: ['Pentatonic scale', 'Cherry blossom imagery'],
        variations: [],
      },
      {
        id: 'arirang_korea',
        name: 'Arirang',
        description: 'Beloved Korean folk song',
        difficulty: 'intermediate',
        category: 'World',
        targetNotes: ['G', 'A', 'C', 'D', 'E', 'D'],
        tempo: 550,
        requiredAccuracy: 85,
        xpReward: 150,
        hints: ['Flowing melody', 'Emotional expression'],
        variations: [],
      },
    ],
  },
];

export const DIFFICULTY_MULTIPLIERS = {
  beginner: 1.0,
  intermediate: 1.5,
  advanced: 2.0,
  master: 3.0,
};

export const BADGES = [
  { id: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '🌟' },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day practice streak', icon: '🔥' },
  { id: 'streak_30', name: 'Month Master', description: '30 day practice streak', icon: '💎' },
  { id: 'perfect_10', name: 'Perfect 10', description: '10 lessons with 100% accuracy', icon: '🎯' },
  { id: 'ear_master', name: 'Golden Ear', description: 'Max out Ear Training skill', icon: '👂' },
  { id: 'melody_maestro', name: 'Melody Maestro', description: 'Complete all melody lessons', icon: '🎵' },
  { id: 'world_traveler', name: 'World Traveler', description: 'Complete all world music', icon: '🌍' },
  { id: 'jazz_cat', name: 'Jazz Cat', description: 'Complete jazz curriculum', icon: '🎷' },
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

export const [LearningProvider, useLearning] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<LearningGameState>(DEFAULT_GAME_STATE);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const statsQuery = useQuery({
    queryKey: ['learningStats'],
    queryFn: async (): Promise<LearningStats> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_STATS);
        if (stored) return JSON.parse(stored);
      } catch (error) {
        console.log('[Learning] Error loading stats:', error);
      }
      return DEFAULT_STATS;
    },
  });

  const progressQuery = useQuery({
    queryKey: ['lessonProgress'],
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
      queryClient.invalidateQueries({ queryKey: ['learningStats'] });
    },
  });

  const { mutate: saveProgress } = useMutation({
    mutationFn: async (progress: LessonProgress[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify(progress));
      return progress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonProgress'] });
    },
  });

  const stats = statsQuery.data ?? DEFAULT_STATS;
  const lessonProgress = useMemo(() => progressQuery.data ?? [], [progressQuery.data]);

  const currentLesson = useMemo<Lesson | null>(() => {
    if (!gameState.currentLessonId) return null;
    for (const curriculum of CURRICULA) {
      const lesson = curriculum.lessons.find(l => l.id === gameState.currentLessonId);
      if (lesson) return lesson;
    }
    return null;
  }, [gameState.currentLessonId]);

  const unlockedCurricula = useMemo(() => {
    return CURRICULA.filter(c => stats.totalXp >= c.unlockRequirement);
  }, [stats.totalXp]);

  const getLessonProgress = useCallback((lessonId: string): LessonProgress | null => {
    return lessonProgress.find(p => p.lessonId === lessonId) ?? null;
  }, [lessonProgress]);

  const startLesson = useCallback((lesson: Lesson, variation?: string) => {
    console.log('[Learning] Starting lesson:', lesson.name);
    setSessionStartTime(Date.now());
    setGameState({
      currentLessonId: lesson.id,
      currentVariation: variation || null,
      attempts: [],
      currentAttempt: [],
      isListening: false,
      isPlaying: false,
      gamePhase: 'ready',
      accuracy: 0,
      streak: 0,
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
    
    setGameState(prev => {
      const newAttempt = [...prev.currentAttempt, note];
      if (newAttempt.length > currentLesson.targetNotes.length) return prev;
      return { ...prev, currentAttempt: newAttempt };
    });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentLesson, gameState.gamePhase]);

  const removeNoteFromAttempt = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentAttempt: prev.currentAttempt.slice(0, -1),
    }));
  }, []);

  const submitAttempt = useCallback(() => {
    if (!currentLesson || gameState.currentAttempt.length !== currentLesson.targetNotes.length) return;

    const accuracy = calculateAccuracy(gameState.currentAttempt, currentLesson.targetNotes);
    const feedback = getFeedbackForAttempt(gameState.currentAttempt, currentLesson.targetNotes);
    
    const attempt: RepetitionAttempt = {
      notes: gameState.currentAttempt,
      accuracy,
      timing: [],
      feedback,
    };

    const newAttempts = [...gameState.attempts, attempt];
    const avgAccuracy = Math.round(newAttempts.reduce((acc, a) => acc + a.accuracy, 0) / newAttempts.length);
    const isComplete = accuracy >= currentLesson.requiredAccuracy || newAttempts.length >= 5;

    setGameState(prev => ({
      ...prev,
      attempts: newAttempts,
      currentAttempt: [],
      gamePhase: isComplete ? 'complete' : 'feedback',
      accuracy: avgAccuracy,
      streak: accuracy === 100 ? prev.streak + 1 : 0,
    }));

    if (isComplete) {
      const timeSpent = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
      const existingProgress = getLessonProgress(currentLesson.id);
      const starsEarned = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : accuracy >= currentLesson.requiredAccuracy ? 1 : 0;
      
      const newProgress: LessonProgress = {
        lessonId: currentLesson.id,
        completed: accuracy >= currentLesson.requiredAccuracy,
        accuracy: Math.max(existingProgress?.accuracy ?? 0, avgAccuracy),
        bestStreak: Math.max(existingProgress?.bestStreak ?? 0, gameState.streak),
        attempts: (existingProgress?.attempts ?? 0) + newAttempts.length,
        lastAttemptDate: new Date().toISOString(),
        starsEarned: Math.max(existingProgress?.starsEarned ?? 0, starsEarned),
        timeSpentSeconds: (existingProgress?.timeSpentSeconds ?? 0) + timeSpent,
      };

      const updatedProgress = lessonProgress.filter(p => p.lessonId !== currentLesson.id);
      updatedProgress.push(newProgress);
      saveProgress(updatedProgress);

      if (accuracy >= currentLesson.requiredAccuracy) {
        const xpGained = Math.round(currentLesson.xpReward * DIFFICULTY_MULTIPLIERS[currentLesson.difficulty] * (accuracy / 100));
        const isFirstComplete = !existingProgress?.completed;
        
        const newStats: LearningStats = {
          ...stats,
          totalLessonsCompleted: isFirstComplete ? stats.totalLessonsCompleted + 1 : stats.totalLessonsCompleted,
          totalPracticeMinutes: stats.totalPracticeMinutes + Math.ceil(timeSpent / 60),
          totalXp: stats.totalXp + (isFirstComplete ? xpGained : Math.round(xpGained * 0.2)),
          averageAccuracy: Math.round((stats.averageAccuracy * stats.totalLessonsCompleted + avgAccuracy) / (stats.totalLessonsCompleted + 1)),
          lastPracticeDate: new Date().toISOString(),
        };

        const xpForLevel = (level: number) => 100 * Math.pow(1.5, level - 1);
        while (newStats.totalXp >= xpForLevel(newStats.currentLevel)) {
          newStats.currentLevel++;
        }

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
  }, [currentLesson, gameState, sessionStartTime, lessonProgress, stats, getLessonProgress, saveProgress, saveStats]);

  const retryLesson = useCallback(() => {
    setSessionStartTime(Date.now());
    setGameState(prev => ({
      ...prev,
      attempts: [],
      currentAttempt: [],
      gamePhase: 'ready',
      accuracy: 0,
      streak: 0,
    }));
  }, []);

  const exitLesson = useCallback(() => {
    setGameState(DEFAULT_GAME_STATE);
    setSessionStartTime(null);
  }, []);

  const continueToNextPhase = useCallback(() => {
    if (gameState.gamePhase === 'feedback') {
      setGameState(prev => ({
        ...prev,
        gamePhase: 'ready',
        currentAttempt: [],
      }));
    }
  }, [gameState.gamePhase]);

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
    const allLessons = CURRICULA.flatMap(c => c.lessons);
    return allLessons[seed % allLessons.length];
  }, []);

  return {
    stats,
    lessonProgress,
    gameState,
    currentLesson,
    unlockedCurricula,
    curricula: CURRICULA,
    isLoading: statsQuery.isLoading || progressQuery.isLoading,
    getLessonProgress,
    startLesson,
    startListening,
    finishListening,
    addNoteToAttempt,
    removeNoteFromAttempt,
    submitAttempt,
    retryLesson,
    exitLesson,
    continueToNextPhase,
    getRecommendedLesson,
    getDailyChallenge,
  };
});
