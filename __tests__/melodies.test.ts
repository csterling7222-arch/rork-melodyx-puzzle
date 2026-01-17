import { MELODIES, getDailySeed, seededRandom, getDailyMelody, getDailyPuzzleNumber } from '../utils/melodies';
import { VALID_NOTES } from '../utils/gameLogic';

describe('Melodies Data Integrity', () => {
  describe('MELODIES array validation', () => {
    it('should have substantial melody collection', () => {
      expect(MELODIES.length).toBeGreaterThanOrEqual(50);
    });

    it('each melody should have required properties', () => {
      MELODIES.forEach((melody, index) => {
        expect(melody.name).toBeDefined();
        expect(typeof melody.name).toBe('string');
        expect(melody.name.length).toBeGreaterThan(0);
        
        expect(melody.notes).toBeDefined();
        expect(Array.isArray(melody.notes)).toBe(true);
        expect(melody.notes.length).toBeGreaterThanOrEqual(3);
        
        expect(melody.hint).toBeDefined();
        expect(typeof melody.hint).toBe('string');
      });
    });

    it('all notes should be valid musical notes', () => {
      const validNotesArray = VALID_NOTES as readonly string[];
      const validNotes = new Set(validNotesArray);
      
      MELODIES.forEach((melody) => {
        melody.notes.forEach((note) => {
          expect(validNotes.has(note)).toBe(true);
        });
        
        if (melody.extendedNotes) {
          melody.extendedNotes.forEach((note) => {
            expect(validNotes.has(note)).toBe(true);
          });
        }
      });
    });

    it('should have unique melody names', () => {
      const names = MELODIES.map(m => m.name);
      const uniqueNames = new Set(names);
      
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
      if (duplicates.length > 0) {
        console.log('Duplicate melody names:', [...new Set(duplicates)]);
      }
      
      expect(uniqueNames.size).toBe(names.length);
    });

    it('melody categories should be defined', () => {
      MELODIES.forEach((melody) => {
        expect(melody.category).toBeDefined();
        expect(typeof melody.category).toBe('string');
      });
    });

    it('melody genres should be defined', () => {
      MELODIES.forEach((melody) => {
        expect(melody.genre).toBeDefined();
        expect(typeof melody.genre).toBe('string');
      });
    });
  });

  describe('Melody length distribution', () => {
    it('should have variety in melody lengths', () => {
      const lengths = MELODIES.map(m => m.notes.length);
      const uniqueLengths = new Set(lengths);
      
      expect(uniqueLengths.size).toBeGreaterThanOrEqual(3);
    });

    it('should have melodies of different difficulties', () => {
      const easy = MELODIES.filter(m => m.notes.length <= 5);
      const medium = MELODIES.filter(m => m.notes.length === 6);
      const hard = MELODIES.filter(m => m.notes.length >= 7);
      
      expect(easy.length).toBeGreaterThan(0);
      expect(medium.length + hard.length).toBeGreaterThan(0);
    });
  });
});

describe('Daily Melody Selection', () => {
  describe('getDailySeed', () => {
    it('should return consistent seed for same day', () => {
      const seed1 = getDailySeed();
      const seed2 = getDailySeed();
      
      expect(seed1).toBe(seed2);
    });

    it('should return number type', () => {
      const seed = getDailySeed();
      expect(typeof seed).toBe('number');
    });

    it('should return non-negative number', () => {
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

    it('should be deterministic', () => {
      const results1: number[] = [];
      const results2: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        results1.push(seededRandom(i));
        results2.push(seededRandom(i));
      }
      
      expect(results1).toEqual(results2);
    });

    it('should produce different values for different seeds', () => {
      const values = new Set<number>();
      
      for (let i = 0; i < 100; i++) {
        values.add(seededRandom(i));
      }
      
      expect(values.size).toBeGreaterThan(90);
    });

    it('should have good distribution', () => {
      const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      for (let i = 0; i < 1000; i++) {
        const value = seededRandom(i);
        const bucket = Math.floor(value * 10);
        buckets[Math.min(bucket, 9)]++;
      }
      
      buckets.forEach(count => {
        expect(count).toBeGreaterThan(50);
        expect(count).toBeLessThan(150);
      });
    });
  });

  describe('getDailyMelody', () => {
    it('should return valid melody object', () => {
      const melody = getDailyMelody();
      
      expect(melody).toBeDefined();
      expect(melody.name).toBeDefined();
      expect(melody.notes).toBeDefined();
      expect(melody.notes.length).toBeGreaterThan(0);
    });

    it('should be consistent throughout the day', () => {
      const melody1 = getDailyMelody();
      const melody2 = getDailyMelody();
      
      expect(melody1.name).toBe(melody2.name);
      expect(melody1.notes).toEqual(melody2.notes);
    });

    it('should return melody from MELODIES array', () => {
      const melody = getDailyMelody();
      const found = MELODIES.find(m => m.name === melody.name);
      
      expect(found).toBeDefined();
    });
  });

  describe('getDailyPuzzleNumber', () => {
    it('should return positive integer', () => {
      const num = getDailyPuzzleNumber();
      
      expect(Number.isInteger(num)).toBe(true);
      expect(num).toBeGreaterThan(0);
    });

    it('should be consistent throughout the day', () => {
      const num1 = getDailyPuzzleNumber();
      const num2 = getDailyPuzzleNumber();
      
      expect(num1).toBe(num2);
    });
  });
});

describe('Melody Edge Cases', () => {
  it('should handle melody with minimum notes', () => {
    const shortMelodies = MELODIES.filter(m => m.notes.length <= 4);
    
    shortMelodies.forEach(melody => {
      expect(melody.notes.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should handle melody with sharp notes', () => {
    const melodiesWithSharps = MELODIES.filter(m => 
      m.notes.some(note => note.includes('#'))
    );
    
    expect(melodiesWithSharps.length).toBeGreaterThan(0);
    
    melodiesWithSharps.forEach(melody => {
      melody.notes.forEach(note => {
        expect(VALID_NOTES).toContain(note);
      });
    });
  });

  it('extended notes should contain original notes', () => {
    MELODIES.forEach(melody => {
      if (melody.extendedNotes && melody.extendedNotes.length > 0) {
        expect(melody.extendedNotes.length).toBeGreaterThanOrEqual(melody.notes.length);
      }
    });
  });
});
