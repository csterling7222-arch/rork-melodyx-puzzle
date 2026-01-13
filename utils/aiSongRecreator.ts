import { NOTE_SCALE } from '@/utils/melodies';

export type RhythmPreset = 'straight' | 'swing' | 'dotted' | 'syncopated' | 'triplet';
export type TempoVariant = 'slow' | 'medium' | 'fast' | 'very_fast';
export type StyleVariant = 'original' | 'jazzy' | 'rock' | 'classical' | 'electronic';

export interface RhythmSettings {
  preset: RhythmPreset;
  swingAmount: number;
  noteDensity: number;
  accentPattern: number[];
}

export interface MelodyVariant {
  id: string;
  name: string;
  description: string;
  notes: string[];
  durations: number[];
  tempo: number;
  style: StyleVariant;
  rhythmPreset: RhythmPreset;
  swingAmount: number;
}

export const RHYTHM_PRESETS: Record<RhythmPreset, { name: string; icon: string; description: string; baseDurations: number[] }> = {
  straight: {
    name: 'Straight',
    icon: '➡️',
    description: 'Even, consistent timing',
    baseDurations: [0.5, 0.5, 0.5, 0.5],
  },
  swing: {
    name: 'Swing',
    icon: '🎷',
    description: 'Jazz-style bounce',
    baseDurations: [0.67, 0.33, 0.67, 0.33],
  },
  dotted: {
    name: 'Dotted',
    icon: '⏸️',
    description: 'Long-short pattern',
    baseDurations: [0.75, 0.25, 0.75, 0.25],
  },
  syncopated: {
    name: 'Syncopated',
    icon: '⚡',
    description: 'Off-beat accents',
    baseDurations: [0.25, 0.5, 0.25, 0.5, 0.5],
  },
  triplet: {
    name: 'Triplet',
    icon: '🎵',
    description: 'Three notes per beat',
    baseDurations: [0.33, 0.33, 0.34, 0.33, 0.33, 0.34],
  },
};

export const TEMPO_OPTIONS: Record<TempoVariant, { name: string; bpm: number; icon: string }> = {
  slow: { name: 'Slow', bpm: 60, icon: '🐢' },
  medium: { name: 'Medium', bpm: 100, icon: '🚶' },
  fast: { name: 'Fast', bpm: 140, icon: '🏃' },
  very_fast: { name: 'Very Fast', bpm: 180, icon: '⚡' },
};

export const STYLE_OPTIONS: Record<StyleVariant, { name: string; icon: string; color: string }> = {
  original: { name: 'Original', icon: '🎵', color: '#10B981' },
  jazzy: { name: 'Jazzy', icon: '🎷', color: '#F59E0B' },
  rock: { name: 'Rock', icon: '🎸', color: '#EF4444' },
  classical: { name: 'Classical', icon: '🎻', color: '#8B5CF6' },
  electronic: { name: 'Electronic', icon: '🎧', color: '#06B6D4' },
};

function applySwing(durations: number[], swingAmount: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < durations.length; i++) {
    if (i % 2 === 0) {
      result.push(durations[i] * (1 + swingAmount * 0.5));
    } else {
      result.push(durations[i] * (1 - swingAmount * 0.3));
    }
  }
  return result;
}

function generateDurationsForPreset(noteCount: number, preset: RhythmPreset, swingAmount: number): number[] {
  const baseDurations = RHYTHM_PRESETS[preset].baseDurations;
  const durations: number[] = [];
  
  for (let i = 0; i < noteCount; i++) {
    durations.push(baseDurations[i % baseDurations.length]);
  }
  
  if (preset === 'swing' || swingAmount > 0) {
    return applySwing(durations, swingAmount);
  }
  
  return durations;
}

function transposeNote(note: string, semitones: number): string {
  const noteIndex = NOTE_SCALE.indexOf(note);
  if (noteIndex === -1) return note;
  const newIndex = (noteIndex + semitones + NOTE_SCALE.length) % NOTE_SCALE.length;
  return NOTE_SCALE[newIndex];
}

function applyStyleTransformation(notes: string[], style: StyleVariant): string[] {
  switch (style) {
    case 'jazzy':
      return notes.map((note, i) => {
        if (i % 4 === 2) {
          return transposeNote(note, Math.random() > 0.5 ? 1 : -1);
        }
        return note;
      });
    
    case 'rock':
      return notes.map((note, i) => {
        if (i % 2 === 0) {
          return transposeNote(note, -2);
        }
        return note;
      });
    
    case 'classical':
      return notes.map((note, i) => {
        if (i > 0 && i < notes.length - 1) {
          const prevIndex = NOTE_SCALE.indexOf(notes[i - 1]);
          const currIndex = NOTE_SCALE.indexOf(note);
          if (Math.abs(prevIndex - currIndex) > 3) {
            return transposeNote(note, prevIndex > currIndex ? 1 : -1);
          }
        }
        return note;
      });
    
    case 'electronic':
      return notes.map((note, i) => {
        if (i % 3 === 0) {
          return transposeNote(note, 12);
        }
        return note;
      });
    
    default:
      return [...notes];
  }
}

export function generateMelodyVariants(
  originalNotes: string[],
  originalDurations?: number[]
): MelodyVariant[] {
  const variants: MelodyVariant[] = [];
  const baseId = Date.now().toString(36);
  
  const defaultDurations = originalDurations || originalNotes.map(() => 0.5);
  
  variants.push({
    id: `${baseId}-original`,
    name: 'Original',
    description: 'Your melody as composed',
    notes: [...originalNotes],
    durations: [...defaultDurations],
    tempo: 100,
    style: 'original',
    rhythmPreset: 'straight',
    swingAmount: 0,
  });
  
  variants.push({
    id: `${baseId}-swing`,
    name: 'Swing Groove',
    description: 'Jazz-inspired swing feel',
    notes: applyStyleTransformation(originalNotes, 'jazzy'),
    durations: generateDurationsForPreset(originalNotes.length, 'swing', 0.6),
    tempo: 90,
    style: 'jazzy',
    rhythmPreset: 'swing',
    swingAmount: 0.6,
  });
  
  variants.push({
    id: `${baseId}-energetic`,
    name: 'Energetic Rock',
    description: 'Fast-paced rock style',
    notes: applyStyleTransformation(originalNotes, 'rock'),
    durations: generateDurationsForPreset(originalNotes.length, 'syncopated', 0.2),
    tempo: 140,
    style: 'rock',
    rhythmPreset: 'syncopated',
    swingAmount: 0.2,
  });
  
  return variants;
}

export function generateCustomVariant(
  notes: string[],
  rhythmPreset: RhythmPreset,
  swingAmount: number,
  tempo: number,
  style: StyleVariant
): MelodyVariant {
  const transformedNotes = style === 'original' ? [...notes] : applyStyleTransformation(notes, style);
  const durations = generateDurationsForPreset(notes.length, rhythmPreset, swingAmount);
  
  return {
    id: `custom-${Date.now().toString(36)}`,
    name: `${STYLE_OPTIONS[style].name} ${RHYTHM_PRESETS[rhythmPreset].name}`,
    description: `Custom ${style} style with ${rhythmPreset} rhythm`,
    notes: transformedNotes,
    durations,
    tempo,
    style,
    rhythmPreset,
    swingAmount,
  };
}

export function calculatePlaybackTiming(durations: number[], tempo: number): number[] {
  const msPerBeat = (60 / tempo) * 1000;
  return durations.map(d => d * msPerBeat);
}

export function getVariantPreviewDescription(variant: MelodyVariant): string {
  const tempoDesc = variant.tempo < 80 ? 'slow' : variant.tempo < 120 ? 'medium' : 'fast';
  const styleDesc = STYLE_OPTIONS[variant.style].name.toLowerCase();
  const rhythmDesc = RHYTHM_PRESETS[variant.rhythmPreset].name.toLowerCase();
  return `A ${tempoDesc} ${styleDesc} rendition with ${rhythmDesc} rhythm`;
}

export const DEFAULT_RHYTHM_SETTINGS: RhythmSettings = {
  preset: 'straight',
  swingAmount: 0,
  noteDensity: 1.0,
  accentPattern: [1, 0.7, 0.8, 0.7],
};
