import { MELODIES, Melody, Theme, THEMES, GENRE_THEMES, getDailySeed, seededRandom } from './melodies';

export interface AISelection {
  melody: Melody;
  theme: Theme;
  themeDescription: string;
  aiReasoning: string;
}

const THEME_DESCRIPTIONS: Record<Theme, string> = {
  upbeat: "Today's vibe: Feel-good energy! 🎉",
  nostalgic: "Today's vibe: A trip down memory lane 💭",
  epic: "Today's vibe: Grand and cinematic! 🎬",
  playful: "Today's vibe: Fun and lighthearted 🎮",
  dramatic: "Today's vibe: Intense and powerful ⚡",
  peaceful: "Today's vibe: Calm and serene 🌸",
  mysterious: "Today's vibe: Intriguing and suspenseful 🔮",
  energetic: "Today's vibe: High energy beats! 🔥",
};

const AI_REASONING_TEMPLATES = [
  "Selected based on today's {theme} theme - this melody captures the essence perfectly.",
  "AI picked this {genre} classic because it matches today's {theme} mood.",
  "Today's theme is {theme}, and this {era} melody fits the bill!",
  "The algorithm chose this for its {mood} qualities - perfect for today!",
  "Based on pattern analysis, this {genre} tune resonates with the {theme} theme.",
];

function getMelodiesByTheme(theme: Theme): Melody[] {
  return MELODIES.filter(melody => {
    const genreThemes = GENRE_THEMES[melody.genre] || [];
    return genreThemes.includes(theme) || melody.mood === theme;
  });
}

function getRecentlyUsedSeeds(currentSeed: number, daysBack: number = 7): number[] {
  const seeds: number[] = [];
  for (let i = 1; i <= daysBack; i++) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - i);
    const dateString = `${pastDate.getFullYear()}-${pastDate.getMonth() + 1}-${pastDate.getDate()}`;
    let hash = 0;
    for (let j = 0; j < dateString.length; j++) {
      const char = dateString.charCodeAt(j);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    seeds.push(Math.abs(hash));
  }
  return seeds;
}

function getRecentMelodyIndices(seeds: number[]): number[] {
  return seeds.map(seed => Math.floor(seededRandom(seed) * MELODIES.length));
}

export function aiChooseSong(): AISelection {
  const seed = getDailySeed();
  
  const themeIndex = Math.floor(seededRandom(seed + 100) * THEMES.length);
  const theme = THEMES[themeIndex];
  
  const themedMelodies = getMelodiesByTheme(theme);
  
  const recentSeeds = getRecentlyUsedSeeds(seed);
  const recentIndices = getRecentMelodyIndices(recentSeeds);
  
  const availableMelodies = themedMelodies.filter((_, idx) => {
    const globalIdx = MELODIES.indexOf(themedMelodies[idx]);
    return !recentIndices.includes(globalIdx);
  });
  
  const melodiesToChooseFrom = availableMelodies.length > 0 ? availableMelodies : themedMelodies;
  
  const melodyIndex = Math.floor(seededRandom(seed + 200) * melodiesToChooseFrom.length);
  const selectedMelody = melodiesToChooseFrom[melodyIndex] || MELODIES[0];
  
  const reasoningIndex = Math.floor(seededRandom(seed + 300) * AI_REASONING_TEMPLATES.length);
  const reasoningTemplate = AI_REASONING_TEMPLATES[reasoningIndex];
  const aiReasoning = reasoningTemplate
    .replace('{theme}', theme)
    .replace('{genre}', selectedMelody.genre)
    .replace('{era}', selectedMelody.era)
    .replace('{mood}', selectedMelody.mood);
  
  console.log(`AI Song Selection - Theme: ${theme}, Song: ${selectedMelody.name}`);
  
  return {
    melody: selectedMelody,
    theme,
    themeDescription: THEME_DESCRIPTIONS[theme],
    aiReasoning,
  };
}

export function getHintNotes(melody: Melody, count: number = 3): string[] {
  return melody.notes.slice(0, Math.min(count, melody.notes.length));
}

export function getSnippetNotes(melody: Melody): string[] {
  return melody.extendedNotes;
}

export function getGenreEmoji(genre: string): string {
  const emojiMap: Record<string, string> = {
    'Video Game': '🎮',
    'Movie': '🎬',
    'Classical': '🎻',
    'Nursery': '👶',
    'Holiday': '🎄',
    'TV': '📺',
    'Pop': '🎤',
    'Rock': '🎸',
    '80s': '💿',
    'Meme': '😂',
    'Viral': '🔥',
    'Disney': '🏰',
    'Pop Culture': '📱',
    'Classic': '🎵',
  };
  return emojiMap[genre] || '🎵';
}

export function getThemeEmoji(theme: Theme): string {
  const emojiMap: Record<Theme, string> = {
    upbeat: '🎉',
    nostalgic: '💭',
    epic: '🎬',
    playful: '🎮',
    dramatic: '⚡',
    peaceful: '🌸',
    mysterious: '🔮',
    energetic: '🔥',
  };
  return emojiMap[theme];
}
