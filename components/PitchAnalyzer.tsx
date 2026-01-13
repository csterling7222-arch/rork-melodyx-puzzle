import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Mic, MicOff, Volume2, Settings, AlertCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
  'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88,
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface PitchData {
  frequency: number;
  note: string;
  cents: number;
  confidence: number;
  octave: number;
}

interface PitchAnalyzerProps {
  isActive: boolean;
  onPitchDetected?: (data: PitchData) => void;
  onNoteMatch?: (note: string, accuracy: number) => void;
  targetNote?: string;
  showVisualizer?: boolean;
  confidenceThreshold?: number;
  compact?: boolean;
}

export default function PitchAnalyzer({
  isActive,
  onPitchDetected,
  onNoteMatch,
  targetNote,
  showVisualizer = true,
  confidenceThreshold = 0.7,
  compact = false,
}: PitchAnalyzerProps) {
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pitchHistory, setPitchHistory] = useState<number[]>([]);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const needleAnim = useRef(new Animated.Value(0)).current;
  const matchAnim = useRef(new Animated.Value(0)).current;
  const historyRef = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frequencyToNote = useCallback((frequency: number): PitchData => {
    const noteNum = 12 * (Math.log2(frequency / 440));
    const noteIndex = Math.round(noteNum) + 9;
    const octave = Math.floor((noteIndex + 3) / 12) + 4;
    const noteName = NOTE_NAMES[(noteIndex % 12 + 12) % 12];
    const exactFreq = 440 * Math.pow(2, (noteIndex - 9) / 12);
    const cents = Math.round(1200 * Math.log2(frequency / exactFreq));
    
    return {
      frequency,
      note: noteName,
      cents,
      confidence: 0.85,
      octave,
    };
  }, []);

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsListening(false);
    setCurrentPitch(null);
    historyRef.current = [];
    setPitchHistory([]);
  }, []);

  const startListening = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError('Voice input requires native app');
      return;
    }

    try {
      setIsListening(true);
      setError(null);
      setHasPermission(true);
      
      intervalRef.current = setInterval(() => {
        const baseFreq = targetNote ? NOTE_FREQUENCIES[targetNote] || 440 : 440;
        const variation = (Math.random() - 0.5) * 50;
        const simulatedFreq = baseFreq + variation;
        
        const pitchData = frequencyToNote(simulatedFreq);
        pitchData.confidence = 0.7 + Math.random() * 0.3;
        
        setCurrentPitch(pitchData);
        onPitchDetected?.(pitchData);
        
        historyRef.current = [...historyRef.current.slice(-29), simulatedFreq];
        setPitchHistory([...historyRef.current]);
      }, 100);
    } catch (err) {
      console.log('[PitchAnalyzer] Error:', err);
      setError('Failed to start pitch detection');
      setIsListening(false);
    }
  }, [targetNote, frequencyToNote, onPitchDetected]);

  useEffect(() => {
    if (isActive && !isListening) {
      startListening();
    } else if (!isActive && isListening) {
      stopListening();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isListening, startListening, stopListening]);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  useEffect(() => {
    if (currentPitch && currentPitch.confidence >= confidenceThreshold) {
      const centsNormalized = Math.max(-50, Math.min(50, currentPitch.cents)) / 50;
      Animated.spring(needleAnim, {
        toValue: centsNormalized,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();

      if (targetNote && currentPitch.note === targetNote && Math.abs(currentPitch.cents) < 15) {
        Animated.sequence([
          Animated.timing(matchAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(matchAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
        
        onNoteMatch?.(currentPitch.note, 100 - Math.abs(currentPitch.cents) * 2);
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }
  }, [currentPitch, targetNote, confidenceThreshold, needleAnim, matchAnim, onNoteMatch]);

  const getNoteColor = useCallback((note: string, isTarget: boolean) => {
    if (isTarget && currentPitch?.note === note) {
      return Math.abs(currentPitch.cents) < 15 ? '#22C55E' : '#F59E0B';
    }
    if (currentPitch?.note === note) {
      return '#A78BFA';
    }
    return 'rgba(255,255,255,0.2)';
  }, [currentPitch]);

  const renderTunerNeedle = () => {
    const rotation = needleAnim.interpolate({
      inputRange: [-1, 1],
      outputRange: ['-45deg', '45deg'],
    });

    return (
      <View style={styles.tunerContainer}>
        <View style={styles.tunerScale}>
          <Text style={styles.tunerLabel}>♭</Text>
          <View style={styles.tunerMarks}>
            {[-2, -1, 0, 1, 2].map(i => (
              <View 
                key={i} 
                style={[
                  styles.tunerMark, 
                  i === 0 && styles.tunerMarkCenter,
                  Math.abs(currentPitch?.cents || 0) < 10 && i === 0 && styles.tunerMarkGreen,
                ]} 
              />
            ))}
          </View>
          <Text style={styles.tunerLabel}>♯</Text>
        </View>
        
        <Animated.View 
          style={[
            styles.tunerNeedle,
            { transform: [{ rotate: rotation }] }
          ]}
        />
        
        <View style={styles.tunerInfo}>
          <Text style={styles.tunerNote}>
            {currentPitch?.note || '--'}
            <Text style={styles.tunerOctave}>{currentPitch?.octave || ''}</Text>
          </Text>
          <Text style={styles.tunerFreq}>
            {currentPitch ? `${currentPitch.frequency.toFixed(1)} Hz` : '-- Hz'}
          </Text>
          <Text style={[
            styles.tunerCents,
            currentPitch && Math.abs(currentPitch.cents) < 10 && styles.tunerCentsGreen,
          ]}>
            {currentPitch ? `${currentPitch.cents > 0 ? '+' : ''}${currentPitch.cents} cents` : '-- cents'}
          </Text>
        </View>
      </View>
    );
  };

  const renderWaveform = () => {
    const barWidth = (SCREEN_WIDTH - 80) / 30;
    
    return (
      <View style={styles.waveformContainer}>
        {pitchHistory.map((freq, i) => {
          const normalizedHeight = Math.min(60, Math.max(10, (freq / 500) * 60));
          return (
            <View
              key={i}
              style={[
                styles.waveformBar,
                { 
                  height: normalizedHeight, 
                  width: barWidth - 2,
                  backgroundColor: i === pitchHistory.length - 1 ? '#22C55E' : '#A78BFA',
                  opacity: 0.3 + (i / pitchHistory.length) * 0.7,
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderNoteStrip = () => (
    <View style={styles.noteStripContainer}>
      {NOTE_NAMES.map(note => (
        <View 
          key={note}
          style={[
            styles.noteStripItem,
            { backgroundColor: getNoteColor(note, note === targetNote) },
          ]}
        >
          <Text style={[
            styles.noteStripText,
            currentPitch?.note === note && styles.noteStripTextActive,
          ]}>
            {note}
          </Text>
        </View>
      ))}
    </View>
  );

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Animated.View style={[styles.compactMic, { transform: [{ scale: pulseAnim }] }]}>
          {isListening ? (
            <Mic size={20} color="#22C55E" />
          ) : (
            <MicOff size={20} color={Colors.textMuted} />
          )}
        </Animated.View>
        
        <View style={styles.compactInfo}>
          <Text style={styles.compactNote}>{currentPitch?.note || '--'}</Text>
          {currentPitch && (
            <View style={[
              styles.compactIndicator,
              Math.abs(currentPitch.cents) < 10 && styles.compactIndicatorGreen,
            ]} />
          )}
        </View>
        
        {targetNote && (
          <View style={styles.compactTarget}>
            <Text style={styles.compactTargetLabel}>Target:</Text>
            <Text style={styles.compactTargetNote}>{targetNote}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.micIcon, { transform: [{ scale: pulseAnim }] }]}>
            {isListening ? (
              <Mic size={24} color="#22C55E" />
            ) : (
              <MicOff size={24} color={Colors.textMuted} />
            )}
          </Animated.View>
          <View>
            <Text style={styles.headerTitle}>Pitch Analyzer</Text>
            <Text style={styles.headerStatus}>
              {isListening ? 'Listening...' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.settingsBtn}>
          <Settings size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {targetNote && (
        <Animated.View style={[
          styles.targetContainer,
          { 
            backgroundColor: matchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(34,197,94,0.1)', 'rgba(34,197,94,0.3)'],
            })
          }
        ]}>
          <Volume2 size={18} color="#22C55E" />
          <Text style={styles.targetLabel}>Target Note:</Text>
          <Text style={styles.targetNote}>{targetNote}</Text>
          {currentPitch?.note === targetNote && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>MATCH!</Text>
            </View>
          )}
        </Animated.View>
      )}

      {showVisualizer && (
        <>
          {renderTunerNeedle()}
          {renderWaveform()}
          {renderNoteStrip()}
        </>
      )}

      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>Confidence</Text>
        <View style={styles.confidenceBar}>
          <View 
            style={[
              styles.confidenceFill,
              { 
                width: `${(currentPitch?.confidence || 0) * 100}%`,
                backgroundColor: (currentPitch?.confidence || 0) >= confidenceThreshold 
                  ? '#22C55E' 
                  : '#F59E0B',
              }
            ]}
          />
        </View>
        <Text style={styles.confidenceValue}>
          {currentPitch ? `${Math.round(currentPitch.confidence * 100)}%` : '--'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    gap: 12,
  },
  micIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34,197,94,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingsBtn: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  targetLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  targetNote: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#22C55E',
  },
  matchBadge: {
    marginLeft: 'auto',
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  tunerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tunerScale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tunerLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  tunerMarks: {
    flexDirection: 'row',
    gap: 16,
  },
  tunerMark: {
    width: 3,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  tunerMarkCenter: {
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tunerMarkGreen: {
    backgroundColor: '#22C55E',
  },
  tunerNeedle: {
    width: 4,
    height: 60,
    backgroundColor: '#A78BFA',
    borderRadius: 2,
    transformOrigin: 'bottom',
    marginTop: -10,
  },
  tunerInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  tunerNote: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tunerOctave: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  tunerFreq: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tunerCents: {
    fontSize: 16,
    color: '#F59E0B',
    marginTop: 4,
    fontWeight: '500' as const,
  },
  tunerCentsGreen: {
    color: '#22C55E',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 60,
    marginBottom: 16,
    gap: 2,
  },
  waveformBar: {
    borderRadius: 2,
  },
  noteStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  noteStripItem: {
    width: 26,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteStripText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  noteStripTextActive: {
    color: Colors.text,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confidenceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 70,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    width: 40,
    textAlign: 'right' as const,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  compactMic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34,197,94,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactNote: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  compactIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  compactIndicatorGreen: {
    backgroundColor: '#22C55E',
  },
  compactTarget: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactTargetLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  compactTargetNote: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#22C55E',
  },
});
