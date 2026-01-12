export type FeedbackType = 'correct' | 'present' | 'absent' | 'empty';

export interface GuessResult {
  note: string;
  feedback: FeedbackType;
}

export function getFeedback(guess: string[], target: string[]): GuessResult[] {
  const result: GuessResult[] = guess.map(note => ({ note, feedback: 'absent' as FeedbackType }));
  const targetCopy = [...target];
  const usedIndices = new Set<number>();

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === targetCopy[i]) {
      result[i].feedback = 'correct';
      usedIndices.add(i);
      targetCopy[i] = '';
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (result[i].feedback === 'correct') continue;
    
    const targetIndex = targetCopy.findIndex((note, idx) => note === guess[i] && !usedIndices.has(idx));
    if (targetIndex !== -1) {
      result[i].feedback = 'present';
      targetCopy[targetIndex] = '';
      usedIndices.add(targetIndex);
    }
  }

  return result;
}

export function generateShareText(
  guesses: GuessResult[][],
  puzzleNumber: number,
  won: boolean,
  melodyLength: number,
  streakCount?: number
): string {
  const attemptText = won ? `${guesses.length}/6` : 'X/6';
  let grid = '';
  
  for (const guess of guesses) {
    for (const { feedback } of guess) {
      if (feedback === 'correct') grid += '🟩';
      else if (feedback === 'present') grid += '🟨';
      else grid += '⬛';
    }
    grid += '\n';
  }

  const winEmoji = won ? (guesses.length <= 2 ? '🔥' : guesses.length <= 4 ? '✨' : '🎉') : '😢';
  const streakText = streakCount && streakCount > 1 ? ` | ${streakCount}🔥 streak` : '';
  const perfectText = won && guesses.length === 1 ? ' PERFECT!' : '';
  
  return `🎵 Melodyx #${puzzleNumber} ${attemptText}${perfectText} ${winEmoji}${streakText}\n\n${grid}\n🎹 Can you guess the melody?\nmelodyx.app`;
}

export function isWin(feedback: GuessResult[]): boolean {
  return feedback.every(f => f.feedback === 'correct');
}

export const VALID_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type ValidNote = typeof VALID_NOTES[number];

export interface MelodyValidation {
  isValid: boolean;
  noteCount: number;
  uniqueNotes: number;
  hasValidNotes: boolean;
  errors: string[];
  warnings: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

export function validateMelodyNotes(
  notes: string[],
  minNotes: number = 5,
  maxNotes: number = 8
): MelodyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const hasValidNotes = notes.every(note => VALID_NOTES.includes(note as ValidNote));
  if (!hasValidNotes) {
    const invalidNotes = notes.filter(note => !VALID_NOTES.includes(note as ValidNote));
    errors.push(`Invalid notes: ${invalidNotes.join(', ')}`);
  }

  if (notes.length < minNotes) {
    errors.push(`Need at least ${minNotes} notes (have ${notes.length})`);
  }
  if (notes.length > maxNotes) {
    errors.push(`Maximum ${maxNotes} notes allowed (have ${notes.length})`);
  }

  const uniqueNotes = new Set(notes).size;
  if (uniqueNotes < 3 && notes.length >= minNotes) {
    warnings.push('Consider using more variety in notes');
  }

  let maxConsecutive = 1;
  let currentConsecutive = 1;
  for (let i = 1; i < notes.length; i++) {
    if (notes[i] === notes[i - 1]) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }
  if (maxConsecutive > 3) {
    warnings.push('Many consecutive repeated notes detected');
  }

  let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
  if (uniqueNotes <= 3 || notes.length <= 5) {
    complexity = 'simple';
  } else if (uniqueNotes >= 6 || notes.length >= 7) {
    complexity = 'complex';
  }

  return {
    isValid: errors.length === 0,
    noteCount: notes.length,
    uniqueNotes,
    hasValidNotes,
    errors,
    warnings,
    complexity,
  };
}

export function generateUGCShareText(
  guesses: GuessResult[][],
  melodyTitle: string,
  creatorName: string,
  won: boolean,
  shareCode: string
): string {
  const attemptText = won ? `${guesses.length}/6` : 'X/6';
  let grid = '';
  
  for (const guess of guesses) {
    for (const { feedback } of guess) {
      if (feedback === 'correct') grid += '🟩';
      else if (feedback === 'present') grid += '🟨';
      else grid += '⬛';
    }
    grid += '\n';
  }

  const winEmoji = won ? (guesses.length <= 2 ? '🔥' : guesses.length <= 4 ? '✨' : '🎉') : '😢';
  
  return `🎵 "${melodyTitle}" ${attemptText} ${winEmoji}\nBy @${creatorName}\n\n${grid}\n🎹 Try this melody: melodyx://c/${shareCode}\nmelodyx.app`;
}

export function calculateMelodyScore(notes: string[]): number {
  const uniqueNotes = new Set(notes).size;
  const lengthScore = notes.length * 10;
  const varietyScore = uniqueNotes * 15;
  
  let patternScore = 0;
  for (let i = 1; i < notes.length; i++) {
    if (notes[i] !== notes[i - 1]) {
      patternScore += 5;
    }
  }
  
  return lengthScore + varietyScore + patternScore;
}
