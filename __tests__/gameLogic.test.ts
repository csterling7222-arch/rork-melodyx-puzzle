import { 
  getFeedback, 
  isWin, 
  generateShareText, 
  GuessResult,
  validateMelodyNotes,
  VALID_NOTES,
  MELODY_LENGTH_PRESETS,
  getDifficultyFromLength,
  getMaxGuessesForLength,
  generateUGCShareText,
  calculateMelodyScore,
  MelodyDifficulty,
} from '../utils/gameLogic';
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

describe('Variable Length Melodies', () => {
  describe('getDifficultyFromLength', () => {
    it('should return easy for 5 notes', () => {
      expect(getDifficultyFromLength(5)).toBe('easy');
    });

    it('should return medium for 6 notes', () => {
      expect(getDifficultyFromLength(6)).toBe('medium');
    });

    it('should return hard for 7-8 notes', () => {
      expect(getDifficultyFromLength(7)).toBe('hard');
      expect(getDifficultyFromLength(8)).toBe('hard');
    });

    it('should return epic for 9-15 notes', () => {
      expect(getDifficultyFromLength(9)).toBe('epic');
      expect(getDifficultyFromLength(15)).toBe('epic');
    });

    it('should return legendary for 16-30 notes', () => {
      expect(getDifficultyFromLength(16)).toBe('legendary');
      expect(getDifficultyFromLength(30)).toBe('legendary');
    });
  });

  describe('getMaxGuessesForLength', () => {
    it('should return 6 guesses for easy (5 notes)', () => {
      expect(getMaxGuessesForLength(5)).toBe(6);
    });

    it('should return 7 guesses for hard (6-8 notes)', () => {
      expect(getMaxGuessesForLength(6)).toBe(7);
      expect(getMaxGuessesForLength(8)).toBe(7);
    });

    it('should return 8 guesses for epic (9-15 notes)', () => {
      expect(getMaxGuessesForLength(9)).toBe(8);
      expect(getMaxGuessesForLength(15)).toBe(8);
    });

    it('should return 10 guesses for legendary (16-30 notes)', () => {
      expect(getMaxGuessesForLength(16)).toBe(10);
      expect(getMaxGuessesForLength(30)).toBe(10);
    });
  });

  describe('getFeedback with variable lengths', () => {
    it('should handle 5-note melodies (easy)', () => {
      const guess = ['C', 'D', 'E', 'F', 'G'];
      const target = ['C', 'D', 'E', 'F', 'G'];
      const result = getFeedback(guess, target);
      
      expect(result.length).toBe(5);
      expect(result.every(r => r.feedback === 'correct')).toBe(true);
    });

    it('should handle 10-note melodies (epic)', () => {
      const guess = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E'];
      const target = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E'];
      const result = getFeedback(guess, target);
      
      expect(result.length).toBe(10);
      expect(result.every(r => r.feedback === 'correct')).toBe(true);
    });

    it('should handle 20-note melodies (legendary)', () => {
      const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E'];
      const guess = [...notes, ...notes];
      const target = [...notes, ...notes];
      const result = getFeedback(guess, target);
      
      expect(result.length).toBe(20);
      expect(result.every(r => r.feedback === 'correct')).toBe(true);
    });

    it('should handle 30-note melodies (max legendary)', () => {
      const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E'];
      const guess = [...notes, ...notes, ...notes];
      const target = [...notes, ...notes, ...notes];
      const result = getFeedback(guess, target);
      
      expect(result.length).toBe(30);
      expect(result.every(r => r.feedback === 'correct')).toBe(true);
    });

    it('should correctly handle mixed feedback in long melodies', () => {
      const guess = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E'];
      const target = ['C', 'E', 'D', 'F', 'G', 'B', 'A', 'C', 'D', 'F'];
      const result = getFeedback(guess, target);
      
      expect(result[0].feedback).toBe('correct');
      expect(result[1].feedback).toBe('present');
      expect(result[2].feedback).toBe('present');
      expect(result[3].feedback).toBe('correct');
      expect(result[4].feedback).toBe('correct');
      expect(result[5].feedback).toBe('present');
      expect(result[6].feedback).toBe('present');
      expect(result[7].feedback).toBe('correct');
      expect(result[8].feedback).toBe('correct');
      expect(result[9].feedback).toBe('absent');
    });
  });

  describe('generateShareText with variable lengths', () => {
    it('should include difficulty label for epic melodies', () => {
      const guesses: GuessResult[][] = [
        Array(12).fill({ note: 'C', feedback: 'correct' as const }),
      ];
      const text = generateShareText(guesses, 1, true, 12);
      
      expect(text).toContain('Epic');
      expect(text).toContain('12🎵');
    });

    it('should include difficulty label for legendary melodies', () => {
      const guesses: GuessResult[][] = [
        Array(20).fill({ note: 'C', feedback: 'correct' as const }),
      ];
      const text = generateShareText(guesses, 1, true, 20);
      
      expect(text).toContain('Legendary');
      expect(text).toContain('20🎵');
    });

    it('should not include difficulty label for standard melodies', () => {
      const guesses: GuessResult[][] = [
        Array(6).fill({ note: 'C', feedback: 'correct' as const }),
      ];
      const text = generateShareText(guesses, 1, true, 6);
      
      expect(text).not.toContain('Easy');
      expect(text).not.toContain('🎵]');
    });
  });
});

describe('UGC Validation', () => {
  describe('validateMelodyNotes', () => {
    it('should validate correct notes', () => {
      const notes = ['C', 'D', 'E', 'F', 'G'];
      const result = validateMelodyNotes(notes);
      
      expect(result.isValid).toBe(true);
      expect(result.hasValidNotes).toBe(true);
      expect(result.noteCount).toBe(5);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid notes', () => {
      const notes = ['C', 'D', 'H', 'X', 'G'];
      const result = validateMelodyNotes(notes);
      
      expect(result.isValid).toBe(false);
      expect(result.hasValidNotes).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid notes');
    });

    it('should reject melodies shorter than minimum', () => {
      const notes = ['C', 'D', 'E'];
      const result = validateMelodyNotes(notes, 5, 30);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at least'))).toBe(true);
    });

    it('should reject melodies longer than maximum', () => {
      const notes = Array(35).fill('C');
      const result = validateMelodyNotes(notes, 5, 30);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Maximum'))).toBe(true);
    });

    it('should accept 30-note melodies at boundary', () => {
      const notes = Array(30).fill(null).map((_, i) => VALID_NOTES[i % 12]);
      const result = validateMelodyNotes(notes, 5, 30);
      
      expect(result.isValid).toBe(true);
      expect(result.noteCount).toBe(30);
    });

    it('should warn about low variety', () => {
      const notes = ['C', 'C', 'D', 'D', 'C'];
      const result = validateMelodyNotes(notes);
      
      expect(result.isValid).toBe(true);
      expect(result.uniqueNotes).toBe(2);
      expect(result.warnings.some(w => w.includes('variety'))).toBe(true);
    });

    it('should warn about consecutive repeated notes', () => {
      const notes = ['C', 'C', 'C', 'C', 'D', 'E', 'F', 'G'];
      const result = validateMelodyNotes(notes);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('consecutive'))).toBe(true);
    });

    it('should calculate complexity correctly', () => {
      const simpleNotes = ['C', 'D', 'C', 'D', 'C'];
      const moderateNotes = ['C', 'D', 'E', 'F', 'G', 'A'];
      const complexNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#'];
      
      expect(validateMelodyNotes(simpleNotes).complexity).toBe('simple');
      expect(validateMelodyNotes(moderateNotes).complexity).toBe('complex');
      expect(validateMelodyNotes(complexNotes).complexity).toBe('complex');
    });

    it('should handle all valid note types', () => {
      const allNotes = [...VALID_NOTES];
      const result = validateMelodyNotes(allNotes);
      
      expect(result.isValid).toBe(true);
      expect(result.uniqueNotes).toBe(12);
      expect(result.hasValidNotes).toBe(true);
    });
  });

  describe('generateUGCShareText', () => {
    it('should generate correct share text for UGC win', () => {
      const guesses: GuessResult[][] = [
        [
          { note: 'C', feedback: 'correct' },
          { note: 'D', feedback: 'correct' },
          { note: 'E', feedback: 'correct' },
        ],
      ];
      
      const text = generateUGCShareText(
        guesses,
        'My Cool Melody',
        'testuser',
        true,
        'ABC123'
      );
      
      expect(text).toContain('My Cool Melody');
      expect(text).toContain('@testuser');
      expect(text).toContain('1/6');
      expect(text).toContain('ABC123');
      expect(text).toContain('🟩🟩🟩');
    });

    it('should generate correct share text for UGC loss', () => {
      const guesses: GuessResult[][] = Array(6).fill([
        { note: 'C', feedback: 'absent' as const },
        { note: 'D', feedback: 'absent' as const },
      ]);
      
      const text = generateUGCShareText(
        guesses,
        'Hard Melody',
        'creator',
        false,
        'XYZ789'
      );
      
      expect(text).toContain('X/6');
      expect(text).toContain('😢');
    });
  });

  describe('calculateMelodyScore', () => {
    it('should calculate higher scores for longer melodies', () => {
      const short = ['C', 'D', 'E', 'F', 'G'];
      const long = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E'];
      
      expect(calculateMelodyScore(long)).toBeGreaterThan(calculateMelodyScore(short));
    });

    it('should calculate higher scores for more variety', () => {
      const lowVariety = ['C', 'C', 'C', 'C', 'C', 'D', 'D'];
      const highVariety = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      
      expect(calculateMelodyScore(highVariety)).toBeGreaterThan(calculateMelodyScore(lowVariety));
    });

    it('should return consistent scores', () => {
      const notes = ['C', 'D', 'E', 'F', 'G'];
      const score1 = calculateMelodyScore(notes);
      const score2 = calculateMelodyScore(notes);
      
      expect(score1).toBe(score2);
    });
  });
});

describe('Long Melody Stress Tests', () => {
  it('should handle getFeedback for 30 notes efficiently', () => {
    const notes30 = Array(30).fill(null).map((_, i) => VALID_NOTES[i % 12]);
    
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      getFeedback(notes30, notes30);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200);
  });

  it('should handle validation for 30 notes efficiently', () => {
    const notes30 = Array(30).fill(null).map((_, i) => VALID_NOTES[i % 12]);
    
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      validateMelodyNotes(notes30);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });

  it('should handle share text generation for long melodies', () => {
    const guesses: GuessResult[][] = Array(10).fill(
      Array(30).fill({ note: 'C', feedback: 'absent' as const })
    );
    
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      generateShareText(guesses, 1, false, 30);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200);
  });

  it('should correctly process many UGC melodies in sequence', () => {
    const melodies = Array(50).fill(null).map((_, idx) => {
      const length = 5 + (idx % 26);
      return Array(length).fill(null).map((_, i) => VALID_NOTES[i % 12]);
    });
    
    const start = Date.now();
    const results = melodies.map(m => validateMelodyNotes(m));
    const duration = Date.now() - start;
    
    expect(results.every(r => r.isValid)).toBe(true);
    expect(duration).toBeLessThan(100);
  });

  it('should handle edge case of exactly 5 and 30 notes', () => {
    const min = Array(5).fill('C');
    const max = Array(30).fill(null).map((_, i) => VALID_NOTES[i % 12]);
    
    expect(validateMelodyNotes(min, 5, 30).isValid).toBe(true);
    expect(validateMelodyNotes(max, 5, 30).isValid).toBe(true);
    
    expect(validateMelodyNotes(Array(4).fill('C'), 5, 30).isValid).toBe(false);
    expect(validateMelodyNotes(Array(31).fill('C'), 5, 30).isValid).toBe(false);
  });
});

describe('MELODY_LENGTH_PRESETS', () => {
  it('should have all difficulty levels defined', () => {
    const difficulties: MelodyDifficulty[] = ['easy', 'medium', 'hard', 'epic', 'legendary'];
    
    difficulties.forEach(diff => {
      expect(MELODY_LENGTH_PRESETS[diff]).toBeDefined();
      expect(MELODY_LENGTH_PRESETS[diff].min).toBeDefined();
      expect(MELODY_LENGTH_PRESETS[diff].max).toBeDefined();
      expect(MELODY_LENGTH_PRESETS[diff].label).toBeDefined();
    });
  });

  it('should have non-overlapping ranges', () => {
    expect(MELODY_LENGTH_PRESETS.easy.max).toBeLessThan(MELODY_LENGTH_PRESETS.medium.min);
    expect(MELODY_LENGTH_PRESETS.medium.max).toBeLessThan(MELODY_LENGTH_PRESETS.hard.min);
    expect(MELODY_LENGTH_PRESETS.hard.max).toBeLessThan(MELODY_LENGTH_PRESETS.epic.min);
    expect(MELODY_LENGTH_PRESETS.epic.max).toBeLessThan(MELODY_LENGTH_PRESETS.legendary.min);
  });

  it('should cover range from 5 to 30', () => {
    expect(MELODY_LENGTH_PRESETS.easy.min).toBe(5);
    expect(MELODY_LENGTH_PRESETS.legendary.max).toBe(30);
  });
});
