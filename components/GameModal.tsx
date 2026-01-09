import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Share,
  Platform,
} from 'react-native';
import { X, Share2, Trophy, Music, Play, Square, Sparkles, Clock, Flame, Leaf, Map, ChevronRight, Home } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Confetti from '@/components/Confetti';
import { Colors } from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { useAudio, PlaybackState } from '@/hooks/useAudio';
import { generateShareText } from '@/utils/gameLogic';
import { getGenreEmoji, getThemeEmoji } from '@/utils/aiSongChooser';

interface WaveformVisualizerProps {
  playbackState: PlaybackState;
  notes: string[];
}

function WaveformVisualizer({ playbackState, notes }: WaveformVisualizerProps) {
  const barAnimations = useRef(notes.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (playbackState.isPlaying && playbackState.currentNoteIndex >= 0) {
      barAnimations.forEach((anim, index) => {
        if (index === playbackState.currentNoteIndex) {
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.4,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
    } else if (!playbackState.isPlaying) {
      barAnimations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [playbackState.currentNoteIndex, playbackState.isPlaying, barAnimations]);

  return (
    <View style={waveStyles.container}>
      {notes.slice(0, 12).map((note, index) => (
        <Animated.View
          key={`${note}-${index}`}
          style={[
            waveStyles.bar,
            {
              transform: [{ scaleY: barAnimations[index] || new Animated.Value(0.3) }],
              backgroundColor: index === playbackState.currentNoteIndex 
                ? Colors.correct 
                : Colors.accent,
            },
          ]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 3,
    marginVertical: 12,
  },
  bar: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
});

function CountdownTimer() {
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilMidnight(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={timerStyles.container}>
      <Clock size={14} color={Colors.textMuted} />
      <Text style={timerStyles.text}>Next puzzle in {timeUntilMidnight}</Text>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  text: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});

interface QuickModeButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
}

function QuickModeButton({ icon, label, sublabel, color, onPress }: QuickModeButtonProps) {
  return (
    <TouchableOpacity 
      style={[quickModeStyles.button, { borderColor: color + '40' }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[quickModeStyles.iconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={quickModeStyles.textContainer}>
        <Text style={quickModeStyles.label}>{label}</Text>
        <Text style={quickModeStyles.sublabel}>{sublabel}</Text>
      </View>
      <ChevronRight size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const quickModeStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sublabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

export default function GameModal() {
  const router = useRouter();
  const {
    showModal,
    setShowModal,
    gameStatus,
    guesses,
    puzzleNumber,
    melody,
    melodyLength,
    aiSelection,
    stats,
  } = useGame();

  const { playSnippet, stopPlayback, playbackState } = useAudio();
  const [hasPlayedSnippet, setHasPlayedSnippet] = useState(false);
  const [copied, setCopied] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (showModal) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (Platform.OS !== 'web' && gameStatus === 'won') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      slideAnim.setValue(30);
      setHasPlayedSnippet(false);
      setCopied(false);
    }
  }, [showModal, gameStatus, scaleAnim, opacityAnim, slideAnim]);

  const handleShare = async () => {
    const shareText = generateShareText(guesses, puzzleNumber, gameStatus === 'won', melodyLength);
    
    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await Share.share({ message: shareText });
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleClose = useCallback(() => {
    stopPlayback();
    setShowModal(false);
  }, [stopPlayback, setShowModal]);

  const handleGoToDashboard = useCallback(() => {
    stopPlayback();
    setShowModal(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimeout(() => {
      router.push('/(tabs)/home');
    }, 200);
  }, [stopPlayback, setShowModal, router]);

  const navigateToMode = useCallback((route: string) => {
    handleClose();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  }, [router, handleClose]);

  const handlePlaySnippet = () => {
    if (playbackState.isPlaying) {
      stopPlayback();
    } else {
      playSnippet(melody.extendedNotes, () => {
        setHasPlayedSnippet(true);
      });
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const won = gameStatus === 'won';

  if (!showModal) return null;
  
  const genreEmoji = getGenreEmoji(melody.genre);
  const themeEmoji = aiSelection ? getThemeEmoji(aiSelection.theme) : '🎵';
  const countryFlag = melody.flag || '';

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {won && <Confetti isActive={won} count={80} />}
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.iconContainer, won && styles.iconContainerWon]}>
            {won ? (
              <Trophy size={48} color={Colors.correct} />
            ) : (
              <Music size={48} color={Colors.present} />
            )}
          </View>

          <Text style={styles.title}>
            {won ? '🎉 Brilliant!' : 'Better luck tomorrow!'}
          </Text>

          <Text style={styles.subtitle}>
            {won
              ? `You got it in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}!`
              : 'The melody was:'}
          </Text>

          <View style={styles.melodyContainer}>
            <View style={styles.melodyHeader}>
              <Text style={styles.melodyEmoji}>{countryFlag || genreEmoji}</Text>
              <Text style={styles.melodyName}>{melody.name}</Text>
            </View>
            <Text style={styles.melodyCategory}>
              {melody.country ? `${melody.country} • ` : ''}{melody.genre} • {melody.era}
            </Text>
            <View style={styles.notesContainer}>
              {melody.notes.map((note, index) => (
                <View key={index} style={styles.noteChip}>
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </View>
          </View>

          {aiSelection && (
            <View style={styles.aiContainer}>
              <View style={styles.aiHeader}>
                <Sparkles size={14} color={Colors.accent} />
                <Text style={styles.aiLabel}>AI Pick</Text>
              </View>
              <Text style={styles.aiTheme}>{themeEmoji} {aiSelection.themeDescription}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak 🔥</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.maxStreak}</Text>
              <Text style={styles.statLabel}>Best</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.gamesWon}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>

          <View style={styles.snippetSection}>
            <Text style={styles.snippetLabel}>🎧 Extended Snippet</Text>
            <WaveformVisualizer 
              playbackState={playbackState} 
              notes={melody.extendedNotes} 
            />
            <TouchableOpacity 
              style={[
                styles.playButton,
                playbackState.isPlaying && styles.playButtonActive
              ]} 
              onPress={handlePlaySnippet}
            >
              {playbackState.isPlaying ? (
                <>
                  <Square size={18} color={Colors.background} fill={Colors.background} />
                  <Text style={styles.playButtonText}>Stop</Text>
                </>
              ) : (
                <>
                  <Play size={18} color={Colors.background} fill={Colors.background} />
                  <Text style={styles.playButtonText}>
                    {hasPlayedSnippet ? 'Play Again' : 'Play Snippet'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Share2 size={18} color={Colors.background} />
              <Text style={styles.shareButtonText}>
                {copied ? 'Copied!' : 'Share'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dashboardButton} onPress={handleGoToDashboard}>
              <Home size={18} color={Colors.text} />
              <Text style={styles.dashboardButtonText}>Dashboard</Text>
            </TouchableOpacity>
          </View>

          <CountdownTimer />

          <View style={styles.divider} />

          <Text style={styles.exploreTitle}>Continue Playing</Text>
          
          <View style={styles.modesGrid}>
            <QuickModeButton
              icon={<Flame size={20} color="#FF6B35" />}
              label="Fever Mode"
              sublabel="Endless chains"
              color="#FF6B35"
              onPress={() => navigateToMode('/(tabs)/fever')}
            />
            <QuickModeButton
              icon={<Trophy size={20} color="#FFD700" />}
              label="Tournaments"
              sublabel="Compete weekly"
              color="#FFD700"
              onPress={() => navigateToMode('/(tabs)/tournaments')}
            />
            <QuickModeButton
              icon={<Map size={20} color={Colors.accent} />}
              label="Quest"
              sublabel="Story adventure"
              color={Colors.accent}
              onPress={() => navigateToMode('/(tabs)/campaign')}
            />
            <QuickModeButton
              icon={<Leaf size={20} color="#10B981" />}
              label="Zen Mode"
              sublabel="Calming puzzles"
              color="#10B981"
              onPress={() => navigateToMode('/(tabs)/wellness')}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: '90%',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainerWon: {
    backgroundColor: Colors.correct + '20',
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  melodyContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  melodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  melodyEmoji: {
    fontSize: 22,
  },
  melodyName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  melodyCategory: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  noteChip: {
    backgroundColor: Colors.accent + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  aiContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiTheme: {
    fontSize: 14,
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  snippetSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  snippetLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 8,
  },
  playButtonActive: {
    backgroundColor: Colors.present,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.correct,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  dashboardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  dashboardButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.surfaceLight,
    marginVertical: 16,
  },
  exploreTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  modesGrid: {
    width: '100%',
    gap: 10,
  },
});
