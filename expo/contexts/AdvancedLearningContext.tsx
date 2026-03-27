import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { generateText } from '@rork-ai/toolkit-sdk';
import {
  AIPersonalizationProfile,
  AIGeneratedDrill,
  AI_COACH_PERSONALITIES,
  AnalyticsDashboardData,
  DailyProgress,
  SkillProgress,
  MistakePattern,
  SKILL_TREE,
  SkillTreeNode,
  ADVANCED_CURRICULA,
  WARMUP_ROUTINES,
  CHALLENGE_MODES,
  ACCESSIBILITY_SETTINGS,
  LEARNING_ACHIEVEMENTS,
  DEFAULT_PERSONALIZATION_PROFILE,
  PITCH_DETECTION_PRESETS,
  PitchDetectionConfig,
  InputMethod,
  SessionType,
} from '@/constants/learningAdvanced';

const STORAGE_KEYS = {
  PERSONALIZATION: 'melodyx_ai_personalization_v1',
  ANALYTICS: 'melodyx_learning_analytics_v1',
  SKILL_TREE: 'melodyx_skill_tree_v1',
  SESSION_HISTORY: 'melodyx_session_history_v1',
  COACH_PREFS: 'melodyx_coach_prefs_v1',
  ACCESSIBILITY: 'melodyx_accessibility_v1',
  OFFLINE_LESSONS: 'melodyx_offline_lessons_v1',
};

export interface SessionRecord {
  id: string;
  type: SessionType;
  startedAt: string;
  endedAt: string;
  lessonsCompleted: number;
  accuracy: number;
  xpEarned: number;
  notesPlayed: number;
  mistakePatterns: MistakePattern[];
  inputMethod: InputMethod;
  coachId: string;
  streakMaintained: boolean;
}

export interface OfflineLesson {
  id: string;
  name: string;
  cachedAt: string;
  data: string;
  audioUrls: string[];
}

export interface AccessibilityPrefs {
  visualMode: string;
  audioMode: string;
  inputMode: string;
  feedbackMode: string;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  voiceoverEnabled: boolean;
  hapticIntensity: 'none' | 'light' | 'medium' | 'strong';
  highContrastEnabled: boolean;
  reducedMotionEnabled: boolean;
  zoomLevel: number;
}

const DEFAULT_ACCESSIBILITY: AccessibilityPrefs = {
  visualMode: 'standard',
  audioMode: 'standard',
  inputMode: 'touch',
  feedbackMode: 'all',
  fontSize: 'medium',
  voiceoverEnabled: false,
  hapticIntensity: 'medium',
  highContrastEnabled: false,
  reducedMotionEnabled: false,
  zoomLevel: 1.0,
};

export interface AdvancedLearningState {
  currentSessionId: string | null;
  sessionType: SessionType;
  isWarmupActive: boolean;
  warmupRoutineId: string | null;
  challengeModeId: string | null;
  selectedCoachId: string;
  pitchDetectionActive: boolean;
  pitchDetectionConfig: PitchDetectionConfig;
  currentInputMethod: InputMethod;
  aiDrillQueue: AIGeneratedDrill[];
  isGeneratingDrill: boolean;
  isAnalyzingPerformance: boolean;
  realtimePitchData: { pitch: number; confidence: number; note: string } | null;
  voiceCalibrationComplete: boolean;
  offlineModeActive: boolean;
  syncPending: boolean;
}

const DEFAULT_STATE: AdvancedLearningState = {
  currentSessionId: null,
  sessionType: 'practice',
  isWarmupActive: false,
  warmupRoutineId: null,
  challengeModeId: null,
  selectedCoachId: 'melody',
  pitchDetectionActive: false,
  pitchDetectionConfig: PITCH_DETECTION_PRESETS.standard,
  currentInputMethod: 'keyboard',
  aiDrillQueue: [],
  isGeneratingDrill: false,
  isAnalyzingPerformance: false,
  realtimePitchData: null,
  voiceCalibrationComplete: false,
  offlineModeActive: false,
  syncPending: false,
};

export const [AdvancedLearningProvider, useAdvancedLearning] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AdvancedLearningState>(DEFAULT_STATE);
  const sessionStartRef = useRef<number | null>(null);
  const mistakePatternsRef = useRef<Map<string, MistakePattern>>(new Map());

  const personalizationQuery = useQuery({
    queryKey: ['aiPersonalization'],
    queryFn: async (): Promise<AIPersonalizationProfile> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.PERSONALIZATION);
        if (stored) {
          return { ...DEFAULT_PERSONALIZATION_PROFILE, ...JSON.parse(stored) };
        }
      } catch (error) {
        console.log('[AdvancedLearning] Error loading personalization:', error);
      }
      return DEFAULT_PERSONALIZATION_PROFILE;
    },
  });

  const skillTreeQuery = useQuery({
    queryKey: ['skillTreeProgress'],
    queryFn: async (): Promise<Record<string, number>> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_TREE);
        if (stored) return JSON.parse(stored);
      } catch (error) {
        console.log('[AdvancedLearning] Error loading skill tree:', error);
      }
      const initial: Record<string, number> = {};
      SKILL_TREE.forEach(node => { initial[node.id] = 0; });
      return initial;
    },
  });

  const sessionHistoryQuery = useQuery({
    queryKey: ['sessionHistory'],
    queryFn: async (): Promise<SessionRecord[]> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
        if (stored) return JSON.parse(stored);
      } catch (error) {
        console.log('[AdvancedLearning] Error loading session history:', error);
      }
      return [];
    },
  });

  const accessibilityQuery = useQuery({
    queryKey: ['accessibilityPrefs'],
    queryFn: async (): Promise<AccessibilityPrefs> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACCESSIBILITY);
        if (stored) return { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(stored) };
      } catch (error) {
        console.log('[AdvancedLearning] Error loading accessibility:', error);
      }
      return DEFAULT_ACCESSIBILITY;
    },
  });

  const offlineLessonsQuery = useQuery({
    queryKey: ['offlineLessons'],
    queryFn: async (): Promise<OfflineLesson[]> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_LESSONS);
        if (stored) return JSON.parse(stored);
      } catch (error) {
        console.log('[AdvancedLearning] Error loading offline lessons:', error);
      }
      return [];
    },
  });

  const { mutate: savePersonalization } = useMutation({
    mutationFn: async (profile: AIPersonalizationProfile) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PERSONALIZATION, JSON.stringify(profile));
      return profile;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aiPersonalization'] }),
  });

  const { mutate: saveSkillTree } = useMutation({
    mutationFn: async (progress: Record<string, number>) => {
      await AsyncStorage.setItem(STORAGE_KEYS.SKILL_TREE, JSON.stringify(progress));
      return progress;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skillTreeProgress'] }),
  });

  const { mutate: saveSessionHistory } = useMutation({
    mutationFn: async (sessions: SessionRecord[]) => {
      const trimmed = sessions.slice(-100);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(trimmed));
      return trimmed;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessionHistory'] }),
  });

  const { mutate: saveAccessibility } = useMutation({
    mutationFn: async (prefs: AccessibilityPrefs) => {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESSIBILITY, JSON.stringify(prefs));
      return prefs;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accessibilityPrefs'] }),
  });

  const { mutate: saveOfflineLessons } = useMutation({
    mutationFn: async (lessons: OfflineLesson[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_LESSONS, JSON.stringify(lessons));
      return lessons;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offlineLessons'] }),
  });

  const personalization = useMemo(() => personalizationQuery.data ?? DEFAULT_PERSONALIZATION_PROFILE, [personalizationQuery.data]);
  const skillTreeProgress = useMemo(() => {
    if (skillTreeQuery.data) return skillTreeQuery.data;
    const initial: Record<string, number> = {};
    SKILL_TREE.forEach(node => { initial[node.id] = 0; });
    return initial;
  }, [skillTreeQuery.data]);
  const sessionHistory = useMemo(() => sessionHistoryQuery.data ?? [], [sessionHistoryQuery.data]);
  const accessibility = useMemo(() => accessibilityQuery.data ?? DEFAULT_ACCESSIBILITY, [accessibilityQuery.data]);
  const offlineLessons = useMemo(() => offlineLessonsQuery.data ?? [], [offlineLessonsQuery.data]);

  const currentCoach = useMemo(() => {
    return AI_COACH_PERSONALITIES.find(c => c.id === state.selectedCoachId) || AI_COACH_PERSONALITIES[0];
  }, [state.selectedCoachId]);

  const skillTreeWithProgress = useMemo((): (SkillTreeNode & { currentLevel: number; xpProgress: number })[] => {
    return SKILL_TREE.map(node => ({
      ...node,
      currentLevel: skillTreeProgress[node.id] ?? 0,
      xpProgress: 0,
    }));
  }, [skillTreeProgress]);

  const analyticsDashboard = useMemo((): AnalyticsDashboardData => {
    const last7Days = sessionHistory.filter(s => {
      const date = new Date(s.startedAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays < 7;
    });

    const weeklyProgress: DailyProgress[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = last7Days.filter(s => s.startedAt.startsWith(dateStr));
      
      weeklyProgress.push({
        date: dateStr,
        lessonsCompleted: daySessions.reduce((acc, s) => acc + s.lessonsCompleted, 0),
        minutesPracticed: daySessions.reduce((acc, s) => {
          const start = new Date(s.startedAt).getTime();
          const end = new Date(s.endedAt).getTime();
          return acc + Math.round((end - start) / 60000);
        }, 0),
        xpEarned: daySessions.reduce((acc, s) => acc + s.xpEarned, 0),
        accuracy: daySessions.length > 0 
          ? Math.round(daySessions.reduce((acc, s) => acc + s.accuracy, 0) / daySessions.length) 
          : 0,
        notesPlayed: daySessions.reduce((acc, s) => acc + s.notesPlayed, 0),
      });
    }

    const skillBreakdown: SkillProgress[] = skillTreeWithProgress.map(node => ({
      skillId: node.id,
      name: node.name,
      level: node.currentLevel,
      xp: node.xpProgress,
      xpToNext: node.xpRequired[Math.min(node.currentLevel, node.xpRequired.length - 1)] ?? 1000,
      recentGain: 0,
      trend: 'stable' as const,
    }));

    const allMistakes = new Map<string, MistakePattern>();
    sessionHistory.slice(-30).forEach(session => {
      session.mistakePatterns.forEach(mp => {
        const key = `${mp.fromNote}->${mp.toNote}`;
        const existing = allMistakes.get(key);
        if (existing) {
          existing.count += mp.count;
        } else {
          allMistakes.set(key, { ...mp });
        }
      });
    });

    const mistakePatterns = Array.from(allMistakes.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      weeklyProgress,
      skillBreakdown,
      accuracyTrend: weeklyProgress.map(d => ({ date: d.date, value: d.accuracy })),
      practiceTimeTrend: weeklyProgress.map(d => ({ date: d.date, value: d.minutesPracticed })),
      mistakePatterns,
      streakHistory: [],
      milestones: [],
      comparisons: {
        rank: 0,
        totalUsers: 0,
        percentile: 0,
        averageAccuracy: 75,
        userAccuracy: personalization.strengthAreas.length > 0 ? 80 : 70,
        averageStreak: 5,
        userStreak: 0,
      },
    };
  }, [sessionHistory, skillTreeWithProgress, personalization]);

  const generateAIDrill = useCallback(async (focusArea?: string): Promise<AIGeneratedDrill | null> => {
    setState(prev => ({ ...prev, isGeneratingDrill: true }));
    
    try {
      const prompt = `Generate a personalized music ear training drill.
User profile:
- Preferred genres: ${personalization.preferredGenres.join(', ') || 'any'}
- Strength areas: ${personalization.strengthAreas.join(', ') || 'none identified'}
- Weakness areas: ${personalization.weaknessAreas.join(', ') || 'none identified'}
- Learning pace: ${personalization.learningPace}
- Challenge level: ${personalization.challengeLevel}%
${focusArea ? `- Specific focus: ${focusArea}` : ''}

Generate a drill with JSON format:
{"name": "Drill Name", "description": "Brief description", "notes": ["C", "E", "G"], "durations": [0.5, 0.5, 1], "tempo": 500, "difficulty": 2, "skillFocus": ["ear_training"], "reasoning": "Why this drill helps", "estimatedMinutes": 3}`;

      const result = await generateText(prompt);
      
      try {
        const parsed = JSON.parse(result);
        const drill: AIGeneratedDrill = {
          id: `ai_drill_${Date.now()}`,
          name: parsed.name || 'Custom AI Drill',
          description: parsed.description || 'AI-generated practice drill',
          notes: parsed.notes || ['C', 'E', 'G'],
          durations: parsed.durations || [0.5, 0.5, 0.5],
          tempo: parsed.tempo || 500,
          difficulty: parsed.difficulty || 2,
          skillFocus: parsed.skillFocus || ['ear_training'],
          reasoning: parsed.reasoning || 'Tailored to your skill level',
          estimatedMinutes: parsed.estimatedMinutes || 3,
          variationsAvailable: 3,
        };

        setState(prev => ({
          ...prev,
          aiDrillQueue: [...prev.aiDrillQueue, drill],
          isGeneratingDrill: false,
        }));

        return drill;
      } catch {
        const fallbackDrill: AIGeneratedDrill = {
          id: `ai_drill_${Date.now()}`,
          name: 'Interval Recognition',
          description: 'Practice identifying intervals by ear',
          notes: ['C', 'G', 'C', 'E', 'C', 'A'],
          durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
          tempo: 500,
          difficulty: 2,
          skillFocus: ['ear_training', 'intervals'],
          reasoning: 'Fundamental interval training',
          estimatedMinutes: 3,
          variationsAvailable: 2,
        };
        setState(prev => ({
          ...prev,
          aiDrillQueue: [...prev.aiDrillQueue, fallbackDrill],
          isGeneratingDrill: false,
        }));
        return fallbackDrill;
      }
    } catch (error) {
      console.log('[AdvancedLearning] AI drill generation error:', error);
      setState(prev => ({ ...prev, isGeneratingDrill: false }));
      return null;
    }
  }, [personalization]);

  const generateAIFeedback = useCallback(async (
    accuracy: number,
    mistakePatterns: MistakePattern[],
    sessionType: SessionType
  ): Promise<string> => {
    setState(prev => ({ ...prev, isAnalyzingPerformance: true }));
    
    try {
      const coach = currentCoach;
      const mistakeInfo = mistakePatterns.length > 0
        ? `Common mistakes: ${mistakePatterns.slice(0, 3).map(m => `${m.fromNote} instead of ${m.toNote}`).join(', ')}`
        : 'No significant mistake patterns detected';

      const prompt = `You are ${coach.name}, an AI music coach with a ${coach.style} style.
Specialty: ${coach.specialty}
Voice tone: ${coach.voiceTone}

Student just completed a ${sessionType} session with ${accuracy}% accuracy.
${mistakeInfo}

Generate encouraging, personalized feedback (2-3 sentences) that:
1. Acknowledges their effort
2. Provides one specific improvement tip
3. Motivates them to continue

Keep it concise and use ${coach.style} tone.`;

      const result = await generateText(prompt);
      setState(prev => ({ ...prev, isAnalyzingPerformance: false }));
      return result || coach.encouragementPhrases[0];
    } catch (error) {
      console.log('[AdvancedLearning] AI feedback error:', error);
      setState(prev => ({ ...prev, isAnalyzingPerformance: false }));
      return currentCoach.encouragementPhrases[Math.floor(Math.random() * currentCoach.encouragementPhrases.length)];
    }
  }, [currentCoach]);

  const startSession = useCallback((type: SessionType) => {
    const sessionId = `session_${Date.now()}`;
    sessionStartRef.current = Date.now();
    mistakePatternsRef.current.clear();
    
    setState(prev => ({
      ...prev,
      currentSessionId: sessionId,
      sessionType: type,
    }));

    if (Platform.OS !== 'web' && accessibility.hapticIntensity !== 'none') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    console.log(`[AdvancedLearning] Session started: ${sessionId} (${type})`);
    return sessionId;
  }, [accessibility.hapticIntensity]);

  const endSession = useCallback((stats: { lessonsCompleted: number; accuracy: number; xpEarned: number; notesPlayed: number }) => {
    if (!state.currentSessionId || !sessionStartRef.current) return null;

    const session: SessionRecord = {
      id: state.currentSessionId,
      type: state.sessionType,
      startedAt: new Date(sessionStartRef.current).toISOString(),
      endedAt: new Date().toISOString(),
      lessonsCompleted: stats.lessonsCompleted,
      accuracy: stats.accuracy,
      xpEarned: stats.xpEarned,
      notesPlayed: stats.notesPlayed,
      mistakePatterns: Array.from(mistakePatternsRef.current.values()),
      inputMethod: state.currentInputMethod,
      coachId: state.selectedCoachId,
      streakMaintained: stats.accuracy >= 70,
    };

    saveSessionHistory([...sessionHistory, session]);

    setState(prev => ({
      ...prev,
      currentSessionId: null,
    }));

    if (Platform.OS !== 'web' && accessibility.hapticIntensity !== 'none') {
      Haptics.notificationAsync(
        stats.accuracy >= 80 
          ? Haptics.NotificationFeedbackType.Success 
          : Haptics.NotificationFeedbackType.Warning
      );
    }

    console.log(`[AdvancedLearning] Session ended: ${session.id}`);
    return session;
  }, [state.currentSessionId, state.sessionType, state.currentInputMethod, state.selectedCoachId, sessionHistory, saveSessionHistory, accessibility.hapticIntensity]);

  const recordMistake = useCallback((expectedNote: string, playedNote: string) => {
    const key = `${playedNote}->${expectedNote}`;
    const existing = mistakePatternsRef.current.get(key);
    
    if (existing) {
      existing.count++;
    } else {
      mistakePatternsRef.current.set(key, {
        fromNote: playedNote,
        toNote: expectedNote,
        count: 1,
        percentage: 0,
        suggestion: `Practice the interval from ${playedNote} to ${expectedNote}`,
      });
    }
  }, []);

  const startWarmup = useCallback((routineId: string) => {
    const routine = WARMUP_ROUTINES.find(r => r.id === routineId);
    if (!routine) return false;

    startSession('warmup');
    setState(prev => ({
      ...prev,
      isWarmupActive: true,
      warmupRoutineId: routineId,
    }));

    console.log(`[AdvancedLearning] Warmup started: ${routine.name}`);
    return true;
  }, [startSession]);

  const startChallenge = useCallback((challengeId: string) => {
    const challenge = CHALLENGE_MODES.find(c => c.id === challengeId);
    if (!challenge) return false;

    startSession('challenge');
    setState(prev => ({
      ...prev,
      challengeModeId: challengeId,
    }));

    console.log(`[AdvancedLearning] Challenge started: ${challenge.name}`);
    return true;
  }, [startSession]);

  const setInputMethod = useCallback((method: InputMethod) => {
    setState(prev => ({ ...prev, currentInputMethod: method }));
    
    if (method === 'voice' && !state.voiceCalibrationComplete) {
      console.log('[AdvancedLearning] Voice input needs calibration');
    }
    
    console.log(`[AdvancedLearning] Input method changed: ${method}`);
  }, [state.voiceCalibrationComplete]);

  const setPitchDetectionConfig = useCallback((preset: string | PitchDetectionConfig) => {
    const config = typeof preset === 'string' 
      ? PITCH_DETECTION_PRESETS[preset] || PITCH_DETECTION_PRESETS.standard
      : preset;
    
    setState(prev => ({ ...prev, pitchDetectionConfig: config }));
    console.log('[AdvancedLearning] Pitch detection config updated');
  }, []);

  const togglePitchDetection = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, pitchDetectionActive: active }));
    console.log(`[AdvancedLearning] Pitch detection: ${active ? 'ON' : 'OFF'}`);
  }, []);

  const updateRealtimePitch = useCallback((data: { pitch: number; confidence: number; note: string } | null) => {
    setState(prev => ({ ...prev, realtimePitchData: data }));
  }, []);

  const completeVoiceCalibration = useCallback(() => {
    setState(prev => ({ ...prev, voiceCalibrationComplete: true }));
    console.log('[AdvancedLearning] Voice calibration complete');
  }, []);

  const selectCoach = useCallback((coachId: string) => {
    const coach = AI_COACH_PERSONALITIES.find(c => c.id === coachId);
    if (!coach) return false;
    
    setState(prev => ({ ...prev, selectedCoachId: coachId }));
    
    if (Platform.OS !== 'web' && accessibility.hapticIntensity !== 'none') {
      Haptics.selectionAsync();
    }
    
    console.log(`[AdvancedLearning] Coach selected: ${coach.name}`);
    return true;
  }, [accessibility.hapticIntensity]);

  const updatePersonalization = useCallback((updates: Partial<AIPersonalizationProfile>) => {
    const updated = {
      ...personalization,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    savePersonalization(updated);
    console.log('[AdvancedLearning] Personalization updated');
  }, [personalization, savePersonalization]);

  const updateAccessibility = useCallback((updates: Partial<AccessibilityPrefs>) => {
    const updated = { ...accessibility, ...updates };
    saveAccessibility(updated);
    console.log('[AdvancedLearning] Accessibility updated');
  }, [accessibility, saveAccessibility]);

  const addSkillXp = useCallback((skillId: string, xp: number) => {
    const node = SKILL_TREE.find(n => n.id === skillId);
    if (!node) return;

    const currentLevel = skillTreeProgress[skillId] ?? 0;
    if (currentLevel >= node.maxLevel) return;

    const newProgress = { ...skillTreeProgress };
    newProgress[skillId] = Math.min(currentLevel + 1, node.maxLevel);
    saveSkillTree(newProgress);
    
    console.log(`[AdvancedLearning] Skill XP added: ${skillId} +${xp}`);
  }, [skillTreeProgress, saveSkillTree]);

  const cacheLesson = useCallback(async (lessonId: string, lessonData: string, audioUrls: string[]) => {
    const lesson: OfflineLesson = {
      id: lessonId,
      name: `Lesson ${lessonId}`,
      cachedAt: new Date().toISOString(),
      data: lessonData,
      audioUrls,
    };

    const updated = [...offlineLessons.filter(l => l.id !== lessonId), lesson];
    saveOfflineLessons(updated);
    console.log(`[AdvancedLearning] Lesson cached: ${lessonId}`);
  }, [offlineLessons, saveOfflineLessons]);

  const isLessonCached = useCallback((lessonId: string): boolean => {
    return offlineLessons.some(l => l.id === lessonId);
  }, [offlineLessons]);

  const setOfflineMode = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, offlineModeActive: active }));
    console.log(`[AdvancedLearning] Offline mode: ${active ? 'ON' : 'OFF'}`);
  }, []);

  const getNextDrillFromQueue = useCallback(() => {
    if (state.aiDrillQueue.length === 0) return null;
    
    const [next, ...rest] = state.aiDrillQueue;
    setState(prev => ({ ...prev, aiDrillQueue: rest }));
    return next;
  }, [state.aiDrillQueue]);

  const clearDrillQueue = useCallback(() => {
    setState(prev => ({ ...prev, aiDrillQueue: [] }));
  }, []);

  const getRecommendedCurriculum = useCallback(() => {
    const weakestSkill = personalization.weaknessAreas[0];
    if (!weakestSkill) return ADVANCED_CURRICULA[0];

    const matching = ADVANCED_CURRICULA.find(c => 
      c.category.toLowerCase().includes(weakestSkill.toLowerCase())
    );
    return matching || ADVANCED_CURRICULA[0];
  }, [personalization.weaknessAreas]);

  const checkAchievements = useCallback((): string[] => {
    const unlocked: string[] = [];
    const totalLessons = sessionHistory.reduce((acc, s) => acc + s.lessonsCompleted, 0);
    const currentStreak = 0;

    LEARNING_ACHIEVEMENTS.forEach(achievement => {
      switch (achievement.requirement.type) {
        case 'lessons':
          if (totalLessons >= achievement.requirement.value) unlocked.push(achievement.id);
          break;
        case 'streak':
          if (currentStreak >= achievement.requirement.value) unlocked.push(achievement.id);
          break;
      }
    });

    return unlocked;
  }, [sessionHistory]);

  return {
    state,
    personalization,
    skillTreeProgress,
    skillTreeWithProgress,
    sessionHistory,
    accessibility,
    offlineLessons,
    currentCoach,
    analyticsDashboard,
    
    coaches: AI_COACH_PERSONALITIES,
    curricula: ADVANCED_CURRICULA,
    warmupRoutines: WARMUP_ROUTINES,
    challengeModes: CHALLENGE_MODES,
    accessibilityOptions: ACCESSIBILITY_SETTINGS,
    achievements: LEARNING_ACHIEVEMENTS,
    skillTree: SKILL_TREE,
    pitchPresets: PITCH_DETECTION_PRESETS,
    
    isLoading: personalizationQuery.isLoading || skillTreeQuery.isLoading,
    isGeneratingDrill: state.isGeneratingDrill,
    isAnalyzingPerformance: state.isAnalyzingPerformance,
    
    generateAIDrill,
    generateAIFeedback,
    startSession,
    endSession,
    recordMistake,
    startWarmup,
    startChallenge,
    setInputMethod,
    setPitchDetectionConfig,
    togglePitchDetection,
    updateRealtimePitch,
    completeVoiceCalibration,
    selectCoach,
    updatePersonalization,
    updateAccessibility,
    addSkillXp,
    cacheLesson,
    isLessonCached,
    setOfflineMode,
    getNextDrillFromQueue,
    clearDrillQueue,
    getRecommendedCurriculum,
    checkAchievements,
  };
});
