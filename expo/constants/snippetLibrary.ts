import { SnippetMetadata } from '@/contexts/TuneSnippetContext';

export const SNIPPET_SOURCES = {
  MIDI_RECREATION: 'midi',
  ROYALTY_FREE: 'sample',
  LICENSED: 'licensed',
  EPIDEMIC_SOUND: 'epidemic',
} as const;

export const FAIR_USE_DISCLAIMER = `
🎵 FAIR USE NOTICE: This app uses short audio excerpts (<30 seconds) for educational 
and transformative purposes under fair use principles. These snippets are intended 
to help users learn music recognition and appreciation. For full tracks, please 
support artists by streaming on official platforms.

All music content remains the property of respective copyright holders. Melodyx 
does not claim ownership of any original recordings. Users are encouraged to 
stream full songs legally through Spotify, Apple Music, or other licensed services.
`;

export const LEGAL_NOTICES = {
  fairUse: 'Educational use under fair use doctrine - <30s transformative excerpt',
  midiRecreation: 'MIDI recreation - not original recording',
  royaltyFree: 'Licensed royalty-free audio sample',
  licensedContent: 'Licensed content via Epidemic Sound/similar services',
  streamFull: 'Stream the full track on official platforms to support the artist!',
  affiliate: 'Streaming links may contain affiliate codes - no extra cost to you',
};

export const SNIPPET_QUALITY_SETTINGS = {
  low: { bitrate: 64, sampleRate: 22050 },
  medium: { bitrate: 128, sampleRate: 44100 },
  high: { bitrate: 256, sampleRate: 48000 },
};

const SAMPLE_AUDIO_BASE = 'https://www.soundhelix.com/examples/mp3';

export const SONG_SNIPPETS: Record<string, SnippetMetadata> = {
  yesterday_beatles: {
    songId: 'yesterday_beatles',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-1.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-1.mp3`,
    durationMs: 25000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  let_it_be_beatles: {
    songId: 'let_it_be_beatles',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-2.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-2.mp3`,
    durationMs: 28000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  bohemian_rhapsody_queen: {
    songId: 'bohemian_rhapsody_queen',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-3.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-3.mp3`,
    durationMs: 30000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  stairway_to_heaven_led_zeppelin: {
    songId: 'stairway_to_heaven_led_zeppelin',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-4.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-4.mp3`,
    durationMs: 30000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  billie_jean_mj: {
    songId: 'billie_jean_mj',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-5.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-5.mp3`,
    durationMs: 25000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  take_on_me_aha: {
    songId: 'take_on_me_aha',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-6.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-6.mp3`,
    durationMs: 22000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  sweet_child_gnr: {
    songId: 'sweet_child_gnr',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-7.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-7.mp3`,
    durationMs: 28000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  smells_like_teen_spirit_nirvana: {
    songId: 'smells_like_teen_spirit_nirvana',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-8.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-8.mp3`,
    durationMs: 26000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  wonderwall_oasis: {
    songId: 'wonderwall_oasis',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-9.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-9.mp3`,
    durationMs: 24000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  crazy_in_love_beyonce: {
    songId: 'crazy_in_love_beyonce',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-10.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-10.mp3`,
    durationMs: 25000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  mr_brightside_killers: {
    songId: 'mr_brightside_killers',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-11.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-11.mp3`,
    durationMs: 26000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  shape_of_you_ed: {
    songId: 'shape_of_you_ed',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-12.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-12.mp3`,
    durationMs: 24000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  bad_guy_billie: {
    songId: 'bad_guy_billie',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-13.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-13.mp3`,
    durationMs: 22000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  blinding_lights_weeknd: {
    songId: 'blinding_lights_weeknd',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-14.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-14.mp3`,
    durationMs: 25000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  uptown_funk_bruno: {
    songId: 'uptown_funk_bruno',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-15.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-15.mp3`,
    durationMs: 26000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  stay_kid_laroi: {
    songId: 'stay_kid_laroi',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-16.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-16.mp3`,
    durationMs: 20000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  levitating_dua: {
    songId: 'levitating_dua',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-1.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-1.mp3`,
    durationMs: 24000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  anti_hero_taylor: {
    songId: 'anti_hero_taylor',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-2.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-2.mp3`,
    durationMs: 25000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  as_it_was_harry: {
    songId: 'as_it_was_harry',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-3.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-3.mp3`,
    durationMs: 23000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  flowers_miley: {
    songId: 'flowers_miley',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-4.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-4.mp3`,
    durationMs: 24000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  mario_theme: {
    songId: 'mario_theme',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-5.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-5.mp3`,
    durationMs: 15000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation - video game music',
  },
  zelda_theme: {
    songId: 'zelda_theme',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-6.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-6.mp3`,
    durationMs: 18000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation - video game music',
  },
  star_wars_theme: {
    songId: 'star_wars_theme',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-7.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-7.mp3`,
    durationMs: 25000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation - film score',
  },
  let_it_go_frozen: {
    songId: 'let_it_go_frozen',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-8.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-8.mp3`,
    durationMs: 28000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  fur_elise_beethoven: {
    songId: 'fur_elise_beethoven',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-9.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-9.mp3`,
    durationMs: 30000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'Public domain - classical composition',
  },
  moonlight_sonata_beethoven: {
    songId: 'moonlight_sonata_beethoven',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-10.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-10.mp3`,
    durationMs: 30000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'Public domain - classical composition',
  },
  despacito_fonsi: {
    songId: 'despacito_fonsi',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-11.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-11.mp3`,
    durationMs: 24000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  gangnam_style_psy: {
    songId: 'gangnam_style_psy',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-12.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-12.mp3`,
    durationMs: 22000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  heat_waves_glass: {
    songId: 'heat_waves_glass',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-13.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-13.mp3`,
    durationMs: 25000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  drivers_license_olivia: {
    songId: 'drivers_license_olivia',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-14.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-14.mp3`,
    durationMs: 28000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  about_damn_time_lizzo: {
    songId: 'about_damn_time_lizzo',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-15.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-15.mp3`,
    durationMs: 23000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
  vampire_olivia: {
    songId: 'vampire_olivia',
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-16.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-16.mp3`,
    durationMs: 26000,
    bitrate: 'high',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  },
};

export function getSnippetForSong(songId: string): SnippetMetadata | null {
  return SONG_SNIPPETS[songId] || null;
}

export function getDefaultSnippet(songName: string): SnippetMetadata {
  const hash = songName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = (hash % 16) + 1;
  
  return {
    songId: songName.toLowerCase().replace(/\s+/g, '_'),
    snippetUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-${index}.mp3`,
    teaserUrl: `${SAMPLE_AUDIO_BASE}/SoundHelix-Song-${index}.mp3`,
    durationMs: 25000,
    bitrate: 'medium',
    isLicensed: false,
    source: 'midi',
    attribution: 'MIDI recreation for educational purposes',
  };
}

export function getSnippetAttribution(snippet: SnippetMetadata): string {
  switch (snippet.source) {
    case 'midi':
      return '🎹 MIDI Recreation - Educational use';
    case 'sample':
      return '🎵 Royalty-free sample';
    case 'licensed':
      return '✅ Licensed content';
    case 'epidemic':
      return '🎶 Licensed via Epidemic Sound';
    default:
      return '🎵 Audio content';
  }
}

export function shouldShowPremiumUpsell(snippet: SnippetMetadata, isPremium: boolean): boolean {
  if (isPremium) return false;
  return snippet.source === 'licensed' || snippet.source === 'epidemic';
}

export const PREMIUM_SNIPPET_FEATURES = {
  fullLength: 'Listen to complete 30-second snippets',
  noAds: 'Ad-free listening experience',
  offlineCache: 'Download snippets for offline play',
  highQuality: 'High-quality 256kbps audio',
  extendedRemix: 'AI-generated extended versions',
  instrumentTwist: 'Play snippets with different instruments',
};

export interface SnippetPlaybackConfig {
  maxDurationMs: number;
  fadeInMs: number;
  fadeOutMs: number;
  allowLoop: boolean;
  allowSpeedControl: boolean;
  qualityLevel: 'low' | 'medium' | 'high';
}

export function getPlaybackConfig(isPremium: boolean): SnippetPlaybackConfig {
  if (isPremium) {
    return {
      maxDurationMs: 30000,
      fadeInMs: 200,
      fadeOutMs: 500,
      allowLoop: true,
      allowSpeedControl: true,
      qualityLevel: 'high',
    };
  }
  
  return {
    maxDurationMs: 10000,
    fadeInMs: 100,
    fadeOutMs: 300,
    allowLoop: false,
    allowSpeedControl: false,
    qualityLevel: 'medium',
  };
}
