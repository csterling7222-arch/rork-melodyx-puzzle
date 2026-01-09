import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lightbulb, Volume2, Headphones, Sparkles, Flame, Trophy, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { useEco } from '@/contexts/EcoContext';
import { useScreenTheme } from '@/contexts/ThemeContext';
import { useInstrument } from '@/contexts/InstrumentContext';
import ThemedBackground from '@/components/ThemedBackground';
import { useAudio } from '@/hooks/useAudio';
import InstrumentSelector from '@/components/InstrumentSelector';
import GuessGrid from '@/components/GuessGrid';
import PianoKeyboard from '@/components/PianoKeyboard';
import GameModal from '@/components/GameModal';
import { getThemeEmoji } from '@/utils/aiSongChooser';

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  
  return (
    <View style={streakStyles.container}>
      <Flame size={14} color="#FF6B35" />
      <Text style={streakStyles.text}>{streak}</Text>
    </View>
  );
}

const streakStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B35' + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FF6B35',
  },
});

function CountdownBadge() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={countdownStyles.container}>
      <Clock size={12} color={Colors.textMuted} />
      <Text style={countdownStyles.text}>{timeLeft}</Text>
    </View>
  );
}

const countdownStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});

export default function DailyPuzzleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, isDarkMode, animationsEnabled } = useScreenTheme('daily');
  const {
    puzzleNumber,
    melody,
    melodyLength,
    currentGuess,
    guesses,
    gameStatus,
    addNote,
    removeNote,
    submitGuess,
    activateHint,
    canUseHint,
    showHint,
    setShowHint,
    aiSelection,
    canUseAudioHint,
    activateAudioHint,
    audioHintUsed,
    stats,
    shouldNavigateHome,
    clearNavigationFlag,
    showModal,
  } = useGame();
  const { addEcoPoints } = useEco();

  const { currentInstrument } = useInstrument();
  const { playNote, playMelody, playHintNotes, playbackState } = useAudio(currentInstrument.id);
  const [audioHintPlayed, setAudioHintPlayed] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  useEffect(() => {
    if (shouldNavigateHome && !showModal && !hasNavigatedRef.current && !isNavigating) {
      hasNavigatedRef.current = true;
      setIsNavigating(true);
      
      if (gameStatus === 'won') {
        addEcoPoints(5);
      }

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        clearNavigationFlag();
        router.replace('/(tabs)');
      });
    }
  }, [shouldNavigateHome, showModal, isNavigating, gameStatus, addEcoPoints, fadeAnim, clearNavigationFlag, router]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      hasNavigatedRef.current = false;
      setIsNavigating(false);
      fadeAnim.setValue(1);
    }
  }, [gameStatus, fadeAnim]);

  const canSubmit = currentGuess.length === melodyLength && gameStatus === 'playing';
  const isDisabled = gameStatus !== 'playing';

  const handlePlayMelody = useCallback(() => {
    if (gameStatus !== 'playing') {
      playMelody(melody.notes);
    }
  }, [gameStatus, melody.notes, playMelody]);

  const handleAudioHint = useCallback(() => {
    if (canUseAudioHint || audioHintUsed) {
      const activated = activateAudioHint();
      if (activated || audioHintUsed) {
        playHintNotes(melody.notes, 3);
        setAudioHintPlayed(true);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    }
  }, [canUseAudioHint, audioHintUsed, activateAudioHint, playHintNotes, melody.notes]);

  const themeEmoji = aiSelection ? getThemeEmoji(aiSelection.theme) : '🎵';
  const countryFlag = melody.flag || '';

  return (
    <ThemedBackground theme={theme} isDark={isDarkMode} animated={animationsEnabled}>
      <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.statsRow}>
            <StreakBadge streak={stats.currentStreak} />
            <View style={styles.winsContainer}>
              <Trophy size={12} color={Colors.correct} />
              <Text style={styles.winsText}>{stats.gamesWon}</Text>
            </View>
          </View>
          <View style={styles.topRowRight}>
            <InstrumentSelector compact />
            <CountdownBadge />
          </View>
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Melodyx</Text>
          <Text style={styles.puzzleNumber}>#{puzzleNumber}</Text>
        </View>
        <Text style={styles.subtitle}>
          Guess the {melodyLength}-note melody
        </Text>
        {(aiSelection || countryFlag) && (
          <View style={styles.aiThemeContainer}>
            {countryFlag ? (
              <>
                <Text style={styles.flagEmoji}>{countryFlag}</Text>
                <Text style={styles.aiThemeText}>
                  {melody.country} Folk Melody
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={12} color={Colors.accent} />
                <Text style={styles.aiThemeText}>
                  {themeEmoji} {aiSelection?.themeDescription}
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          <GuessGrid
            guesses={guesses}
            currentGuess={currentGuess}
            melodyLength={melodyLength}
            maxGuesses={6}
          />
        </View>

        {showHint && (
          <View style={styles.hintContainer}>
            <Lightbulb size={16} color={Colors.present} />
            <Text style={styles.hintText}>{melody.hint}</Text>
          </View>
        )}

        {audioHintPlayed && (
          <View style={styles.audioHintContainer}>
            <Headphones size={16} color={Colors.accent} />
            <Text style={styles.audioHintText}>
              First 3 notes played! Listen carefully...
            </Text>
          </View>
        )}

        {gameStatus !== 'playing' && (
          <TouchableOpacity 
            style={styles.playMelodyButton} 
            onPress={handlePlayMelody}
            disabled={playbackState.isPlaying}
          >
            <Volume2 size={20} color={Colors.text} />
            <Text style={styles.playMelodyText}>
              {playbackState.isPlaying ? 'Playing...' : 'Play the melody'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.hintButtonsRow}>
          {(canUseAudioHint || (audioHintUsed && !audioHintPlayed)) && gameStatus === 'playing' && (
            <TouchableOpacity 
              style={[styles.hintButton, styles.audioHintButton]} 
              onPress={handleAudioHint}
              disabled={playbackState.isPlaying}
            >
              <Headphones size={18} color={Colors.accent} />
              <Text style={[styles.hintButtonText, styles.audioHintButtonText]}>
                {audioHintUsed ? 'Replay' : 'Audio Hint'}
              </Text>
            </TouchableOpacity>
          )}

          {canUseHint && !showHint && (
            <TouchableOpacity 
              style={styles.hintButton} 
              onPress={() => {
                activateHint();
                setShowHint(true);
              }}
            >
              <Lightbulb size={18} color={Colors.present} />
              <Text style={styles.hintButtonText}>Text Hint</Text>
            </TouchableOpacity>
          )}
        </View>

        <PianoKeyboard
          onNotePress={addNote}
          onDelete={removeNote}
          onSubmit={submitGuess}
          canSubmit={canSubmit}
          disabled={isDisabled}
          playNote={playNote}
        />
      </View>

      <GameModal />
      </Animated.View>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  winsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  winsText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.correct,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  puzzleNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  aiThemeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: Colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  flagEmoji: {
    fontSize: 16,
  },
  aiThemeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  gridContainer: {
    marginTop: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    maxWidth: 300,
  },
  hintText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  audioHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent + '20',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 12,
    maxWidth: 280,
  },
  audioHintText: {
    fontSize: 13,
    color: Colors.accent,
    flex: 1,
  },
  playMelodyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  playMelodyText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bottomSection: {
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  hintButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.present,
  },
  audioHintButton: {
    borderColor: Colors.accent,
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.present,
  },
  audioHintButtonText: {
    color: Colors.accent,
  },
});
