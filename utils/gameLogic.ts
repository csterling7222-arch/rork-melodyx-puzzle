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
