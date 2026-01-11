import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Repeat,
  Rewind,
  Music,
  AlertCircle,
  Crown,
  Headphones,
  ExternalLink,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useTuneSnippet, SnippetMetadata, SnippetPlaybackState } from '@/contexts/TuneSnippetContext';
import { getSnippetAttribution, LEGAL_NOTICES, getPlaybackConfig } from '@/constants/snippetLibrary';

interface WaveformBarProps {
  index: number;
  isActive: boolean;
  progress: number;
  isPlaying: boolean;
}

function WaveformBar({ index, isActive, progress, isPlaying }: WaveformBarProps) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (isPlaying && isActive) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.4 + Math.random() * 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else if (!isPlaying) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive, isPlaying, scaleAnim, opacityAnim]);

  const barProgress = index / 24;
  const isPast = barProgress <= progress;

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        {
          transform: [{ scaleY: scaleAnim }],
          opacity: opacityAnim,
          backgroundColor: isPast ? Colors.accent : Colors.surfaceLight,
        },
      ]}
    />
  );
}

interface AudioWaveformProps {
  playbackState: SnippetPlaybackState;
  barCount?: number;
}

function AudioWaveform({ playbackState, barCount = 24 }: AudioWaveformProps) {
  const activeIndex = Math.floor(playbackState.progress.progress * barCount);

  return (
    <View style={styles.waveformContainer}>
      {Array.from({ length: barCount }).map((_, index) => (
        <WaveformBar
          key={index}
          index={index}
          isActive={index === activeIndex}
          progress={playbackState.progress.progress}
          isPlaying={playbackState.isPlaying}
        />
      ))}
    </View>
  );
}

interface PlaybackControlsProps {
  playbackState: SnippetPlaybackState;
  onPlayPause: () => void;
  onStop: () => void;
  onReplay: () => void;
  onToggleLoop: () => void;
  onVolumeChange: (volume: number) => void;
  onSpeedChange: (speed: number) => void;
  isPremium: boolean;
  showAdvancedControls?: boolean;
}

function PlaybackControls({
  playbackState,
  onPlayPause,
  onStop,
  onReplay,
  onToggleLoop,
  onVolumeChange,
  onSpeedChange,
  isPremium,
  showAdvancedControls = false,
}: PlaybackControlsProps) {


  const handleVolumeToggle = useCallback(() => {
    if (playbackState.volume > 0) {
      onVolumeChange(0);
    } else {
      onVolumeChange(1);
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [playbackState.volume, onVolumeChange]);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5];
  const config = getPlaybackConfig(isPremium);

  return (
    <View style={styles.controlsContainer}>
      <View style={styles.mainControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleVolumeToggle}
          testID="volume-toggle"
        >
          {playbackState.volume > 0 ? (
            <Volume2 size={20} color={Colors.textSecondary} />
          ) : (
            <VolumeX size={20} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={onReplay}
          testID="replay-button"
        >
          <Rewind size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.playButton,
            playbackState.isPlaying && styles.playButtonActive,
          ]}
          onPress={onPlayPause}
          testID="play-pause-button"
        >
          {playbackState.isBuffering ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : playbackState.isPlaying ? (
            <Pause size={24} color={Colors.background} fill={Colors.background} />
          ) : (
            <Play size={24} color={Colors.background} fill={Colors.background} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={onStop}
          testID="stop-button"
        >
          <Square size={18} color={Colors.textSecondary} fill={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            playbackState.isLooping && styles.controlButtonActive,
            !config.allowLoop && styles.controlButtonDisabled,
          ]}
          onPress={config.allowLoop ? onToggleLoop : undefined}
          disabled={!config.allowLoop}
          testID="loop-toggle"
        >
          <Repeat
            size={20}
            color={playbackState.isLooping ? Colors.accent : Colors.textMuted}
          />
          {!config.allowLoop && !isPremium && (
            <View style={styles.premiumBadgeSmall}>
              <Crown size={8} color="#FFD700" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showAdvancedControls && config.allowSpeedControl && (
        <View style={styles.speedControls}>
          <Text style={styles.speedLabel}>Speed</Text>
          <View style={styles.speedButtons}>
            {speeds.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedButton,
                  playbackState.playbackSpeed === speed && styles.speedButtonActive,
                ]}
                onPress={() => onSpeedChange(speed)}
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    playbackState.playbackSpeed === speed && styles.speedButtonTextActive,
                  ]}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showAdvancedControls && (
        <View style={styles.volumeControls}>
          <Text style={styles.volumeLabel}>Volume</Text>
          <View style={styles.volumeDots}>
            {[0.25, 0.5, 0.75, 1].map((vol) => (
              <TouchableOpacity
                key={vol}
                style={[
                  styles.volumeDot,
                  playbackState.volume >= vol && styles.volumeDotActive,
                ]}
                onPress={() => onVolumeChange(vol)}
              />
            ))}
          </View>
          <Text style={styles.volumeValue}>{Math.round(playbackState.volume * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

interface ProgressDisplayProps {
  playbackState: SnippetPlaybackState;
}

function ProgressDisplay({ playbackState }: ProgressDisplayProps) {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressTime}>
        {formatTime(playbackState.progress.positionMs)}
      </Text>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: `${playbackState.progress.progress * 100}%` },
            ]}
          />
        </View>
      </View>
      <Text style={styles.progressTime}>
        {formatTime(playbackState.progress.durationMs)}
      </Text>
    </View>
  );
}

interface TuneSnippetPlayerProps {
  snippet: SnippetMetadata;
  mode?: 'teaser' | 'snippet' | 'full';
  autoPlay?: boolean;
  showControls?: boolean;
  showWaveform?: boolean;
  showProgress?: boolean;
  showAttribution?: boolean;
  showPremiumUpsell?: boolean;
  compact?: boolean;
  onPlaybackComplete?: () => void;
  onStreamFullTrack?: () => void;
}

export default function TuneSnippetPlayer({
  snippet,
  mode = 'snippet',
  autoPlay = false,
  showControls = true,
  showWaveform = true,
  showProgress = true,
  showAttribution = true,
  showPremiumUpsell = true,
  compact = false,
  onPlaybackComplete,
  onStreamFullTrack,
}: TuneSnippetPlayerProps) {
  const {
    playbackState,
    playSnippet,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    toggleLoop,
    replayFromStart,
    setVolume,
    setPlaybackSpeed,
    isPremiumPlayback,
  } = useTuneSnippet();

  const [hasPlayed, setHasPlayed] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  useEffect(() => {
    if (autoPlay && !hasPlayed) {
      playSnippet(snippet, mode, { fadeIn: true });
      setHasPlayed(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [autoPlay, hasPlayed, playSnippet, snippet, mode]);

  useEffect(() => {
    if (
      playbackState.mode === 'idle' &&
      playbackState.currentSongId === snippet.songId &&
      hasPlayed
    ) {
      onPlaybackComplete?.();
    }
  }, [playbackState.mode, playbackState.currentSongId, snippet.songId, hasPlayed, onPlaybackComplete]);

  const handlePlay = useCallback(async () => {
    await playSnippet(snippet, mode, { fadeIn: true });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [snippet, mode, playSnippet]);

  const handlePlayPause = useCallback(async () => {
    if (playbackState.isPlaying) {
      await pausePlayback();
    } else if (playbackState.isPaused) {
      await resumePlayback();
    } else {
      await handlePlay();
    }
  }, [playbackState.isPlaying, playbackState.isPaused, pausePlayback, resumePlayback, handlePlay]);

  const handleStop = useCallback(async () => {
    await stopPlayback();
  }, [stopPlayback]);

  const handleReplay = useCallback(async () => {
    await replayFromStart();
  }, [replayFromStart]);

  const handleToggleLoop = useCallback(async () => {
    await toggleLoop();
  }, [toggleLoop]);

  const handleVolumeChange = useCallback(async (volume: number) => {
    await setVolume(volume);
  }, [setVolume]);

  const handleSpeedChange = useCallback(async (speed: number) => {
    await setPlaybackSpeed(speed);
  }, [setPlaybackSpeed]);

  const isCurrentTrack = playbackState.currentSongId === snippet.songId;
  const attribution = getSnippetAttribution(snippet);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={[
            styles.compactPlayButton,
            isCurrentTrack && playbackState.isPlaying && styles.compactPlayButtonActive,
          ]}
          onPress={handlePlayPause}
        >
          {playbackState.isBuffering && isCurrentTrack ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : isCurrentTrack && playbackState.isPlaying ? (
            <Pause size={18} color={Colors.background} fill={Colors.background} />
          ) : (
            <Play size={18} color={Colors.background} fill={Colors.background} />
          )}
        </TouchableOpacity>

        {isCurrentTrack && playbackState.isPlaying && (
          <View style={styles.compactWaveform}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.compactBar,
                  {
                    backgroundColor:
                      i / 8 <= playbackState.progress.progress
                        ? Colors.accent
                        : Colors.surfaceLight,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {isCurrentTrack && (
          <TouchableOpacity style={styles.compactStopButton} onPress={handleStop}>
            <Square size={14} color={Colors.textMuted} fill={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Headphones size={16} color={Colors.accent} />
          <Text style={styles.headerTitle}>
            {mode === 'teaser' ? 'Preview Clip' : 'Audio Snippet'}
          </Text>
        </View>
        {!isPremiumPlayback && showPremiumUpsell && (
          <View style={styles.premiumBadge}>
            <Crown size={12} color="#FFD700" />
            <Text style={styles.premiumBadgeText}>PRO for full</Text>
          </View>
        )}
      </View>

      {showWaveform && (
        <AudioWaveform playbackState={isCurrentTrack ? playbackState : { ...playbackState, isPlaying: false, progress: { positionMs: 0, durationMs: snippet.durationMs, progress: 0, isBuffering: false } }} />
      )}

      {showProgress && isCurrentTrack && (
        <ProgressDisplay playbackState={playbackState} />
      )}

      {showControls && (
        <>
          <PlaybackControls
            playbackState={isCurrentTrack ? playbackState : { ...playbackState, isPlaying: false, isPaused: false }}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            onReplay={handleReplay}
            onToggleLoop={handleToggleLoop}
            onVolumeChange={handleVolumeChange}
            onSpeedChange={handleSpeedChange}
            isPremium={isPremiumPlayback}
            showAdvancedControls={showAdvancedControls}
          />

          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvancedControls(!showAdvancedControls)}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvancedControls ? 'Hide controls' : 'More controls'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {playbackState.error && isCurrentTrack && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color={Colors.absent} />
          <Text style={styles.errorText}>{playbackState.error}</Text>
        </View>
      )}

      {showAttribution && (
        <View style={styles.attributionContainer}>
          <Text style={styles.attributionText}>{attribution}</Text>
        </View>
      )}

      {onStreamFullTrack && (
        <TouchableOpacity style={styles.streamButton} onPress={onStreamFullTrack}>
          <Music size={16} color={Colors.accent} />
          <Text style={styles.streamButtonText}>Stream full track</Text>
          <ExternalLink size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      <View style={styles.legalNotice}>
        <Text style={styles.legalText}>{LEGAL_NOTICES.fairUse}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPlayButtonActive: {
    backgroundColor: Colors.correct,
  },
  compactWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 24,
    paddingHorizontal: 8,
  },
  compactBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  compactStopButton: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD700' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  premiumBadgeSmall: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 2,
    marginBottom: 12,
  },
  waveformBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  progressTime: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    width: 36,
    textAlign: 'center' as const,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  controlsContainer: {
    gap: 16,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  controlButtonActive: {
    backgroundColor: Colors.accent + '20',
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: Colors.correct,
  },
  speedControls: {
    alignItems: 'center',
    gap: 8,
  },
  speedLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  speedButtonActive: {
    backgroundColor: Colors.accent,
  },
  speedButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  speedButtonTextActive: {
    color: Colors.background,
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  volumeLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    width: 50,
  },
  volumeDots: {
    flexDirection: 'row',
    gap: 6,
  },
  volumeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
  },
  volumeDotActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  volumeValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    width: 40,
    textAlign: 'right' as const,
  },
  advancedToggle: {
    alignItems: 'center',
    paddingTop: 8,
  },
  advancedToggleText: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.absent + '15',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: Colors.absent,
    flex: 1,
  },
  attributionContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  attributionText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
  streamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  streamButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  legalNotice: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLight,
  },
  legalText: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    fontStyle: 'italic',
  },
});
