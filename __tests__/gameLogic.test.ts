import { getFeedback, isWin, generateShareText, GuessResult } from '../utils/gameLogic';
import { getDailySeed, seededRandom, getDailyMelody, getDailyPuzzleNumber, MELODIES } from '../utils/melodies';

describe('Game Logic', () => {
  describe('getFeedback', () => {
    it('should return all correct for exact match', () => {
      const guess = ['C', 'D', 'E', 'F', 'G'];
      const target = ['C', 'D', 'E', 'F', 'G'];
      const result = getFeedback(guess, target);
      
      expect(result.every(r => r.feedback === 'correct')).toBe(true);
    });

    it('should return all absent for completely wrong guess', () => {
      const guess = ['A', 'B', 'A#', 'G#', 'F#'];
      const target = ['C', 'D', 'E', 'F', 'G'];
      const result = getFeedback(guess, target);
      
      expect(result.every(r => r.feedback === 'absent')).toBe(true);
    });

    it('should return present for notes in wrong position', () => {
      const guess = ['D', 'C', 'F', 'E', 'G'];
      const target = ['C', 'D', 'E', 'F', 'G'];
      const result = getFeedback(guess, target);
      
      expect(result[0].feedback).toBe('present');
      expect(result[1].feedback).toBe('present');
      expect(result[2].feedback).toBe('present');
      expect(result[3].feedback).toBe('present');
      expect(result[4].feedback).toBe('correct');
    });

    it('should handle mixed correct, present, and absent', () => {
      const guess = ['C', 'E', 'A', 'F', 'B'];
      const target = ['C', 'D', 'E', 'F', 'G'];
      const result = getFeedback(guess, target);
      
      expect(result[0].feedback).toBe('correct');
      expect(result[1].feedback).toBe('present');
      expect(result[2].feedback).toBe('absent');
      expect(result[3].feedback).toBe('correct');
      expect(result[4].feedback).toBe('absent');
    });

    it('should handle duplicate notes correctly', () => {
      const guess = ['C', 'C', 'C', 'D', 'E'];
      const target = ['C', 'D', 'E', 'F', 'G'];
      const result = getFeedback(guess, target);
      
      expect(result[0].feedback).toBe('correct');
      expect(result[1].feedback).toBe('absent');
      expect(result[2].feedback).toBe('absent');
    });

    it('should handle empty arrays', () => {
      const result = getFeedback([], []);
      expect(result).toEqual([]);
    });
  });

  describe('isWin', () => {
    it('should return true when all feedback is correct', () => {
      const feedback: GuessResult[] = [
        { note: 'C', feedback: 'correct' },
        { note: 'D', feedback: 'correct' },
        { note: 'E', feedback: 'correct' },
      ];
      expect(isWin(feedback)).toBe(true);
    });

    it('should return false when any feedback is not correct', () => {
      const feedback: GuessResult[] = [
        { note: 'C', feedback: 'correct' },
        { note: 'D', feedback: 'present' },
        { note: 'E', feedback: 'correct' },
      ];
      expect(isWin(feedback)).toBe(false);
    });

    it('should return false when all feedback is absent', () => {
      const feedback: GuessResult[] = [
        { note: 'C', feedback: 'absent' },
        { note: 'D', feedback: 'absent' },
      ];
      expect(isWin(feedback)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(isWin([])).toBe(true);
    });
  });

  describe('generateShareText', () => {
    it('should generate correct share text for a win', () => {
      const guesses: GuessResult[][] = [
        [
          { note: 'C', feedback: 'present' },
          { note: 'D', feedback: 'absent' },
          { note: 'E', feedback: 'correct' },
        ],
        [
          { note: 'C', feedback: 'correct' },
          { note: 'D', feedback: 'correct' },
          { note: 'E', feedback: 'correct' },
        ],
      ];
      
      const text = generateShareText(guesses, 42, true, 3);
      
      expect(text).toContain('Melodyx #42');
      expect(text).toContain('2/6');
      expect(text).toContain('🟨⬛🟩');
      expect(text).toContain('🟩🟩🟩');
      expect(text).toContain('🔥');
    });

    it('should generate correct share text for a loss', () => {
      const guesses: GuessResult[][] = Array(6).fill([
        { note: 'C', feedback: 'absent' },
        { note: 'D', feedback: 'absent' },
      ]);
      
      const text = generateShareText(guesses, 100, false, 2);
      
      expect(text).toContain('X/6');
      expect(text).toContain('😢');
    });

    it('should show PERFECT for first guess win', () => {
      const guesses: GuessResult[][] = [
        [
          { note: 'C', feedback: 'correct' },
          { note: 'D', feedback: 'correct' },
        ],
      ];
      
      const text = generateShareText(guesses, 1, true, 2);
      
      expect(text).toContain('PERFECT');
      expect(text).toContain('1/6');
    });

    it('should include streak count when provided', () => {
      const guesses: GuessResult[][] = [
        [{ note: 'C', feedback: 'correct' }],
      ];
      
      const text = generateShareText(guesses, 1, true, 1, 5);
      
      expect(text).toContain('5🔥 streak');
    });
  });
});

describe('Melodies', () => {
  describe('MELODIES array', () => {
    it('should have at least 100 melodies', () => {
      expect(MELODIES.length).toBeGreaterThanOrEqual(100);
    });

    it('should have valid structure for all melodies', () => {
      MELODIES.forEach((melody, index) => {
        expect(melody.name).toBeTruthy();
        expect(melody.notes).toBeInstanceOf(Array);
        expect(melody.notes.length).toBeGreaterThan(0);
        expect(melody.extendedNotes).toBeInstanceOf(Array);
        expect(melody.hint).toBeTruthy();
        expect(melody.category).toBeTruthy();
        expect(melody.genre).toBeTruthy();
        expect(melody.era).toBeTruthy();
        expect(melody.mood).toBeTruthy();
      });
    });

    it('should have unique melody names', () => {
      const names = MELODIES.map(m => m.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid notes (musical scale)', () => {
      const validNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      
      MELODIES.forEach(melody => {
        melody.notes.forEach(note => {
          expect(validNotes).toContain(note);
        });
      });
    });
  });

  describe('getDailySeed', () => {
    it('should return a number', () => {
      const seed = getDailySeed();
      expect(typeof seed).toBe('number');
    });

    it('should return consistent value for same day', () => {
      const seed1 = getDailySeed();
      const seed2 = getDailySeed();
      expect(seed1).toBe(seed2);
    });

    it('should return positive number', () => {
      const seed = getDailySeed();
      expect(seed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('seededRandom', () => {
    it('should return number between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const result = seededRandom(i);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      }
    });

    it('should return same value for same seed', () => {
      expect(seededRandom(42)).toBe(seededRandom(42));
      expect(seededRandom(100)).toBe(seededRandom(100));
    });

    it('should return different values for different seeds', () => {
      expect(seededRandom(1)).not.toBe(seededRandom(2));
    });
  });

  describe('getDailyMelody', () => {
    it('should return a valid melody', () => {
      const melody = getDailyMelody();
      
      expect(melody).toBeDefined();
      expect(melody.name).toBeTruthy();
      expect(melody.notes.length).toBeGreaterThan(0);
    });

    it('should return same melody for same day', () => {
      const melody1 = getDailyMelody();
      const melody2 = getDailyMelody();
      
      expect(melody1.name).toBe(melody2.name);
    });
  });

  describe('getDailyPuzzleNumber', () => {
    it('should return positive number', () => {
      const puzzleNum = getDailyPuzzleNumber();
      expect(puzzleNum).toBeGreaterThan(0);
    });

    it('should return integer', () => {
      const puzzleNum = getDailyPuzzleNumber();
      expect(Number.isInteger(puzzleNum)).toBe(true);
    });
  });
});

describe('Performance', () => {
  it('getFeedback should handle large inputs efficiently', () => {
    const largeGuess = Array(100).fill('C');
    const largeTarget = Array(100).fill('D');
    
    const start = Date.now();
    getFeedback(largeGuess, largeTarget);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });

  it('seededRandom should be fast for many calls', () => {
    const start = Date.now();
    for (let i = 0; i < 10000; i++) {
      seededRandom(i);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
