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
import { Lightbulb, Headphones, Sparkles, Flame, Trophy, Clock, RotateCcw, Play, Square, Music } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { useUser } from '@/contexts/UserContext';
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
import { hasRealSnippet, playMelodySnippet, initAudioSnippets } from '@/utils/audioSnippets';
import { initAudioOnce, unlockWebAudio, isWebAudioUnlocked } from '@/utils/audioMutex';
import { debouncedImpact } from '@/utils/hapticDebounce';

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
  const { inventory, useHint: consumeHint } = useUser();

  const { currentInstrument } = useInstrument();
  const { 
    playNote, 
    playNotePreview,
    playSnippet,
    playHintNotes, 
    playMelody,
    playbackState,
    stopPlayback,
    initAudio,
  } = useAudio(currentInstrument.id);
  const [audioHintPlayed, setAudioHintPlayed] = useState(false);
  const [hasPlayedMelody, setHasPlayedMelody] = useState(false);
  const [hasRealAudioSnippet, setHasRealAudioSnippet] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [revealedNotes, setRevealedNotes] = useState<number[]>([]);
  const [showWebAudioPrompt, setShowWebAudioPrompt] = useState(false);
  const [showBuildingMelody, setShowBuildingMelody] = useState(false);
  const isMelodyPlayingRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasNavigatedRef = useRef(false);
  const audioInitRef = useRef(false);

  useEffect(() => {
    debouncedImpact();
    
    const initAudio = async () => {
      if (audioInitRef.current) return;
      audioInitRef.current = true;
      
      await initAudioOnce(async () => {
        await initAudioSnippets();
        console.log('[Daily] Audio snippets initialized');
      });
      
      const hasSnippet = hasRealSnippet(melody.name);
      setHasRealAudioSnippet(hasSnippet);
      console.log('[Daily] Melody snippet available:', melody.name, hasSnippet);
      
      if (Platform.OS === 'web' && !isWebAudioUnlocked()) {
        setShowWebAudioPrompt(true);
      }
    };
    
    initAudio();
  }, [melody.name]);

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

  const handlePlayMelody = useCallback(async () => {
    if (gameStatus !== 'playing') {
      initAudio();
      if (playbackState.isPlaying) {
        stopPlayback();
      } else {
        if (hasRealAudioSnippet) {
          const played = await playMelodySnippet(melody.name, () => {
            setHasPlayedMelody(true);
          });
          if (!played) {
            playSnippet(melody.extendedNotes, () => {
              setHasPlayedMelody(true);
            });
          }
        } else {
          playSnippet(melody.extendedNotes, () => {
            setHasPlayedMelody(true);
          });
        }
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    }
  }, [gameStatus, melody.name, melody.extendedNotes, playSnippet, playbackState.isPlaying, stopPlayback, initAudio, hasRealAudioSnippet]);

  const handlePlayBuildingMelody = useCallback(() => {
    if (currentGuess.length > 0 && !isMelodyPlayingRef.current && !playbackState.isPlaying) {
      isMelodyPlayingRef.current = true;
      stopPlayback();
      setTimeout(() => {
        playMelody(currentGuess, 400);
        setShowBuildingMelody(true);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        const duration = currentGuess.length * 400 + 600;
        setTimeout(() => {
          setShowBuildingMelody(false);
          isMelodyPlayingRef.current = false;
        }, duration);
      }, 50);
    }
  }, [currentGuess, playMelody, stopPlayback, playbackState.isPlaying]);

  const handleNotePreview = useCallback((note: string) => {
    initAudio();
    playNotePreview(note);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [playNotePreview, initAudio]);

  const handleAddNote = useCallback((note: string) => {
    addNote(note);
    handleNotePreview(note);
  }, [addNote, handleNotePreview]);

  const handleAudioHint = useCallback(() => {
    if (audioHintUsed) {
      playHintNotes(melody.notes, 3);
      setAudioHintPlayed(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      return;
    }
    
    if (canUseAudioHint && inventory.hints > 0) {
      const consumed = consumeHint();
      if (consumed) {
        const activated = activateAudioHint();
        if (activated) {
          playHintNotes(melody.notes, 3);
          setAudioHintPlayed(true);
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          console.log('[Daily] Audio hint used, remaining:', inventory.hints - 1);
        }
      }
    }
  }, [canUseAudioHint, audioHintUsed, activateAudioHint, playHintNotes, melody.notes, inventory.hints, consumeHint]);

  const getAvailableHintIndices = useCallback(() => {
    const correctlyGuessedIndices = new Set<number>();
    const knownCorrectNotes = new Set<string>();
    
    guesses.forEach(guessRow => {
      guessRow.forEach((result, idx) => {
        if (result.feedback === 'correct') {
          correctlyGuessedIndices.add(idx);
          knownCorrectNotes.add(result.note);
        }
      });
    });

    const availableIndices = melody.notes
      .map((_, idx) => idx)
      .filter(idx => !revealedNotes.includes(idx) && !correctlyGuessedIndices.has(idx));
    
    const preferredIndices = availableIndices.filter(
      idx => !knownCorrectNotes.has(melody.notes[idx])
    );
    
    return preferredIndices.length > 0 ? preferredIndices : availableIndices;
  }, [guesses, melody.notes, revealedNotes]);

  const handleTextHint = useCallback(() => {
    if (gameStatus !== 'playing') return;
    
    if (inventory.hints <= 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const availableIndices = getAvailableHintIndices();
    
    if (availableIndices.length === 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      console.log('[Daily] All notes already revealed or correctly guessed');
      return;
    }

    const consumed = consumeHint();
    if (consumed) {
      const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      const revealedNote = melody.notes[randomIdx];
      
      setRevealedNotes(prev => [...prev, randomIdx]);
      playNote(revealedNote);
      
      activateHint();
      setShowHint(true);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log('[Daily] Note hint used! Position', randomIdx + 1, '=', revealedNote, '| Hints remaining:', inventory.hints - 1);
    }
  }, [gameStatus, inventory.hints, getAvailableHintIndices, consumeHint, melody.notes, playNote, activateHint, setShowHint]);

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
            durations={melody.durations}
          />
        </View>

        {revealedNotes.length > 0 && (
          <View style={styles.revealedNotesContainer}>
            <Text style={styles.revealedNotesLabel}>💡 Revealed Notes:</Text>
            <View style={styles.revealedNotesRow}>
              {revealedNotes.sort((a, b) => a - b).map(idx => (
                <View key={idx} style={styles.revealedNoteChip}>
                  <Text style={styles.revealedNoteText}>
                    #{idx + 1}: {melody.notes[idx]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

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

        {gameStatus === 'playing' && currentGuess.length > 0 && (
          <View style={styles.playGuessSection}>
            <TouchableOpacity 
              style={[
                styles.playGuessButton,
                showBuildingMelody && styles.playGuessButtonActive
              ]}
              onPress={handlePlayBuildingMelody}
              disabled={playbackState.isPlaying}
            >
              <Music size={18} color={showBuildingMelody ? Colors.text : Colors.accent} />
              <Text style={[
                styles.playGuessText,
                showBuildingMelody && styles.playGuessTextActive
              ]}>
                {showBuildingMelody ? 'Playing...' : `Play My Notes (${currentGuess.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {gameStatus !== 'playing' && (
          <View style={styles.melodyPlaybackSection}>
            <TouchableOpacity 
              style={[
                styles.playMelodyButton,
                playbackState.isPlaying && styles.playMelodyButtonActive
              ]} 
              onPress={handlePlayMelody}
            >
              {playbackState.isPlaying ? (
                <>
                  <Square size={20} color={Colors.text} fill={Colors.text} />
                  <Text style={styles.playMelodyText}>Stop</Text>
                </>
              ) : (
                <>
                  <Play size={20} color={Colors.text} fill={Colors.text} />
                  <Text style={styles.playMelodyText}>
                    {hasPlayedMelody ? 'Replay Melody' : 'Play the melody'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {hasPlayedMelody && !playbackState.isPlaying && (
              <TouchableOpacity 
                style={styles.replayButton}
                onPress={handlePlayMelody}
              >
                <RotateCcw size={18} color={Colors.accent} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.hintButtonsRow}>
          {gameStatus === 'playing' && (
            <View style={styles.hintCountBadge}>
              <Lightbulb size={14} color={Colors.present} />
              <Text style={styles.hintCountText}>{inventory.hints}</Text>
            </View>
          )}

          {(canUseAudioHint || (audioHintUsed && !audioHintPlayed)) && gameStatus === 'playing' && (
            <TouchableOpacity 
              style={[
                styles.hintButton, 
                styles.audioHintButton,
                !audioHintUsed && inventory.hints === 0 && styles.hintButtonDisabled
              ]} 
              onPress={handleAudioHint}
              disabled={playbackState.isPlaying || (!audioHintUsed && inventory.hints === 0)}
            >
              <Headphones size={18} color={!audioHintUsed && inventory.hints === 0 ? Colors.textMuted : Colors.accent} />
              <Text style={[
                styles.hintButtonText, 
                styles.audioHintButtonText,
                !audioHintUsed && inventory.hints === 0 && styles.hintButtonTextDisabled
              ]}>
                {audioHintUsed ? 'Replay' : 'Audio Hint'}
              </Text>
            </TouchableOpacity>
          )}

          {gameStatus === 'playing' && (
            <TouchableOpacity 
              style={[
                styles.hintButton,
                styles.noteHintButton,
                (inventory.hints === 0 || getAvailableHintIndices().length === 0) && styles.hintButtonDisabled
              ]} 
              onPress={handleTextHint}
              disabled={inventory.hints === 0 || getAvailableHintIndices().length === 0}
            >
              <Lightbulb size={18} color={(inventory.hints === 0 || getAvailableHintIndices().length === 0) ? Colors.textMuted : '#FFD700'} />
              <Text style={[
                styles.hintButtonText,
                styles.noteHintButtonText,
                (inventory.hints === 0 || getAvailableHintIndices().length === 0) && styles.hintButtonTextDisabled
              ]}>Reveal Note</Text>
            </TouchableOpacity>
          )}
        </View>

        <PianoKeyboard
          onNotePress={handleAddNote}
          onDelete={removeNote}
          onSubmit={submitGuess}
          canSubmit={canSubmit}
          disabled={isDisabled}
          playNote={playNote}
        />
      </View>

      <GameModal />
      
      {showWebAudioPrompt && Platform.OS === 'web' && (
        <View style={styles.webAudioOverlay}>
          <View style={styles.webAudioPrompt}>
            <Text style={styles.webAudioTitle}>🎵 Enable Sound</Text>
            <Text style={styles.webAudioText}>Tap to enable audio playback</Text>
            <TouchableOpacity
              style={styles.webAudioButton}
              onPress={async () => {
                await unlockWebAudio();
                initAudio();
                setShowWebAudioPrompt(false);
              }}
            >
              <Text style={styles.webAudioButtonText}>Enable Sound</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  playGuessSection: {
    alignItems: 'center',
    marginTop: 12,
  },
  playGuessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent + '20',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  playGuessButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  playGuessText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  playGuessTextActive: {
    color: Colors.text,
  },
  melodyPlaybackSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  playMelodyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  playMelodyButtonActive: {
    backgroundColor: Colors.accent,
  },
  playMelodyText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  replayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  hintButtonDisabled: {
    borderColor: Colors.textMuted,
    opacity: 0.6,
  },
  hintButtonTextDisabled: {
    color: Colors.textMuted,
  },
  hintCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.present + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  hintCountText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.present,
  },
  revealedNotesContainer: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD700' + '15',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFD700' + '40',
  },
  revealedNotesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  revealedNotesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  revealedNoteChip: {
    backgroundColor: '#FFD700' + '25',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  revealedNoteText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  noteHintButton: {
    borderColor: '#FFD700',
  },
  noteHintButtonText: {
    color: '#FFD700',
  },
  webAudioOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  webAudioPrompt: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 280,
  },
  webAudioTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  webAudioText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  webAudioButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  webAudioButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
