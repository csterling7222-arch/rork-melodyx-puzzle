import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, Zap, Trophy, Play, RotateCcw, Home, Volume2, Music } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useFever } from '@/contexts/FeverContext';
import { useScreenTheme } from '@/contexts/ThemeContext';
import { useInstrument } from '@/contexts/InstrumentContext';
import ThemedBackground from '@/components/ThemedBackground';
import { useAudio } from '@/hooks/useAudio';
import GuessGrid from '@/components/GuessGrid';
import PianoKeyboard from '@/components/PianoKeyboard';
import InstrumentSelector from '@/components/InstrumentSelector';

function FeverBar({ timeLeft, isActive }: { timeLeft: number; isActive: boolean }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const widthAnim = useRef(new Animated.Value(timeLeft / 30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isActive, pulseAnim, glowAnim]);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: timeLeft / 30,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, widthAnim]);

  if (!isActive) return null;

  return (
    <Animated.View style={[styles.feverContainer, { transform: [{ scale: pulseAnim }] }]}>
      <Animated.View 
        style={[
          styles.feverGlow,
          { opacity: glowAnim }
        ]} 
      />
      <View style={styles.feverHeader}>
        <Flame size={20} color="#FF6B35" />
        <Text style={styles.feverText}>FEVER MODE!</Text>
        <Text style={styles.feverTimer}>{timeLeft}s</Text>
      </View>
      <View style={styles.feverBarBg}>
        <Animated.View 
          style={[
            styles.feverBarFill, 
            { 
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              })
            }
          ]} 
        />
      </View>
    </Animated.View>
  );
}

function ScoreDisplay({ score, chain, multiplier }: { score: number; chain: number; multiplier: number }) {
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const chainPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scoreAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scoreAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [score, scoreAnim]);

  useEffect(() => {
    if (chain > 0) {
      Animated.sequence([
        Animated.timing(chainPulse, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(chainPulse, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [chain, chainPulse]);

  return (
    <View style={styles.scoreContainer}>
      <Animated.View style={[styles.scoreBox, { transform: [{ scale: scoreAnim }] }]}>
        <Zap size={18} color={Colors.present} />
        <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
      </Animated.View>
      <Animated.View style={[styles.chainBox, { transform: [{ scale: chainPulse }] }]}>
        <Text style={styles.chainLabel}>Chain</Text>
        <Text style={styles.chainValue}>{chain}</Text>
      </Animated.View>
      {multiplier > 1 && (
        <View style={[styles.multiplierBox, multiplier >= 3 && styles.multiplierFever]}>
          <Text style={styles.multiplierText}>x{multiplier}</Text>
        </View>
      )}
    </View>
  );
}

function GameOverModal({ 
  score, 
  chain, 
  highScore,
  solvedCount,
  onRestart, 
  onGoHome 
}: { 
  score: number; 
  chain: number;
  highScore: number;
  solvedCount: number;
  onRestart: () => void; 
  onGoHome: () => void;
}) {
  const isNewHighScore = score >= highScore && score > 0;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (Platform.OS !== 'web') {
      if (isNewHighScore) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  }, [scaleAnim, opacityAnim, isNewHighScore]);

  return (
    <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
      <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.modalIcon}>
          <Trophy size={48} color={isNewHighScore ? Colors.present : Colors.accent} />
        </View>

        <Text style={styles.modalTitle}>
          {isNewHighScore ? '🎉 New High Score!' : 'Game Over'}
        </Text>

        <View style={styles.modalStats}>
          <View style={styles.modalStatRow}>
            <Text style={styles.modalStatLabel}>Final Score</Text>
            <Text style={styles.modalStatValue}>{score.toLocaleString()}</Text>
          </View>
          <View style={styles.modalStatRow}>
            <Text style={styles.modalStatLabel}>Melodies Solved</Text>
            <Text style={styles.modalStatValue}>{solvedCount}</Text>
          </View>
          <View style={styles.modalStatRow}>
            <Text style={styles.modalStatLabel}>Best Chain</Text>
            <Text style={styles.modalStatValue}>{chain}</Text>
          </View>
          <View style={styles.modalStatRow}>
            <Text style={styles.modalStatLabel}>High Score</Text>
            <Text style={[styles.modalStatValue, isNewHighScore && styles.highlightText]}>
              {Math.max(score, highScore).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.restartButton} onPress={onRestart}>
            <RotateCcw size={20} color={Colors.background} />
            <Text style={styles.restartButtonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={onGoHome}>
            <Home size={20} color={Colors.text} />
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function FeverGlowOverlay({ isActive, multiplier }: { isActive: boolean; multiplier: number }) {
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (multiplier >= 2) {
      Animated.timing(glowOpacity, {
        toValue: 0.1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, multiplier, glowOpacity]);

  const glowColor = isActive ? '#FF6B35' : (multiplier >= 2 ? Colors.present : 'transparent');

  return (
    <Animated.View
      style={[
        styles.feverGlowOverlay,
        { opacity: glowOpacity, backgroundColor: glowColor }
      ]}
      pointerEvents="none"
    />
  );
}

export default function FeverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, isDarkMode, animationsEnabled } = useScreenTheme('fever');
  const { currentInstrument } = useInstrument();
  const { playNote, playMelody, playbackState } = useAudio(currentInstrument.id);
  
  const {
    isPlaying,
    currentMelody,
    currentGuess,
    guesses,
    melodyLength,
    score,
    chain,
    multiplier,
    isFeverActive,
    feverTimeLeft,
    gameOver,
    stats,
    solvedCount,
    startGame,
    addNote,
    removeNote,
    submitGuess,
  } = useFever();

  const [showMelodyHint, setShowMelodyHint] = useState(false);
  const [showBuildingMelody, setShowBuildingMelody] = useState(false);
  const prevGuessLength = useRef(currentGuess.length);
  const correctFeedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentGuess.length > prevGuessLength.current && currentGuess.length > 0) {
      const lastNote = currentGuess[currentGuess.length - 1];
      playNote(lastNote);
      console.log(`Fever: Playing note ${lastNote} (${currentGuess.length}/${melodyLength})`);
      
      if (isFeverActive && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }
    prevGuessLength.current = currentGuess.length;
  }, [currentGuess, playNote, isFeverActive, melodyLength]);

  useEffect(() => {
    if (chain > 0 && guesses.length > 0) {
      Animated.sequence([
        Animated.timing(correctFeedbackAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(correctFeedbackAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [chain, guesses.length, correctFeedbackAnim]);

  const canSubmit = currentGuess.length === melodyLength && !gameOver;

  const handleStart = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    startGame();
    setShowMelodyHint(false);
  }, [startGame]);

  const handleGoHome = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace('/(tabs)');
  }, [router]);

  const handleAddNote = useCallback((note: string) => {
    if (Platform.OS !== 'web') {
      if (isFeverActive) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (multiplier >= 2) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    addNote(note);
  }, [addNote, isFeverActive, multiplier]);

  const handlePlayMelodyHint = useCallback(() => {
    if (currentMelody && guesses.length >= 2) {
      const hintNotes = currentMelody.notes.slice(0, 3);
      playMelody(hintNotes, 500);
      setShowMelodyHint(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [currentMelody, guesses.length, playMelody]);

  const handlePlayBuildingMelody = useCallback(() => {
    if (currentGuess.length > 0) {
      playMelody(currentGuess, 350);
      setShowBuildingMelody(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setTimeout(() => setShowBuildingMelody(false), currentGuess.length * 350 + 500);
    }
  }, [currentGuess, playMelody]);

  const handleSubmitWithSound = useCallback(() => {
    if (canSubmit) {
      playMelody(currentGuess, 200);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setTimeout(() => {
        submitGuess();
      }, currentGuess.length * 200 + 100);
    }
  }, [canSubmit, currentGuess, playMelody, submitGuess]);

  if (!isPlaying) {
    return (
      <ThemedBackground theme={theme} isDark={isDarkMode} animated={animationsEnabled}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.startScreen}>
            <View style={styles.feverIcon}>
              <Flame size={64} color="#FF6B35" />
            </View>
            <Text style={styles.title}>Sound Fever</Text>
            <Text style={styles.subtitle}>Endless melody madness!</Text>

            <View style={styles.rulesContainer}>
              <Text style={styles.ruleText}>🎵 Solve melodies to earn points</Text>
              <Text style={styles.ruleText}>🔥 Build chains for multipliers</Text>
              <Text style={styles.ruleText}>⚡ 10+ chain = FEVER MODE (x3!)</Text>
              <Text style={styles.ruleText}>❌ Miss 6 guesses = Game Over</Text>
            </View>

            <View style={styles.instrumentSection}>
              <Text style={styles.instrumentLabel}>Choose Your Sound</Text>
              <InstrumentSelector compact />
            </View>

            <View style={styles.highScoreBox}>
              <Trophy size={20} color={Colors.present} />
              <Text style={styles.highScoreLabel}>High Score</Text>
              <Text style={styles.highScoreValue}>{stats.highScore.toLocaleString()}</Text>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Play size={24} color={Colors.background} fill={Colors.background} />
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground theme={theme} isDark={isDarkMode} animated={animationsEnabled}>
      <FeverGlowOverlay isActive={isFeverActive} multiplier={multiplier} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <ScoreDisplay score={score} chain={chain} multiplier={multiplier} />
            <InstrumentSelector compact />
          </View>
          <FeverBar timeLeft={feverTimeLeft} isActive={isFeverActive} />
        </View>

        {currentMelody && (
          <View style={styles.melodyInfo}>
            <Text style={styles.melodyHint}>
              {guesses.length >= 2 ? currentMelody.hint : '???'}
            </Text>
            <View style={styles.audioButtonsRow}>
              {guesses.length >= 2 && (
                <TouchableOpacity 
                  style={styles.audioHintButton}
                  onPress={handlePlayMelodyHint}
                  disabled={playbackState.isPlaying}
                >
                  <Volume2 size={16} color={Colors.accent} />
                  <Text style={styles.audioHintText}>
                    {playbackState.isPlaying ? 'Playing...' : 'Hint'}
                  </Text>
                </TouchableOpacity>
              )}
              {currentGuess.length > 0 && (
                <TouchableOpacity 
                  style={[styles.audioHintButton, styles.buildingMelodyButton]}
                  onPress={handlePlayBuildingMelody}
                  disabled={playbackState.isPlaying}
                >
                  <Music size={16} color="#FF6B35" />
                  <Text style={[styles.audioHintText, styles.buildingMelodyText]}>
                    {showBuildingMelody ? 'Playing...' : `Play (${currentGuess.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {showMelodyHint && (
          <View style={styles.hintPlayed}>
            <Text style={styles.hintPlayedText}>🎧 First 3 notes played!</Text>
          </View>
        )}

        <View style={styles.gridContainer}>
          <GuessGrid
            guesses={guesses}
            currentGuess={currentGuess}
            melodyLength={melodyLength}
            maxGuesses={6}
          />
        </View>

        <Animated.View style={[
          styles.successFlash,
          { opacity: correctFeedbackAnim }
        ]} pointerEvents="none" />

        <View style={styles.bottomSection}>
          <PianoKeyboard
            onNotePress={handleAddNote}
            onDelete={removeNote}
            onSubmit={handleSubmitWithSound}
            canSubmit={canSubmit}
            disabled={gameOver}
            playNote={playNote}
          />
        </View>

        {gameOver && (
          <GameOverModal
            score={score}
            chain={chain}
            highScore={stats.highScore}
            solvedCount={solvedCount}
            onRestart={handleStart}
            onGoHome={handleGoHome}
          />
        )}
      </View>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  feverIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B35' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  rulesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  ruleText: {
    fontSize: 15,
    color: Colors.text,
  },
  instrumentSection: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  instrumentLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  highScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  highScoreLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  highScoreValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.present,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  chainBox: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  chainLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
  },
  chainValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.correct,
  },
  multiplierBox: {
    backgroundColor: Colors.present,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  multiplierFever: {
    backgroundColor: '#FF6B35',
  },
  multiplierText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.background,
  },
  feverContainer: {
    marginTop: 12,
    backgroundColor: '#FF6B35' + '20',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    overflow: 'hidden',
  },
  feverGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
  },
  feverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feverText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FF6B35',
    letterSpacing: 1,
  },
  feverTimer: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  feverBarBg: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  feverBarFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  feverGlowOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  melodyInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  audioButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  melodyHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  audioHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent + '20',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  audioHintText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  buildingMelodyButton: {
    backgroundColor: '#FF6B35' + '20',
    borderColor: '#FF6B35',
    borderWidth: 1,
  },
  buildingMelodyText: {
    color: '#FF6B35',
  },
  successFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.correct,
    zIndex: 50,
  },
  hintPlayed: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  hintPlayedText: {
    fontSize: 12,
    color: Colors.accent,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  modalStats: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  modalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  highlightText: {
    color: Colors.present,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
