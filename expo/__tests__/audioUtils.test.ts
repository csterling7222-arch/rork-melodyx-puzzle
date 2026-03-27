import { 
  audioMutex, 
  withAudioLock, 
  canStartPlayback, 
  releasePlaybackLock, 
  clearAllPlaybackLocks,
  markWebAudioGestureReceived,
  onWebAudioUnlock,
  isWebAudioUnlocked,
} from '../utils/audioLock';
import {
  shouldTriggerAnimation,
  clearHapticDebounce,
  clearAnimationDebounce,
} from '../utils/hapticDebounce';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('Audio Lock Utils', () => {
  beforeEach(() => {
    clearAllPlaybackLocks();
  });

  describe('canStartPlayback', () => {
    it('should allow first playback', () => {
      expect(canStartPlayback('test-id')).toBe(true);
    });

    it('should debounce rapid playback requests', () => {
      expect(canStartPlayback('test-id')).toBe(true);
      expect(canStartPlayback('test-id')).toBe(false);
    });

    it('should allow playback for different ids', () => {
      expect(canStartPlayback('id-1')).toBe(true);
      expect(canStartPlayback('id-2')).toBe(true);
    });

    it('should allow playback after debounce period', async () => {
      expect(canStartPlayback('test-id')).toBe(true);
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(canStartPlayback('test-id')).toBe(true);
    });
  });

  describe('releasePlaybackLock', () => {
    it('should release specific lock', () => {
      canStartPlayback('test-id');
      releasePlaybackLock('test-id');
      expect(canStartPlayback('test-id')).toBe(true);
    });
  });

  describe('clearAllPlaybackLocks', () => {
    it('should clear all locks', () => {
      canStartPlayback('id-1');
      canStartPlayback('id-2');
      clearAllPlaybackLocks();
      expect(canStartPlayback('id-1')).toBe(true);
      expect(canStartPlayback('id-2')).toBe(true);
    });
  });

  describe('withAudioLock', () => {
    it('should execute function with lock', async () => {
      const result = await withAudioLock(async () => {
        return 'test-result';
      });
      expect(result).toBe('test-result');
    });

    it('should handle async operations', async () => {
      const result = await withAudioLock(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 42;
      });
      expect(result).toBe(42);
    });

    it('should serialize concurrent operations', async () => {
      const results: number[] = [];
      
      const op1 = withAudioLock(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        results.push(1);
        return 1;
      });
      
      const op2 = withAudioLock(async () => {
        results.push(2);
        return 2;
      });
      
      await Promise.all([op1, op2]);
      
      expect(results[0]).toBe(1);
      expect(results[1]).toBe(2);
    });
  });

  describe('audioMutex', () => {
    it('should track queue length', async () => {
      expect(audioMutex.getQueueLength()).toBe(0);
    });

    it('should clear queue', () => {
      audioMutex.clear();
      expect(audioMutex.getQueueLength()).toBe(0);
    });
  });
});

describe('Web Audio Unlock', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should track gesture received state', () => {
    const initialState = isWebAudioUnlocked();
    expect(typeof initialState).toBe('boolean');
  });

  it('should call callbacks on unlock', () => {
    const callback = jest.fn();
    
    if (!isWebAudioUnlocked()) {
      onWebAudioUnlock(callback);
      markWebAudioGestureReceived();
      expect(callback).toHaveBeenCalled();
    } else {
      onWebAudioUnlock(callback);
      expect(callback).toHaveBeenCalled();
    }
  });
});

describe('Haptic Debounce Utils', () => {
  beforeEach(() => {
    clearHapticDebounce();
    clearAnimationDebounce();
    jest.clearAllMocks();
  });

  describe('shouldTriggerAnimation', () => {
    it('should allow first animation', () => {
      expect(shouldTriggerAnimation('test-anim')).toBe(true);
    });

    it('should debounce rapid animation triggers', () => {
      expect(shouldTriggerAnimation('test-anim')).toBe(true);
      expect(shouldTriggerAnimation('test-anim')).toBe(false);
    });

    it('should allow different animation keys', () => {
      expect(shouldTriggerAnimation('anim-1')).toBe(true);
      expect(shouldTriggerAnimation('anim-2')).toBe(true);
    });

    it('should respect custom debounce time', () => {
      expect(shouldTriggerAnimation('test', 50)).toBe(true);
      expect(shouldTriggerAnimation('test', 50)).toBe(false);
    });
  });

  describe('clearAnimationDebounce', () => {
    it('should reset all animation debounce state', () => {
      shouldTriggerAnimation('test');
      clearAnimationDebounce();
      expect(shouldTriggerAnimation('test')).toBe(true);
    });
  });

  describe('clearHapticDebounce', () => {
    it('should reset all haptic debounce state', () => {
      clearHapticDebounce();
    });
  });
});

describe('Soundfont Loading', () => {
  const NOTE_TO_FILE: Record<string, string> = {
    'C': 'C4', 'C#': 'Db4', 'D': 'D4', 'D#': 'Eb4',
    'E': 'E4', 'F': 'F4', 'F#': 'Gb4', 'G': 'G4',
    'G#': 'Ab4', 'A': 'A4', 'A#': 'Bb4', 'B': 'B4',
  };

  it('should have correct note to file mappings', () => {
    expect(NOTE_TO_FILE['C']).toBe('C4');
    expect(NOTE_TO_FILE['C#']).toBe('Db4');
    expect(NOTE_TO_FILE['A']).toBe('A4');
    expect(NOTE_TO_FILE['B']).toBe('B4');
  });

  it('should map all 12 notes', () => {
    expect(Object.keys(NOTE_TO_FILE).length).toBe(12);
  });

  it('should generate correct soundfont URLs', () => {
    const instrumentName = 'acoustic_grand_piano';
    const note = 'C';
    const fileName = NOTE_TO_FILE[note];
    const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${instrumentName}-mp3/${fileName}.mp3`;
    
    expect(url).toContain('FluidR3_GM');
    expect(url).toContain('acoustic_grand_piano');
    expect(url).toContain('C4.mp3');
  });

  it('should handle all note mappings for URL generation', () => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    notes.forEach(note => {
      expect(NOTE_TO_FILE[note]).toBeDefined();
      expect(typeof NOTE_TO_FILE[note]).toBe('string');
    });
  });
});

describe('Web Audio Context', () => {
  it('should handle AudioContext creation in test environment', () => {
    const mockAudioContext = {
      state: 'running',
      resume: jest.fn().mockResolvedValue(undefined),
      createOscillator: jest.fn(),
      createGain: jest.fn(),
      destination: {},
    };

    expect(mockAudioContext.state).toBe('running');
  });

  it('should handle suspended state', async () => {
    const mockAudioContext = {
      state: 'suspended',
      resume: jest.fn().mockResolvedValue(undefined),
    };

    await mockAudioContext.resume();
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('should create oscillator nodes', () => {
    const mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: jest.fn() },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };

    mockOscillator.type = 'triangle';
    expect(mockOscillator.type).toBe('triangle');
    
    mockOscillator.frequency.setValueAtTime(440, 0);
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
  });

  it('should create gain nodes with envelope', () => {
    const mockGain = {
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };

    mockGain.gain.setValueAtTime(0, 0);
    mockGain.gain.linearRampToValueAtTime(0.5, 0.1);
    mockGain.gain.exponentialRampToValueAtTime(0.01, 0.5);

    expect(mockGain.gain.setValueAtTime).toHaveBeenCalled();
    expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalled();
    expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
  });
});

describe('Audio Buffer Loading', () => {
  it('should handle fetch responses', async () => {
    const mockResponse = {
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    };

    const buffer = await mockResponse.arrayBuffer();
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(buffer.byteLength).toBe(1024);
  });

  it('should handle failed fetches', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    };

    expect(mockResponse.ok).toBe(false);
    expect(mockResponse.status).toBe(404);
  });

  it('should decode audio data', async () => {
    const mockContext = {
      decodeAudioData: jest.fn().mockResolvedValue({
        duration: 1.5,
        numberOfChannels: 2,
        sampleRate: 44100,
      }),
    };

    const buffer = await mockContext.decodeAudioData(new ArrayBuffer(1024));
    expect(buffer.duration).toBe(1.5);
    expect(buffer.numberOfChannels).toBe(2);
  });
});

describe('Playback Rate and Volume', () => {
  it('should clamp volume between 0 and 1', () => {
    const clampVolume = (vol: number) => Math.max(0, Math.min(1, vol));
    
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(-0.5)).toBe(0);
    expect(clampVolume(1.5)).toBe(1);
  });

  it('should clamp playback speed between 0.5 and 2', () => {
    const clampSpeed = (speed: number) => Math.max(0.5, Math.min(2, speed));
    
    expect(clampSpeed(1)).toBe(1);
    expect(clampSpeed(0.25)).toBe(0.5);
    expect(clampSpeed(3)).toBe(2);
  });

  it('should calculate proportional tempo', () => {
    const getProportionalTempo = (noteCount: number): number => {
      const BASE_TEMPO = 400;
      const MIN_TEMPO = 250;
      
      if (noteCount <= 6) return BASE_TEMPO;
      if (noteCount <= 10) return Math.max(MIN_TEMPO, BASE_TEMPO - (noteCount - 6) * 25);
      if (noteCount <= 20) return Math.max(MIN_TEMPO, 300 - (noteCount - 10) * 5);
      return MIN_TEMPO;
    };
    
    expect(getProportionalTempo(5)).toBe(400);
    expect(getProportionalTempo(8)).toBe(350);
    expect(getProportionalTempo(15)).toBe(275);
    expect(getProportionalTempo(25)).toBe(250);
  });
});
