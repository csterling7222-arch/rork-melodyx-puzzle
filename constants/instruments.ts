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
}

export type InstrumentTier = 'free' | 'premium';

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
  },
  {
    id: 'bass',
    name: 'Bass',
    icon: 'Activity',
    midiProgram: 33,
    soundfontName: 'electric_bass_finger',
    isPremium: true,
    description: 'Deep electric bass',
    waveType: 'sine',
    attackTime: 0.02,
    decayTime: 0.5,
    sustainLevel: 0.6,
    releaseTime: 0.2,
  },
  {
    id: 'drums',
    name: 'Drums',
    icon: 'Disc',
    midiProgram: 118,
    soundfontName: 'synth_drum',
    isPremium: true,
    description: 'Synth drum kit',
    waveType: 'square',
    attackTime: 0.001,
    decayTime: 0.15,
    sustainLevel: 0.1,
    releaseTime: 0.1,
  },
  {
    id: 'synth',
    name: 'Keyboard',
    icon: 'Waves',
    midiProgram: 81,
    soundfontName: 'lead_1_square',
    isPremium: true,
    description: 'Smooth synthesizer pad',
    waveType: 'sawtooth',
    attackTime: 0.05,
    decayTime: 0.2,
    sustainLevel: 0.7,
    releaseTime: 0.5,
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
