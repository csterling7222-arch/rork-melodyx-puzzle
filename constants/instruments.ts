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

const VIOLIN_EFFECTS: EffectPreset[] = [
  {
    id: 'violin_classical',
    name: 'Classical Solo',
    description: 'Pure classical violin tone',
    isPremium: false,
    reverb: 0.35,
    delay: 0.05,
    distortion: 0,
    chorus: 0.05,
    eq: { bass: -0.1, mid: 0.2, treble: 0.15 },
  },
  {
    id: 'violin_romantic',
    name: 'Romantic',
    description: 'Lush, sweeping romantic string sound',
    isPremium: true,
    reverb: 0.55,
    delay: 0.1,
    distortion: 0,
    chorus: 0.2,
    eq: { bass: 0.1, mid: 0.15, treble: 0.1 },
  },
  {
    id: 'violin_fiddle',
    name: 'Folk Fiddle',
    description: 'Bright, energetic fiddle for folk tunes',
    isPremium: true,
    reverb: 0.2,
    delay: 0,
    distortion: 0.05,
    chorus: 0,
    eq: { bass: -0.15, mid: 0.25, treble: 0.3 },
  },
  {
    id: 'violin_cinematic',
    name: 'Cinematic Strings',
    description: 'Epic orchestral string section feel',
    isPremium: true,
    reverb: 0.75,
    delay: 0.15,
    distortion: 0,
    chorus: 0.3,
    eq: { bass: 0.2, mid: 0.1, treble: 0.2 },
  },
];

const TRUMPET_EFFECTS: EffectPreset[] = [
  {
    id: 'trumpet_clean',
    name: 'Clean Brass',
    description: 'Bright, clear trumpet tone',
    isPremium: false,
    reverb: 0.2,
    delay: 0,
    distortion: 0,
    chorus: 0,
    eq: { bass: 0, mid: 0.2, treble: 0.25 },
  },
  {
    id: 'trumpet_jazz',
    name: 'Jazz Muted',
    description: 'Warm muted trumpet for jazz clubs',
    isPremium: true,
    reverb: 0.3,
    delay: 0.05,
    distortion: 0,
    chorus: 0.1,
    eq: { bass: 0.15, mid: 0.2, treble: -0.1 },
  },
  {
    id: 'trumpet_mariachi',
    name: 'Mariachi',
    description: 'Bold, festive mariachi brass',
    isPremium: true,
    reverb: 0.25,
    delay: 0,
    distortion: 0.05,
    chorus: 0.05,
    eq: { bass: 0.1, mid: 0.3, treble: 0.2 },
  },
  {
    id: 'trumpet_orchestral',
    name: 'Orchestral Fanfare',
    description: 'Majestic orchestral brass section',
    isPremium: true,
    reverb: 0.6,
    delay: 0.1,
    distortion: 0,
    chorus: 0.15,
    eq: { bass: 0.2, mid: 0.15, treble: 0.25 },
  },
];

const FLUTE_EFFECTS: EffectPreset[] = [
  {
    id: 'flute_classical',
    name: 'Concert Flute',
    description: 'Pure, airy classical flute',
    isPremium: false,
    reverb: 0.3,
    delay: 0.05,
    distortion: 0,
    chorus: 0.05,
    eq: { bass: -0.2, mid: 0.1, treble: 0.3 },
  },
  {
    id: 'flute_celtic',
    name: 'Celtic Whistle',
    description: 'Haunting Celtic tin whistle tone',
    isPremium: true,
    reverb: 0.4,
    delay: 0.1,
    distortion: 0,
    chorus: 0.15,
    eq: { bass: -0.2, mid: 0.2, treble: 0.35 },
  },
  {
    id: 'flute_bamboo',
    name: 'Bamboo Zen',
    description: 'Peaceful Japanese shakuhachi vibe',
    isPremium: true,
    reverb: 0.5,
    delay: 0.15,
    distortion: 0,
    chorus: 0.1,
    eq: { bass: 0, mid: 0.15, treble: 0.2 },
  },
  {
    id: 'flute_pan',
    name: 'Pan Flute',
    description: 'Ethereal Andean pan flute sound',
    isPremium: true,
    reverb: 0.55,
    delay: 0.2,
    distortion: 0,
    chorus: 0.25,
    eq: { bass: 0.05, mid: 0.2, treble: 0.15 },
  },
];

const SAXOPHONE_EFFECTS: EffectPreset[] = [
  {
    id: 'sax_smooth',
    name: 'Smooth Jazz',
    description: 'Silky smooth alto sax tone',
    isPremium: false,
    reverb: 0.3,
    delay: 0.05,
    distortion: 0,
    chorus: 0.1,
    eq: { bass: 0.1, mid: 0.25, treble: 0.1 },
  },
  {
    id: 'sax_tenor',
    name: 'Tenor Blues',
    description: 'Gritty, soulful tenor saxophone',
    isPremium: true,
    reverb: 0.25,
    delay: 0,
    distortion: 0.1,
    chorus: 0.05,
    eq: { bass: 0.2, mid: 0.3, treble: 0.05 },
  },
  {
    id: 'sax_soprano',
    name: 'Soprano Breeze',
    description: 'Bright soprano sax like Kenny G',
    isPremium: true,
    reverb: 0.4,
    delay: 0.1,
    distortion: 0,
    chorus: 0.2,
    eq: { bass: -0.1, mid: 0.15, treble: 0.3 },
  },
  {
    id: 'sax_bari',
    name: 'Baritone Growl',
    description: 'Deep, punchy baritone sax',
    isPremium: true,
    reverb: 0.2,
    delay: 0,
    distortion: 0.15,
    chorus: 0,
    eq: { bass: 0.4, mid: 0.2, treble: -0.1 },
  },
];

const HARP_EFFECTS: EffectPreset[] = [
  {
    id: 'harp_classical',
    name: 'Concert Harp',
    description: 'Elegant pedal harp tone',
    isPremium: false,
    reverb: 0.45,
    delay: 0.1,
    distortion: 0,
    chorus: 0.1,
    eq: { bass: 0.05, mid: 0.1, treble: 0.25 },
  },
  {
    id: 'harp_celtic',
    name: 'Celtic Harp',
    description: 'Warm, intimate Irish lever harp',
    isPremium: true,
    reverb: 0.35,
    delay: 0.05,
    distortion: 0,
    chorus: 0.15,
    eq: { bass: 0.1, mid: 0.2, treble: 0.15 },
  },
  {
    id: 'harp_angelic',
    name: 'Angelic',
    description: 'Dreamy, heavenly glissando sound',
    isPremium: true,
    reverb: 0.7,
    delay: 0.2,
    distortion: 0,
    chorus: 0.35,
    eq: { bass: 0, mid: 0.05, treble: 0.3 },
  },
  {
    id: 'harp_electric',
    name: 'Electric Harp',
    description: 'Modern electric harp with shimmer',
    isPremium: true,
    reverb: 0.5,
    delay: 0.15,
    distortion: 0.05,
    chorus: 0.25,
    eq: { bass: 0.1, mid: 0.15, treble: 0.2 },
  },
];

const CELLO_EFFECTS: EffectPreset[] = [
  {
    id: 'cello_classical',
    name: 'Classical Cello',
    description: 'Rich, warm classical cello tone',
    isPremium: false,
    reverb: 0.35,
    delay: 0.05,
    distortion: 0,
    chorus: 0.05,
    eq: { bass: 0.2, mid: 0.15, treble: 0 },
  },
  {
    id: 'cello_romantic',
    name: 'Romantic Solo',
    description: 'Passionate, expressive solo cello',
    isPremium: true,
    reverb: 0.5,
    delay: 0.1,
    distortion: 0,
    chorus: 0.15,
    eq: { bass: 0.15, mid: 0.25, treble: 0.1 },
  },
  {
    id: 'cello_pizzicato',
    name: 'Pizzicato',
    description: 'Plucky, playful pizzicato cello',
    isPremium: true,
    reverb: 0.2,
    delay: 0,
    distortion: 0,
    chorus: 0,
    eq: { bass: 0.1, mid: 0.2, treble: 0.15 },
  },
  {
    id: 'cello_cinematic',
    name: 'Cinematic Depth',
    description: 'Deep, emotional cello for film scores',
    isPremium: true,
    reverb: 0.65,
    delay: 0.15,
    distortion: 0,
    chorus: 0.2,
    eq: { bass: 0.3, mid: 0.2, treble: 0.1 },
  },
];

const ORGAN_EFFECTS: EffectPreset[] = [
  {
    id: 'organ_church',
    name: 'Church Organ',
    description: 'Grand pipe organ with cathedral reverb',
    isPremium: false,
    reverb: 0.7,
    delay: 0.1,
    distortion: 0,
    chorus: 0.15,
    eq: { bass: 0.3, mid: 0.1, treble: 0.2 },
  },
  {
    id: 'organ_hammond',
    name: 'Hammond B3',
    description: 'Classic Hammond with Leslie speaker',
    isPremium: true,
    reverb: 0.3,
    delay: 0.05,
    distortion: 0.15,
    chorus: 0.4,
    eq: { bass: 0.2, mid: 0.3, treble: 0.15 },
    pedals: ['Leslie', 'Overdrive'],
  },
  {
    id: 'organ_gospel',
    name: 'Gospel Soul',
    description: 'Soulful gospel organ with warmth',
    isPremium: true,
    reverb: 0.4,
    delay: 0.05,
    distortion: 0.1,
    chorus: 0.3,
    eq: { bass: 0.25, mid: 0.25, treble: 0.1 },
  },
  {
    id: 'organ_rock',
    name: 'Rock Organ',
    description: 'Dirty, overdriven rock organ sound',
    isPremium: true,
    reverb: 0.25,
    delay: 0.08,
    distortion: 0.35,
    chorus: 0.2,
    eq: { bass: 0.3, mid: 0.35, treble: 0.2 },
    pedals: ['Overdrive', 'Phaser'],
  },
];

const MARIMBA_EFFECTS: EffectPreset[] = [
  {
    id: 'marimba_natural',
    name: 'Natural Wood',
    description: 'Warm, resonant wooden marimba',
    isPremium: false,
    reverb: 0.25,
    delay: 0,
    distortion: 0,
    chorus: 0,
    eq: { bass: 0.1, mid: 0.2, treble: 0.15 },
  },
  {
    id: 'marimba_tropical',
    name: 'Tropical',
    description: 'Bright, lively tropical percussion',
    isPremium: true,
    reverb: 0.3,
    delay: 0.1,
    distortion: 0,
    chorus: 0.1,
    eq: { bass: 0, mid: 0.25, treble: 0.3 },
  },
  {
    id: 'marimba_vibraphone',
    name: 'Vibraphone Shimmer',
    description: 'Metallic vibraphone with motor vibrato',
    isPremium: true,
    reverb: 0.45,
    delay: 0.15,
    distortion: 0,
    chorus: 0.35,
    eq: { bass: 0.05, mid: 0.15, treble: 0.25 },
  },
  {
    id: 'marimba_xylophone',
    name: 'Xylophone Bright',
    description: 'Sharp, cutting xylophone tone',
    isPremium: true,
    reverb: 0.15,
    delay: 0,
    distortion: 0,
    chorus: 0,
    eq: { bass: -0.2, mid: 0.1, treble: 0.4 },
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
  violin: [
    { id: 'ai_violin_virtuoso', name: 'Virtuoso', description: 'AI tone inspired by Paganini', genre: 'Classical', mood: 'Brilliant', isPremium: true, baseEffects: 'violin_romantic', icon: '🎻' },
    { id: 'ai_violin_film', name: 'Film Score', description: 'Sweeping cinematic violin', genre: 'Cinematic', mood: 'Epic', isPremium: true, baseEffects: 'violin_cinematic', icon: '🎬' },
  ],
  trumpet: [
    { id: 'ai_trumpet_miles', name: 'Cool Jazz', description: 'Tone inspired by Miles Davis', genre: 'Jazz', mood: 'Cool', isPremium: true, baseEffects: 'trumpet_jazz', icon: '🎺' },
    { id: 'ai_trumpet_latin', name: 'Latin Fire', description: 'Fiery salsa brass section', genre: 'Latin', mood: 'Energetic', isPremium: true, baseEffects: 'trumpet_mariachi', icon: '💃' },
  ],
  flute: [
    { id: 'ai_flute_meditation', name: 'Meditation', description: 'Calming tones for mindfulness', genre: 'Ambient', mood: 'Peaceful', isPremium: true, baseEffects: 'flute_bamboo', icon: '🧘' },
    { id: 'ai_flute_fairy', name: 'Fairy Tale', description: 'Magical, whimsical flute sound', genre: 'Fantasy', mood: 'Enchanting', isPremium: true, baseEffects: 'flute_pan', icon: '🧚' },
  ],
  saxophone: [
    { id: 'ai_sax_midnight', name: 'Midnight Sax', description: 'Late-night jazz club atmosphere', genre: 'Jazz', mood: 'Sultry', isPremium: true, baseEffects: 'sax_tenor', icon: '🌙' },
    { id: 'ai_sax_funk', name: 'Funk Machine', description: 'Punchy funk sax riffs', genre: 'Funk', mood: 'Groovy', isPremium: true, baseEffects: 'sax_smooth', icon: '🪩' },
  ],
  harp: [
    { id: 'ai_harp_lullaby', name: 'Lullaby', description: 'Gentle, soothing bedtime harp', genre: 'Classical', mood: 'Serene', isPremium: true, baseEffects: 'harp_angelic', icon: '🌟' },
    { id: 'ai_harp_fantasy', name: 'Fantasy Quest', description: 'Mystical harp for adventure', genre: 'Fantasy', mood: 'Mystical', isPremium: true, baseEffects: 'harp_celtic', icon: '⚔️' },
  ],
  cello: [
    { id: 'ai_cello_soul', name: 'Soul Cello', description: 'Deep, emotional soul cello', genre: 'Soul', mood: 'Moving', isPremium: true, baseEffects: 'cello_romantic', icon: '💫' },
    { id: 'ai_cello_thriller', name: 'Dark Thriller', description: 'Tense, dramatic cello for suspense', genre: 'Cinematic', mood: 'Dark', isPremium: true, baseEffects: 'cello_cinematic', icon: '🖤' },
  ],
  organ: [
    { id: 'ai_organ_cathedral', name: 'Cathedral', description: 'Massive cathedral pipe organ', genre: 'Classical', mood: 'Grand', isPremium: true, baseEffects: 'organ_church', icon: '⛪' },
    { id: 'ai_organ_funk', name: 'Funky Keys', description: 'Funky Hammond grooves', genre: 'Funk', mood: 'Groovy', isPremium: true, baseEffects: 'organ_hammond', icon: '🎹' },
  ],
  marimba: [
    { id: 'ai_marimba_island', name: 'Island Vibes', description: 'Tropical island percussion', genre: 'World', mood: 'Relaxed', isPremium: true, baseEffects: 'marimba_tropical', icon: '🏝️' },
    { id: 'ai_marimba_jazz', name: 'Jazz Mallet', description: 'Smooth jazz vibraphone tones', genre: 'Jazz', mood: 'Smooth', isPremium: true, baseEffects: 'marimba_vibraphone', icon: '🎶' },
  ],
};

const INSTRUMENT_TUTORIALS: Record<string, InstrumentTutorial[]> = {
  violin: [
    { id: 'violin_basics', title: 'Violin Basics', description: 'Bow hold and first notes', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Correct bow hold', 'Open string bowing', 'First scale'] },
    { id: 'violin_vibrato', title: 'Vibrato Mastery', description: 'Add emotion with vibrato', duration: '12 min', difficulty: 'intermediate', isPremium: true, steps: ['Wrist vibrato', 'Arm vibrato', 'Speed control'] },
    { id: 'violin_advanced', title: 'Advanced Bowing', description: 'Spiccato, staccato, and tremolo', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['Spiccato technique', 'Staccato runs', 'Tremolo bowing'] },
  ],
  trumpet: [
    { id: 'trumpet_basics', title: 'Trumpet Basics', description: 'Embouchure and first tones', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Buzzing technique', 'Mouthpiece practice', 'First notes'] },
    { id: 'trumpet_range', title: 'Expanding Range', description: 'Build your high register', duration: '10 min', difficulty: 'intermediate', isPremium: true, steps: ['Lip slurs', 'Long tones', 'High note exercises'] },
    { id: 'trumpet_improv', title: 'Jazz Improvisation', description: 'Blues scales and licks', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['Blues scale', 'Call and response', 'Solo building'] },
  ],
  flute: [
    { id: 'flute_basics', title: 'Flute Basics', description: 'Breath control and embouchure', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Head joint buzzing', 'Air stream control', 'First notes'] },
    { id: 'flute_tone', title: 'Tone Development', description: 'Beautiful flute tone', duration: '10 min', difficulty: 'intermediate', isPremium: true, steps: ['Long tones', 'Harmonics', 'Dynamic control'] },
    { id: 'flute_ornaments', title: 'Ornamentation', description: 'Trills, grace notes, flutter tongue', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['Trill technique', 'Grace notes', 'Flutter tonguing'] },
  ],
  saxophone: [
    { id: 'sax_basics', title: 'Saxophone Basics', description: 'Reed setup and first sounds', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Reed selection', 'Embouchure', 'First notes'] },
    { id: 'sax_tone', title: 'Tone & Expression', description: 'Develop your personal sound', duration: '12 min', difficulty: 'intermediate', isPremium: true, steps: ['Overtones', 'Subtone technique', 'Growl effect'] },
    { id: 'sax_improv', title: 'Jazz Improv', description: 'Scales, patterns, and soloing', duration: '18 min', difficulty: 'advanced', isPremium: true, steps: ['Bebop scales', 'Pattern drilling', 'Trading fours'] },
  ],
  harp: [
    { id: 'harp_basics', title: 'Harp Basics', description: 'Hand position and plucking', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Seated position', 'Thumb technique', 'Simple arpeggios'] },
    { id: 'harp_arpeggios', title: 'Arpeggios & Glissando', description: 'Flowing harp techniques', duration: '10 min', difficulty: 'intermediate', isPremium: true, steps: ['Arpeggio patterns', 'Glissando technique', 'Pedal changes'] },
    { id: 'harp_celtic', title: 'Celtic Harp Style', description: 'Traditional Irish arrangements', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['Ornamentation', 'Irish rhythms', 'Arrangement skills'] },
  ],
  cello: [
    { id: 'cello_basics', title: 'Cello Basics', description: 'Bow technique and open strings', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Seating posture', 'Bow hold', 'Open string practice'] },
    { id: 'cello_shifting', title: 'Position Shifting', description: 'Navigate the fingerboard', duration: '12 min', difficulty: 'intermediate', isPremium: true, steps: ['First to third position', 'Thumb position intro', 'Smooth shifts'] },
    { id: 'cello_expression', title: 'Musical Expression', description: 'Dynamics, vibrato, and phrasing', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['Dynamic range', 'Vibrato styles', 'Phrase shaping'] },
  ],
  organ: [
    { id: 'organ_basics', title: 'Organ Basics', description: 'Manuals, stops, and pedals', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Manual basics', 'Stop selection', 'Simple registration'] },
    { id: 'organ_registration', title: 'Registration Art', description: 'Combine stops for rich sounds', duration: '12 min', difficulty: 'intermediate', isPremium: true, steps: ['Principal chorus', 'Reed combinations', 'Dynamic builds'] },
    { id: 'organ_pedals', title: 'Pedalboard Mastery', description: 'Independent foot technique', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['Heel-toe technique', 'Pedal scales', 'Full coordination'] },
  ],
  marimba: [
    { id: 'marimba_basics', title: 'Marimba Basics', description: 'Mallet grip and stroke', duration: '5 min', difficulty: 'beginner', isPremium: false, steps: ['Mallet selection', 'Basic stroke', 'Scale practice'] },
    { id: 'marimba_four_mallet', title: 'Four-Mallet Technique', description: 'Play chords and melodies', duration: '12 min', difficulty: 'intermediate', isPremium: true, steps: ['Stevens grip', 'Independent strokes', 'Chord voicings'] },
    { id: 'marimba_advanced', title: 'Advanced Percussion', description: 'Rolls, dead strokes, effects', duration: '15 min', difficulty: 'advanced', isPremium: true, steps: ['One-handed rolls', 'Dead strokes', 'Extended techniques'] },
  ],
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
  violin: [
    { id: 'violin_standard', name: 'Solo Violin', description: 'Expressive solo violin samples', isPremium: false, samples: 96, quality: 'standard' },
    { id: 'violin_premium', name: 'Stradivarius Collection', description: 'Legendary instrument recordings', isPremium: true, samples: 384, quality: 'studio' },
  ],
  trumpet: [
    { id: 'trumpet_standard', name: 'Brass Section', description: 'Versatile trumpet samples', isPremium: false, samples: 64, quality: 'standard' },
    { id: 'trumpet_premium', name: 'Jazz Trumpet Studio', description: 'Multi-mic jazz trumpet', isPremium: true, samples: 256, quality: 'studio' },
  ],
  flute: [
    { id: 'flute_standard', name: 'Concert Flute', description: 'Silver flute basics', isPremium: false, samples: 72, quality: 'standard' },
    { id: 'flute_premium', name: 'World Flutes Collection', description: 'Flutes from around the globe', isPremium: true, samples: 320, quality: 'studio' },
  ],
  saxophone: [
    { id: 'sax_standard', name: 'Alto Saxophone', description: 'Standard alto sax samples', isPremium: false, samples: 80, quality: 'standard' },
    { id: 'sax_premium', name: 'Saxophone Family', description: 'Soprano, alto, tenor, baritone', isPremium: true, samples: 480, quality: 'studio' },
  ],
  harp: [
    { id: 'harp_standard', name: 'Pedal Harp', description: 'Concert pedal harp', isPremium: false, samples: 88, quality: 'standard' },
    { id: 'harp_premium', name: 'Harp Paradise', description: 'Celtic and concert harps', isPremium: true, samples: 352, quality: 'studio' },
  ],
  cello: [
    { id: 'cello_standard', name: 'Solo Cello', description: 'Rich solo cello tone', isPremium: false, samples: 96, quality: 'standard' },
    { id: 'cello_premium', name: 'Cello Ensemble', description: 'Solo and section recordings', isPremium: true, samples: 384, quality: 'studio' },
  ],
  organ: [
    { id: 'organ_standard', name: 'Pipe Organ', description: 'Classic church pipe organ', isPremium: false, samples: 64, quality: 'standard' },
    { id: 'organ_premium', name: 'Organ Cathedral', description: 'Multiple organ types', isPremium: true, samples: 512, quality: 'studio' },
  ],
  marimba: [
    { id: 'marimba_standard', name: 'Concert Marimba', description: 'Rosewood concert marimba', isPremium: false, samples: 52, quality: 'standard' },
    { id: 'marimba_premium', name: 'Mallet Percussion Suite', description: 'Marimba, vibes, xylophone', isPremium: true, samples: 288, quality: 'studio' },
  ],
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
  {
    id: 'violin',
    name: 'Violin',
    icon: 'Music',
    midiProgram: 40,
    soundfontName: 'violin',
    isPremium: true,
    description: 'Expressive solo violin with rich vibrato',
    waveType: 'sine',
    attackTime: 0.03,
    decayTime: 0.2,
    sustainLevel: 0.7,
    releaseTime: 0.4,
    effectPresets: VIOLIN_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.violin,
    tutorials: INSTRUMENT_TUTORIALS.violin,
    soundBanks: SOUND_BANKS.violin,
    features: ['Classical solo', 'Romantic vibrato', 'Folk fiddle', 'Cinematic strings'],
  },
  {
    id: 'trumpet',
    name: 'Trumpet',
    icon: 'Megaphone',
    midiProgram: 56,
    soundfontName: 'trumpet',
    isPremium: true,
    description: 'Bold brass trumpet from jazz to orchestral',
    waveType: 'sawtooth',
    attackTime: 0.015,
    decayTime: 0.25,
    sustainLevel: 0.65,
    releaseTime: 0.3,
    effectPresets: TRUMPET_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.trumpet,
    tutorials: INSTRUMENT_TUTORIALS.trumpet,
    soundBanks: SOUND_BANKS.trumpet,
    features: ['Jazz muted tone', 'Mariachi brass', 'Orchestral fanfare', 'Bright lead'],
  },
  {
    id: 'flute',
    name: 'Flute',
    icon: 'Wind',
    midiProgram: 73,
    soundfontName: 'flute',
    isPremium: true,
    description: 'Ethereal woodwind from classical to world music',
    waveType: 'sine',
    attackTime: 0.04,
    decayTime: 0.15,
    sustainLevel: 0.6,
    releaseTime: 0.35,
    effectPresets: FLUTE_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.flute,
    tutorials: INSTRUMENT_TUTORIALS.flute,
    soundBanks: SOUND_BANKS.flute,
    features: ['Concert flute', 'Celtic whistle', 'Bamboo zen', 'Pan flute'],
  },
  {
    id: 'saxophone',
    name: 'Saxophone',
    icon: 'AudioLines',
    midiProgram: 65,
    soundfontName: 'alto_sax',
    isPremium: true,
    description: 'Smooth to soulful saxophone across all ranges',
    waveType: 'sawtooth',
    attackTime: 0.02,
    decayTime: 0.3,
    sustainLevel: 0.6,
    releaseTime: 0.35,
    effectPresets: SAXOPHONE_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.saxophone,
    tutorials: INSTRUMENT_TUTORIALS.saxophone,
    soundBanks: SOUND_BANKS.saxophone,
    features: ['Smooth jazz', 'Tenor blues', 'Soprano breeze', 'Baritone growl'],
  },
  {
    id: 'harp',
    name: 'Harp',
    icon: 'Sparkles',
    midiProgram: 46,
    soundfontName: 'orchestral_harp',
    isPremium: true,
    description: 'Elegant harp with angelic glissandos',
    waveType: 'sine',
    attackTime: 0.005,
    decayTime: 0.5,
    sustainLevel: 0.35,
    releaseTime: 0.6,
    effectPresets: HARP_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.harp,
    tutorials: INSTRUMENT_TUTORIALS.harp,
    soundBanks: SOUND_BANKS.harp,
    features: ['Concert harp', 'Celtic harp', 'Angelic arpeggios', 'Electric shimmer'],
  },
  {
    id: 'cello',
    name: 'Cello',
    icon: 'Music2',
    midiProgram: 42,
    soundfontName: 'cello',
    isPremium: true,
    description: 'Deep, resonant cello from classical to cinematic',
    waveType: 'triangle',
    attackTime: 0.035,
    decayTime: 0.25,
    sustainLevel: 0.65,
    releaseTime: 0.45,
    effectPresets: CELLO_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.cello,
    tutorials: INSTRUMENT_TUTORIALS.cello,
    soundBanks: SOUND_BANKS.cello,
    features: ['Classical warmth', 'Romantic solo', 'Playful pizzicato', 'Cinematic depth'],
  },
  {
    id: 'organ',
    name: 'Organ',
    icon: 'LayoutGrid',
    midiProgram: 19,
    soundfontName: 'church_organ',
    isPremium: true,
    description: 'From cathedral pipe organ to funky Hammond B3',
    waveType: 'square',
    attackTime: 0.01,
    decayTime: 0.1,
    sustainLevel: 0.8,
    releaseTime: 0.2,
    effectPresets: ORGAN_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.organ,
    tutorials: INSTRUMENT_TUTORIALS.organ,
    soundBanks: SOUND_BANKS.organ,
    features: ['Church pipe organ', 'Hammond B3', 'Gospel soul', 'Rock overdrive'],
  },
  {
    id: 'marimba',
    name: 'Marimba',
    icon: 'Grid3x3',
    midiProgram: 12,
    soundfontName: 'marimba',
    isPremium: true,
    description: 'Warm wooden percussion from tropical to jazz',
    waveType: 'sine',
    attackTime: 0.002,
    decayTime: 0.35,
    sustainLevel: 0.2,
    releaseTime: 0.3,
    effectPresets: MARIMBA_EFFECTS,
    aiTonePresets: AI_TONE_PRESETS.marimba,
    tutorials: INSTRUMENT_TUTORIALS.marimba,
    soundBanks: SOUND_BANKS.marimba,
    features: ['Natural rosewood', 'Tropical vibes', 'Vibraphone shimmer', 'Xylophone bright'],
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
    description: 'All 13 instruments with premium effects',
    instruments: ['piano', 'guitar', 'bass', 'drums', 'synth', 'violin', 'trumpet', 'flute', 'saxophone', 'harp', 'cello', 'organ', 'marimba'],
    effectPacks: ['all_premium_effects'],
    soundBanks: ['all_premium_banks'],
    originalPrice: 24.99,
    bundlePrice: 12.99,
    savings: 48,
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
    id: 'orchestral_pack',
    name: 'Orchestral Collection',
    description: 'Violin, Cello, Flute, Harp, Trumpet with orchestral effects',
    instruments: ['violin', 'cello', 'flute', 'harp', 'trumpet'],
    effectPacks: ['violin_cinematic', 'cello_cinematic', 'flute_classical', 'harp_angelic', 'trumpet_orchestral'],
    soundBanks: ['violin_premium', 'cello_premium', 'flute_premium', 'harp_premium', 'trumpet_premium'],
    originalPrice: 14.99,
    bundlePrice: 8.99,
    savings: 40,
    icon: '🎼',
    featured: false,
  },
  {
    id: 'jazz_pack',
    name: 'Jazz Ensemble',
    description: 'Saxophone, Trumpet, Piano with jazz effects',
    instruments: ['saxophone', 'trumpet', 'piano'],
    effectPacks: ['sax_smooth', 'trumpet_jazz', 'piano_jazz'],
    soundBanks: ['sax_premium', 'trumpet_premium', 'piano_grand'],
    originalPrice: 11.99,
    bundlePrice: 6.99,
    savings: 42,
    icon: '🎷',
    featured: false,
  },
  {
    id: 'world_music_pack',
    name: 'World Music Explorer',
    description: 'Marimba, Flute, Harp for global sounds',
    instruments: ['marimba', 'flute', 'harp'],
    effectPacks: ['marimba_tropical', 'flute_bamboo', 'harp_celtic'],
    soundBanks: ['marimba_premium', 'flute_premium', 'harp_premium'],
    originalPrice: 9.99,
    bundlePrice: 5.99,
    savings: 40,
    icon: '🌍',
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
    description: 'All instruments + 50 Hints bundle',
    instruments: ['piano', 'guitar', 'bass', 'drums', 'synth', 'violin', 'trumpet', 'flute', 'saxophone', 'harp', 'cello', 'organ', 'marimba'],
    effectPacks: ['all_premium_effects'],
    soundBanks: ['all_premium_banks'],
    originalPrice: 29.99,
    bundlePrice: 14.99,
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
      instrumentId: 'saxophone',
      effectId: 'sax_smooth',
      reason: 'Your funk/jazz taste is perfect for smooth Saxophone!',
    };
  }

  if (userHistory.genres.includes('classical') && currentInstrumentId === 'piano') {
    return {
      instrumentId: 'violin',
      effectId: 'violin_classical',
      reason: 'Classical lover? The Violin will elevate your melody puzzles!',
    };
  }

  if (userHistory.accuracy > 90) {
    return {
      instrumentId: 'harp',
      effectId: 'harp_angelic',
      reason: 'Your incredible accuracy deserves the angelic Harp sound!',
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
