import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NOTE_SCALE } from '@/utils/melodies';
import { generateText } from '@rork-ai/toolkit-sdk';
import {
  PracticeMode,
  DifficultyLevel,
  SkillCategory,
  Lesson,
  Curriculum,
  LessonVariation,
  EXPANDED_CURRICULA,
  PRACTICE_MODE_INFO,
  DIFFICULTY_CONFIG,
  SKILL_INFO,
  POWER_UPS,
  LEARNING_BADGES,
  CERTIFICATES,
  AI_COACH_PROMPTS,
  LEARNING_MILESTONES,
} from '@/constants/learning';

export type { PracticeMode, DifficultyLevel, SkillCategory, Lesson, Curriculum, LessonVariation };

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
  highestCombo: number;
  variationsCompleted: string[];
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
  modesUsed: PracticeMode[];
  highestCombo: number;
}

export interface DailyGoal {
  lessonsTarget: number;
  lessonsCompleted: number;
  minutesTarget: number;
  minutesCompleted: number;
  xpTarget: number;
  xpEarned: number;
  streakMaintained: boolean;
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
  dailyGoal: DailyGoal;
  powerUpsOwned: Record<string, number>;
  highestCombo: number;
  voiceInputEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  accessibilityMode: 'standard' | 'high-contrast' | 'reduced-motion';
  preferredTempo: 'slow' | 'normal' | 'fast';
}

export interface RepetitionAttempt {
  notes: string[];
  accuracy: number;
  timing: number[];
  feedback: ('correct' | 'wrong' | 'close')[];
  mode: PracticeMode;
  tempoUsed: number;
  timestamp: number;
  inputMethod: 'keyboard' | 'voice' | 'midi';
}

export interface AICoachFeedback {
  message: string;
  suggestions: string[];
  encouragement: string;
  nextSteps: string[];
  focusAreas: SkillCategory[];
  personalizedDrill?: {
    notes: string[];
    description: string;
    difficulty: DifficultyLevel;
  };
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
  gamePhase: 'ready' | 'listening' | 'repeating' | 'feedback' | 'complete' | 'coaching' | 'countdown';
  accuracy: number;
  streak: number;
  currentTempo: number;
  harmonyNotes: string[];
  aiCoachFeedback: AICoachFeedback | null;
  pitchDetectionActive: boolean;
  confidenceThreshold: number;
  comboMultiplier: number;
  sessionXpGained: number;
  activePowerUps: string[];
  countdownValue: number;
  inputMethod: 'keyboard' | 'voice' | 'midi';
  showHints: boolean;
  zenModeActive: boolean;
  aiDuetNotes: string[];
  challengeTimeRemaining: number;
  perfectStreak: number;
}

const STORAGE_KEYS = {
  LEARNING_STATS: 'melodyx_learning_stats_v3',
  LESSON_PROGRESS: 'melodyx_lesson_progress_v3',
  LEARNING_GAME: 'melodyx_learning_game_v3',
};

const DEFAULT_SKILL_LEVELS: Record<SkillCategory, SkillLevel> = {
  earTraining: { name: 'Ear Training', level: 1, xp: 0, maxXp: 100, category: 'earTraining' },
  rhythm: { name: 'Rhythm', level: 1, xp: 0, maxXp: 100, category: 'rhythm' },
  melodyRecognition: { name: 'Melody Recognition', level: 1, xp: 0, maxXp: 100, category: 'melodyRecognition' },
  noteAccuracy: { name: 'Note Accuracy', level: 1, xp: 0, maxXp: 100, category: 'noteAccuracy' },
  improvisation: { name: 'Improvisation', level: 1, xp: 0, maxXp: 150, category: 'improvisation' },
  harmony: { name: 'Harmony', level: 1, xp: 0, maxXp: 150, category: 'harmony' },
  sightReading: { name: 'Sight Reading', level: 1, xp: 0, maxXp: 120, category: 'sightReading' },
  composition: { name: 'Composition', level: 1, xp: 0, maxXp: 175, category: 'composition' },
  theory: { name: 'Theory', level: 1, xp: 0, maxXp: 125, category: 'theory' },
};

const DEFAULT_DAILY_GOAL: DailyGoal = {
  lessonsTarget: 3,
  lessonsCompleted: 0,
  minutesTarget: 15,
  minutesCompleted: 0,
  xpTarget: 150,
  xpEarned: 0,
  streakMaintained: false,
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
  dailyGoal: DEFAULT_DAILY_GOAL,
  powerUpsOwned: {},
  highestCombo: 0,
  voiceInputEnabled: false,
  hapticFeedbackEnabled: true,
  accessibilityMode: 'standard',
  preferredTempo: 'normal',
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
  activePowerUps: [],
  countdownValue: 3,
  inputMethod: 'keyboard',
  showHints: true,
  zenModeActive: false,
  aiDuetNotes: [],
  challengeTimeRemaining: 0,
  perfectStreak: 0,
};

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

function calculateTempoForMode(baseTempo: number, mode: PracticeMode, variation?: LessonVariation, preference?: 'slow' | 'normal' | 'fast'): number {
  let tempo = baseTempo;
  
  if (mode === 'speed' || mode === 'challenge') {
    tempo = Math.max(200, baseTempo * 0.6);
  } else if (mode === 'zen') {
    tempo = baseTempo * 1.5;
  }
  
  if (variation?.transform === 'tempo' || variation?.transform === 'speed') {
    tempo = tempo / variation.modifier;
  }
  
  if (preference === 'slow') {
    tempo = tempo * 1.3;
  } else if (preference === 'fast') {
    tempo = tempo * 0.8;
  }
  
  return Math.max(200, Math.min(1200, tempo));
}

function calculateXpForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.4, level - 1));
}

function generateHarmonyNotes(targetNotes: string[]): string[] {
  return targetNotes.map(note => {
    const idx = NOTE_SCALE.indexOf(note);
    if (idx === -1) return note;
    const thirdIdx = (idx + 4) % 12;
    return NOTE_SCALE[thirdIdx];
  });
}

function generateAIDuetNotes(targetNotes: string[], mode: 'accompany' | 'counter' | 'harmony' = 'accompany'): string[] {
  if (mode === 'harmony') {
    return generateHarmonyNotes(targetNotes);
  }
  
  if (mode === 'counter') {
    return targetNotes.map(note => {
      const idx = NOTE_SCALE.indexOf(note);
      if (idx === -1) return note;
      return NOTE_SCALE[(idx + 7) % 12];
    }).reverse();
  }
  
  return targetNotes.filter((_, i) => i % 2 === 0).map(note => {
    const idx = NOTE_SCALE.indexOf(note);
    if (idx === -1) return note;
    return NOTE_SCALE[(idx - 12 + 12) % 12];
  });
}

export const [LearningProvider, useLearning] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<LearningGameState>(DEFAULT_GAME_STATE);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const sessionNotesRef = useRef<number>(0);
  const challengeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const statsQuery = useQuery({
    queryKey: ['learningStatsV3'],
    queryFn: async (): Promise<LearningStats> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_STATS);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_STATS, ...parsed, skillLevels: { ...DEFAULT_SKILL_LEVELS, ...parsed.skillLevels } };
        }
      } catch (error) {
        console.log('[Learning] Error loading stats:', error);
      }
      return DEFAULT_STATS;
    },
  });

  const progressQuery = useQuery({
    queryKey: ['lessonProgressV3'],
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
      queryClient.invalidateQueries({ queryKey: ['learningStatsV3'] });
    },
  });

  const { mutate: saveProgress } = useMutation({
    mutationFn: async (progress: LessonProgress[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify(progress));
      return progress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonProgressV3'] });
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
    return EXPANDED_CURRICULA.filter(c => {
      if (c.isPremium) return stats.totalXp >= c.unlockRequirement;
      return stats.totalXp >= c.unlockRequirement;
    });
  }, [stats.totalXp]);

  const unlockedBadges = useMemo(() => {
    return LEARNING_BADGES.filter(badge => {
      switch (badge.requirement.type) {
        case 'lessons': return stats.totalLessonsCompleted >= badge.requirement.value;
        case 'streak': return stats.longestStreak >= badge.requirement.value;
        case 'perfect': return stats.perfectLessons >= badge.requirement.value;
        case 'level': return stats.currentLevel >= badge.requirement.value;
        case 'xp': return stats.totalXp >= badge.requirement.value;
        case 'time': return stats.totalPracticeMinutes >= badge.requirement.value;
        case 'notes': return stats.totalNotesPlayed >= badge.requirement.value;
        case 'combo': return stats.highestCombo >= badge.requirement.value;
        case 'skill':
          if (badge.requirement.skill) {
            return stats.skillLevels[badge.requirement.skill]?.level >= badge.requirement.value;
          }
          return false;
        default: return false;
      }
    });
  }, [stats]);

  const currentMilestone = useMemo(() => {
    return LEARNING_MILESTONES.find(m => stats.totalXp < m.xp) || LEARNING_MILESTONES[LEARNING_MILESTONES.length - 1];
  }, [stats.totalXp]);

  useEffect(() => {
    return () => {
      if (challengeTimerRef.current) {
        clearInterval(challengeTimerRef.current);
      }
    };
  }, []);

  const getLessonProgress = useCallback((lessonId: string): LessonProgress | null => {
    return lessonProgress.find(p => p.lessonId === lessonId) ?? null;
  }, [lessonProgress]);

  const getSkillLevel = useCallback((category: SkillCategory): SkillLevel => {
    return stats.skillLevels[category] ?? DEFAULT_SKILL_LEVELS[category];
  }, [stats.skillLevels]);

  const generateAICoachFeedback = useCallback(async (accuracy: number, attempts: number, lesson: Lesson, mistakePatterns?: { note: string; correctNote: string }[]): Promise<AICoachFeedback | null> => {
    if (!stats.aiCoachEnabled) return null;
    
    setIsGeneratingFeedback(true);
    try {
      const mistakeInfo = mistakePatterns?.length 
        ? `Common mistakes: ${mistakePatterns.map(m => `${m.note} instead of ${m.correctNote}`).join(', ')}.` 
        : '';
      
      const prompt = `${AI_COACH_PROMPTS.feedback}
A student completed "${lesson.name}" (${lesson.difficulty}) with ${accuracy}% accuracy after ${attempts} attempts.
Skills: ${lesson.skillFocus.join(', ')}. ${mistakeInfo}
${lesson.theoryTip ? `Theory: ${lesson.theoryTip}` : ''}
Current level: ${stats.currentLevel}, Streak: ${stats.currentStreak} days.

Generate JSON: {"message": "feedback", "suggestions": ["tip1", "tip2"], "encouragement": "phrase", "nextSteps": ["step1"], "focusAreas": ["${lesson.skillFocus[0]}"]}`;

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
          message: accuracy >= 80 ? 'Excellent work! You\'re making great progress!' : 'Keep practicing - improvement comes with every attempt!',
          suggestions: ['Listen carefully before playing', 'Focus on the rhythm'],
          encouragement: 'Every session makes you better!',
          nextSteps: ['Try the next lesson', 'Practice for mastery'],
          focusAreas: lesson.skillFocus,
        };
      }
    } catch (error) {
      console.log('[Learning] AI Coach error:', error);
      return {
        message: accuracy >= 80 ? 'Great job!' : 'Keep practicing!',
        suggestions: ['Listen one more time before playing'],
        encouragement: 'You\'re improving!',
        nextSteps: ['Continue to next lesson'],
        focusAreas: lesson.skillFocus,
      };
    } finally {
      setIsGeneratingFeedback(false);
    }
  }, [stats.aiCoachEnabled, stats.currentLevel, stats.currentStreak]);

  const generateCustomLesson = useCallback(async (preferences: { difficulty: DifficultyLevel; skillFocus: SkillCategory[]; duration: number }): Promise<Lesson | null> => {
    setIsGeneratingLesson(true);
    try {
      const prompt = `${AI_COACH_PROMPTS.lessonGeneration}
Create a ${preferences.difficulty} lesson focusing on ${preferences.skillFocus.join(', ')}.
Duration: ~${preferences.duration} minutes. User level: ${stats.currentLevel}.
Skills: ${Object.entries(stats.skillLevels).map(([k, v]) => `${k}: Lv${v.level}`).join(', ')}.

Generate JSON: {"name": "Lesson Name", "description": "desc", "targetNotes": ["C", "D", "E"], "tempo": 500, "hints": ["hint1"], "theoryTip": "theory"}`;

      const result = await generateText(prompt);
      const parsed = JSON.parse(result);
      
      return {
        id: `custom_${Date.now()}`,
        name: parsed.name,
        description: parsed.description,
        type: 'drill',
        difficulty: preferences.difficulty,
        category: 'Custom',
        skillFocus: preferences.skillFocus,
        targetNotes: parsed.targetNotes,
        tempo: parsed.tempo || 500,
        requiredAccuracy: 75,
        xpReward: Math.round(100 * DIFFICULTY_CONFIG[preferences.difficulty].multiplier),
        hints: parsed.hints || [],
        theoryTip: parsed.theoryTip,
        prerequisites: [],
        practiceGoals: [{ mode: 'standard', target: 85 }],
        estimatedMinutes: preferences.duration,
        variations: [],
      };
    } catch (error) {
      console.log('[Learning] Lesson generation error:', error);
      return null;
    } finally {
      setIsGeneratingLesson(false);
    }
  }, [stats.currentLevel, stats.skillLevels]);

  const startChallengeTimerFn = useCallback(() => {
    if (challengeTimerRef.current) {
      clearInterval(challengeTimerRef.current);
    }
    
    challengeTimerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.challengeTimeRemaining <= 1) {
          if (challengeTimerRef.current) {
            clearInterval(challengeTimerRef.current);
          }
          return { ...prev, challengeTimeRemaining: 0, gamePhase: 'complete' };
        }
        return { ...prev, challengeTimeRemaining: prev.challengeTimeRemaining - 1 };
      });
    }, 1000);
  }, []);

  const startLesson = useCallback((lesson: Lesson, mode: PracticeMode = 'standard', variation?: LessonVariation) => {
    console.log('[Learning] Starting lesson:', lesson.name, 'Mode:', mode);
    setSessionStartTime(Date.now());
    sessionNotesRef.current = 0;
    
    const tempo = calculateTempoForMode(lesson.tempo, mode, variation, stats.preferredTempo);
    
    const harmonyNotes = mode === 'harmony' ? generateHarmonyNotes(lesson.targetNotes) : [];
    const duetNotes = mode === 'duet' ? generateAIDuetNotes(lesson.targetNotes) : [];
    
    setGameState({
      currentLessonId: lesson.id,
      currentVariation: variation || null,
      currentMode: mode,
      attempts: [],
      currentAttempt: [],
      isListening: false,
      isPlaying: false,
      isRecording: false,
      gamePhase: mode === 'challenge' ? 'countdown' : 'ready',
      accuracy: 0,
      streak: 0,
      currentTempo: tempo,
      harmonyNotes,
      aiCoachFeedback: null,
      pitchDetectionActive: stats.voiceInputEnabled,
      confidenceThreshold: 0.7,
      comboMultiplier: 1,
      sessionXpGained: 0,
      activePowerUps: [],
      countdownValue: 3,
      inputMethod: stats.voiceInputEnabled ? 'voice' : 'keyboard',
      showHints: true,
      zenModeActive: mode === 'zen',
      aiDuetNotes: duetNotes,
      challengeTimeRemaining: mode === 'challenge' ? 60 : 0,
      perfectStreak: 0,
    });

    if (Platform.OS !== 'web' && stats.hapticFeedbackEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (mode === 'challenge') {
      setTimeout(() => {
        setGameState(prev => ({ ...prev, countdownValue: 2 }));
        setTimeout(() => {
          setGameState(prev => ({ ...prev, countdownValue: 1 }));
          setTimeout(() => {
            setGameState(prev => ({ ...prev, gamePhase: 'ready', countdownValue: 0 }));
            startChallengeTimerFn();
          }, 1000);
        }, 1000);
      }, 1000);
    }
  }, [stats.preferredTempo, stats.voiceInputEnabled, stats.hapticFeedbackEnabled, startChallengeTimerFn]);



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

  const addNoteToAttempt = useCallback((note: string, inputMethod: 'keyboard' | 'voice' | 'midi' = 'keyboard') => {
    if (!currentLesson || gameState.gamePhase !== 'repeating') return;
    
    sessionNotesRef.current++;
    
    setGameState(prev => {
      const newAttempt = [...prev.currentAttempt, note];
      if (newAttempt.length > currentTargetNotes.length) return prev;
      
      const newPerfectStreak = newAttempt.length <= currentTargetNotes.length && 
        newAttempt[newAttempt.length - 1] === currentTargetNotes[newAttempt.length - 1]
        ? prev.perfectStreak + 1
        : 0;
      
      return { 
        ...prev, 
        currentAttempt: newAttempt,
        inputMethod,
        perfectStreak: newPerfectStreak,
        comboMultiplier: Math.min(3, 1 + Math.floor(newPerfectStreak / 3) * 0.5),
      };
    });

    if (Platform.OS !== 'web' && stats.hapticFeedbackEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentLesson, gameState.gamePhase, currentTargetNotes, stats.hapticFeedbackEnabled]);

  const removeNoteFromAttempt = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentAttempt: prev.currentAttempt.slice(0, -1),
      perfectStreak: 0,
    }));
  }, []);

  const completeLessonAndUpdateStatsRef = useRef<(
    accuracy: number,
    avgAccuracy: number,
    streak: number,
    multiplier: number,
    attemptCount: number,
    mistakePatterns: { note: string; correctNote: string; count: number }[]
  ) => Promise<void>>(null as unknown as () => Promise<void>);

  completeLessonAndUpdateStatsRef.current = async (
    accuracy: number,
    avgAccuracy: number,
    streak: number,
    multiplier: number,
    attemptCount: number,
    mistakePatterns: { note: string; correctNote: string; count: number }[]
  ) => {
    if (!currentLesson) return;
    
    const timeSpent = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
    const existingProgress = getLessonProgress(currentLesson.id);
    const starsEarned = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : accuracy >= currentLesson.requiredAccuracy ? 1 : 0;
    
    const completedModes = existingProgress?.modesCompleted || [];
    if (!completedModes.includes(gameState.currentMode)) {
      completedModes.push(gameState.currentMode);
    }
    
    const completedVariations = existingProgress?.variationsCompleted || [];
    if (gameState.currentVariation && !completedVariations.includes(gameState.currentVariation.id)) {
      completedVariations.push(gameState.currentVariation.id);
    }
    
    const newProgress: LessonProgress = {
      lessonId: currentLesson.id,
      completed: accuracy >= currentLesson.requiredAccuracy,
      accuracy: Math.max(existingProgress?.accuracy ?? 0, avgAccuracy),
      bestStreak: Math.max(existingProgress?.bestStreak ?? 0, streak),
      attempts: (existingProgress?.attempts ?? 0) + attemptCount,
      lastAttemptDate: new Date().toISOString(),
      starsEarned: Math.max(existingProgress?.starsEarned ?? 0, starsEarned),
      timeSpentSeconds: (existingProgress?.timeSpentSeconds ?? 0) + timeSpent,
      modesCompleted: completedModes,
      perfectRuns: (existingProgress?.perfectRuns ?? 0) + (accuracy === 100 ? 1 : 0),
      highestCombo: Math.max(existingProgress?.highestCombo ?? 0, gameState.perfectStreak),
      variationsCompleted: completedVariations,
    };

    const updatedProgress = lessonProgress.filter(p => p.lessonId !== currentLesson.id);
    updatedProgress.push(newProgress);
    saveProgress(updatedProgress);

    if (accuracy >= currentLesson.requiredAccuracy) {
      const modeBonus = PRACTICE_MODE_INFO[gameState.currentMode].xpBonus;
      const difficultyBonus = DIFFICULTY_CONFIG[currentLesson.difficulty].multiplier;
      const xpGained = Math.round(currentLesson.xpReward * difficultyBonus * modeBonus * multiplier * (accuracy / 100));
      const isFirstComplete = !existingProgress?.completed;
      
      const skillXpGains: Partial<Record<SkillCategory, number>> = {};
      currentLesson.skillFocus.forEach(skill => {
        skillXpGains[skill] = Math.round(xpGained * 0.25);
      });

      const newSkillLevels = { ...stats.skillLevels };
      Object.entries(skillXpGains).forEach(([skill, xp]) => {
        const skillLevel = newSkillLevels[skill as SkillCategory];
        if (skillLevel && xp) {
          skillLevel.xp += xp;
          while (skillLevel.xp >= skillLevel.maxXp) {
            skillLevel.xp -= skillLevel.maxXp;
            skillLevel.level++;
            skillLevel.maxXp = Math.round(skillLevel.maxXp * 1.4);
          }
        }
      });

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const lastPractice = stats.lastPracticeDate?.split('T')[0];
      
      let newStreak = stats.currentStreak;
      if (lastPractice === today) {
        // Same day
      } else if (lastPractice === yesterday) {
        newStreak++;
      } else {
        newStreak = 1;
      }

      const newDailyGoal = { ...stats.dailyGoal };
      if (isFirstComplete) {
        newDailyGoal.lessonsCompleted++;
      }
      newDailyGoal.minutesCompleted += Math.ceil(timeSpent / 60);
      newDailyGoal.xpEarned += isFirstComplete ? xpGained : Math.round(xpGained * 0.2);
      newDailyGoal.streakMaintained = newStreak > 0;

      const sessionAnalytics: SessionAnalytics = {
        date: new Date().toISOString(),
        lessonsCompleted: isFirstComplete ? 1 : 0,
        averageAccuracy: avgAccuracy,
        totalTimeMinutes: Math.ceil(timeSpent / 60),
        notesPlayed: sessionNotesRef.current,
        mistakePatterns,
        skillGains: skillXpGains,
        modesUsed: [gameState.currentMode],
        highestCombo: gameState.perfectStreak,
      };

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
        dailyGoal: newDailyGoal,
        highestCombo: Math.max(stats.highestCombo, gameState.perfectStreak),
        sessionHistory: [...stats.sessionHistory.slice(-29), sessionAnalytics],
      };

      while (newStats.totalXp >= calculateXpForLevel(newStats.currentLevel)) {
        newStats.currentLevel++;
      }

      const newBadges = [...newStats.badges];
      unlockedBadges.forEach(badge => {
        if (!newBadges.includes(badge.id)) {
          newBadges.push(badge.id);
          newStats.totalXp += badge.xpReward;
        }
      });
      newStats.badges = newBadges;

      setGameState(prev => ({
        ...prev,
        sessionXpGained: isFirstComplete ? xpGained : Math.round(xpGained * 0.2),
      }));

      saveStats(newStats);
    }
  };

  const submitAttempt = useCallback(async () => {
    if (!currentLesson || gameState.currentAttempt.length !== currentTargetNotes.length) return;

    const accuracy = calculateAccuracy(gameState.currentAttempt, currentTargetNotes);
    const feedback = getFeedbackForAttempt(gameState.currentAttempt, currentTargetNotes);
    
    const mistakePatterns: { note: string; correctNote: string; count: number }[] = [];
    feedback.forEach((f, i) => {
      if (f === 'wrong' && gameState.currentAttempt[i] !== currentTargetNotes[i]) {
        const existing = mistakePatterns.find(m => m.note === gameState.currentAttempt[i] && m.correctNote === currentTargetNotes[i]);
        if (existing) {
          existing.count++;
        } else {
          mistakePatterns.push({ note: gameState.currentAttempt[i], correctNote: currentTargetNotes[i], count: 1 });
        }
      }
    });
    
    const attempt: RepetitionAttempt = {
      notes: gameState.currentAttempt,
      accuracy,
      timing: [],
      feedback,
      mode: gameState.currentMode,
      tempoUsed: gameState.currentTempo,
      timestamp: Date.now(),
      inputMethod: gameState.inputMethod,
    };

    const newAttempts = [...gameState.attempts, attempt];
    const avgAccuracy = Math.round(newAttempts.reduce((acc, a) => acc + a.accuracy, 0) / newAttempts.length);
    const isComplete = accuracy >= currentLesson.requiredAccuracy || newAttempts.length >= 5;

    const newStreak = accuracy === 100 ? gameState.streak + 1 : 0;
    const newMultiplier = newStreak >= 5 ? 2.5 : newStreak >= 3 ? 2 : newStreak >= 2 ? 1.5 : 1;

    let aiCoachFeedback: AICoachFeedback | null = null;
    if (isComplete && stats.aiCoachEnabled) {
      aiCoachFeedback = await generateAICoachFeedback(avgAccuracy, newAttempts.length, currentLesson, mistakePatterns);
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

    if (isComplete && completeLessonAndUpdateStatsRef.current) {
      await completeLessonAndUpdateStatsRef.current(accuracy, avgAccuracy, newStreak, newMultiplier, newAttempts.length, mistakePatterns);
    }

    if (Platform.OS !== 'web' && stats.hapticFeedbackEnabled) {
      if (accuracy >= currentLesson.requiredAccuracy) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (isComplete) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [currentLesson, currentTargetNotes, gameState, stats, generateAICoachFeedback]);

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
      perfectStreak: 0,
    }));
  }, []);

  const exitLesson = useCallback(() => {
    if (challengeTimerRef.current) {
      clearInterval(challengeTimerRef.current);
    }
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
    const tempo = calculateTempoForMode(currentLesson.tempo, mode, gameState.currentVariation || undefined, stats.preferredTempo);
    const harmonyNotes = mode === 'harmony' ? generateHarmonyNotes(currentLesson.targetNotes) : [];
    const duetNotes = mode === 'duet' ? generateAIDuetNotes(currentLesson.targetNotes) : [];
    
    setGameState(prev => ({
      ...prev,
      currentMode: mode,
      currentTempo: tempo,
      harmonyNotes,
      aiDuetNotes: duetNotes,
      zenModeActive: mode === 'zen',
    }));
  }, [currentLesson, gameState.currentVariation, stats.preferredTempo]);

  const adjustTempo = useCallback((delta: number) => {
    setGameState(prev => ({
      ...prev,
      currentTempo: Math.max(200, Math.min(1200, prev.currentTempo + delta)),
    }));
  }, []);

  const toggleHints = useCallback(() => {
    setGameState(prev => ({ ...prev, showHints: !prev.showHints }));
  }, []);

  const activatePowerUp = useCallback((powerUpId: string) => {
    const powerUp = POWER_UPS.find(p => p.id === powerUpId);
    if (!powerUp || (stats.powerUpsOwned[powerUpId] ?? 0) <= 0) return;
    
    setGameState(prev => ({
      ...prev,
      activePowerUps: [...prev.activePowerUps, powerUpId],
    }));
    
    const newPowerUps = { ...stats.powerUpsOwned };
    newPowerUps[powerUpId] = (newPowerUps[powerUpId] ?? 0) - 1;
    saveStats({ ...stats, powerUpsOwned: newPowerUps });

    if (Platform.OS !== 'web' && stats.hapticFeedbackEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [stats, saveStats]);

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
    return { 
      completed: stats.weeklyProgress, 
      goal: stats.weeklyGoal, 
      percentage: Math.min(100, Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)) 
    };
  }, [stats.weeklyGoal, stats.weeklyProgress]);

  const getSkillBreakdown = useCallback((): { category: SkillCategory; level: number; progress: number; name: string; color: string }[] => {
    return Object.entries(stats.skillLevels).map(([category, skill]) => ({
      category: category as SkillCategory,
      level: skill.level,
      progress: Math.round((skill.xp / skill.maxXp) * 100),
      name: SKILL_INFO[category as SkillCategory]?.name || category,
      color: SKILL_INFO[category as SkillCategory]?.color || '#888',
    }));
  }, [stats.skillLevels]);

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

  const toggleAICoach = useCallback(() => {
    const newStats = { ...stats, aiCoachEnabled: !stats.aiCoachEnabled };
    saveStats(newStats);
  }, [stats, saveStats]);

  const toggleAdaptiveDifficulty = useCallback(() => {
    const newStats = { ...stats, adaptiveDifficultyEnabled: !stats.adaptiveDifficultyEnabled };
    saveStats(newStats);
  }, [stats, saveStats]);

  const toggleVoiceInput = useCallback(() => {
    const newStats = { ...stats, voiceInputEnabled: !stats.voiceInputEnabled };
    saveStats(newStats);
  }, [stats, saveStats]);

  const toggleHapticFeedback = useCallback(() => {
    const newStats = { ...stats, hapticFeedbackEnabled: !stats.hapticFeedbackEnabled };
    saveStats(newStats);
  }, [stats, saveStats]);

  const setAccessibilityMode = useCallback((mode: 'standard' | 'high-contrast' | 'reduced-motion') => {
    const newStats = { ...stats, accessibilityMode: mode };
    saveStats(newStats);
  }, [stats, saveStats]);

  const setPreferredTempo = useCallback((tempo: 'slow' | 'normal' | 'fast') => {
    const newStats = { ...stats, preferredTempo: tempo };
    saveStats(newStats);
  }, [stats, saveStats]);

  const resetDailyGoal = useCallback(() => {
    const newStats = { ...stats, dailyGoal: DEFAULT_DAILY_GOAL };
    saveStats(newStats);
  }, [stats, saveStats]);

  return {
    stats,
    lessonProgress,
    gameState,
    currentLesson,
    currentTargetNotes,
    unlockedCurricula,
    unlockedBadges,
    currentMilestone,
    curricula: EXPANDED_CURRICULA,
    practiceModes: PRACTICE_MODE_INFO,
    skillInfo: SKILL_INFO,
    difficultyConfig: DIFFICULTY_CONFIG,
    badges: LEARNING_BADGES,
    certificates: CERTIFICATES,
    powerUps: POWER_UPS,
    milestones: LEARNING_MILESTONES,
    isLoading: statsQuery.isLoading || progressQuery.isLoading,
    isGeneratingFeedback,
    isGeneratingLesson,
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
    toggleHints,
    activatePowerUp,
    getRecommendedLesson,
    getDailyChallenge,
    getWeeklyProgress,
    getSkillBreakdown,
    getCurriculumProgress,
    toggleAICoach,
    toggleAdaptiveDifficulty,
    toggleVoiceInput,
    toggleHapticFeedback,
    setAccessibilityMode,
    setPreferredTempo,
    resetDailyGoal,
    generateCustomLesson,
    generateAICoachFeedback,
  };
});
