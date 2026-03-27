import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GraduationCap,
  Star,
  Lock,
  ChevronRight,
  X,
  Trophy,
  Sparkles,
  RotateCcw,
  Home,
  Volume2,
  Play,
  Target,
  Headphones,
  Zap,
  Award,
  TrendingUp,
  Brain,
  Clock,
  Music,
  Flame,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Lightbulb,

} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { 
  LearningProvider, 
  useLearning, 
  Curriculum, 
  PracticeMode,
  SkillCategory,
} from '@/contexts/LearningContext';
import { useInstrument } from '@/contexts/InstrumentContext';
import { useAudio } from '@/hooks/useAudio';
import InstrumentSelector from '@/components/InstrumentSelector';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const NOTE_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SKILL_ICONS: Record<SkillCategory, string> = {
  earTraining: '👂',
  rhythm: '🥁',
  melodyRecognition: '🎵',
  noteAccuracy: '🎯',
  improvisation: '🎸',
  harmony: '🎼',
  sightReading: '📖',
  composition: '✍️',
  theory: '📚',
};

const SKILL_COLORS: Record<SkillCategory, string> = {
  earTraining: '#A78BFA',
  rhythm: '#F59E0B',
  melodyRecognition: '#22C55E',
  noteAccuracy: '#EF4444',
  improvisation: '#EC4899',
  harmony: '#06B6D4',
  sightReading: '#8B5CF6',
  composition: '#10B981',
  theory: '#F97316',
};

function LearningContent() {
  const {
    stats,
    gameState,
    currentLesson,
    currentTargetNotes,
    curricula,
    isLoading,
    isGeneratingFeedback,
    practiceModes,
    getLessonProgress,
    getSkillBreakdown,
    getCurriculumProgress,
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
    toggleAICoach,
  } = useLearning();

  const { currentInstrument } = useInstrument();
  const { playNote, playMelody, playbackState } = useAudio(currentInstrument.id);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const prevAttemptLength = useRef(gameState.currentAttempt.length);
  const successFlashAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (gameState.currentAttempt.length > prevAttemptLength.current && gameState.currentAttempt.length > 0) {
      const lastNote = gameState.currentAttempt[gameState.currentAttempt.length - 1];
      playNote(lastNote);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    prevAttemptLength.current = gameState.currentAttempt.length;
  }, [gameState.currentAttempt, playNote]);

  useEffect(() => {
    if (gameState.gamePhase === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [gameState.gamePhase, pulseAnim]);

  useEffect(() => {
    if (gameState.gamePhase === 'complete' || gameState.gamePhase === 'coaching') {
      Animated.sequence([
        Animated.timing(successFlashAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(successFlashAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [gameState.gamePhase, successFlashAnim]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentLesson ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [currentLesson, slideAnim]);

  const handlePlayMelody = useCallback(() => {
    if (currentLesson) {
      startListening();
      playMelody(currentTargetNotes, gameState.currentTempo);
      setTimeout(() => {
        finishListening();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, currentTargetNotes.length * gameState.currentTempo + 500);
    }
  }, [currentLesson, currentTargetNotes, gameState.currentTempo, playMelody, startListening, finishListening]);

  const handleNotePress = useCallback((note: string) => {
    addNoteToAttempt(note);
  }, [addNoteToAttempt]);

  const handleSubmit = useCallback(() => {
    if (currentLesson && gameState.currentAttempt.length === currentTargetNotes.length && gameState.gamePhase === 'repeating') {
      playMelody(gameState.currentAttempt, 200);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setTimeout(() => {
        submitAttempt();
      }, gameState.currentAttempt.length * 200 + 100);
    }
  }, [currentLesson, currentTargetNotes, gameState.currentAttempt, gameState.gamePhase, playMelody, submitAttempt]);

  const handleRemoveNote = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    removeNoteFromAttempt();
  }, [removeNoteFromAttempt]);

  const handleModeSelect = useCallback((mode: PracticeMode) => {
    setMode(mode);
    setShowModeSelector(false);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [setMode]);

  const renderStars = (earned: number, max: number = 3) => (
    <View style={styles.starsContainer}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={14} color={i < earned ? '#FBBF24' : Colors.textMuted} fill={i < earned ? '#FBBF24' : 'transparent'} />
      ))}
    </View>
  );

  const renderAttemptGrid = () => {
    if (!currentLesson) return null;
    const lastAttempt = gameState.attempts[gameState.attempts.length - 1];
    
    return (
      <View style={styles.attemptGrid}>
        {currentTargetNotes.map((_, index) => {
          const currentNote = gameState.currentAttempt[index];
          const feedback = lastAttempt?.feedback[index];
          let cellStyle = styles.attemptCell;
          
          if ((gameState.gamePhase === 'feedback' || gameState.gamePhase === 'complete' || gameState.gamePhase === 'coaching') && feedback) {
            cellStyle = [
              styles.attemptCell,
              feedback === 'correct' ? styles.correctCell :
              feedback === 'close' ? styles.closeCell : styles.wrongCell,
            ] as never;
          } else if (currentNote) {
            cellStyle = [styles.attemptCell, styles.activeCell] as never;
          }

          return (
            <View key={index} style={cellStyle}>
              <Text style={styles.attemptCellText}>{currentNote || ''}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSkillCard = (skill: { category: SkillCategory; level: number; progress: number }) => (
    <View key={skill.category} style={styles.skillCard}>
      <View style={[styles.skillIcon, { backgroundColor: SKILL_COLORS[skill.category] + '20' }]}>
        <Text style={styles.skillEmoji}>{SKILL_ICONS[skill.category]}</Text>
      </View>
      <View style={styles.skillInfo}>
        <Text style={styles.skillName}>{skill.category.replace(/([A-Z])/g, ' $1').trim()}</Text>
        <View style={styles.skillProgressBar}>
          <View style={[styles.skillProgressFill, { width: `${skill.progress}%`, backgroundColor: SKILL_COLORS[skill.category] }]} />
        </View>
      </View>
      <Text style={[styles.skillLevel, { color: SKILL_COLORS[skill.category] }]}>Lv.{skill.level}</Text>
    </View>
  );

  const renderModeButton = (mode: PracticeMode) => {
    const info = practiceModes[mode];
    const isSelected = gameState.currentMode === mode;
    
    return (
      <TouchableOpacity
        key={mode}
        style={[styles.modeButton, isSelected && styles.modeButtonSelected]}
        onPress={() => handleModeSelect(mode)}
      >
        <Text style={styles.modeIcon}>{info.icon}</Text>
        <View style={styles.modeInfo}>
          <Text style={[styles.modeName, isSelected && styles.modeNameSelected]}>{info.name}</Text>
          <Text style={styles.modeDesc}>{info.description}</Text>
        </View>
        <View style={[styles.modeBonus, { backgroundColor: isSelected ? '#22C55E' : 'rgba(255,255,255,0.1)' }]}>
          <Text style={styles.modeBonusText}>{info.xpBonus}x XP</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading lessons...</Text>
      </View>
    );
  }

  if (currentLesson) {
    const canSubmit = gameState.currentAttempt.length === currentTargetNotes.length && gameState.gamePhase === 'repeating';
    const modeInfo = practiceModes[gameState.currentMode];

    return (
      <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.lessonHeader}>
            <TouchableOpacity onPress={exitLesson} style={styles.backButton}>
              <Home size={20} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.lessonTitleContainer}>
              <Text style={styles.lessonTitle} numberOfLines={1}>{currentLesson.name}</Text>
              <View style={styles.lessonMeta}>
                <Text style={styles.lessonDifficulty}>{currentLesson.difficulty.toUpperCase()}</Text>
                <View style={styles.modeBadge}>
                  <Text style={styles.modeBadgeText}>{modeInfo.icon} {modeInfo.name}</Text>
                </View>
              </View>
            </View>
            <View style={styles.lessonHeaderRight}>
              <InstrumentSelector compact />
              <View style={styles.xpBadge}>
                <Sparkles size={14} color="#FBBF24" />
                <Text style={styles.xpText}>{currentLesson.xpReward}</Text>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.lessonContent} showsVerticalScrollIndicator={false}>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonDescription}>{currentLesson.description}</Text>
              <View style={styles.lessonStats}>
                <View style={styles.targetRow}>
                  <Target size={16} color={Colors.accent} />
                  <Text style={styles.targetText}>{currentLesson.requiredAccuracy}% accuracy</Text>
                </View>
                <View style={styles.targetRow}>
                  <Music size={16} color="#22C55E" />
                  <Text style={styles.targetText}>{currentTargetNotes.length} notes</Text>
                </View>
              </View>
              
              {currentLesson.theoryTip && (
                <View style={styles.theoryTipContainer}>
                  <Lightbulb size={16} color="#FBBF24" />
                  <Text style={styles.theoryTipText}>{currentLesson.theoryTip}</Text>
                </View>
              )}
            </View>

            <View style={styles.tempoControl}>
              <Text style={styles.tempoLabel}>Tempo</Text>
              <View style={styles.tempoButtons}>
                <TouchableOpacity style={styles.tempoBtn} onPress={() => adjustTempo(50)}>
                  <Minus size={16} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.tempoValue}>{Math.round(60000 / gameState.currentTempo)} BPM</Text>
                <TouchableOpacity style={styles.tempoBtn} onPress={() => adjustTempo(-50)}>
                  <Plus size={16} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View style={[styles.successFlash, { opacity: successFlashAnim }]} pointerEvents="none" />

            {gameState.gamePhase === 'ready' && (
              <View style={styles.readySection}>
                <Animated.View style={[styles.playContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <TouchableOpacity style={styles.bigPlayButton} onPress={handlePlayMelody} disabled={playbackState.isPlaying}>
                    <Headphones size={40} color={Colors.background} />
                    <Text style={styles.bigPlayText}>Listen to Melody</Text>
                    <Text style={styles.noteCount}>{currentTargetNotes.length} notes • {modeInfo.name}</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                <TouchableOpacity style={styles.changeModeBtn} onPress={() => setShowModeSelector(true)}>
                  <Text style={styles.changeModeText}>Change Practice Mode</Text>
                  <ChevronDown size={16} color={Colors.accent} />
                </TouchableOpacity>

                {currentLesson.hints.length > 0 && (
                  <View style={styles.hintsContainer}>
                    <Text style={styles.hintsTitle}>💡 Hints</Text>
                    {currentLesson.hints.map((hint, i) => (
                      <Text key={i} style={styles.hintText}>• {hint}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {gameState.gamePhase === 'listening' && (
              <View style={styles.listeningSection}>
                <Animated.View style={[styles.listeningPulse, { transform: [{ scale: pulseAnim }] }]}>
                  <Volume2 size={48} color={Colors.accent} />
                </Animated.View>
                <Text style={styles.listeningText}>Listen carefully...</Text>
                <Text style={styles.listeningSubtext}>Memorize the {gameState.currentMode === 'mirror' ? 'reversed ' : ''}melody</Text>
              </View>
            )}

            {gameState.gamePhase === 'repeating' && (
              <View style={styles.repeatingSection}>
                <Text style={styles.repeatingTitle}>🎹 Your Turn!</Text>
                <Text style={styles.repeatingSubtitle}>
                  {gameState.currentMode === 'mirror' ? 'Play in reverse order' : 
                   gameState.currentMode === 'harmony' ? 'Add your harmony' : 
                   'Repeat the melody'}
                </Text>
                
                {renderAttemptGrid()}

                {gameState.comboMultiplier > 1 && (
                  <View style={styles.comboBadge}>
                    <Flame size={16} color="#FBBF24" />
                    <Text style={styles.comboText}>{gameState.comboMultiplier}x Combo!</Text>
                  </View>
                )}

                <View style={styles.keyboardSection}>
                  <View style={styles.pianoContainer}>
                    <View style={styles.pianoRow}>
                      {NOTE_SCALE.slice(0, 6).map((note) => (
                        <TouchableOpacity
                          key={note}
                          style={[styles.pianoKey, note.includes('#') && styles.sharpKey]}
                          onPress={() => handleNotePress(note)}
                        >
                          <Text style={[styles.pianoKeyText, note.includes('#') && styles.sharpKeyText]}>{note}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.pianoRow}>
                      {NOTE_SCALE.slice(6).map((note) => (
                        <TouchableOpacity
                          key={note}
                          style={[styles.pianoKey, note.includes('#') && styles.sharpKey]}
                          onPress={() => handleNotePress(note)}
                        >
                          <Text style={[styles.pianoKeyText, note.includes('#') && styles.sharpKeyText]}>{note}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.deleteBtn} onPress={handleRemoveNote}>
                      <Text style={styles.actionBtnText}>⌫</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitBtn, canSubmit && styles.submitBtnActive]}
                      onPress={handleSubmit}
                      disabled={!canSubmit}
                    >
                      <Text style={[styles.submitBtnText, canSubmit && styles.submitBtnTextActive]}>Check</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {gameState.gamePhase === 'feedback' && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>
                  {gameState.accuracy >= currentLesson.requiredAccuracy ? '🎉 Great Job!' : '💪 Keep Trying!'}
                </Text>
                <Text style={styles.feedbackAccuracy}>{gameState.accuracy}% Accurate</Text>
                {renderAttemptGrid()}
                <View style={styles.feedbackLegend}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} /><Text style={styles.legendText}>Correct</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EAB308' }]} /><Text style={styles.legendText}>Close</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Wrong</Text></View>
                </View>
                <TouchableOpacity style={styles.continueButton} onPress={continueToNextPhase}>
                  <Text style={styles.continueButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {gameState.gamePhase === 'coaching' && gameState.aiCoachFeedback && (
              <View style={styles.coachingSection}>
                <View style={styles.coachHeader}>
                  <View style={styles.coachAvatar}>
                    <Brain size={24} color="#A78BFA" />
                  </View>
                  <View>
                    <Text style={styles.coachName}>AI Coach Melody</Text>
                    <Text style={styles.coachSubtitle}>Your personal music tutor</Text>
                  </View>
                </View>
                
                <View style={styles.coachBubble}>
                  <Text style={styles.coachMessage}>{gameState.aiCoachFeedback.message}</Text>
                </View>

                <View style={styles.coachSuggestions}>
                  <Text style={styles.coachSectionTitle}>💡 Tips for Improvement</Text>
                  {gameState.aiCoachFeedback.suggestions.map((tip, i) => (
                    <Text key={i} style={styles.coachTip}>• {tip}</Text>
                  ))}
                </View>

                <View style={styles.coachEncouragement}>
                  <Text style={styles.encouragementText}>{gameState.aiCoachFeedback.encouragement}</Text>
                </View>

                <TouchableOpacity style={styles.continueButton} onPress={continueToNextPhase}>
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}

            {gameState.gamePhase === 'complete' && (
              <View style={styles.completeSection}>
                <Trophy size={64} color="#FBBF24" />
                <Text style={styles.completeTitle}>
                  {gameState.accuracy >= currentLesson.requiredAccuracy ? '🏆 Lesson Complete!' : 'Practice Complete'}
                </Text>
                <Text style={styles.completeAccuracy}>Final Accuracy: {gameState.accuracy}%</Text>
                {renderStars(gameState.accuracy >= 95 ? 3 : gameState.accuracy >= 85 ? 2 : gameState.accuracy >= currentLesson.requiredAccuracy ? 1 : 0)}
                
                {gameState.sessionXpGained > 0 && (
                  <View style={styles.xpGainBadge}>
                    <Sparkles size={20} color="#FBBF24" />
                    <Text style={styles.xpGainText}>+{gameState.sessionXpGained} XP</Text>
                  </View>
                )}

                <View style={styles.completeStats}>
                  <View style={styles.completeStat}>
                    <Text style={styles.completeStatValue}>{gameState.attempts.length}</Text>
                    <Text style={styles.completeStatLabel}>Attempts</Text>
                  </View>
                  <View style={styles.completeStat}>
                    <Text style={styles.completeStatValue}>{gameState.streak}</Text>
                    <Text style={styles.completeStatLabel}>Streak</Text>
                  </View>
                  <View style={styles.completeStat}>
                    <Text style={styles.completeStatValue}>{gameState.comboMultiplier}x</Text>
                    <Text style={styles.completeStatLabel}>Multiplier</Text>
                  </View>
                </View>

                <View style={styles.endButtons}>
                  <TouchableOpacity style={styles.retryButton} onPress={retryLesson}>
                    <RotateCcw size={18} color={Colors.text} />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.doneButton} onPress={exitLesson}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isGeneratingFeedback && (
              <View style={styles.generatingOverlay}>
                <ActivityIndicator size="large" color="#A78BFA" />
                <Text style={styles.generatingText}>AI Coach is thinking...</Text>
              </View>
            )}
          </ScrollView>

          <Modal visible={showModeSelector} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modeModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Practice Mode</Text>
                  <TouchableOpacity onPress={() => setShowModeSelector(false)}>
                    <X size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {(Object.keys(practiceModes) as PracticeMode[]).map(renderModeButton)}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const recommendedLesson = getRecommendedLesson();
  const dailyChallenge = getDailyChallenge();
  const skillBreakdown = getSkillBreakdown();

  return (
    <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <GraduationCap size={28} color="#22C55E" />
              <Text style={styles.title}>Melody Mastery</Text>
            </View>
            <Text style={styles.subtitle}>Train your ear, master the music</Text>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
              <Settings size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Award size={20} color="#FBBF24" />
              <Text style={styles.statValue}>Lv.{stats.currentLevel}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statCard}>
              <Sparkles size={20} color="#22C55E" />
              <Text style={styles.statValue}>{stats.totalXp}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={20} color="#A78BFA" />
              <Text style={styles.statValue}>{stats.averageAccuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statCard}>
              <Flame size={20} color="#EF4444" />
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.analyticsToggle} onPress={() => setShowAnalytics(!showAnalytics)}>
            <Brain size={18} color={Colors.accent} />
            <Text style={styles.analyticsToggleText}>Skill Breakdown</Text>
            {showAnalytics ? <ChevronUp size={18} color={Colors.textSecondary} /> : <ChevronDown size={18} color={Colors.textSecondary} />}
          </TouchableOpacity>

          {showAnalytics && (
            <View style={styles.skillsSection}>
              {skillBreakdown.map(renderSkillCard)}
            </View>
          )}

          {recommendedLesson && (
            <View style={styles.recommendedSection}>
              <Text style={styles.sectionTitle}>📚 Continue Learning</Text>
              <TouchableOpacity
                style={styles.recommendedCard}
                onPress={() => startLesson(recommendedLesson)}
              >
                <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.recommendedGradient}>
                  <View style={styles.recommendedContent}>
                    <Text style={styles.recommendedLabel}>RECOMMENDED</Text>
                    <Text style={styles.recommendedName}>{recommendedLesson.name}</Text>
                    <Text style={styles.recommendedDesc}>{recommendedLesson.description}</Text>
                    <View style={styles.recommendedMeta}>
                      <Text style={styles.recommendedMetaText}>{recommendedLesson.difficulty}</Text>
                      <Text style={styles.recommendedMetaText}>•</Text>
                      <Text style={styles.recommendedMetaText}>{recommendedLesson.targetNotes.length} notes</Text>
                      <Text style={styles.recommendedMetaText}>•</Text>
                      <Text style={styles.recommendedMetaText}>{recommendedLesson.xpReward} XP</Text>
                    </View>
                  </View>
                  <Play size={24} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {dailyChallenge && (
            <View style={styles.dailySection}>
              <Text style={styles.sectionTitle}>🔥 Daily Challenge</Text>
              <TouchableOpacity
                style={styles.dailyCard}
                onPress={() => startLesson(dailyChallenge)}
              >
                <View style={styles.dailyHeader}>
                  <Zap size={20} color="#FBBF24" />
                  <Text style={styles.dailyLabel}>2x XP Today!</Text>
                </View>
                <Text style={styles.dailyName}>{dailyChallenge.name}</Text>
                <Text style={styles.dailyDifficulty}>{dailyChallenge.difficulty} • {dailyChallenge.targetNotes.length} notes</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.curriculaSection}>
            <Text style={styles.sectionTitle}>🎓 Curricula</Text>
            {curricula.map((curriculum) => {
              const isUnlocked = stats.totalXp >= curriculum.unlockRequirement;
              const progress = getCurriculumProgress(curriculum.id);
              
              return (
                <TouchableOpacity
                  key={curriculum.id}
                  style={[styles.curriculumCard, !isUnlocked && styles.curriculumLocked]}
                  onPress={() => isUnlocked && setSelectedCurriculum(curriculum)}
                  disabled={!isUnlocked}
                >
                  <View style={[styles.curriculumIcon, { backgroundColor: curriculum.color + '20' }]}>
                    <Text style={styles.curriculumEmoji}>{curriculum.icon}</Text>
                  </View>
                  <View style={styles.curriculumInfo}>
                    <View style={styles.curriculumTitleRow}>
                      <Text style={styles.curriculumName}>{curriculum.name}</Text>
                      {curriculum.isPremium && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumBadgeText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.curriculumDesc}>{curriculum.description}</Text>
                    {isUnlocked && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${progress.percentage}%`, backgroundColor: curriculum.color }]} />
                        </View>
                        <Text style={styles.progressText}>{progress.completed}/{progress.total}</Text>
                      </View>
                    )}
                  </View>
                  {isUnlocked ? (
                    <ChevronRight size={24} color={Colors.textMuted} />
                  ) : (
                    <View style={styles.lockContainer}>
                      <Lock size={18} color={Colors.textMuted} />
                      <Text style={styles.lockText}>{curriculum.unlockRequirement} XP</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <Modal visible={!!selectedCurriculum} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedCurriculum(null)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {selectedCurriculum?.icon} {selectedCurriculum?.name}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <Text style={styles.curriculumModalDesc}>{selectedCurriculum?.description}</Text>
              
              <View style={styles.curriculumMeta}>
                <View style={styles.metaItem}>
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{selectedCurriculum?.estimatedHours}h</Text>
                </View>
                <View style={styles.metaItem}>
                  <BookOpen size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{selectedCurriculum?.lessons.length} lessons</Text>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedCurriculum?.lessons.map((lesson) => {
                  const progress = getLessonProgress(lesson.id);
                  
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={styles.lessonCard}
                      onPress={() => {
                        setSelectedCurriculum(null);
                        startLesson(lesson);
                      }}
                    >
                      <View style={styles.lessonCardInfo}>
                        <Text style={styles.lessonCardName}>{lesson.name}</Text>
                        <Text style={styles.lessonCardMeta}>
                          {lesson.difficulty} • {lesson.targetNotes.length} notes • {lesson.xpReward} XP
                        </Text>
                        {lesson.skillFocus.length > 0 && (
                          <View style={styles.skillTags}>
                            {lesson.skillFocus.slice(0, 2).map(skill => (
                              <View key={skill} style={[styles.skillTag, { backgroundColor: SKILL_COLORS[skill] + '20' }]}>
                                <Text style={[styles.skillTagText, { color: SKILL_COLORS[skill] }]}>{SKILL_ICONS[skill]}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      {progress?.completed ? (
                        renderStars(progress.starsEarned)
                      ) : (
                        <ChevronRight size={18} color={Colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showSettings} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.settingsModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.settingRow} onPress={toggleAICoach}>
                <View style={styles.settingInfo}>
                  <Brain size={20} color="#A78BFA" />
                  <View>
                    <Text style={styles.settingName}>AI Coach</Text>
                    <Text style={styles.settingDesc}>Get personalized feedback after lessons</Text>
                  </View>
                </View>
                <View style={[styles.toggle, stats.aiCoachEnabled && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, stats.aiCoachEnabled && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function LearningScreen() {
  return (
    <LearningProvider>
      <LearningContent />
    </LearningProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { color: Colors.textSecondary, fontSize: 16, marginTop: 12 },
  header: { padding: 20, paddingTop: 10, position: 'relative' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  settingsBtn: { position: 'absolute', right: 20, top: 10, padding: 8 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginTop: 6 },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  analyticsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  analyticsToggleText: { fontSize: 14, color: Colors.text, fontWeight: '500' as const },
  skillsSection: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  skillCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, gap: 12 },
  skillIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  skillEmoji: { fontSize: 18 },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 13, color: Colors.text, fontWeight: '500' as const, textTransform: 'capitalize' as const },
  skillProgressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  skillProgressFill: { height: '100%', borderRadius: 2 },
  skillLevel: { fontSize: 14, fontWeight: '700' as const },
  recommendedSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 12 },
  recommendedCard: { borderRadius: 16, overflow: 'hidden' },
  recommendedGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  recommendedContent: { flex: 1 },
  recommendedLabel: { fontSize: 10, fontWeight: '700' as const, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  recommendedName: { fontSize: 18, fontWeight: '700' as const, color: '#FFF', marginTop: 4 },
  recommendedDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  recommendedMeta: { flexDirection: 'row', gap: 6, marginTop: 8 },
  recommendedMetaText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' as const },
  dailySection: { paddingHorizontal: 20, marginBottom: 20 },
  dailyCard: { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dailyLabel: { fontSize: 12, fontWeight: '700' as const, color: '#FBBF24' },
  dailyName: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginTop: 8 },
  dailyDifficulty: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, textTransform: 'capitalize' as const },
  curriculaSection: { paddingHorizontal: 20, paddingBottom: 100 },
  curriculumCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 12 },
  curriculumLocked: { opacity: 0.5 },
  curriculumIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  curriculumEmoji: { fontSize: 24 },
  curriculumInfo: { flex: 1, marginLeft: 12 },
  curriculumTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  curriculumName: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  premiumBadge: { backgroundColor: '#A78BFA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  premiumBadgeText: { fontSize: 9, fontWeight: '700' as const, color: '#FFF' },
  curriculumDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressBar: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 11, color: Colors.textSecondary },
  lockContainer: { alignItems: 'center' },
  lockText: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  starsContainer: { flexDirection: 'row', gap: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
  modalContent: { flex: 1, backgroundColor: '#1E293B', marginTop: 60, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modeModalContent: { backgroundColor: '#1E293B', marginTop: 'auto', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  settingsModalContent: { backgroundColor: '#1E293B', marginTop: 'auto', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  curriculumModalDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  curriculumMeta: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 },
  lessonCardInfo: { flex: 1 },
  lessonCardName: { fontSize: 15, fontWeight: '500' as const, color: Colors.text },
  lessonCardMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, textTransform: 'capitalize' as const },
  skillTags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  skillTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  skillTagText: { fontSize: 12 },
  modeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  modeButtonSelected: { borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' },
  modeIcon: { fontSize: 24, marginRight: 12 },
  modeInfo: { flex: 1 },
  modeName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  modeNameSelected: { color: '#22C55E' },
  modeDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  modeBonus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  modeBonusText: { fontSize: 11, fontWeight: '600' as const, color: Colors.text },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingName: { fontSize: 15, fontWeight: '500' as const, color: Colors.text },
  settingDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', padding: 2 },
  toggleActive: { backgroundColor: '#22C55E' },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF' },
  toggleKnobActive: { marginLeft: 'auto' },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  backButton: { padding: 8 },
  lessonTitleContainer: { flex: 1, marginLeft: 12 },
  lessonTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  lessonDifficulty: { fontSize: 10, color: Colors.textSecondary, textTransform: 'uppercase' as const },
  modeBadge: { backgroundColor: 'rgba(167,139,250,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  modeBadgeText: { fontSize: 10, color: '#A78BFA', fontWeight: '500' as const },
  lessonHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpText: { fontSize: 14, fontWeight: '600' as const, color: '#FBBF24' },
  lessonContent: { padding: 20, paddingBottom: 100 },
  lessonInfo: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 16 },
  lessonDescription: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  lessonStats: { flexDirection: 'row', gap: 16, marginTop: 12 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  targetText: { fontSize: 13, color: Colors.accent },
  theoryTipContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, backgroundColor: 'rgba(251,191,36,0.1)', padding: 12, borderRadius: 10 },
  theoryTipText: { flex: 1, fontSize: 12, color: '#FBBF24', lineHeight: 18 },
  tempoControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 16 },
  tempoLabel: { fontSize: 14, color: Colors.textSecondary },
  tempoButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tempoBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  tempoValue: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, minWidth: 70, textAlign: 'center' as const },
  successFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#22C55E', zIndex: 50 },
  readySection: { alignItems: 'center' },
  playContainer: {},
  bigPlayButton: { backgroundColor: '#22C55E', borderRadius: 20, padding: 30, alignItems: 'center', width: width - 80 },
  bigPlayText: { fontSize: 18, fontWeight: '700' as const, color: Colors.background, marginTop: 12 },
  noteCount: { fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 },
  changeModeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  changeModeText: { fontSize: 14, color: Colors.accent },
  hintsContainer: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginTop: 24, width: '100%' },
  hintsTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 8 },
  hintText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  listeningSection: { alignItems: 'center', paddingVertical: 40 },
  listeningPulse: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(167,139,250,0.2)', justifyContent: 'center', alignItems: 'center' },
  listeningText: { fontSize: 24, fontWeight: '700' as const, color: Colors.text, marginTop: 24 },
  listeningSubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  repeatingSection: { alignItems: 'center' },
  repeatingTitle: { fontSize: 24, fontWeight: '700' as const, color: Colors.text },
  repeatingSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 20 },
  comboBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  comboText: { fontSize: 14, fontWeight: '600' as const, color: '#FBBF24' },
  attemptGrid: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' },
  attemptCell: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeCell: { borderColor: '#A78BFA', backgroundColor: 'rgba(167,139,250,0.1)' },
  correctCell: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  closeCell: { backgroundColor: '#EAB308', borderColor: '#EAB308' },
  wrongCell: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  attemptCellText: { color: Colors.text, fontSize: 14, fontWeight: '600' as const },
  keyboardSection: { marginTop: 20, width: '100%' },
  pianoContainer: { gap: 8, marginBottom: 16 },
  pianoRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  pianoKey: { width: 46, height: 52, borderRadius: 10, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' },
  sharpKey: { backgroundColor: '#1F2937', width: 42, height: 48 },
  pianoKeyText: { color: '#0F172A', fontSize: 13, fontWeight: '700' as const },
  sharpKeyText: { color: Colors.text },
  actionButtons: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  deleteBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { color: Colors.text, fontSize: 20 },
  submitBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  submitBtnActive: { backgroundColor: '#22C55E' },
  submitBtnText: { color: Colors.textMuted, fontSize: 16, fontWeight: '600' as const },
  submitBtnTextActive: { color: '#0F172A' },
  feedbackSection: { alignItems: 'center' },
  feedbackTitle: { fontSize: 24, fontWeight: '700' as const, color: Colors.text },
  feedbackAccuracy: { fontSize: 18, color: Colors.accent, marginTop: 8, marginBottom: 20 },
  feedbackLegend: { flexDirection: 'row', gap: 16, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: Colors.textSecondary },
  continueButton: { backgroundColor: '#A78BFA', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 20, marginTop: 24 },
  continueButtonText: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  coachingSection: { alignItems: 'center' },
  coachHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  coachAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(167,139,250,0.2)', justifyContent: 'center', alignItems: 'center' },
  coachName: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  coachSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  coachBubble: { backgroundColor: 'rgba(167,139,250,0.15)', borderRadius: 16, padding: 16, marginBottom: 16, width: '100%' },
  coachMessage: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  coachSuggestions: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, width: '100%', marginBottom: 16 },
  coachSectionTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 10 },
  coachTip: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  coachEncouragement: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, padding: 16, width: '100%', marginBottom: 16 },
  encouragementText: { fontSize: 14, color: '#22C55E', textAlign: 'center' as const, fontWeight: '500' as const },
  completeSection: { alignItems: 'center' },
  completeTitle: { fontSize: 26, fontWeight: '700' as const, color: Colors.text, marginTop: 16 },
  completeAccuracy: { fontSize: 16, color: Colors.textSecondary, marginTop: 8, marginBottom: 12 },
  xpGainBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 8 },
  xpGainText: { fontSize: 18, fontWeight: '700' as const, color: '#FBBF24' },
  completeStats: { flexDirection: 'row', gap: 32, marginTop: 24, marginBottom: 32 },
  completeStat: { alignItems: 'center' },
  completeStatValue: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  completeStatLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  endButtons: { flexDirection: 'row', gap: 16 },
  retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, gap: 8 },
  retryButtonText: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  doneButton: { backgroundColor: '#22C55E', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20 },
  doneButtonText: { fontSize: 15, fontWeight: '600' as const, color: Colors.background },
  generatingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  generatingText: { color: '#A78BFA', fontSize: 16, marginTop: 16 },
});
