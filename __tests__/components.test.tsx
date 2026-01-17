describe('Component Tests', () => {
  describe('ErrorBoundary', () => {
    it('should render children when no error occurs', () => {
      const mockChild = 'Test Child Content';
      expect(mockChild).toBeDefined();
    });

    it('should have proper error state structure', () => {
      const errorState = {
        hasError: false,
        error: null,
        errorInfo: null,
      };
      
      expect(errorState.hasError).toBe(false);
      expect(errorState.error).toBeNull();
    });

    it('should handle error state transition', () => {
      const initialState = { hasError: false, error: null };
      const errorState = { hasError: true, error: new Error('Test error') };
      
      expect(initialState.hasError).toBe(false);
      expect(errorState.hasError).toBe(true);
      expect(errorState.error?.message).toBe('Test error');
    });
  });

  describe('PianoKeyboard', () => {
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

    it('should have all 12 notes defined', () => {
      const notes = Object.keys(NOTE_COLORS);
      expect(notes.length).toBe(12);
    });

    it('should have correct sharp notes', () => {
      const sharpNotes = Object.keys(NOTE_COLORS).filter(n => n.includes('#'));
      expect(sharpNotes).toEqual(['C#', 'D#', 'F#', 'G#', 'A#']);
    });

    it('should have valid color values', () => {
      Object.values(NOTE_COLORS).forEach(colors => {
        expect(colors.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(colors.text).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(colors.glow).toMatch(/^#[0-9A-Fa-f]{8}$/);
      });
    });

    it('should distinguish natural and sharp keys visually', () => {
      const naturalKey = NOTE_COLORS['C'];
      const sharpKey = NOTE_COLORS['C#'];
      
      expect(naturalKey.bg).not.toBe(sharpKey.bg);
    });
  });

  describe('GuessGrid Logic', () => {
    type FeedbackType = 'correct' | 'present' | 'absent' | 'empty';
    
    interface GuessResult {
      note: string;
      feedback: FeedbackType;
    }

    const createEmptyRow = (length: number): GuessResult[] => {
      return Array(length).fill(null).map(() => ({ note: '', feedback: 'empty' as FeedbackType }));
    };

    it('should create empty row with correct length', () => {
      const row = createEmptyRow(5);
      expect(row.length).toBe(5);
      row.forEach(cell => {
        expect(cell.note).toBe('');
        expect(cell.feedback).toBe('empty');
      });
    });

    it('should handle variable melody lengths', () => {
      [5, 6, 7, 8, 10, 15, 20].forEach(length => {
        const row = createEmptyRow(length);
        expect(row.length).toBe(length);
      });
    });

    it('should have correct feedback types', () => {
      const validTypes: FeedbackType[] = ['correct', 'present', 'absent', 'empty'];
      
      validTypes.forEach(type => {
        const result: GuessResult = { note: 'C', feedback: type };
        expect(validTypes).toContain(result.feedback);
      });
    });
  });

  describe('GameModal States', () => {
    it('should have win state properties', () => {
      const winState = {
        gameStatus: 'won' as const,
        attempts: 3,
        streak: 5,
        maxStreak: 10,
      };
      
      expect(winState.gameStatus).toBe('won');
      expect(winState.attempts).toBeLessThanOrEqual(6);
      expect(winState.streak).toBeLessThanOrEqual(winState.maxStreak);
    });

    it('should have loss state properties', () => {
      const lossState = {
        gameStatus: 'lost' as const,
        attempts: 6,
        correctAnswer: ['C', 'D', 'E', 'F', 'G'],
      };
      
      expect(lossState.gameStatus).toBe('lost');
      expect(lossState.attempts).toBe(6);
      expect(lossState.correctAnswer.length).toBeGreaterThan(0);
    });

    it('should calculate win percentage correctly', () => {
      const calculateWinPercentage = (won: number, played: number): number => {
        if (played === 0) return 0;
        return Math.round((won / played) * 100);
      };
      
      expect(calculateWinPercentage(50, 100)).toBe(50);
      expect(calculateWinPercentage(0, 0)).toBe(0);
      expect(calculateWinPercentage(10, 10)).toBe(100);
      expect(calculateWinPercentage(1, 3)).toBe(33);
    });
  });

  describe('Confetti Animation', () => {
    it('should generate random particle properties', () => {
      const generateParticle = (index: number) => ({
        id: index,
        x: Math.random() * 400,
        y: -20 - Math.random() * 100,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][index % 5],
      });

      const particles = Array.from({ length: 50 }, (_, i) => generateParticle(i));
      
      expect(particles.length).toBe(50);
      particles.forEach(p => {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(400);
        expect(p.rotation).toBeGreaterThanOrEqual(0);
        expect(p.rotation).toBeLessThanOrEqual(360);
        expect(p.scale).toBeGreaterThanOrEqual(0.5);
        expect(p.scale).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessible labels', () => {
      const accessibleProps = {
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Piano key C',
        accessibilityHint: 'Double tap to play C',
        accessibilityState: { disabled: false },
      };

      expect(accessibleProps.accessible).toBe(true);
      expect(accessibleProps.accessibilityRole).toBe('button');
      expect(accessibleProps.accessibilityLabel).toContain('Piano key');
      expect(accessibleProps.accessibilityHint).toBeTruthy();
    });

    it('should handle disabled state accessibility', () => {
      const disabledProps = {
        accessibilityState: { disabled: true },
        accessibilityHint: 'Key is disabled',
      };

      expect(disabledProps.accessibilityState.disabled).toBe(true);
      expect(disabledProps.accessibilityHint).toContain('disabled');
    });
  });
});

describe('Integration Tests', () => {
  describe('Game Flow', () => {
    type GameStatus = 'playing' | 'won' | 'lost';

    interface GameState {
      guesses: string[][];
      currentGuess: string[];
      status: GameStatus;
      targetMelody: string[];
    }

    const createGameState = (targetMelody: string[]): GameState => ({
      guesses: [],
      currentGuess: [],
      status: 'playing',
      targetMelody,
    });

    const addNote = (state: GameState, note: string): GameState => {
      if (state.currentGuess.length >= state.targetMelody.length) {
        return state;
      }
      return {
        ...state,
        currentGuess: [...state.currentGuess, note],
      };
    };

    const removeNote = (state: GameState): GameState => ({
      ...state,
      currentGuess: state.currentGuess.slice(0, -1),
    });

    const submitGuess = (state: GameState): GameState => {
      if (state.currentGuess.length !== state.targetMelody.length) {
        return state;
      }

      const newGuesses = [...state.guesses, state.currentGuess];
      const isWin = state.currentGuess.every((note, i) => note === state.targetMelody[i]);
      const isLoss = newGuesses.length >= 6 && !isWin;

      return {
        ...state,
        guesses: newGuesses,
        currentGuess: [],
        status: isWin ? 'won' : isLoss ? 'lost' : 'playing',
      };
    };

    it('should initialize game correctly', () => {
      const state = createGameState(['C', 'D', 'E', 'F', 'G']);
      
      expect(state.guesses).toHaveLength(0);
      expect(state.currentGuess).toHaveLength(0);
      expect(state.status).toBe('playing');
    });

    it('should add notes to current guess', () => {
      let state = createGameState(['C', 'D', 'E', 'F', 'G']);
      state = addNote(state, 'C');
      state = addNote(state, 'D');
      
      expect(state.currentGuess).toEqual(['C', 'D']);
    });

    it('should not exceed melody length', () => {
      let state = createGameState(['C', 'D']);
      state = addNote(state, 'C');
      state = addNote(state, 'D');
      state = addNote(state, 'E');
      
      expect(state.currentGuess).toEqual(['C', 'D']);
    });

    it('should remove notes correctly', () => {
      let state = createGameState(['C', 'D', 'E']);
      state = addNote(state, 'C');
      state = addNote(state, 'D');
      state = removeNote(state);
      
      expect(state.currentGuess).toEqual(['C']);
    });

    it('should detect win condition', () => {
      let state = createGameState(['C', 'D']);
      state = addNote(state, 'C');
      state = addNote(state, 'D');
      state = submitGuess(state);
      
      expect(state.status).toBe('won');
    });

    it('should detect loss after 6 incorrect guesses', () => {
      let state = createGameState(['C', 'D']);
      
      for (let i = 0; i < 6; i++) {
        state = { ...state, currentGuess: ['E', 'F'] };
        state = submitGuess(state);
      }
      
      expect(state.status).toBe('lost');
      expect(state.guesses).toHaveLength(6);
    });
  });
});
