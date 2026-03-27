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
  streakCount?: number,
  maxGuesses?: number
): string {
  const maxG = maxGuesses || getMaxGuessesForLength(melodyLength);
  const attemptText = won ? `${guesses.length}/${maxG}` : `X/${maxG}`;
  const difficulty = getDifficultyFromLength(melodyLength);
  const diffLabel = MELODY_LENGTH_PRESETS[difficulty].label;
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
  const lengthText = melodyLength > 8 ? ` [${diffLabel} ${melodyLength}🎵]` : '';
  
  return `🎵 Melodyx #${puzzleNumber} ${attemptText}${perfectText}${lengthText} ${winEmoji}${streakText}\n\n${grid}\n🎹 Can you guess the melody?\nmelodyx.app`;
}

export function isWin(feedback: GuessResult[]): boolean {
  return feedback.every(f => f.feedback === 'correct');
}

export const VALID_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type ValidNote = typeof VALID_NOTES[number];

export const DEFAULT_NOTE_DURATION = 0.5;
export const DEFAULT_NOTE_COLOR = '#6B7280';
export const MIN_MELODY_NOTES = 5;
export const MAX_MELODY_NOTES = 30;

export function getDefaultDurations(noteCount: number): number[] {
  return Array(noteCount).fill(DEFAULT_NOTE_DURATION);
}

export function getDefaultColors(noteCount: number): string[] {
  return Array(noteCount).fill(DEFAULT_NOTE_COLOR);
}

export interface MelodyValidation {
  isValid: boolean;
  noteCount: number;
  uniqueNotes: number;
  hasValidNotes: boolean;
  errors: string[];
  warnings: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

export const MELODY_LENGTH_PRESETS = {
  easy: { min: 5, max: 5, label: 'Easy' },
  medium: { min: 6, max: 6, label: 'Medium' },
  hard: { min: 7, max: 8, label: 'Hard' },
  epic: { min: 9, max: 15, label: 'Epic' },
  legendary: { min: 16, max: 30, label: 'Legendary' },
} as const;

export type MelodyDifficulty = keyof typeof MELODY_LENGTH_PRESETS;

export function getDifficultyFromLength(length: number): MelodyDifficulty {
  if (length <= 5) return 'easy';
  if (length <= 6) return 'medium';
  if (length <= 8) return 'hard';
  if (length <= 15) return 'epic';
  return 'legendary';
}

export function getMaxGuessesForLength(length: number): number {
  if (length <= 5) return 6;
  if (length <= 8) return 7;
  if (length <= 15) return 8;
  return 10;
}

export function validateMelodyNotes(
  notes: string[],
  minNotes: number = MIN_MELODY_NOTES,
  maxNotes: number = MAX_MELODY_NOTES
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

export function sanitizeMelodyInput(notes: string[]): string[] {
  if (!Array.isArray(notes)) return [];
  return notes
    .filter(note => typeof note === 'string')
    .map(note => note.toUpperCase().trim())
    .filter(note => VALID_NOTES.includes(note as ValidNote));
}

export function normalizeDurations(durations: number[] | undefined, noteCount: number): number[] {
  if (!durations || !Array.isArray(durations) || durations.length === 0) {
    return getDefaultDurations(noteCount);
  }
  if (durations.length < noteCount) {
    return [...durations, ...getDefaultDurations(noteCount - durations.length)];
  }
  return durations.slice(0, noteCount).map(d => 
    typeof d === 'number' && d > 0 ? Math.min(d, 4.0) : DEFAULT_NOTE_DURATION
  );
}

export interface NetworkMockConfig {
  enabled: boolean;
  latencyMs: number;
  failureRate: number;
}

let networkMockConfig: NetworkMockConfig = {
  enabled: false,
  latencyMs: 0,
  failureRate: 0,
};

export function setNetworkMockConfig(config: Partial<NetworkMockConfig>): void {
  networkMockConfig = { ...networkMockConfig, ...config };
  console.log('[GameLogic] Network mock config updated:', networkMockConfig);
}

export function getNetworkMockConfig(): NetworkMockConfig {
  return { ...networkMockConfig };
}

export async function mockNetworkCall<T>(fn: () => Promise<T>): Promise<T> {
  if (!networkMockConfig.enabled) {
    return fn();
  }
  
  if (networkMockConfig.latencyMs > 0) {
    await new Promise(resolve => setTimeout(resolve, networkMockConfig.latencyMs));
  }
  
  if (Math.random() < networkMockConfig.failureRate) {
    throw new Error('Mock network failure');
  }
  
  return fn();
}
