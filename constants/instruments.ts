export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  reverb: number;
  delay: number;
  distortion: number;
  chorus: number;
  eq: {
    bass: number;
    mid: number;
    treble: number;
  };
  amp?: string;
  pedals?: string[];
}

export interface AITonePreset {
  id: string;
  name: string;
  description: string;
  genre: string;
  mood: string;
  isPremium: boolean;
  baseEffects: string;
  icon: string;
}

export interface InstrumentTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPremium: boolean;
  videoUrl?: string;
  steps: string[];
}

export interface SoundBank {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  samples: number;
  quality: 'standard' | 'high' | 'studio';
}

export interface Instrument {
  id: string;
  name: string;
  icon: string;
  midiProgram: number;
  soundfontName: string;
  isPremium: boolean;
  description: string;
  waveType: OscillatorType;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
  effectPresets: EffectPreset[];
  aiTonePresets: AITonePreset[];
  tutorials: InstrumentTutorial[];
  soundBanks: SoundBank[];
  features: string[];
}

export type InstrumentTier = 'free' | 'premium';

const PIANO_EFFECTS: EffectPreset[] = [
  {
    id: 'piano_clean',
    name: 'Clean',
    description: 'Pure acoustic piano sound',
    isPremium: false,
    reverb: 0.2,
    delay: 0,
    distortion: 0,
    chorus: 0,
    eq: { bass: 0, mid: 0, treble: 0 },
  },
  {
    id: 'piano_concert',
    name: 'Concert Hall',
    description: 'Rich reverb like a grand concert hall',
    isPremium: false,
    reverb: 0.6,
    delay: 0.1,
    distortion: 0,
    chorus: 0.1,
    eq: { bass: 0.1, mid: 0, treble: 0.15 },
  },
  {
    id: 'piano_jazz',
    name: 'Jazz Club',
    description: 'Warm, intimate jazz piano tone',
    isPremium: true,
    reverb: 0.35,
    delay: 0.05,
    distortion: 0,
    chorus: 0.15,
    eq: { bass: 0.2, mid: 0.1, treble: -0.1 },
  },
  {
    id: 'piano_cinematic',
    name: 'Cinematic',
    description: 'Epic, dramatic piano for film scores',
    isPremium: true,
    reverb: 0.8,
    delay: 0.2,
    distortion: 0,
    chorus: 0.2,
    eq: { bass: 0.3, mid: 0.1, treble: 0.2 },
  },
];

const GUITAR_EFFECTS: EffectPreset[] = [
  {
    id: 'guitar_acoustic',
    name: 'Acoustic',
    description: 'Natural acoustic guitar sound',
    isPremium: false,
    reverb: 0.15,
    delay: 0,
    distortion: 0,
    chorus: 0,
    eq: { bass: 0, mid: 0.1, treble: 0.1 },
  },
  {
    id: 'guitar_fingerpick',
    name: 'Fingerpicking',
    description: 'Soft, delicate fingerstyle tone',
    isPremium: false,
    reverb: 0.25,
    delay: 0.05,
    distortion: 0,
    chorus: 0.1,
    eq: { bass: -0.1, mid: 0.15, treble: 0.2 },
  },
  {
    id: 'guitar_blues',
    name: 'Blues',
    description: 'Warm, soulful blues guitar',
    isPremium: true,
    reverb: 0.3,
    delay: 0.1,
    distortion: 0.2,
    chorus: 0.05,
    eq: { bass: 0.2, mid: 0.2, treble: 0 },
    amp: 'Tube Amp',
    pedals: ['Overdrive'],
  },
  {
    id: 'guitar_rock',
    name: 'Rock',
    description: 'Punchy rock guitar with bite',
    isPremium: true,
    reverb: 0.2,
    delay: 0.08,
    distortion: 0.4,
    chorus: 0,
    eq: { bass: 0.3, mid: 0.3, treble: 0.2 },
    amp: 'Marshall Stack',
    pedals: ['Distortion', 'Compressor'],
  },
];

const BASS_EFFECTS: EffectPreset[] = [
  {
    id: 'bass_clean',
    name: 'Clean Finger',
    description: 'Classic clean fingerstyle bass',
    isPremium: false,
    reverb: 0.1,
    delay: 0,
    distortion: 0,
    chorus: 0,
    eq: { bass: 0.3, mid: 0, treble: -0.1 },
  },
  {
    id: 'bass_vintage',
    name: 'Vintage Blues',
    description: 'Warm, round 60s-70s bass tone',
    isPremium: true,
    reverb: 0.15,
    delay: 0,
    distortion: 0.1,
    chorus: 0,
    eq: { bass: 0.4, mid: 0.2, treble: -0.2 },
    amp: 'Ampeg SVT',
  },
  {
    id: 'bass_slap',
    name: 'Slap Funk',
    description: 'Punchy slap bass for funk grooves',
    isPremium: true,
    reverb: 0.1,
    delay: 0,
    distortion: 0.15,
    chorus: 0.1,
    eq: { bass: 0.2, mid: -0.1, treble: 0.4 },
    amp: 'Markbass',
    pedals: ['Compressor', 'Envelope Filter'],
  },
  {
    id: 'bass_metal',
    name: 'Metal Growl',
    description: 'Aggressive, distorted bass for metal',
    isPremium: true,
    reverb: 0.05,
    delay: 0,
    distortion: 0.6,
    chorus: 0,
    eq: { bass: 0.5, mid: 0.4, treble: 0.3 },
    amp: 'Darkglass',
    pedals: ['Overdrive', 'Gate'],
  },
  {
    id: 'bass_reggae',
    name: 'Dub Reggae',
    description: 'Deep, dubby reggae bass',
    isPremium: true,
    reverb: 0.4,
    delay: 0.3,
    distortion: 0,
    chorus: 0,
    eq: { bass: 0.6, mid: -0.2, treble: -0.3 },
  },
];

const DRUMS_EFFECTS: EffectPreset[] = [
  {
    id: 'drums_acoustic',
    name: 'Acoustic Kit',
    description: 'Natural acoustic drum sound',
    isPremium: false,
    reverb: 0.25,
    delay: 0,
    distortion: 0,
    chorus: 0,
    eq: { bass: 0.1, mid: 0.1, treble: 0.1 },
  },
  {
    id: 'drums_rock',
    name: 'Rock Stadium',
    description: 'Big, roomy rock drums',
    isPremium: true,
    reverb: 0.5,
    delay: 0.1,
    distortion: 0.1,
    chorus: 0,
    eq: { bass: 0.3, mid: 0.2, treble: 0.2 },
  },
  {
    id: 'drums_electronic',
    name: 'Electronic',
    description: 'Punchy electronic drum machine',
    isPremium: true,
    reverb: 0.15,
    delay: 0.2,
    distortion: 0.2,
    chorus: 0.1,
    eq: { bass: 0.4, mid: 0, treble: 0.3 },
  },
  {
    id: 'drums_jazz',
    name: 'Jazz Brush',
    description: 'Soft brush kit for jazz',
    isPremium: true,
    reverb: 0.3,
    delay: 0.05,
    distortion: 0,
    chorus: 0,
    eq: { bass: 0, mid: 0.2, treble: 0.1 },
  },
  {
    id: 'drums_fever',
    name: 'Epic Fever Boss',
    description: 'Thunderous drums for Fever mode battles',
    isPremium: true,
    reverb: 0.7,
    delay: 0.15,
    distortion: 0.3,
    chorus: 0.1,
    eq: { bass: 0.5, mid: 0.3, treble: 0.4 },
  },
];

const SYNTH_EFFECTS: EffectPreset[] = [
  {
    id: 'synth_pad',
    name: 'Ambient Pad',
    description: 'Lush, evolving ambient pad',
    isPremium: false,
    reverb: 0.7,
    delay: 0.3,
    distortion: 0,
    chorus: 0.4,
    eq: { bass: 0.1, mid: 0.1, treble: 0.2 },
  },
  {
    id: 'synth_lead',
    name: 'Synth Lead',
    description: 'Cutting lead synth for melodies',
    isPremium: true,
    reverb: 0.3,
    delay: 0.15,
    distortion: 0.2,
    chorus: 0.2,
    eq: { bass: 0, mid: 0.3, treble: 0.4 },
  },
  {
    id: 'synth_retro',
    name: 'Retro 80s',
    description: 'Classic 80s synth sounds',
    isPremium: true,
    reverb: 0.4,
    delay: 0.25,
    distortion: 0.1,
    chorus: 0.5,
    eq: { bass: 0.2, mid: 0.2, treble: 0.3 },
  },
  {
    id: 'synth_dubstep',
    name: 'Dubstep Wobble',
    description: 'Heavy wobble bass for EDM',
    isPremium: true,
    reverb: 0.2,
    delay: 0.1,
    distortion: 0.5,
    chorus: 0.3,
    eq: { bass: 0.6, mid: 0.4, treble: 0.2 },
  },
  {
    id: 'synth_chill',
    name: 'Lo-Fi Chill',
    description: 'Warm, nostalgic lo-fi vibes',
    isPremium: true,
    reverb: 0.5,
    delay: 0.2,
    distortion: 0.05,
    chorus: 0.3,
    eq: { bass: 0.3, mid: 0, treble: -0.2 },
  },
];

const AI_TONE_PRESETS: Record<string, AITonePreset[]> = {
  piano: [
    { id: 'ai_piano_classical', name: 'Classical Master', description: 'AI-crafted tone inspired by Chopin', genre: 'Classical', mood: 'Elegant', isPremium: true, baseEffects: 'piano_concert', icon: '🎹' },
    { id: 'ai_piano_emotional', name: 'Emotional Ballad', description: 'Heart-touching piano for slow songs', genre: 'Pop', mood: 'Emotional', isPremium: true, baseEffects: 'piano_cinematic', icon: '💝' },
  ],
  guitar: [
    { id: 'ai_guitar_campfire', name: 'Campfire Acoustic', description: 'Cozy, warm campfire guitar vibes', genre: 'Folk', mood: 'Relaxed', isPremium: true, baseEffects: 'guitar_fingerpick', icon: '🔥' },
    { id: 'ai_guitar_shred', name: 'Metal Shredder', description: 'High-gain tone for fast solos', genre: 'Metal', mood: 'Aggressive', isPremium: true, baseEffects: 'guitar_rock', icon: '🤘' },
  ],
  bass: [
    { id: 'ai_bass_groove', name: 'Groove Master', description: 'Funky bass AI preset for grooves', genre: 'Funk', mood: 'Groovy', isPremium: true, baseEffects: 'bass_slap', icon: '🕺' },
    { id: 'ai_bass_vintage_blues', name: 'Vintage Blues Bass', description: 'AI tone inspired by Motown legends', genre: 'Blues', mood: 'Soulful', isPremium: true, baseEffects: 'bass_vintage', icon: '🎷' },
  ],
  drums: [
    { id: 'ai_drums_pocket', name: 'Pocket Groove', description: 'Tight, in-the-pocket drumming', genre: 'R&B', mood: 'Smooth', isPremium: true, baseEffects: 'drums_acoustic', icon: '🥁' },
    { id: 'ai_drums_epic_fever', name: 'Epic Fever Boss Kit', description: 'Thunderous drums for Fever bosses', genre: 'Epic', mood: 'Intense', isPremium: true, baseEffects: 'drums_fever', icon: '⚡' },
  ],
  synth: [
    { id: 'ai_synth_space', name: 'Space Explorer', description: 'Cosmic synth textures', genre: 'Ambient', mood: 'Dreamy', isPremium: true, baseEffects: 'synth_pad', icon: '🚀' },
    { id: 'ai_synth_retro_wave', name: 'Retro Wave', description: 'Synthwave inspired 80s tone', genre: 'Synthwave', mood: 'Nostalgic', isPremium: true, baseEffects: 'synth_retro', icon: '🌆' },
  ],
};

const INSTRUMENT_TUTORIALS: Record<string, InstrumentTutorial[]> = {
  piano: [
    { id: 'piano_basics', title: 'Piano Basics', description: 'Learn hand position and basic scales', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Place fingers on home row', 'Practice C major scale', 'Try simple melody'] },
    { id: 'piano_chords', title: 'Essential Chords', description: 'Master major and minor chords', duration: '10 min', difficulty: 'intermediate', isPremium: true, steps: ['Learn chord shapes', 'Practice transitions', 'Play chord progressions'] },
    { id: 'piano_advanced', title: 'Advanced Techniques', description: 'Arpeggios, runs, and expression', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['Arpeggio patterns', 'Dynamic control', 'Pedal techniques'] },
  ],
  guitar: [
    { id: 'guitar_basics', title: 'Guitar Fundamentals', description: 'Strumming and basic chords', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Hold the guitar', 'Basic strumming', 'Open chords'] },
    { id: 'guitar_fingerpicking', title: 'Fingerpicking Mastery', description: 'Beautiful fingerstyle patterns', duration: '12 min', difficulty: 'intermediate', isPremium: true, steps: ['Thumb technique', 'Pattern practice', 'Song application'] },
    { id: 'guitar_solos', title: 'Solo Techniques', description: 'Bends, slides, and vibrato', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['Bending notes', 'Slides and hammer-ons', 'Vibrato control'] },
  ],
  bass: [
    { id: 'bass_fundamentals', title: 'Bass Fundamentals', description: 'Root notes and basic grooves', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Finger placement', 'Root note patterns', 'Simple bass lines'] },
    { id: 'bass_slap', title: 'Slap Bass Workshop', description: 'Funk slap and pop techniques', duration: '12 min', difficulty: 'intermediate', isPremium: true, steps: ['Thumb slap', 'Finger pop', 'Funk patterns'] },
    { id: 'bass_walking', title: 'Walking Bass Lines', description: 'Jazz walking bass mastery', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['Chord tones', 'Passing notes', 'Jazz standards'] },
  ],
  drums: [
    { id: 'drums_basics', title: 'Drum Kit Basics', description: 'Basic beats and fills', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Basic rock beat', 'Simple fills', 'Timing exercises'] },
    { id: 'drums_grooves', title: 'Genre Grooves', description: 'Rock, funk, and jazz patterns', duration: '12 min', difficulty: 'intermediate', isPremium: true, steps: ['Rock patterns', 'Funk grooves', 'Jazz brushes'] },
    { id: 'drums_advanced', title: 'Advanced Drumming', description: 'Complex fills and polyrhythms', duration: '18 min', difficulty: 'advanced', isPremium: true, steps: ['Double bass', 'Polyrhythms', 'Odd time signatures'] },
  ],
  synth: [
    { id: 'synth_basics', title: 'Synth Fundamentals', description: 'Oscillators and basic sound design', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Waveforms', 'Filters', 'Envelope basics'] },
    { id: 'synth_sound_design', title: 'Sound Design', description: 'Create unique synth patches', duration: '15 min', difficulty: 'intermediate', isPremium: true, steps: ['Modulation', 'LFOs', 'Effects chains'] },
    { id: 'synth_production', title: 'Production Techniques', description: 'Layer and arrange synths', duration: '20 min', difficulty: 'advanced', isPremium: true, steps: ['Layering', 'Automation', 'Mixing synths'] },
  ],
};

const SOUND_BANKS: Record<string, SoundBank[]> = {
  piano: [
    { id: 'piano_standard', name: 'Standard Piano', description: 'Quality acoustic piano samples', isPremium: false, samples: 88, quality: 'standard' },
    { id: 'piano_grand', name: 'Concert Grand', description: 'Steinway D concert grand', isPremium: true, samples: 176, quality: 'studio' },
  ],
  guitar: [
    { id: 'guitar_standard', name: 'Acoustic Steel', description: 'Steel string acoustic', isPremium: false, samples: 72, quality: 'standard' },
    { id: 'guitar_collection', name: 'Guitar Collection', description: 'Multiple guitar types', isPremium: true, samples: 288, quality: 'studio' },
  ],
  bass: [
    { id: 'bass_standard', name: 'Electric Bass', description: 'Fender-style electric bass', isPremium: false, samples: 48, quality: 'standard' },
    { id: 'bass_premium', name: 'Bass Arsenal', description: 'Multi-bass collection', isPremium: true, samples: 192, quality: 'studio' },
  ],
  drums: [
    { id: 'drums_standard', name: 'Basic Kit', description: 'Standard drum kit', isPremium: false, samples: 24, quality: 'standard' },
    { id: 'drums_premium', name: 'Pro Drum Collection', description: 'Multiple kits and cymbals', isPremium: true, samples: 256, quality: 'studio' },
  ],
  synth: [
    { id: 'synth_standard', name: 'Basic Synths', description: 'Essential synth sounds', isPremium: false, samples: 36, quality: 'standard' },
    { id: 'synth_premium', name: 'Synth Universe', description: 'Massive synth library', isPremium: true, samples: 512, quality: 'studio' },
  ],
};

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'piano',
    name: 'Piano',
    icon: 'Piano',
    midiProgram: 0,
    soundfontName: 'acoustic_grand_piano',
    isPremium: false,
    description: 'Classic grand piano sound',
    waveType: 'sine',
    attackTime: 0.01,
    decayTime: 0.3,
    sustainLevel: 0.4,
    releaseTime: 0.3,
    effectPresets: PIANO_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.piano,
    tutorials: INSTRUMENT_TUTORIALS.piano,
    soundBanks: SOUND_BANKS.piano,
    features: ['Clean sound', 'Concert hall reverb', '88-key range'],
  },
  {
    id: 'guitar',
    name: 'Guitar',
    icon: 'Guitar',
    midiProgram: 25,
    soundfontName: 'acoustic_guitar_steel',
    isPremium: false,
    description: 'Warm acoustic guitar tones',
    waveType: 'triangle',
    attackTime: 0.005,
    decayTime: 0.4,
    sustainLevel: 0.3,
    releaseTime: 0.4,
    effectPresets: GUITAR_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.guitar,
    tutorials: INSTRUMENT_TUTORIALS.guitar,
    soundBanks: SOUND_BANKS.guitar,
    features: ['Natural tone', 'Fingerpicking style', 'Strumming patterns'],
  },
  {
    id: 'bass',
    name: 'Bass',
    icon: 'Activity',
    midiProgram: 33,
    soundfontName: 'electric_bass_finger',
    isPremium: true,
    description: 'Deep electric bass with premium effects',
    waveType: 'sine',
    attackTime: 0.02,
    decayTime: 0.5,
    sustainLevel: 0.6,
    releaseTime: 0.2,
    effectPresets: BASS_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.bass,
    tutorials: INSTRUMENT_TUTORIALS.bass,
    soundBanks: SOUND_BANKS.bass,
    features: ['Slap bass', 'Vintage blues tone', 'Metal growl', 'Reggae dub', 'Multi-effect chains'],
  },
  {
    id: 'drums',
    name: 'Drums',
    icon: 'Disc',
    midiProgram: 118,
    soundfontName: 'synth_drum',
    isPremium: true,
    description: 'Pro drum kit with epic Fever boss sounds',
    waveType: 'square',
    attackTime: 0.001,
    decayTime: 0.15,
    sustainLevel: 0.1,
    releaseTime: 0.1,
    effectPresets: DRUMS_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.drums,
    tutorials: INSTRUMENT_TUTORIALS.drums,
    soundBanks: SOUND_BANKS.drums,
    features: ['Rock stadium', 'Electronic kit', 'Jazz brushes', 'Epic Fever mode', 'Multi-kit collection'],
  },
  {
    id: 'synth',
    name: 'Keyboard',
    icon: 'Waves',
    midiProgram: 81,
    soundfontName: 'lead_1_square',
    isPremium: true,
    description: 'Smooth synthesizer with advanced sound design',
    waveType: 'sawtooth',
    attackTime: 0.05,
    decayTime: 0.2,
    sustainLevel: 0.7,
    releaseTime: 0.5,
    effectPresets: SYNTH_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.synth,
    tutorials: INSTRUMENT_TUTORIALS.synth,
    soundBanks: SOUND_BANKS.synth,
    features: ['Ambient pads', 'Synth leads', 'Retro 80s', 'Dubstep wobble', 'Lo-fi chill'],
  },
];

export interface UserPreset {
  id: string;
  name: string;
  instrumentId: string;
  baseEffectId: string;
  customizations: {
    reverb?: number;
    delay?: number;
    distortion?: number;
    chorus?: number;
    eq?: { bass: number; mid: number; treble: number };
  };
  createdAt: string;
  isShared: boolean;
  shareCode?: string;
  likes: number;
}

export interface InstrumentBundle {
  id: string;
  name: string;
  description: string;
  instruments: string[];
  effectPacks: string[];
  soundBanks: string[];
  originalPrice: number;
  bundlePrice: number;
  savings: number;
  icon: string;
  featured: boolean;
}

export const INSTRUMENT_BUNDLES: InstrumentBundle[] = [
  {
    id: 'starter_pack',
    name: 'Starter Pack',
    description: 'Perfect for beginners - Piano & Guitar enhanced',
    instruments: ['piano', 'guitar'],
    effectPacks: ['piano_jazz', 'guitar_blues'],
    soundBanks: ['piano_grand'],
    originalPrice: 4.99,
    bundlePrice: 2.99,
    savings: 40,
    icon: '🎵',
    featured: false,
  },
  {
    id: 'full_band',
    name: 'Full Band Suite',
    description: 'All 5 instruments with premium effects',
    instruments: ['piano', 'guitar', 'bass', 'drums', 'synth'],
    effectPacks: ['all_premium_effects'],
    soundBanks: ['all_premium_banks'],
    originalPrice: 14.99,
    bundlePrice: 7.99,
    savings: 47,
    icon: '🎸',
    featured: true,
  },
  {
    id: 'rock_pack',
    name: 'Rock Master Pack',
    description: 'Guitar, Bass, Drums with rock effects',
    instruments: ['guitar', 'bass', 'drums'],
    effectPacks: ['guitar_rock', 'bass_metal', 'drums_rock'],
    soundBanks: ['guitar_collection', 'bass_premium', 'drums_premium'],
    originalPrice: 9.99,
    bundlePrice: 5.99,
    savings: 40,
    icon: '🤘',
    featured: false,
  },
  {
    id: 'electronic_pack',
    name: 'Electronic Producer',
    description: 'Synth and Drums for EDM production',
    instruments: ['synth', 'drums'],
    effectPacks: ['synth_dubstep', 'synth_retro', 'drums_electronic'],
    soundBanks: ['synth_premium', 'drums_premium'],
    originalPrice: 7.99,
    bundlePrice: 4.99,
    savings: 38,
    icon: '🎧',
    featured: false,
  },
  {
    id: 'ai_tones_pack',
    name: 'AI Tone Collection',
    description: 'All AI-crafted presets for every instrument',
    instruments: [],
    effectPacks: ['all_ai_presets'],
    soundBanks: [],
    originalPrice: 5.99,
    bundlePrice: 3.99,
    savings: 33,
    icon: '🤖',
    featured: false,
  },
  {
    id: 'learning_plus_hints',
    name: 'Instrument Pack + Hints',
    description: 'Full Band Suite + 50 Hints bundle',
    instruments: ['piano', 'guitar', 'bass', 'drums', 'synth'],
    effectPacks: ['all_premium_effects'],
    soundBanks: ['all_premium_banks'],
    originalPrice: 19.99,
    bundlePrice: 9.99,
    savings: 50,
    icon: '💡',
    featured: true,
  },
];

export const FREE_INSTRUMENTS = INSTRUMENTS.filter(i => !i.isPremium);
export const PREMIUM_INSTRUMENTS = INSTRUMENTS.filter(i => i.isPremium);

export const DEFAULT_INSTRUMENT_ID = 'piano';
export const WELLNESS_INSTRUMENT_ID = 'synth';

export function getInstrumentById(id: string): Instrument {
  return INSTRUMENTS.find(i => i.id === id) || INSTRUMENTS[0];
}

export function getAvailableInstruments(isPremium: boolean): Instrument[] {
  return INSTRUMENTS.filter(i => !i.isPremium || isPremium);
}

export function isInstrumentLocked(instrumentId: string, isPremium: boolean): boolean {
  const instrument = getInstrumentById(instrumentId);
  return instrument.isPremium && !isPremium;
}

export function getEffectPresetById(instrumentId: string, effectId: string): EffectPreset | undefined {
  const instrument = getInstrumentById(instrumentId);
  return instrument.effectPresets.find(e => e.id === effectId);
}

export function getAITonePresetById(instrumentId: string, presetId: string): AITonePreset | undefined {
  const instrument = getInstrumentById(instrumentId);
  return instrument.aiTonePresets.find(p => p.id === presetId);
}

export function getTutorialById(instrumentId: string, tutorialId: string): InstrumentTutorial | undefined {
  const instrument = getInstrumentById(instrumentId);
  return instrument.tutorials.find(t => t.id === tutorialId);
}

export function getSoundBankById(instrumentId: string, bankId: string): SoundBank | undefined {
  const instrument = getInstrumentById(instrumentId);
  return instrument.soundBanks.find(b => b.id === bankId);
}

export function getBundleById(bundleId: string): InstrumentBundle | undefined {
  return INSTRUMENT_BUNDLES.find(b => b.id === bundleId);
}

export function getInstrumentAIRecommendation(
  userHistory: { genres: string[]; accuracy: number; preferredInstruments: string[] },
  currentInstrumentId: string
): { instrumentId: string; effectId: string; reason: string } | null {
  const currentInstrument = getInstrumentById(currentInstrumentId);
  
  if (userHistory.genres.includes('rock') && currentInstrumentId === 'guitar') {
    return {
      instrumentId: 'bass',
      effectId: 'bass_metal',
      reason: 'Your rock puzzles show great rhythm! Try Bass with Metal Growl for deeper grooves.',
    };
  }
  
  if (userHistory.accuracy > 85 && currentInstrumentId === 'piano') {
    return {
      instrumentId: 'synth',
      effectId: 'synth_lead',
      reason: 'High accuracy unlocked! Explore Keyboard with Synth Lead for advanced melodies.',
    };
  }
  
  if (userHistory.genres.includes('funk') || userHistory.genres.includes('jazz')) {
    return {
      instrumentId: 'bass',
      effectId: 'bass_slap',
      reason: 'Your funk/jazz taste is perfect for Slap Bass grooves!',
    };
  }
  
  const premiumEffects = currentInstrument.effectPresets.filter(e => e.isPremium);
  if (premiumEffects.length > 0) {
    return {
      instrumentId: currentInstrumentId,
      effectId: premiumEffects[0].id,
      reason: `Unlock ${premiumEffects[0].name} for ${currentInstrument.name} - ${premiumEffects[0].description}`,
    };
  }
  
  return null;
}
