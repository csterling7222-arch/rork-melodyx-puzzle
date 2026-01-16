import React, { useRef, useEffect, useState, useCallback } from 'react';
import ArtistSharingModal from '@/components/ArtistSharingModal';
import SocialShareModal from '@/components/SocialShareModal';
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
import { X, Share2, Trophy, Music, Play, Square, Sparkles, Clock, Flame, Leaf, Map, ChevronRight, Home, Timer, Copy, Twitter, Volume2, RotateCcw, Crown, Repeat } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Confetti from '@/components/Confetti';
import { Colors } from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { useAudio, PlaybackState } from '@/hooks/useAudio';
import { useUser } from '@/contexts/UserContext';
import { useInstrument } from '@/contexts/InstrumentContext';
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

interface EmojiGridProps {
  guesses: { note: string; feedback: 'correct' | 'present' | 'absent' | 'empty' }[][];
}

function EmojiGrid({ guesses }: EmojiGridProps) {
  return (
    <View style={emojiGridStyles.container}>
      {guesses.map((guess, rowIndex) => (
        <View key={rowIndex} style={emojiGridStyles.row}>
          {guess.map((item, colIndex) => (
            <Text key={colIndex} style={emojiGridStyles.emoji}>
              {item.feedback === 'correct' ? '🟩' : item.feedback === 'present' ? '🟨' : '⬛'}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const emojiGridStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  emoji: {
    fontSize: 20,
  },
});

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

interface PlaybackControlsPanelProps {
  volume: number;
  speed: number;
  isLooping: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  onVolumeChange: (vol: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleLoop: () => void;
  onReplay: () => void;
  onPauseResume: () => void;
}

function PlaybackControlsPanel({
  volume,
  speed,
  isLooping,
  onVolumeChange,
  onSpeedChange,
  onToggleLoop,
}: PlaybackControlsPanelProps) {
  return (
    <View style={controlsPanelStyles.container}>
      <View style={controlsPanelStyles.row}>
        <Volume2 size={14} color={Colors.textSecondary} />
        <View style={controlsPanelStyles.sliderTrack}>
          {[0.25, 0.5, 0.75, 1].map((vol) => (
            <TouchableOpacity
              key={vol}
              style={[
                controlsPanelStyles.sliderDot,
                volume >= vol && controlsPanelStyles.sliderDotActive,
              ]}
              onPress={() => onVolumeChange(vol)}
            />
          ))}
        </View>
        <Text style={controlsPanelStyles.valueText}>{Math.round(volume * 100)}%</Text>
      </View>
      
      <View style={controlsPanelStyles.row}>
        <Text style={controlsPanelStyles.labelText}>Speed</Text>
        <View style={controlsPanelStyles.speedButtons}>
          {[0.5, 0.75, 1, 1.25, 1.5].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                controlsPanelStyles.speedButton,
                speed === s && controlsPanelStyles.speedButtonActive,
              ]}
              onPress={() => onSpeedChange(s)}
            >
              <Text style={[
                controlsPanelStyles.speedButtonText,
                speed === s && controlsPanelStyles.speedButtonTextActive,
              ]}>{s}x</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          controlsPanelStyles.loopButton,
          isLooping && controlsPanelStyles.loopButtonActive,
        ]}
        onPress={onToggleLoop}
      >
        <Repeat size={14} color={isLooping ? Colors.accent : Colors.textMuted} />
        <Text style={[
          controlsPanelStyles.loopText,
          isLooping && controlsPanelStyles.loopTextActive,
        ]}>Loop</Text>
      </TouchableOpacity>
    </View>
  );
}

const controlsPanelStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: '100%',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 20,
    paddingHorizontal: 4,
  },
  sliderDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
  },
  sliderDotActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    width: 36,
    textAlign: 'right' as const,
  },
  labelText: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 40,
  },
  speedButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  speedButton: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: Colors.accent,
  },
  speedButtonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  speedButtonTextActive: {
    color: Colors.background,
  },
  loopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  loopButtonActive: {
    backgroundColor: Colors.accent + '20',
  },
  loopText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  loopTextActive: {
    color: Colors.accent,
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
    solveTimeSeconds,
    clearNavigationFlag,
    shouldAutoPlaySnippet,
    setShouldAutoPlaySnippet,
  } = useGame();

  const { currentInstrument, instruments } = useInstrument();
  const { isPremium } = useUser();
  const { 
    playSnippet, 
    playHintNotes, 
    playTeaser,
    stopPlayback, 
    pausePlayback,
    resumePlayback,
    toggleLoop,
    replayFromStart,
    playbackState,
    initAudio,
    volume,
    playbackSpeed,
    updateVolume,
    updatePlaybackSpeed,
  } = useAudio(currentInstrument.id);
  const [hasPlayedSnippet, setHasPlayedSnippet] = useState(false);
  const [hasPlayedLossReveal, setHasPlayedLossReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullReveal, setShowFullReveal] = useState(false);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showPlaybackControls, setShowPlaybackControls] = useState(false);
  const [selectedInstrumentTwist, setSelectedInstrumentTwist] = useState<string | null>(null);

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

  useEffect(() => {
    if (showModal && shouldAutoPlaySnippet && gameStatus === 'won' && !hasPlayedSnippet) {
      initAudio();
      
      const autoPlayTimeout = setTimeout(() => {
        console.log('[GameModal] Auto-playing win snippet:', melody.extendedNotes);
        playSnippet(melody.extendedNotes, () => {
          setHasPlayedSnippet(true);
          console.log('[GameModal] Win snippet playback complete');
        });
        setShouldAutoPlaySnippet(false);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 600);
      return () => clearTimeout(autoPlayTimeout);
    }
  }, [showModal, shouldAutoPlaySnippet, gameStatus, hasPlayedSnippet, melody.extendedNotes, playSnippet, setShouldAutoPlaySnippet, initAudio]);

  useEffect(() => {
    if (showModal && gameStatus === 'lost' && !hasPlayedLossReveal) {
      initAudio();
      
      const revealTimeout = setTimeout(() => {
        console.log('[GameModal] Auto-playing loss teaser:', melody.notes.slice(0, 4));
        playTeaser(melody.notes, 5);
        setHasPlayedLossReveal(true);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }, 800);
      return () => clearTimeout(revealTimeout);
    }
  }, [showModal, gameStatus, hasPlayedLossReveal, melody.notes, playTeaser, initAudio]);

  const shareText = generateShareText(guesses, puzzleNumber, gameStatus === 'won', melodyLength, stats.currentStreak);

  const handleCopyToClipboard = async () => {
    try {
      console.log('[GameModal] Copying to clipboard:', shareText.substring(0, 50) + '...');
      
      if (Platform.OS === 'web') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareText);
          console.log('[GameModal] Copied to clipboard successfully');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Fallback for browsers without clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = shareText;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          console.log('[GameModal] Copied using fallback method');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } else {
        const result = await Share.share({ message: shareText });
        console.log('[GameModal] Share result:', result);
        if (result.action === Share.sharedAction) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('[GameModal] Error copying/sharing:', error);
      // Show copied anyway to give user feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareToTwitter = async () => {
    try {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      if (Platform.OS === 'web') {
        window.open(twitterUrl, '_blank');
      } else {
        await Share.share({ message: shareText, title: 'Share to X' });
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('[GameModal] Error sharing to Twitter:', error);
    }
  };

  const handleClose = useCallback(() => {
    stopPlayback();
    setShowModal(false);
    setShowFullReveal(false);
    setShowPlaybackControls(false);
    setSelectedInstrumentTwist(null);
  }, [stopPlayback, setShowModal]);

  const handleTogglePlaybackControls = useCallback(() => {
    setShowPlaybackControls(prev => !prev);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    updateVolume(newVolume);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [updateVolume]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    updatePlaybackSpeed(newSpeed);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [updatePlaybackSpeed]);

  const handleToggleLoop = useCallback(() => {
    toggleLoop();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [toggleLoop]);

  const handleReplay = useCallback(() => {
    replayFromStart();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [replayFromStart]);

  const handlePauseResume = useCallback(() => {
    if (playbackState.isPaused) {
      resumePlayback();
    } else if (playbackState.isPlaying) {
      pausePlayback();
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [playbackState.isPaused, playbackState.isPlaying, pausePlayback, resumePlayback]);

  const handlePlayLossReveal = useCallback(() => {
    initAudio();
    if (playbackState.isPlaying) {
      stopPlayback();
    } else {
      if (showFullReveal) {
        console.log('[GameModal] Playing full melody reveal:', melody.extendedNotes);
        playSnippet(melody.extendedNotes);
      } else {
        console.log('[GameModal] Playing partial reveal:', melody.notes.slice(0, 4));
        playHintNotes(melody.notes, 4);
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [initAudio, playbackState.isPlaying, stopPlayback, showFullReveal, melody, playSnippet, playHintNotes]);

  const handleGoToDashboard = useCallback(() => {
    stopPlayback();
    setShowModal(false);
    clearNavigationFlag();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimeout(() => {
      router.push('/(tabs)');
    }, 200);
  }, [stopPlayback, setShowModal, clearNavigationFlag, router]);

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
    initAudio();
    
    if (playbackState.isPlaying) {
      stopPlayback();
    } else {
      console.log('[GameModal] Playing snippet manually:', melody.extendedNotes);
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

          {melody.artist && (
            <View style={styles.artistBadge}>
              <Text style={styles.artistText}>🎤 {melody.artist}</Text>
            </View>
          )}

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

          {solveTimeSeconds > 0 && (
            <View style={styles.timeRow}>
              <Timer size={14} color={Colors.accent} />
              <Text style={styles.timeText}>
                Solved in {Math.floor(solveTimeSeconds / 60)}:{String(solveTimeSeconds % 60).padStart(2, '0')}
              </Text>
            </View>
          )}

          {won ? (
            <View style={styles.snippetSection}>
              <View style={styles.snippetHeader}>
                <Text style={styles.snippetLabel}>🎧 Extended Snippet</Text>
                <TouchableOpacity 
                  style={styles.controlsToggle}
                  onPress={handleTogglePlaybackControls}
                >
                  <Volume2 size={16} color={Colors.accent} />
                </TouchableOpacity>
              </View>
              
              <WaveformVisualizer 
                playbackState={playbackState} 
                notes={melody.extendedNotes} 
              />
              
              {showPlaybackControls && (
                <PlaybackControlsPanel
                  volume={volume}
                  speed={playbackSpeed}
                  isLooping={playbackState.isLooping}
                  isPlaying={playbackState.isPlaying}
                  isPaused={playbackState.isPaused}
                  onVolumeChange={handleVolumeChange}
                  onSpeedChange={handleSpeedChange}
                  onToggleLoop={handleToggleLoop}
                  onReplay={handleReplay}
                  onPauseResume={handlePauseResume}
                />
              )}
              
              <View style={styles.playbackButtonsRow}>
                <TouchableOpacity 
                  style={[
                    styles.playButton,
                    styles.playButtonMain,
                    playbackState.isPlaying && styles.playButtonActive
                  ]} 
                  onPress={handlePlaySnippet}
                >
                  {playbackState.isPlaying && !playbackState.isPaused ? (
                    <>
                      <Square size={18} color={Colors.background} fill={Colors.background} />
                      <Text style={styles.playButtonText}>Stop</Text>
                    </>
                  ) : (
                    <>
                      <Play size={18} color={Colors.background} fill={Colors.background} />
                      <Text style={styles.playButtonText}>
                        {hasPlayedSnippet ? 'Replay Melody' : 'Play Snippet'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {hasPlayedSnippet && (
                  <TouchableOpacity 
                    style={styles.replayIconButton}
                    onPress={handleReplay}
                  >
                    <RotateCcw size={18} color={Colors.accent} />
                  </TouchableOpacity>
                )}
              </View>
              
              {isPremium && (
                <View style={styles.premiumTwistSection}>
                  <View style={styles.premiumBadge}>
                    <Crown size={12} color="#FFD700" />
                    <Text style={styles.premiumBadgeText}>PRO</Text>
                  </View>
                  <Text style={styles.twistLabel}>Play with different instrument:</Text>
                  <View style={styles.instrumentChips}>
                    {instruments.slice(0, 4).map((inst) => (
                      <TouchableOpacity
                        key={inst.id}
                        style={[
                          styles.instrumentChip,
                          selectedInstrumentTwist === inst.id && styles.instrumentChipActive
                        ]}
                        onPress={() => setSelectedInstrumentTwist(
                          selectedInstrumentTwist === inst.id ? null : inst.id
                        )}
                      >
                        <Text style={styles.instrumentChipText}>{inst.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.snippetSection}>
              <View style={styles.snippetHeader}>
                <Text style={styles.snippetLabel}>🎧 Hear the Melody</Text>
                <TouchableOpacity 
                  style={styles.controlsToggle}
                  onPress={handleTogglePlaybackControls}
                >
                  <Volume2 size={16} color={Colors.present} />
                </TouchableOpacity>
              </View>
              
              <WaveformVisualizer 
                playbackState={playbackState} 
                notes={showFullReveal ? melody.extendedNotes : melody.notes.slice(0, 4)} 
              />
              
              {showPlaybackControls && (
                <PlaybackControlsPanel
                  volume={volume}
                  speed={playbackSpeed}
                  isLooping={playbackState.isLooping}
                  isPlaying={playbackState.isPlaying}
                  isPaused={playbackState.isPaused}
                  onVolumeChange={handleVolumeChange}
                  onSpeedChange={handleSpeedChange}
                  onToggleLoop={handleToggleLoop}
                  onReplay={handleReplay}
                  onPauseResume={handlePauseResume}
                />
              )}
              
              <View style={styles.lossRevealButtons}>
                <TouchableOpacity 
                  style={[
                    styles.revealToggleButton,
                    !showFullReveal && styles.revealToggleActive
                  ]} 
                  onPress={() => setShowFullReveal(false)}
                >
                  <Text style={[
                    styles.revealToggleText,
                    !showFullReveal && styles.revealToggleTextActive
                  ]}>Teaser (5s)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.revealToggleButton,
                    showFullReveal && styles.revealToggleActive
                  ]} 
                  onPress={() => setShowFullReveal(true)}
                >
                  <Text style={[
                    styles.revealToggleText,
                    showFullReveal && styles.revealToggleTextActive
                  ]}>Full Reveal</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.playbackButtonsRow}>
                <TouchableOpacity 
                  style={[
                    styles.playButton,
                    styles.lossPlayButton,
                    styles.playButtonMain,
                    playbackState.isPlaying && styles.playButtonActive
                  ]} 
                  onPress={handlePlayLossReveal}
                >
                  {playbackState.isPlaying && !playbackState.isPaused ? (
                    <>
                      <Square size={18} color={Colors.background} fill={Colors.background} />
                      <Text style={styles.playButtonText}>Stop</Text>
                    </>
                  ) : (
                    <>
                      <Play size={18} color={Colors.background} fill={Colors.background} />
                      <Text style={styles.playButtonText}>
                        {showFullReveal ? 'Play Full Melody' : 'Play Teaser'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.replayIconButton}
                  onPress={handleReplay}
                >
                  <RotateCcw size={18} color={Colors.present} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.shareSection}>
            <Text style={styles.shareSectionTitle}>Share Your Result</Text>
            <EmojiGrid guesses={guesses} />
            <View style={styles.shareButtonsRow}>
              <TouchableOpacity 
                style={[styles.shareOptionButton, styles.copyButton]} 
                onPress={handleCopyToClipboard}
              >
                <Copy size={18} color={Colors.text} />
                <Text style={styles.shareOptionText}>{copied ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.shareOptionButton, styles.twitterButton]} 
                onPress={handleShareToTwitter}
              >
                <Twitter size={18} color="#1DA1F2" />
                <Text style={[styles.shareOptionText, { color: '#1DA1F2' }]}>X/Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.shareOptionButton, styles.moreButton]} 
                onPress={() => setShowSocialModal(true)}
              >
                <Share2 size={18} color={Colors.correct} />
                <Text style={[styles.shareOptionText, { color: Colors.correct }]}>More</Text>
              </TouchableOpacity>
            </View>
          </View>

          {won && (
            <TouchableOpacity 
              style={styles.discoverButton}
              onPress={() => setShowArtistModal(true)}
            >
              <Music size={18} color={Colors.accent} />
              <Text style={styles.discoverButtonText}>Discover More from Artist</Text>
            </TouchableOpacity>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.dashboardButton} onPress={handleGoToDashboard}>
              <Home size={18} color={Colors.text} />
              <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
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

        <ArtistSharingModal
          visible={showArtistModal}
          onClose={() => setShowArtistModal(false)}
          melody={melody}
        />

        <SocialShareModal
          visible={showSocialModal}
          onClose={() => setShowSocialModal(false)}
          melody={melody}
          guesses={guesses}
          puzzleNumber={puzzleNumber}
          won={won}
          streak={stats.currentStreak}
        />
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
  artistBadge: {
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  artistText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
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
    marginBottom: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.accent + '15',
    borderRadius: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
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
  lossPlayButton: {
    backgroundColor: Colors.present,
  },
  lossRevealButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  revealToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
  },
  revealToggleActive: {
    backgroundColor: Colors.present + '30',
  },
  revealToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  revealToggleTextActive: {
    color: Colors.present,
  },
  shareSection: {
    width: '100%',
    marginBottom: 16,
  },
  shareSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  shareOptionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 4,
    flex: 1,
  },
  copyButton: {
    backgroundColor: Colors.surfaceLight,
  },
  twitterButton: {
    backgroundColor: '#1DA1F2' + '15',
  },
  moreButton: {
    backgroundColor: Colors.correct + '15',
  },
  shareOptionText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actionButtons: {
    width: '100%',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
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
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent + '15',
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  discoverButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  snippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  controlsToggle: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  playbackButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playButtonMain: {
    flex: 1,
  },
  replayIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTwistSection: {
    width: '100%',
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700' + '30',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  twistLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  instrumentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  instrumentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
  },
  instrumentChipActive: {
    backgroundColor: Colors.accent,
  },
  instrumentChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
