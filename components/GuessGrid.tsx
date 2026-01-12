import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/colors';
import { GuessResult, FeedbackType } from '@/utils/gameLogic';

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
}

function Cell({ note, feedback, index, isCurrentRow, isRevealing }: CellProps) {
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

  return (
    <Animated.View
      style={[
        styles.cell,
        {
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
}

function GuessRow({ guess, melodyLength, isCurrentRow, isRevealing }: GuessRowProps) {
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
        />
      );
    }
  }

  return (
    <View 
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Guess grid with ${maxGuesses} rows, ${guesses.length} guesses made`}
    >
      {rows}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    width: 44,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
  },
  cellText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cellTextRevealed: {
    color: Colors.text,
  },
});
