import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Leaf, Wind, Moon, Star, ChevronRight, X, Play } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { WellnessProvider, useWellness } from '@/contexts/WellnessContext';
import { useInstrument } from '@/contexts/InstrumentContext';
import { BREATHING_PATTERNS, BreathingPatternKey } from '@/constants/wellness';
import { useAudio } from '@/hooks/useAudio';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const NOTE_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function WellnessContent() {
  const {
    stats,
    gameState,
    currentMelody,
    currentGuess,
    isLoading,
    addNote,
    removeNote,
    submitGuess,
    nextPuzzle,
    showMeditation,
    setShowMeditation,
    selectedBreathing,
    setSelectedBreathing,
    isBreathing,
    startBreathing,
    completeBreathingSession,
    getBreathingPattern,
    achievements,
  } = useWellness();

  const { currentInstrument, setWellnessModeActive } = useInstrument();
  const { playNote } = useAudio(currentInstrument.id);

  useEffect(() => {
    setWellnessModeActive(true);
    console.log('Wellness mode activated - using calm synth sounds');
    return () => {
      setWellnessModeActive(false);
      console.log('Wellness mode deactivated');
    };
  }, [setWellnessModeActive]);

  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const breathAnim = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  const isBreathingRef = useRef(isBreathing);
  isBreathingRef.current = isBreathing;

  useEffect(() => {
    if (!isBreathing) return;

    const pattern = getBreathingPattern();
    let cycles = 0;
    let isMounted = true;
    let holdTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const runBreathingCycle = () => {
      if (!isMounted || !isBreathingRef.current) return;
      setBreathPhase('inhale');
      Animated.timing(breathAnim, {
        toValue: 1,
        duration: pattern.inhale * 1000,
        useNativeDriver: true,
      }).start(() => {
        if (!isMounted || !isBreathingRef.current) return;
        if (pattern.hold > 0) {
          setBreathPhase('hold');
          holdTimeoutId = setTimeout(() => {
            if (!isMounted || !isBreathingRef.current) return;
            setBreathPhase('exhale');
            Animated.timing(breathAnim, {
              toValue: 0.5,
              duration: pattern.exhale * 1000,
              useNativeDriver: true,
            }).start(() => {
              if (!isMounted || !isBreathingRef.current) return;
              cycles++;
              setBreathCount(cycles);
              if (cycles < 5 && isBreathingRef.current) {
                runBreathingCycle();
              } else if (isMounted) {
                completeBreathingSession();
                setShowBreathingModal(false);
              }
            });
          }, pattern.hold * 1000);
        } else {
          setBreathPhase('exhale');
          Animated.timing(breathAnim, {
            toValue: 0.5,
            duration: pattern.exhale * 1000,
            useNativeDriver: true,
          }).start(() => {
            if (!isMounted || !isBreathingRef.current) return;
            cycles++;
            setBreathCount(cycles);
            if (cycles < 5 && isBreathingRef.current) {
              runBreathingCycle();
            } else if (isMounted) {
              completeBreathingSession();
              setShowBreathingModal(false);
            }
          });
        }
      });
    };

    runBreathingCycle();
    
    return () => {
      isMounted = false;
      if (holdTimeoutId) clearTimeout(holdTimeoutId);
    };
  }, [isBreathing, breathAnim, getBreathingPattern, completeBreathingSession]);

  const handleNotePress = (note: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playNote(note);
    addNote(note);
  };

  const handleSubmit = () => {
    if (currentGuess.length === currentMelody.notes.length) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      submitGuess();
    }
  };

  const renderGuessGrid = () => {
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const guess = gameState.guesses[i];
      const isCurrentRow = i === gameState.guesses.length && gameState.gameStatus === 'playing';

      rows.push(
        <View key={i} style={styles.guessRow}>
          {Array.from({ length: currentMelody.notes.length }).map((_, j) => {
            let cellContent = '';
            let cellStyle = styles.guessCell;

            if (guess) {
              cellContent = guess[j];
              const isCorrect = guess[j] === currentMelody.notes[j];
              cellStyle = [
                styles.guessCell,
                isCorrect ? styles.correctCell : styles.wrongCell,
              ] as any;
            } else if (isCurrentRow && currentGuess[j]) {
              cellContent = currentGuess[j];
              cellStyle = [styles.guessCell, styles.activeCell] as any;
            }

            return (
              <View key={j} style={cellStyle}>
                <Text style={styles.guessCellText}>{cellContent}</Text>
              </View>
            );
          })}
        </View>
      );
    }
    return rows;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Finding inner peace...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Leaf size={28} color="#4ADE80" />
              <Text style={styles.title}>Zen Mode</Text>
            </View>
            <Text style={styles.subtitle}>Find peace through melody</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Moon size={20} color="#A78BFA" />
              <Text style={styles.statValue}>{stats.zenStreak}</Text>
              <Text style={styles.statLabel}>Zen Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Heart size={20} color="#F472B6" />
              <Text style={styles.statValue}>{stats.totalMinutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Star size={20} color="#FBBF24" />
              <Text style={styles.statValue}>{stats.puzzlesSolved}</Text>
              <Text style={styles.statLabel}>Solved</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.breathingCard}
            onPress={() => setShowBreathingModal(true)}
          >
            <LinearGradient
              colors={['rgba(74, 222, 128, 0.2)', 'rgba(34, 197, 94, 0.1)']}
              style={styles.breathingGradient}
            >
              <View style={styles.breathingContent}>
                <Wind size={32} color="#4ADE80" />
                <View style={styles.breathingText}>
                  <Text style={styles.breathingTitle}>Breathing Exercise</Text>
                  <Text style={styles.breathingSubtitle}>
                    {stats.breathingSessions} sessions completed
                  </Text>
                </View>
                <ChevronRight size={24} color="#4ADE80" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.puzzleSection}>
            <Text style={styles.sectionTitle}>
              {currentMelody.name}
            </Text>
            <Text style={styles.puzzleHint}>{currentMelody.hint}</Text>

            <View style={styles.guessGrid}>{renderGuessGrid()}</View>

            {gameState.gameStatus === 'won' && (
              <View style={styles.resultContainer}>
                <Text style={styles.wonText}>🧘 Inner Peace Achieved</Text>
                <TouchableOpacity style={styles.nextButton} onPress={nextPuzzle}>
                  <Text style={styles.nextButtonText}>Continue Journey</Text>
                </TouchableOpacity>
              </View>
            )}

            {gameState.gameStatus === 'lost' && (
              <View style={styles.resultContainer}>
                <Text style={styles.lostText}>Take a breath and try again</Text>
                <Text style={styles.solutionText}>
                  The melody was: {currentMelody.notes.join(' - ')}
                </Text>
                <TouchableOpacity style={styles.nextButton} onPress={nextPuzzle}>
                  <Text style={styles.nextButtonText}>New Melody</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {gameState.gameStatus === 'playing' && (
            <View style={styles.keyboardSection}>
              <View style={styles.pianoContainer}>
                <View style={styles.pianoRow}>
                  {NOTE_SCALE.slice(0, 6).map((note) => (
                    <TouchableOpacity
                      key={note}
                      style={[
                        styles.pianoKey,
                        note.includes('#') && styles.sharpKey,
                      ]}
                      onPress={() => handleNotePress(note)}
                    >
                      <Text style={[
                        styles.pianoKeyText,
                        note.includes('#') && styles.sharpKeyText,
                      ]}>{note}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.pianoRow}>
                  {NOTE_SCALE.slice(6).map((note) => (
                    <TouchableOpacity
                      key={note}
                      style={[
                        styles.pianoKey,
                        note.includes('#') && styles.sharpKey,
                      ]}
                      onPress={() => handleNotePress(note)}
                    >
                      <Text style={[
                        styles.pianoKeyText,
                        note.includes('#') && styles.sharpKeyText,
                      ]}>{note}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.deleteBtn} onPress={removeNote}>
                  <Text style={styles.actionBtnText}>⌫</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    currentGuess.length === currentMelody.notes.length && styles.submitBtnActive,
                  ]}
                  onPress={handleSubmit}
                  disabled={currentGuess.length !== currentMelody.notes.length}
                >
                  <Text style={[
                    styles.submitBtnText,
                    currentGuess.length === currentMelody.notes.length && styles.submitBtnTextActive,
                  ]}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Wellness Achievements</Text>
            <View style={styles.achievementsList}>
              {achievements.slice(0, 4).map((achievement) => {
                const isUnlocked = stats.unlockedAchievements.includes(achievement.id);
                return (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      !isUnlocked && styles.achievementLocked,
                    ]}
                  >
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <Modal visible={showBreathingModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.breathingModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowBreathingModal(false);
                  completeBreathingSession();
                }}
              >
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>

              {!isBreathing ? (
                <>
                  <Text style={styles.breathingModalTitle}>Choose Your Practice</Text>
                  
                  {(Object.keys(BREATHING_PATTERNS) as BreathingPatternKey[]).map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.patternOption,
                        selectedBreathing === key && styles.patternSelected,
                      ]}
                      onPress={() => setSelectedBreathing(key)}
                    >
                      <Text style={styles.patternName}>{BREATHING_PATTERNS[key].name}</Text>
                      <Text style={styles.patternTiming}>
                        {BREATHING_PATTERNS[key].inhale}s - {BREATHING_PATTERNS[key].hold}s - {BREATHING_PATTERNS[key].exhale}s
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity style={styles.startBreathingButton} onPress={startBreathing}>
                    <Play size={20} color="#FFF" />
                    <Text style={styles.startBreathingText}>Begin</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.breathingActive}>
                  <Text style={styles.breathPhaseText}>
                    {breathPhase === 'inhale' && 'Breathe In...'}
                    {breathPhase === 'hold' && 'Hold...'}
                    {breathPhase === 'exhale' && 'Breathe Out...'}
                  </Text>
                  
                  <Animated.View
                    style={[
                      styles.breathCircle,
                      {
                        transform: [{ scale: breathAnim }],
                        opacity: breathAnim,
                      },
                    ]}
                  />
                  
                  <Text style={styles.breathCounter}>{breathCount} / 5 cycles</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={showMeditation} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.meditationContent}>
              <Text style={styles.meditationTitle}>🧘 Moment of Peace</Text>
              <Text style={styles.meditationText}>
                Take 30 seconds to appreciate this moment of calm.
              </Text>
              <Animated.View
                style={[
                  styles.meditationGlow,
                  {
                    opacity: glowAnim,
                  },
                ]}
              />
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  setShowMeditation(false);
                  nextPuzzle();
                }}
              >
                <Text style={styles.skipButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function WellnessScreen() {
  return (
    <WellnessProvider>
      <WellnessContent />
    </WellnessProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F2027',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  breathingCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  breathingGradient: {
    padding: 20,
  },
  breathingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breathingText: {
    flex: 1,
    marginLeft: 16,
  },
  breathingTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  breathingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  puzzleSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  puzzleHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontStyle: 'italic' as const,
  },
  guessGrid: {
    gap: 8,
  },
  guessRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  guessCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeCell: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74,222,128,0.1)',
  },
  correctCell: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  wrongCell: {
    backgroundColor: 'rgba(239,68,68,0.3)',
    borderColor: 'rgba(239,68,68,0.5)',
  },
  guessCellText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  resultContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  wonText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#4ADE80',
    marginBottom: 16,
  },
  lostText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  solutionText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  nextButtonText: {
    color: '#0F2027',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  keyboardSection: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  achievementsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  achievementCard: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  achievementDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingModalContent: {
    width: width - 40,
    backgroundColor: '#1A2634',
    borderRadius: 24,
    padding: 24,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 1,
  },
  breathingModalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 24,
    marginTop: 20,
  },
  patternOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  patternSelected: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74,222,128,0.1)',
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  patternTiming: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  startBreathingButton: {
    backgroundColor: '#4ADE80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  startBreathingText: {
    color: '#0F2027',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  breathingActive: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  breathPhaseText: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#4ADE80',
    marginBottom: 40,
  },
  breathCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(74,222,128,0.3)',
    borderWidth: 3,
    borderColor: '#4ADE80',
  },
  breathCounter: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 40,
  },
  meditationContent: {
    width: width - 60,
    backgroundColor: '#1A2634',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  meditationTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  meditationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  meditationGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(74,222,128,0.3)',
    marginVertical: 30,
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  skipButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  pianoContainer: {
    gap: 8,
    marginBottom: 16,
  },
  pianoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  pianoKey: {
    width: 48,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#4ADE80',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sharpKey: {
    backgroundColor: '#1F2937',
    width: 44,
    height: 52,
  },
  pianoKeyText: {
    color: '#0F2027',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  sharpKeyText: {
    color: Colors.text,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: Colors.text,
    fontSize: 20,
  },
  submitBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitBtnActive: {
    backgroundColor: '#4ADE80',
  },
  submitBtnText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  submitBtnTextActive: {
    color: '#0F2027',
  },
});
