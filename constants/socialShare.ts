export interface SharePlatform {
  id: string;
  name: string;
  color: string;
  icon: string;
  maxLength: number;
  supportsVideo: boolean;
  supportsAudio: boolean;
  supportsImage: boolean;
  urlScheme?: string;
  webUrl: string;
  hashtagPrefix: string;
}

export const SHARE_PLATFORMS: SharePlatform[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    icon: 'video',
    maxLength: 2200,
    supportsVideo: true,
    supportsAudio: true,
    supportsImage: false,
    urlScheme: 'tiktok://',
    webUrl: 'https://www.tiktok.com',
    hashtagPrefix: '#',
  },
  {
    id: 'x',
    name: 'X',
    color: '#000000',
    icon: 'x',
    maxLength: 280,
    supportsVideo: true,
    supportsAudio: false,
    supportsImage: true,
    urlScheme: 'twitter://',
    webUrl: 'https://x.com/intent/tweet',
    hashtagPrefix: '#',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    icon: 'instagram',
    maxLength: 2200,
    supportsVideo: true,
    supportsAudio: true,
    supportsImage: true,
    urlScheme: 'instagram://',
    webUrl: 'https://instagram.com',
    hashtagPrefix: '#',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    icon: 'facebook',
    maxLength: 63206,
    supportsVideo: true,
    supportsAudio: false,
    supportsImage: true,
    urlScheme: 'fb://',
    webUrl: 'https://www.facebook.com/sharer/sharer.php',
    hashtagPrefix: '#',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    color: '#FFFC00',
    icon: 'camera',
    maxLength: 250,
    supportsVideo: true,
    supportsAudio: true,
    supportsImage: true,
    urlScheme: 'snapchat://',
    webUrl: 'https://www.snapchat.com',
    hashtagPrefix: '',
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    color: '#FF0000',
    icon: 'youtube',
    maxLength: 100,
    supportsVideo: true,
    supportsAudio: true,
    supportsImage: false,
    urlScheme: 'youtube://',
    webUrl: 'https://www.youtube.com/shorts',
    hashtagPrefix: '#',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    color: '#FF4500',
    icon: 'message-circle',
    maxLength: 40000,
    supportsVideo: true,
    supportsAudio: false,
    supportsImage: true,
    urlScheme: 'reddit://',
    webUrl: 'https://www.reddit.com/submit',
    hashtagPrefix: '',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    icon: 'message-circle',
    maxLength: 65536,
    supportsVideo: true,
    supportsAudio: true,
    supportsImage: true,
    urlScheme: 'whatsapp://',
    webUrl: 'https://api.whatsapp.com/send',
    hashtagPrefix: '',
  },
  {
    id: 'sms',
    name: 'SMS',
    color: '#34C759',
    icon: 'message-square',
    maxLength: 1600,
    supportsVideo: false,
    supportsAudio: false,
    supportsImage: true,
    urlScheme: 'sms:',
    webUrl: 'sms:',
    hashtagPrefix: '',
  },
  {
    id: 'imessage',
    name: 'iMessage',
    color: '#007AFF',
    icon: 'message-circle',
    maxLength: 20000,
    supportsVideo: true,
    supportsAudio: true,
    supportsImage: true,
    urlScheme: 'imessage://',
    webUrl: 'sms:',
    hashtagPrefix: '',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: 'linkedin',
    maxLength: 3000,
    supportsVideo: true,
    supportsAudio: false,
    supportsImage: true,
    urlScheme: 'linkedin://',
    webUrl: 'https://www.linkedin.com/sharing/share-offsite/',
    hashtagPrefix: '#',
  },
];

export interface ShareTemplate {
  id: string;
  name: string;
  category: 'win' | 'loss' | 'streak' | 'fever' | 'learning' | 'challenge';
  isPremium: boolean;
  textTemplate: string;
  overlayStyle: 'minimal' | 'bold' | 'neon' | 'retro' | 'gradient';
  suggestedHashtags: string[];
  emoji: string;
}

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: 'classic_win',
    name: 'Classic Win',
    category: 'win',
    isPremium: false,
    textTemplate: '🎵 Melodyx #{puzzleNumber}\n{guessCount}/6 guesses\n🔥 {streak} day streak!\n\nPlay: melodyx.app',
    overlayStyle: 'minimal',
    suggestedHashtags: ['Melodyx', 'MusicPuzzle', 'DailyChallenge'],
    emoji: '🎵',
  },
  {
    id: 'brag_win',
    name: 'Brag Mode',
    category: 'win',
    isPremium: false,
    textTemplate: '🏆 CRUSHED IT!\n\nMelodyx #{puzzleNumber}\n{guessCount}/6 • {streak}🔥\n\n"{songName}" by {artist}\n\nCan you beat me?',
    overlayStyle: 'bold',
    suggestedHashtags: ['Melodyx', 'MusicBoss', 'GameOn'],
    emoji: '🏆',
  },
  {
    id: 'minimal_win',
    name: 'Minimal',
    category: 'win',
    isPremium: false,
    textTemplate: 'Melodyx #{puzzleNumber} ✅\n{guessCount}/6',
    overlayStyle: 'minimal',
    suggestedHashtags: ['Melodyx'],
    emoji: '✅',
  },
  {
    id: 'story_win',
    name: 'Story Time',
    category: 'win',
    isPremium: false,
    textTemplate: 'Today I proved my ears work! 👂\n\nMelodyx #{puzzleNumber}: {guessCount}/6\n"{songName}" 🎵\n\n{streak > 1 ? streak + " days strong! " : ""}Who else plays?',
    overlayStyle: 'gradient',
    suggestedHashtags: ['Melodyx', 'MusicTrivia', 'DailyGame'],
    emoji: '👂',
  },
  {
    id: 'neon_win',
    name: 'Neon Vibes',
    category: 'win',
    isPremium: true,
    textTemplate: '⚡ MELODY MASTER ⚡\n\n#{puzzleNumber} • {guessCount}/6\n🎶 {songName}\n\n#Melodyx #NeonVibes',
    overlayStyle: 'neon',
    suggestedHashtags: ['Melodyx', 'NeonVibes', 'MusicGame'],
    emoji: '⚡',
  },
  {
    id: 'retro_win',
    name: 'Retro Style',
    category: 'win',
    isPremium: true,
    textTemplate: '🕹️ [MELODYX #{puzzleNumber}]\n>>> SCORE: {guessCount}/6\n>>> STREAK: {streak}\n>>> SONG: {songName}\n\nPLAY NOW >>',
    overlayStyle: 'retro',
    suggestedHashtags: ['Melodyx', 'RetroGamer', 'Arcade'],
    emoji: '🕹️',
  },
  {
    id: 'close_loss',
    name: 'So Close',
    category: 'loss',
    isPremium: false,
    textTemplate: 'Melodyx #{puzzleNumber}\nSo close! 😅\n\nIt was "{songName}"\n\nTry it yourself!',
    overlayStyle: 'minimal',
    suggestedHashtags: ['Melodyx', 'AlmostHadIt'],
    emoji: '😅',
  },
  {
    id: 'challenge_loss',
    name: 'Challenge Mode',
    category: 'loss',
    isPremium: false,
    textTemplate: '🎯 This one got me!\n\nMelodyx #{puzzleNumber}\nCan YOU guess "{songName}"?\n\nChallenge accepted? 👇',
    overlayStyle: 'bold',
    suggestedHashtags: ['Melodyx', 'Challenge', 'MusicTrivia'],
    emoji: '🎯',
  },
  {
    id: 'fever_score',
    name: 'Fever Champion',
    category: 'fever',
    isPremium: false,
    textTemplate: '🔥 FEVER MODE 🔥\n\nScore: {score} points\nChain: {chain}x\n\nThink you can beat me?',
    overlayStyle: 'neon',
    suggestedHashtags: ['Melodyx', 'FeverMode', 'HighScore'],
    emoji: '🔥',
  },
  {
    id: 'streak_milestone',
    name: 'Streak King',
    category: 'streak',
    isPremium: false,
    textTemplate: '👑 {streak} DAY STREAK 👑\n\nMelodyx #{puzzleNumber}\nNever missing a beat! 🎵\n\nJoin the challenge!',
    overlayStyle: 'gradient',
    suggestedHashtags: ['Melodyx', 'StreakKing', 'DailyGamer'],
    emoji: '👑',
  },
  {
    id: 'learning_progress',
    name: 'Learning Journey',
    category: 'learning',
    isPremium: false,
    textTemplate: '🎹 Learning Progress\n\nAccuracy: {accuracy}%\nSongs Mastered: {mastered}\n\nMy musical journey continues! 🎶',
    overlayStyle: 'gradient',
    suggestedHashtags: ['Melodyx', 'MusicLearning', 'Practice'],
    emoji: '🎹',
  },
  {
    id: 'viral_challenge',
    name: 'Viral Challenge',
    category: 'challenge',
    isPremium: true,
    textTemplate: '🚨 MELODYX CHALLENGE 🚨\n\nI got {guessCount}/6 on "{songName}"\n\nTag a friend who can\'t beat this! 👀\n\n#MelodyxChallenge',
    overlayStyle: 'neon',
    suggestedHashtags: ['MelodyxChallenge', 'MusicChallenge', 'Viral'],
    emoji: '🚨',
  },
];

export interface ShareSticker {
  id: string;
  name: string;
  emoji: string;
  category: 'reaction' | 'celebration' | 'music' | 'gaming' | 'premium';
  isPremium: boolean;
}

export const SHARE_STICKERS: ShareSticker[] = [
  { id: 'fire', name: 'Fire', emoji: '🔥', category: 'reaction', isPremium: false },
  { id: 'star', name: 'Star', emoji: '⭐', category: 'reaction', isPremium: false },
  { id: 'trophy', name: 'Trophy', emoji: '🏆', category: 'celebration', isPremium: false },
  { id: 'party', name: 'Party', emoji: '🎉', category: 'celebration', isPremium: false },
  { id: 'music', name: 'Music', emoji: '🎵', category: 'music', isPremium: false },
  { id: 'headphones', name: 'Headphones', emoji: '🎧', category: 'music', isPremium: false },
  { id: 'piano', name: 'Piano', emoji: '🎹', category: 'music', isPremium: false },
  { id: 'guitar', name: 'Guitar', emoji: '🎸', category: 'music', isPremium: false },
  { id: 'mic', name: 'Microphone', emoji: '🎤', category: 'music', isPremium: false },
  { id: 'gamepad', name: 'Gamepad', emoji: '🎮', category: 'gaming', isPremium: false },
  { id: 'target', name: 'Target', emoji: '🎯', category: 'gaming', isPremium: false },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', category: 'gaming', isPremium: false },
  { id: 'crown', name: 'Crown', emoji: '👑', category: 'premium', isPremium: true },
  { id: 'gem', name: 'Gem', emoji: '💎', category: 'premium', isPremium: true },
  { id: 'lightning', name: 'Lightning', emoji: '⚡', category: 'premium', isPremium: true },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', category: 'premium', isPremium: true },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', category: 'premium', isPremium: true },
  { id: 'sparkles', name: 'Sparkles', emoji: '✨', category: 'premium', isPremium: true },
];

export interface ShareFilter {
  id: string;
  name: string;
  style: Record<string, string | number>;
  isPremium: boolean;
}

export const SHARE_FILTERS: ShareFilter[] = [
  { id: 'none', name: 'None', style: {}, isPremium: false },
  { id: 'vibrant', name: 'Vibrant', style: { saturation: 1.3, contrast: 1.1 }, isPremium: false },
  { id: 'muted', name: 'Muted', style: { saturation: 0.7, brightness: 1.05 }, isPremium: false },
  { id: 'warm', name: 'Warm', style: { temperature: 20, tint: 10 }, isPremium: false },
  { id: 'cool', name: 'Cool', style: { temperature: -20, tint: -5 }, isPremium: true },
  { id: 'noir', name: 'Noir', style: { saturation: 0, contrast: 1.3 }, isPremium: true },
  { id: 'vintage', name: 'Vintage', style: { saturation: 0.8, sepia: 0.3, contrast: 0.9 }, isPremium: true },
  { id: 'neon', name: 'Neon', style: { saturation: 1.5, contrast: 1.2, brightness: 1.1 }, isPremium: true },
];

export interface ShareEffect {
  id: string;
  name: string;
  type: 'animation' | 'overlay' | 'transition';
  isPremium: boolean;
}

export const SHARE_EFFECTS: ShareEffect[] = [
  { id: 'none', name: 'None', type: 'animation', isPremium: false },
  { id: 'pulse', name: 'Pulse', type: 'animation', isPremium: false },
  { id: 'bounce', name: 'Bounce', type: 'animation', isPremium: false },
  { id: 'confetti', name: 'Confetti', type: 'overlay', isPremium: false },
  { id: 'sparkle', name: 'Sparkle', type: 'overlay', isPremium: true },
  { id: 'fireworks', name: 'Fireworks', type: 'overlay', isPremium: true },
  { id: 'rainbow', name: 'Rainbow', type: 'overlay', isPremium: true },
  { id: 'slide', name: 'Slide In', type: 'transition', isPremium: false },
  { id: 'fade', name: 'Fade', type: 'transition', isPremium: false },
  { id: 'zoom', name: 'Zoom', type: 'transition', isPremium: true },
  { id: 'flip', name: 'Flip', type: 'transition', isPremium: true },
];

export const AI_CAPTION_PROMPTS = [
  "Just crushed today's melody puzzle! 🎵",
  "My ears are getting sharper! 👂🔥",
  "Can you beat my score? Challenge accepted! 🎯",
  "Music genius mode: ACTIVATED 🧠🎶",
  "Another day, another melody mastered! 💪",
  "Who knew I had perfect pitch? 😏🎵",
  "Name that tune champion over here! 🏆",
  "My playlist knowledge is unmatched! 🎧",
  "Melody recognition: 100% 📈",
  "The rhythm is in my soul! 💃🎶",
];

export const TRENDING_HASHTAGS = [
  '#Melodyx',
  '#MusicPuzzle',
  '#DailyChallenge',
  '#MusicGame',
  '#GuessThatTune',
  '#MusicTrivia',
  '#BrainGames',
  '#PuzzleGame',
  '#MusicLover',
  '#GameOn',
  '#DailyGamer',
  '#MusicChallenge',
  '#EarTraining',
  '#MusicEducation',
];

export const PLATFORM_SPECIFIC_HASHTAGS: Record<string, string[]> = {
  tiktok: ['#fyp', '#foryou', '#musicchallenge', '#duet'],
  instagram: ['#instagame', '#instadaily', '#musicofinstagram'],
  x: ['#GameTwitter', '#MusicTwitter'],
  youtube: ['#Shorts', '#YTShorts'],
  reddit: [],
  facebook: [],
  snapchat: [],
  whatsapp: [],
};

export interface ShareAnalytics {
  platform: string;
  templateId: string;
  hasStickers: boolean;
  hasFilters: boolean;
  hasEffects: boolean;
  includesAudio: boolean;
  timestamp: string;
  shareType: 'text' | 'image' | 'video';
}

export const SHARE_LIMITS = {
  free: {
    dailyShares: 5,
    templates: SHARE_TEMPLATES.filter(t => !t.isPremium).length,
    stickers: SHARE_STICKERS.filter(s => !s.isPremium).length,
    filters: SHARE_FILTERS.filter(f => !f.isPremium).length,
    effects: SHARE_EFFECTS.filter(e => !e.isPremium).length,
    includeWatermark: true,
    maxExportQuality: 'standard' as const,
  },
  premium: {
    dailyShares: -1,
    templates: SHARE_TEMPLATES.length,
    stickers: SHARE_STICKERS.length,
    filters: SHARE_FILTERS.length,
    effects: SHARE_EFFECTS.length,
    includeWatermark: false,
    maxExportQuality: 'high' as const,
  },
};

export const LEGAL_DISCLAIMER = `
User-generated content disclaimer: Content shared through Melodyx is created by users and may contain copyrighted material used under fair use for educational and entertainment purposes. Short audio snippets (<30 seconds) are used for music recognition games only. Users are responsible for ensuring their shared content complies with platform terms of service. Melodyx does not claim ownership of any third-party music or content.
`;

export const SHARE_WATERMARK = {
  text: 'Made with Melodyx 🎵',
  position: 'bottom-right' as const,
  opacity: 0.7,
};
