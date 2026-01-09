import React, { useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Delete, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { NOTE_SCALE } from '@/utils/melodies';

interface PianoKeyboardProps {
  onNotePress: (note: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  disabled: boolean;
  playNote: (note: string) => void;
}

interface PianoKeyProps {
  note: string;
  onPress: (note: string) => void;
  disabled: boolean;
}

const NOTE_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  'C': { bg: '#EF4444', text: '#FFFFFF', glow: '#EF444480' },
  'C#': { bg: '#1F1F1F', text: '#FFFFFF', glow: '#6B728080' },
  'D': { bg: '#F97316', text: '#FFFFFF', glow: '#F9731680' },
  'D#': { bg: '#1F1F1F', text: '#FFFFFF', glow: '#6B728080' },
  'E': { bg: '#FBBF24', text: '#1F1F1F', glow: '#FBBF2480' },
  'F': { bg: '#22C55E', text: '#FFFFFF', glow: '#22C55E80' },
  'F#': { bg: '#1F1F1F', text: '#FFFFFF', glow: '#6B728080' },
  'G': { bg: '#06B6D4', text: '#1F1F1F', glow: '#06B6D480' },
  'G#': { bg: '#1F1F1F', text: '#FFFFFF', glow: '#6B728080' },
  'A': { bg: '#3B82F6', text: '#FFFFFF', glow: '#3B82F680' },
  'A#': { bg: '#1F1F1F', text: '#FFFFFF', glow: '#6B728080' },
  'B': { bg: '#A855F7', text: '#FFFFFF', glow: '#A855F780' },
};

const PianoKey = memo(function PianoKey({ note, onPress, disabled }: PianoKeyProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const brightnessAnim = useRef(new Animated.Value(1)).current;
  const isSharp = note.includes('#');
  const colors = NOTE_COLORS[note] || { bg: '#FAFAFA', text: '#000', glow: '#00000040' };

  const handlePress = useCallback(() => {
    if (disabled) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 30,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 400,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(brightnessAnim, {
          toValue: 1.3,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(brightnessAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onPress(note);
  }, [note, onPress, disabled, scaleAnim, glowAnim, brightnessAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.key,
          isSharp && styles.sharpKey,
          { backgroundColor: colors.bg },
          disabled && styles.keyDisabled,
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={disabled}
        testID={`piano-key-${note}`}
      >
        <Animated.View 
          style={[
            styles.keyGlow,
            { 
              backgroundColor: colors.glow,
              opacity: glowOpacity,
            }
          ]} 
        />
        <Animated.View style={[styles.keyContent, { opacity: brightnessAnim }]}>
          <Text style={[styles.keyText, { color: colors.text }]}>
            {note}
          </Text>
          <View style={[styles.noteIndicator, { backgroundColor: colors.text + '30' }]} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

function PianoKeyboard({
  onNotePress,
  onDelete,
  onSubmit,
  canSubmit,
  disabled,
  playNote,
}: PianoKeyboardProps) {
  const deleteScaleAnim = useRef(new Animated.Value(1)).current;
  const submitScaleAnim = useRef(new Animated.Value(1)).current;
  const submitGlowAnim = useRef(new Animated.Value(0)).current;

  const handleNotePress = useCallback((note: string) => {
    onNotePress(note);
    playNote(note);
  }, [onNotePress, playNote]);

  const handleDelete = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Animated.sequence([
      Animated.timing(deleteScaleAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(deleteScaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    
    onDelete();
  }, [onDelete, deleteScaleAnim]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Animated.parallel([
      Animated.sequence([
        Animated.timing(submitScaleAnim, {
          toValue: 0.92,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.spring(submitScaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(submitGlowAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(submitGlowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    
    onSubmit();
  }, [canSubmit, onSubmit, submitScaleAnim, submitGlowAnim]);

  const topRow = NOTE_SCALE.slice(0, 6);
  const bottomRow = NOTE_SCALE.slice(6);

  const submitGlowOpacity = submitGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <View style={styles.container}>
      <View style={styles.keyboardContainer}>
        <View style={styles.row}>
          {topRow.map((note) => (
            <PianoKey
              key={note}
              note={note}
              onPress={handleNotePress}
              disabled={disabled}
            />
          ))}
        </View>
        <View style={styles.row}>
          {bottomRow.map((note) => (
            <PianoKey
              key={note}
              note={note}
              onPress={handleNotePress}
              disabled={disabled}
            />
          ))}
        </View>
      </View>

      <View style={styles.actionRow}>
        <Animated.View style={{ transform: [{ scale: deleteScaleAnim }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            disabled={disabled}
            testID="delete-button"
          >
            <Delete size={22} color={Colors.text} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: submitScaleAnim }], flex: 1, maxWidth: 200 }}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.submitButton,
              canSubmit && styles.submitButtonActive,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || disabled}
            testID="submit-button"
          >
            {canSubmit && (
              <Animated.View 
                style={[
                  styles.submitGlow,
                  { opacity: submitGlowOpacity }
                ]} 
              />
            )}
            <Check size={22} color={canSubmit ? Colors.background : Colors.textMuted} />
            <Text style={[
              styles.submitText,
              canSubmit && styles.submitTextActive,
            ]}>
              Submit
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

export default memo(PianoKeyboard);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  keyboardContainer: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  key: {
    width: 54,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 8,
  },
  sharpKey: {
    width: 50,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.keyBorder,
  },
  keyGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  keyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  noteIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    overflow: 'hidden',
  },
  deleteButton: {
    backgroundColor: Colors.surfaceLight,
    minWidth: 72,
  },
  submitButton: {
    backgroundColor: Colors.surfaceLight,
    width: '100%',
  },
  submitButtonActive: {
    backgroundColor: Colors.correct,
  },
  submitGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  submitText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  submitTextActive: {
    color: Colors.background,
  },
});
