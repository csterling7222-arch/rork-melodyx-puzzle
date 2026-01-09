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
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { LearningProvider, useLearning, Curriculum } from '@/contexts/LearningContext';
import { useInstrument } from '@/contexts/InstrumentContext';
import { useAudio } from '@/hooks/useAudio';
import InstrumentSelector from '@/components/InstrumentSelector';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const NOTE_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function LearningContent() {
  const {
    stats,
    gameState,
    currentLesson,
    curricula,
    isLoading,
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
  } = useLearning();

  const { currentInstrument } = useInstrument();
  const { playNote, playMelody, playbackState } = useAudio(currentInstrument.id);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const prevAttemptLength = useRef(gameState.currentAttempt.length);
  const successFlashAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
    if (gameState.gamePhase === 'complete') {
      Animated.sequence([
        Animated.timing(successFlashAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(successFlashAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [gameState.gamePhase, successFlashAnim]);

  const handlePlayMelody = useCallback(() => {
    if (currentLesson) {
      startListening();
      playMelody(currentLesson.targetNotes, currentLesson.tempo);
      setTimeout(() => {
        finishListening();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, currentLesson.targetNotes.length * currentLesson.tempo + 500);
    }
  }, [currentLesson, playMelody, startListening, finishListening]);

  const handleNotePress = useCallback((note: string) => {
    addNoteToAttempt(note);
  }, [addNoteToAttempt]);

  const handleSubmit = useCallback(() => {
    if (currentLesson && gameState.currentAttempt.length === currentLesson.targetNotes.length) {
      playMelody(gameState.currentAttempt, 200);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setTimeout(() => {
        submitAttempt();
      }, gameState.currentAttempt.length * 200 + 100);
    }
  }, [currentLesson, gameState.currentAttempt, playMelody, submitAttempt]);

  const handleRemoveNote = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    removeNoteFromAttempt();
  }, [removeNoteFromAttempt]);

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
        {currentLesson.targetNotes.map((_, index) => {
          const currentNote = gameState.currentAttempt[index];
          const feedback = lastAttempt?.feedback[index];
          let cellStyle = styles.attemptCell;
          
          if (gameState.gamePhase === 'feedback' && feedback) {
            cellStyle = [
              styles.attemptCell,
              feedback === 'correct' ? styles.correctCell :
              feedback === 'close' ? styles.closeCell : styles.wrongCell,
            ] as any;
          } else if (currentNote) {
            cellStyle = [styles.attemptCell, styles.activeCell] as any;
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading lessons...</Text>
      </View>
    );
  }

  if (currentLesson) {
    const canSubmit = gameState.currentAttempt.length === currentLesson.targetNotes.length && gameState.gamePhase === 'repeating';

    return (
      <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.lessonHeader}>
            <TouchableOpacity onPress={exitLesson} style={styles.backButton}>
              <Home size={20} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.lessonTitleContainer}>
              <Text style={styles.lessonTitle}>{currentLesson.name}</Text>
              <Text style={styles.lessonDifficulty}>{currentLesson.difficulty.toUpperCase()}</Text>
            </View>
            <View style={styles.lessonHeaderRight}>
              <InstrumentSelector compact />
              <View style={styles.xpBadge}>
                <Sparkles size={14} color="#FBBF24" />
                <Text style={styles.xpText}>{currentLesson.xpReward}</Text>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.lessonContent}>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonDescription}>{currentLesson.description}</Text>
              <View style={styles.targetRow}>
                <Target size={16} color={Colors.accent} />
                <Text style={styles.targetText}>Target: {currentLesson.requiredAccuracy}% accuracy</Text>
              </View>
            </View>

            <Animated.View style={[styles.successFlash, { opacity: successFlashAnim }]} pointerEvents="none" />

            {gameState.gamePhase === 'ready' && (
              <View style={styles.readySection}>
                <Animated.View style={[styles.playContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <TouchableOpacity style={styles.bigPlayButton} onPress={handlePlayMelody} disabled={playbackState.isPlaying}>
                    <Headphones size={40} color={Colors.background} />
                    <Text style={styles.bigPlayText}>Listen to Melody</Text>
                    <Text style={styles.noteCount}>{currentLesson.targetNotes.length} notes</Text>
                  </TouchableOpacity>
                </Animated.View>
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
                <Text style={styles.listeningSubtext}>Memorize the melody</Text>
              </View>
            )}

            {gameState.gamePhase === 'repeating' && (
              <View style={styles.repeatingSection}>
                <Text style={styles.repeatingTitle}>🎹 Your Turn!</Text>
                <Text style={styles.repeatingSubtitle}>Repeat the melody you heard</Text>
                
                {renderAttemptGrid()}

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

            {gameState.gamePhase === 'complete' && (
              <View style={styles.completeSection}>
                <Trophy size={64} color="#FBBF24" />
                <Text style={styles.completeTitle}>
                  {gameState.accuracy >= currentLesson.requiredAccuracy ? '🏆 Lesson Complete!' : 'Practice Complete'}
                </Text>
                <Text style={styles.completeAccuracy}>Final Accuracy: {gameState.accuracy}%</Text>
                {renderStars(gameState.accuracy >= 95 ? 3 : gameState.accuracy >= 85 ? 2 : gameState.accuracy >= currentLesson.requiredAccuracy ? 1 : 0)}
                
                <View style={styles.completeStats}>
                  <View style={styles.completeStat}>
                    <Text style={styles.completeStatValue}>{gameState.attempts.length}</Text>
                    <Text style={styles.completeStatLabel}>Attempts</Text>
                  </View>
                  <View style={styles.completeStat}>
                    <Text style={styles.completeStatValue}>{gameState.streak}</Text>
                    <Text style={styles.completeStatLabel}>Streak</Text>
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
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const recommendedLesson = getRecommendedLesson();
  const dailyChallenge = getDailyChallenge();

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
          </View>

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
                <Text style={styles.dailyDifficulty}>{dailyChallenge.difficulty}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.curriculaSection}>
            <Text style={styles.sectionTitle}>🎓 Curricula</Text>
            {curricula.map((curriculum) => {
              const isUnlocked = stats.totalXp >= curriculum.unlockRequirement;
              const completedLessons = curriculum.lessons.filter(l => getLessonProgress(l.id)?.completed).length;
              
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
                    <Text style={styles.curriculumName}>{curriculum.name}</Text>
                    <Text style={styles.curriculumDesc}>{curriculum.description}</Text>
                    {isUnlocked && (
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(completedLessons / curriculum.lessons.length) * 100}%`, backgroundColor: curriculum.color }]} />
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
  loadingText: { color: Colors.textSecondary, fontSize: 16 },
  header: { padding: 20, paddingTop: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  recommendedSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 12 },
  recommendedCard: { borderRadius: 16, overflow: 'hidden' },
  recommendedGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  recommendedContent: { flex: 1 },
  recommendedLabel: { fontSize: 10, fontWeight: '700' as const, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  recommendedName: { fontSize: 18, fontWeight: '700' as const, color: '#FFF', marginTop: 4 },
  recommendedDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
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
  curriculumName: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  curriculumDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  lockContainer: { alignItems: 'center' },
  lockText: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  starsContainer: { flexDirection: 'row', gap: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
  modalContent: { flex: 1, backgroundColor: '#1E293B', marginTop: 60, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 },
  lessonCardInfo: { flex: 1 },
  lessonCardName: { fontSize: 15, fontWeight: '500' as const, color: Colors.text },
  lessonCardMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, textTransform: 'capitalize' as const },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  backButton: { padding: 8 },
  lessonTitleContainer: { flex: 1, marginLeft: 12 },
  lessonTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  lessonDifficulty: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  lessonHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpText: { fontSize: 14, fontWeight: '600' as const, color: '#FBBF24' },
  lessonContent: { padding: 20, paddingBottom: 100 },
  lessonInfo: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 20 },
  lessonDescription: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  targetText: { fontSize: 13, color: Colors.accent },
  successFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#22C55E', zIndex: 50 },
  readySection: { alignItems: 'center' },
  playContainer: {},
  bigPlayButton: { backgroundColor: '#22C55E', borderRadius: 20, padding: 30, alignItems: 'center', width: width - 80 },
  bigPlayText: { fontSize: 18, fontWeight: '700' as const, color: Colors.background, marginTop: 12 },
  noteCount: { fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 },
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
  completeSection: { alignItems: 'center' },
  completeTitle: { fontSize: 26, fontWeight: '700' as const, color: Colors.text, marginTop: 16 },
  completeAccuracy: { fontSize: 16, color: Colors.textSecondary, marginTop: 8, marginBottom: 12 },
  completeStats: { flexDirection: 'row', gap: 32, marginTop: 24, marginBottom: 32 },
  completeStat: { alignItems: 'center' },
  completeStatValue: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  completeStatLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  endButtons: { flexDirection: 'row', gap: 16 },
  retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, gap: 8 },
  retryButtonText: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  doneButton: { backgroundColor: '#22C55E', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20 },
  doneButtonText: { fontSize: 15, fontWeight: '600' as const, color: Colors.background },
});
