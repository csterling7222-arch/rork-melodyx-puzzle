import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, Dimensions, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { GuessResult, FeedbackType } from '@/utils/gameLogic';
import { DEFAULT_NOTE_DURATION } from '@/utils/melodies';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_VISIBLE_COLUMNS = 8;
const MIN_CELL_SIZE = 36;
const MAX_CELL_SIZE = 48;
const CELL_GAP = 6;
const HORIZONTAL_PADDING = 32;

const MIN_CELL_WIDTH = 50;
const MAX_CELL_WIDTH = 200;
const BASE_CELL_WIDTH = 48;
const DURATION_SCALE_FACTOR = 1.8;

interface GuessGridProps {
  guesses: GuessResult[][];
  currentGuess: string[];
  melodyLength: number;
  maxGuesses: number;
  durations?: number[];
}

interface CellProps {
  note: string;
  feedback: FeedbackType;
  index: number;
  isCurrentRow: boolean;
  isRevealing: boolean;
  cellSize: number;
  cellWidth: number;
  duration: number;
}

function Cell({ note, feedback, index, isCurrentRow, isRevealing, cellSize, cellWidth, duration }: CellProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const widthAnim = useRef(new Animated.Value(cellWidth)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: cellWidth,
      tension: 120,
      friction: 14,
      useNativeDriver: false,
    }).start();
  }, [cellWidth, widthAnim]);

  useEffect(() => {
    if (isRevealing && feedback !== 'empty') {
      Animated.sequence([
        Animated.delay(index * 150),
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isRevealing, feedback, index, flipAnim]);

  useEffect(() => {
    if (isCurrentRow && note) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [note, isCurrentRow, scaleAnim]);

  const getBackgroundColor = () => {
    if (feedback === 'empty') return Colors.surface;
    if (feedback === 'correct') return Colors.correct;
    if (feedback === 'present') return Colors.present;
    return Colors.absent;
  };

  const getBorderColor = () => {
    if (feedback === 'empty') {
      return note ? Colors.textMuted : Colors.surfaceLight;
    }
    return 'transparent';
  };

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  const backgroundColor = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [Colors.surface, Colors.surface, getBackgroundColor()],
  });

  const getDurationLabel = () => {
    if (duration <= 0.25) return '♬';
    if (duration <= 0.5) return '♪';
    if (duration <= 1.0) return '♩';
    return '𝅗𝅥';
  };

  const getAccessibilityLabel = () => {
    const durationDesc = duration <= 0.25 ? 'sixteenth' : duration <= 0.5 ? 'eighth' : duration <= 1.0 ? 'quarter' : 'half';
    if (!note) return `Empty cell, position ${index + 1}, ${durationDesc} note duration`;
    if (feedback === 'empty') return `Note ${note}, position ${index + 1}, ${durationDesc} note, not submitted`;
    if (feedback === 'correct') return `Note ${note}, position ${index + 1}, ${durationDesc} note, correct position`;
    if (feedback === 'present') return `Note ${note}, position ${index + 1}, ${durationDesc} note, in melody but wrong position`;
    return `Note ${note}, position ${index + 1}, ${durationDesc} note, not in melody`;
  };

  const fontSize = cellSize <= 38 ? 13 : cellSize <= 42 ? 14 : 16;
  const showDurationIndicator = duration !== DEFAULT_NOTE_DURATION;

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          width: widthAnim,
          height: cellSize + 6,
          backgroundColor: isRevealing ? backgroundColor : getBackgroundColor(),
          borderColor: getBorderColor(),
          transform: [
            { scale: scaleAnim },
            { perspective: 1000 },
            ...(isRevealing ? [{ rotateY }] : []),
          ],
        },
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={getAccessibilityLabel()}
    >
      {showDurationIndicator && (
        <Text style={styles.durationIndicator}>{getDurationLabel()}</Text>
      )}
      <Text style={[
        styles.cellText,
        { fontSize },
        feedback !== 'empty' && styles.cellTextRevealed,
      ]}>
        {note}
      </Text>
    </Animated.View>
  );
}

interface GuessRowProps {
  guess: GuessResult[] | null;
  melodyLength: number;
  isCurrentRow: boolean;
  isRevealing: boolean;
  cellSize: number;
  cellWidths: number[];
  durations: number[];
}

function GuessRow({ guess, melodyLength, isCurrentRow, isRevealing, cellSize, cellWidths, durations }: GuessRowProps) {
  const cells = [];
  for (let i = 0; i < melodyLength; i++) {
    const result = guess?.[i];
    cells.push(
      <Cell
        key={i}
        note={result?.note || ''}
        feedback={result?.feedback || 'empty'}
        index={i}
        isCurrentRow={isCurrentRow}
        isRevealing={isRevealing}
        cellSize={cellSize}
        cellWidth={cellWidths[i] || cellSize}
        duration={durations[i] || DEFAULT_NOTE_DURATION}
      />
    );
  }

  return (
    <View 
      style={styles.row}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Guess row${isCurrentRow ? ', current row' : ''}`}
    >
      {cells}
    </View>
  );
}

export default function GuessGrid({
  guesses,
  currentGuess,
  melodyLength,
  maxGuesses,
  durations,
}: GuessGridProps) {
  const prevLengthRef = useRef(melodyLength);
  const prevDurationsRef = useRef<number[]>(durations || []);
  const scrollViewRef = useRef<ScrollView>(null);
  const gridScaleAnim = useRef(new Animated.Value(1)).current;

  const normalizedDurations = useMemo(() => {
    if (!durations || durations.length === 0) {
      return Array(melodyLength).fill(DEFAULT_NOTE_DURATION);
    }
    const result = [...durations];
    while (result.length < melodyLength) {
      result.push(DEFAULT_NOTE_DURATION);
    }
    return result.slice(0, melodyLength);
  }, [durations, melodyLength]);

  const hasVariableDurations = useMemo(() => {
    return normalizedDurations.some(d => d !== DEFAULT_NOTE_DURATION);
  }, [normalizedDurations]);

  const cellSize = useMemo(() => {
    const availableWidth = SCREEN_WIDTH - HORIZONTAL_PADDING;
    const maxColumnsToShow = Math.min(melodyLength, MAX_VISIBLE_COLUMNS);
    const totalGaps = (maxColumnsToShow - 1) * CELL_GAP;
    const calculatedSize = Math.floor((availableWidth - totalGaps) / maxColumnsToShow);
    return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, calculatedSize));
  }, [melodyLength]);

  const cellWidths = useMemo(() => {
    if (!hasVariableDurations) {
      return Array(melodyLength).fill(cellSize);
    }
    
    return normalizedDurations.map(duration => {
      const scaledWidth = BASE_CELL_WIDTH * (duration / DEFAULT_NOTE_DURATION) * DURATION_SCALE_FACTOR;
      const normalizedWidth = Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, scaledWidth));
      return Math.round(normalizedWidth);
    });
  }, [normalizedDurations, hasVariableDurations, cellSize, melodyLength]);

  const gridWidth = useMemo(() => {
    const totalCellWidth = cellWidths.reduce((sum, w) => sum + w, 0);
    return totalCellWidth + ((melodyLength - 1) * CELL_GAP);
  }, [cellWidths, melodyLength]);

  const needsScroll = gridWidth > (SCREEN_WIDTH - HORIZONTAL_PADDING);

  const triggerResizeHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  useEffect(() => {
    const durationsChanged = JSON.stringify(prevDurationsRef.current) !== JSON.stringify(normalizedDurations);
    
    if (prevLengthRef.current !== melodyLength || durationsChanged) {
      triggerResizeHaptic();
      
      Animated.sequence([
        Animated.timing(gridScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(gridScaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();

      prevLengthRef.current = melodyLength;
      prevDurationsRef.current = normalizedDurations;
    }
  }, [melodyLength, normalizedDurations, gridScaleAnim, triggerResizeHaptic]);

  const rows = [];
  
  for (let i = 0; i < maxGuesses; i++) {
    if (i < guesses.length) {
      rows.push(
        <GuessRow
          key={i}
          guess={guesses[i]}
          melodyLength={melodyLength}
          isCurrentRow={false}
          isRevealing={i === guesses.length - 1}
          cellSize={cellSize}
          cellWidths={cellWidths}
          durations={normalizedDurations}
        />
      );
    } else if (i === guesses.length) {
      const currentGuessResult: GuessResult[] = currentGuess.map(note => ({
        note,
        feedback: 'empty' as FeedbackType,
      }));
      while (currentGuessResult.length < melodyLength) {
        currentGuessResult.push({ note: '', feedback: 'empty' });
      }
      rows.push(
        <GuessRow
          key={i}
          guess={currentGuessResult}
          melodyLength={melodyLength}
          isCurrentRow={true}
          isRevealing={false}
          cellSize={cellSize}
          cellWidths={cellWidths}
          durations={normalizedDurations}
        />
      );
    } else {
      rows.push(
        <GuessRow
          key={i}
          guess={null}
          melodyLength={melodyLength}
          isCurrentRow={false}
          isRevealing={false}
          cellSize={cellSize}
          cellWidths={cellWidths}
          durations={normalizedDurations}
        />
      );
    }
  }

  const getDifficultyLabel = () => {
    if (melodyLength <= 5) return 'Easy';
    if (melodyLength <= 6) return 'Medium';
    if (melodyLength <= 8) return 'Hard';
    if (melodyLength <= 15) return 'Epic';
    return 'Legendary';
  };

  const getRhythmDescription = () => {
    if (!hasVariableDurations) return '';
    const uniqueDurations = [...new Set(normalizedDurations)];
    if (uniqueDurations.length === 1) return '';
    return ` with ${uniqueDurations.length} rhythm patterns`;
  };

  const gridContent = (
    <Animated.View 
      style={[
        styles.gridContent,
        { transform: [{ scale: gridScaleAnim }] },
        needsScroll && { width: gridWidth },
      ]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Guess grid with ${maxGuesses} rows and ${melodyLength} columns, ${getDifficultyLabel()} difficulty${getRhythmDescription()}, ${guesses.length} guesses made`}
    >
      {rows}
    </Animated.View>
  );

  if (needsScroll) {
    return (
      <View style={styles.container}>
        <View style={styles.scrollIndicator}>
          <Text style={styles.scrollIndicatorText}>
            {melodyLength} notes{hasVariableDurations ? ' • Rhythm mode' : ''} • Swipe to scroll →
          </Text>
        </View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          bounces={true}
          decelerationRate="fast"
        >
          {gridContent}
        </ScrollView>
      </View>
    );
  }

  return (
    <View 
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Guess grid with ${maxGuesses} rows and ${melodyLength} columns, ${guesses.length} guesses made`}
    >
      {gridContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
  },
  scrollIndicatorText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  gridContent: {
    gap: 6,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
  },
  cellText: {
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cellTextRevealed: {
    color: Colors.text,
  },
  durationIndicator: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 9,
    color: Colors.textMuted,
    opacity: 0.7,
  },
});
