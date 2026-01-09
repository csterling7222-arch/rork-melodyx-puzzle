import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Zap, Trophy, Play, X, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useFever } from '@/contexts/FeverContext';
import { useScreenTheme } from '@/contexts/ThemeContext';
import ThemedBackground from '@/components/ThemedBackground';
import { useAudio } from '@/hooks/useAudio';
import GuessGrid from '@/components/GuessGrid';
import PianoKeyboard from '@/components/PianoKeyboard';

function FeverBar({ timeLeft, isActive }: { timeLeft: number; isActive: boolean }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const widthAnim = useRef(new Animated.Value(timeLeft / 30)).current;

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
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

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

  return (
    <View style={styles.scoreContainer}>
      <Animated.View style={[styles.scoreBox, { transform: [{ scale: scoreAnim }] }]}>
        <Zap size={18} color={Colors.present} />
        <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
      </Animated.View>
      <View style={styles.chainBox}>
        <Text style={styles.chainLabel}>Chain</Text>
        <Text style={styles.chainValue}>{chain}</Text>
      </View>
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
  onClose 
}: { 
  score: number; 
  chain: number;
  highScore: number;
  solvedCount: number;
  onRestart: () => void; 
  onClose: () => void;
}) {
  const isNewHighScore = score >= highScore && score > 0;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.modalClose} onPress={onClose}>
          <X size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

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

        <TouchableOpacity style={styles.restartButton} onPress={onRestart}>
          <RotateCcw size={20} color={Colors.background} />
          <Text style={styles.restartButtonText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeverScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode, animationsEnabled } = useScreenTheme('fever');
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

  const { playNote } = useAudio();

  const canSubmit = currentGuess.length === melodyLength && !gameOver;

  const handleStart = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    startGame();
  }, [startGame]);

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
        <ScoreDisplay score={score} chain={chain} multiplier={multiplier} />
        <FeverBar timeLeft={feverTimeLeft} isActive={isFeverActive} />
      </View>

      {currentMelody && (
        <View style={styles.melodyInfo}>
          <Text style={styles.melodyHint}>
            {guesses.length >= 2 ? currentMelody.hint : '???'}
          </Text>
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

      <View style={styles.bottomSection}>
        <PianoKeyboard
          onNotePress={addNote}
          onDelete={removeNote}
          onSubmit={submitGuess}
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
            onClose={() => {}}
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
    marginBottom: 24,
    gap: 12,
  },
  ruleText: {
    fontSize: 15,
    color: Colors.text,
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  melodyInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  melodyHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
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
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
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
});
