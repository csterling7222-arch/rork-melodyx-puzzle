import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, Dimensions, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { GuessResult, FeedbackType } from '@/utils/gameLogic';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_VISIBLE_COLUMNS = 8;
const MIN_CELL_SIZE = 36;
const MAX_CELL_SIZE = 48;
const CELL_GAP = 6;
const HORIZONTAL_PADDING = 32;

interface GuessGridProps {
  guesses: GuessResult[][];
  currentGuess: string[];
  melodyLength: number;
  maxGuesses: number;
}

interface CellProps {
  note: string;
  feedback: FeedbackType;
  index: number;
  isCurrentRow: boolean;
  isRevealing: boolean;
  cellSize: number;
}

function Cell({ note, feedback, index, isCurrentRow, isRevealing, cellSize }: CellProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const getAccessibilityLabel = () => {
    if (!note) return `Empty cell, position ${index + 1}`;
    if (feedback === 'empty') return `Note ${note}, position ${index + 1}, not submitted`;
    if (feedback === 'correct') return `Note ${note}, position ${index + 1}, correct position`;
    if (feedback === 'present') return `Note ${note}, position ${index + 1}, in melody but wrong position`;
    return `Note ${note}, position ${index + 1}, not in melody`;
  };

  const fontSize = cellSize <= 38 ? 13 : cellSize <= 42 ? 14 : 16;

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          width: cellSize,
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
}

function GuessRow({ guess, melodyLength, isCurrentRow, isRevealing, cellSize }: GuessRowProps) {
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
}: GuessGridProps) {
  const prevLengthRef = useRef(melodyLength);
  const scrollViewRef = useRef<ScrollView>(null);
  const gridScaleAnim = useRef(new Animated.Value(1)).current;

  const needsScroll = melodyLength > MAX_VISIBLE_COLUMNS;

  const cellSize = useMemo(() => {
    const availableWidth = SCREEN_WIDTH - HORIZONTAL_PADDING;
    const maxColumnsToShow = Math.min(melodyLength, MAX_VISIBLE_COLUMNS);
    const totalGaps = (maxColumnsToShow - 1) * CELL_GAP;
    const calculatedSize = Math.floor((availableWidth - totalGaps) / maxColumnsToShow);
    return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, calculatedSize));
  }, [melodyLength]);

  const gridWidth = useMemo(() => {
    return (cellSize * melodyLength) + ((melodyLength - 1) * CELL_GAP);
  }, [cellSize, melodyLength]);

  const triggerResizeHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  useEffect(() => {
    if (prevLengthRef.current !== melodyLength) {
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
    }
  }, [melodyLength, gridScaleAnim, triggerResizeHaptic]);

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

  const gridContent = (
    <Animated.View 
      style={[
        styles.gridContent,
        { transform: [{ scale: gridScaleAnim }] },
        needsScroll && { width: gridWidth },
      ]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Guess grid with ${maxGuesses} rows and ${melodyLength} columns, ${getDifficultyLabel()} difficulty, ${guesses.length} guesses made`}
    >
      {rows}
    </Animated.View>
  );

  if (needsScroll) {
    return (
      <View style={styles.container}>
        <View style={styles.scrollIndicator}>
          <Text style={styles.scrollIndicatorText}>
            {melodyLength} notes • Swipe to scroll →
          </Text>
        </View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          bounces={true}
          decelerationRate="fast"
          snapToInterval={cellSize + CELL_GAP}
          snapToAlignment="start"
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
});
