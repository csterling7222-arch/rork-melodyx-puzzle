export interface Melody {
  name: string;
  notes: string[];
  hint: string;
  category: string;
  genre: string;
  era: string;
  extendedNotes: string[];
  mood: string;
  country?: string;
  flag?: string;
  artist?: string;
}

export const THEMES = [
  'upbeat',
  'nostalgic',
  'epic',
  'playful',
  'dramatic',
  'peaceful',
  'mysterious',
  'energetic',
] as const;

export type Theme = typeof THEMES[number];

export const GENRE_THEMES: Record<string, Theme[]> = {
  'Video Game': ['playful', 'epic', 'energetic'],
  'Movie': ['epic', 'dramatic', 'mysterious'],
  'Classical': ['peaceful', 'dramatic', 'nostalgic'],
  'Nursery': ['playful', 'peaceful', 'upbeat'],
  'Holiday': ['upbeat', 'nostalgic', 'playful'],
  'TV': ['nostalgic', 'dramatic', 'upbeat'],
  'Pop': ['upbeat', 'energetic', 'playful'],
  'Rock': ['energetic', 'epic', 'dramatic'],
  '80s': ['nostalgic', 'energetic', 'upbeat'],
  'Meme': ['playful', 'upbeat', 'energetic'],
  'Viral': ['upbeat', 'playful', 'energetic'],
  'Disney': ['upbeat', 'playful', 'epic'],
  'Pop Culture': ['nostalgic', 'playful', 'upbeat'],
  'International': ['peaceful', 'nostalgic', 'upbeat'],
  'Folk': ['peaceful', 'nostalgic', 'upbeat'],
};

export const MELODIES: Melody[] = [
  // Classic & Nursery
  { 
    name: "Happy Birthday", 
    notes: ["G", "G", "A", "G", "C", "B"], 
    extendedNotes: ["G", "G", "A", "G", "C", "B", "G", "G", "A", "G", "D", "C"],
    hint: "Everyone sings this once a year", 
    category: "Classic",
    genre: "Classic",
    era: "Traditional",
    mood: "upbeat"
  },
  { 
    name: "Twinkle Twinkle", 
    notes: ["C", "C", "G", "G", "A", "A", "G"], 
    extendedNotes: ["C", "C", "G", "G", "A", "A", "G", "F", "F", "E", "E", "D", "D", "C"],
    hint: "Look up at the night sky", 
    category: "Nursery",
    genre: "Nursery",
    era: "Traditional",
    mood: "peaceful"
  },
  { 
    name: "Mary Had a Little Lamb", 
    notes: ["E", "D", "C", "D", "E", "E", "E"], 
    extendedNotes: ["E", "D", "C", "D", "E", "E", "E", "D", "D", "D", "E", "G", "G"],
    hint: "A farm animal follows someone to school", 
    category: "Nursery",
    genre: "Nursery",
    era: "Traditional",
    mood: "playful"
  },
  { 
    name: "Jingle Bells", 
    notes: ["E", "E", "E", "E", "E", "E", "E"], 
    extendedNotes: ["E", "E", "E", "E", "E", "E", "E", "G", "C", "D", "E", "F", "F", "F"],
    hint: "Dashing through the snow", 
    category: "Holiday",
    genre: "Holiday",
    era: "Traditional",
    mood: "upbeat"
  },
  { 
    name: "Row Row Row", 
    notes: ["C", "C", "C", "D", "E", "E"], 
    extendedNotes: ["C", "C", "C", "D", "E", "E", "D", "E", "F", "G", "C", "C", "C"],
    hint: "Gently down the stream", 
    category: "Nursery",
    genre: "Nursery",
    era: "Traditional",
    mood: "peaceful"
  },
  { 
    name: "London Bridge", 
    notes: ["G", "A", "G", "F", "E", "F", "G"], 
    extendedNotes: ["G", "A", "G", "F", "E", "F", "G", "D", "E", "F", "E", "F", "G"],
    hint: "It's falling down", 
    category: "Nursery",
    genre: "Nursery",
    era: "Traditional",
    mood: "playful"
  },

  // Video Games
  { 
    name: "Super Mario Bros", 
    notes: ["E", "E", "E", "C", "E", "G"], 
    extendedNotes: ["E", "E", "E", "C", "E", "G", "G", "C", "G", "E", "A", "B"],
    hint: "A plumber's adventure begins", 
    category: "Video Game",
    genre: "Video Game",
    era: "80s",
    mood: "playful"
  },
  { 
    name: "Tetris Theme", 
    notes: ["E", "B", "C", "D", "C", "B", "A"], 
    extendedNotes: ["E", "B", "C", "D", "C", "B", "A", "A", "C", "E", "D", "C", "B"],
    hint: "Blocks falling endlessly", 
    category: "Video Game",
    genre: "Video Game",
    era: "80s",
    mood: "energetic"
  },
  { 
    name: "Zelda Theme", 
    notes: ["A", "E", "A", "A", "B", "C#"], 
    extendedNotes: ["A", "E", "A", "A", "B", "C#", "D", "E", "A", "G", "A", "E"],
    hint: "A hero's legendary adventure", 
    category: "Video Game",
    genre: "Video Game",
    era: "80s",
    mood: "epic"
  },
  { 
    name: "Pac-Man Start", 
    notes: ["B", "B", "B", "F#", "F#", "B"], 
    extendedNotes: ["B", "B", "B", "F#", "F#", "B", "B", "F#", "F#", "B", "A#", "A"],
    hint: "Wakka wakka wakka", 
    category: "Video Game",
    genre: "Video Game",
    era: "80s",
    mood: "playful"
  },
  { 
    name: "Minecraft Theme", 
    notes: ["E", "G", "A", "E", "G", "B"], 
    extendedNotes: ["E", "G", "A", "E", "G", "B", "A", "G", "E", "D", "E", "G"],
    hint: "Build and survive", 
    category: "Video Game",
    genre: "Video Game",
    era: "2010s",
    mood: "peaceful"
  },
  { 
    name: "Sonic Green Hill", 
    notes: ["E", "E", "F", "G", "G", "F", "E"], 
    extendedNotes: ["E", "E", "F", "G", "G", "F", "E", "D", "C", "C", "D", "E", "E"],
    hint: "Gotta go fast", 
    category: "Video Game",
    genre: "Video Game",
    era: "90s",
    mood: "energetic"
  },

  // Classical
  { 
    name: "Ode to Joy", 
    notes: ["E", "E", "F", "G", "G", "F", "E"], 
    extendedNotes: ["E", "E", "F", "G", "G", "F", "E", "D", "C", "C", "D", "E", "E", "D", "D"],
    hint: "Beethoven's famous symphony finale", 
    category: "Classical",
    genre: "Classical",
    era: "Classical",
    mood: "epic"
  },
  { 
    name: "Fur Elise", 
    notes: ["E", "D#", "E", "D#", "E", "B"], 
    extendedNotes: ["E", "D#", "E", "D#", "E", "B", "D", "C", "A", "C", "E", "A", "B"],
    hint: "A famous Beethoven piano piece", 
    category: "Classical",
    genre: "Classical",
    era: "Classical",
    mood: "nostalgic"
  },
  { 
    name: "Beethoven's 5th", 
    notes: ["G", "G", "G", "D#", "F", "F"], 
    extendedNotes: ["G", "G", "G", "D#", "F", "F", "F", "D", "G", "G", "G", "D#"],
    hint: "Da-da-da-DUM", 
    category: "Classical",
    genre: "Classical",
    era: "Classical",
    mood: "dramatic"
  },
  { 
    name: "Moonlight Sonata", 
    notes: ["G#", "C#", "E", "G#", "C#", "E"], 
    extendedNotes: ["G#", "C#", "E", "G#", "C#", "E", "G#", "C#", "E", "A", "C#", "E"],
    hint: "Beethoven's most emotional piece", 
    category: "Classical",
    genre: "Classical",
    era: "Classical",
    mood: "peaceful"
  },
  { 
    name: "Canon in D", 
    notes: ["F#", "E", "D", "C#", "B", "A"], 
    extendedNotes: ["F#", "E", "D", "C#", "B", "A", "B", "C#", "D", "C#", "B", "A", "G"],
    hint: "Wedding ceremony favorite", 
    category: "Classical",
    genre: "Classical",
    era: "Baroque",
    mood: "peaceful"
  },
  { 
    name: "Swan Lake", 
    notes: ["E", "E", "E", "D", "C", "D"], 
    extendedNotes: ["E", "E", "E", "D", "C", "D", "E", "G", "C", "B", "A", "G", "F#"],
    hint: "Tchaikovsky's ballet masterpiece", 
    category: "Classical",
    genre: "Classical",
    era: "Romantic",
    mood: "dramatic"
  },
  { 
    name: "Flight of Bumblebee", 
    notes: ["C", "C#", "D", "D#", "E", "F"], 
    extendedNotes: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
    hint: "A buzzing fast classical piece", 
    category: "Classical",
    genre: "Classical",
    era: "Romantic",
    mood: "energetic"
  },
  { 
    name: "Turkish March", 
    notes: ["B", "A", "G#", "A", "C", "A"], 
    extendedNotes: ["B", "A", "G#", "A", "C", "A", "B", "A", "G#", "A", "D", "C", "B"],
    hint: "Mozart's famous piano rondo", 
    category: "Classical",
    genre: "Classical",
    era: "Classical",
    mood: "playful"
  },

  // Movies
  { 
    name: "Star Wars", 
    notes: ["G", "G", "G", "C", "G", "F"], 
    extendedNotes: ["G", "G", "G", "C", "G", "F", "E", "D", "C", "G", "F", "E", "D", "C"],
    hint: "A long time ago in a galaxy far away", 
    category: "Movie",
    genre: "Movie",
    era: "70s",
    mood: "epic"
  },
  { 
    name: "Pink Panther", 
    notes: ["C#", "D", "E", "F", "C#", "D"], 
    extendedNotes: ["C#", "D", "E", "F", "C#", "D", "E", "C#", "D", "E", "F", "A", "G"],
    hint: "A sneaky detective theme", 
    category: "Movie",
    genre: "Movie",
    era: "60s",
    mood: "mysterious"
  },
  { 
    name: "Imperial March", 
    notes: ["G", "G", "G", "D#", "A#", "G"], 
    extendedNotes: ["G", "G", "G", "D#", "A#", "G", "D#", "A#", "G", "D", "D", "D", "D#"],
    hint: "The villain's entrance music", 
    category: "Movie",
    genre: "Movie",
    era: "70s",
    mood: "dramatic"
  },
  { 
    name: "Mission Impossible", 
    notes: ["G", "A#", "G", "C", "G", "D#"], 
    extendedNotes: ["G", "A#", "G", "C", "G", "D#", "G", "A#", "G", "C", "G", "F", "F#"],
    hint: "Your mission, should you choose to accept", 
    category: "Movie",
    genre: "Movie",
    era: "90s",
    mood: "mysterious"
  },
  { 
    name: "Jaws Theme", 
    notes: ["E", "F", "E", "F", "E", "F"], 
    extendedNotes: ["E", "F", "E", "F", "E", "F", "E", "F", "G", "A", "B", "C"],
    hint: "Something lurks beneath the water", 
    category: "Movie",
    genre: "Movie",
    era: "70s",
    mood: "dramatic"
  },
  { 
    name: "Hedwig's Theme", 
    notes: ["B", "E", "G", "F#", "E", "B"], 
    extendedNotes: ["B", "E", "G", "F#", "E", "B", "A", "F#", "E", "G", "F#", "D#", "F"],
    hint: "A magical owl delivers messages", 
    category: "Movie",
    genre: "Movie",
    era: "2000s",
    mood: "mysterious"
  },
  { 
    name: "Pirates of Caribbean", 
    notes: ["D", "D", "D", "D", "D", "D", "D"], 
    extendedNotes: ["D", "D", "D", "D", "D", "D", "D", "D", "A", "C", "D", "D", "E", "F"],
    hint: "Yo ho, a pirate's life", 
    category: "Movie",
    genre: "Movie",
    era: "2000s",
    mood: "epic"
  },
  { 
    name: "Jurassic Park", 
    notes: ["B", "A", "B", "F#", "F#", "E"], 
    extendedNotes: ["B", "A", "B", "F#", "F#", "E", "F#", "B", "A", "B", "E", "F#"],
    hint: "Life finds a way", 
    category: "Movie",
    genre: "Movie",
    era: "90s",
    mood: "epic"
  },
  { 
    name: "The Godfather", 
    notes: ["A", "C", "B", "A", "G#", "A"], 
    extendedNotes: ["A", "C", "B", "A", "G#", "A", "E", "A", "C", "B", "A", "G#", "A"],
    hint: "An offer you can't refuse", 
    category: "Movie",
    genre: "Movie",
    era: "70s",
    mood: "dramatic"
  },

  // TV Shows
  { 
    name: "Game of Thrones", 
    notes: ["G", "C", "D#", "F", "G", "C"], 
    extendedNotes: ["G", "C", "D#", "F", "G", "C", "D#", "F", "D", "G", "A#", "C"],
    hint: "Winter is coming", 
    category: "TV",
    genre: "TV",
    era: "2010s",
    mood: "epic"
  },
  { 
    name: "Stranger Things", 
    notes: ["C", "E", "G", "B", "C", "E"], 
    extendedNotes: ["C", "E", "G", "B", "C", "E", "G", "B", "A", "F#", "D", "B"],
    hint: "Things get weird in the 80s", 
    category: "TV",
    genre: "TV",
    era: "2010s",
    mood: "mysterious"
  },
  { 
    name: "Friends Theme", 
    notes: ["G", "A", "B", "D", "A", "G"], 
    extendedNotes: ["G", "A", "B", "D", "A", "G", "E", "D", "C", "D", "E", "G"],
    hint: "I'll be there for you", 
    category: "TV",
    genre: "TV",
    era: "90s",
    mood: "upbeat"
  },
  { 
    name: "Simpsons Theme", 
    notes: ["C", "E", "F#", "A", "G", "E"], 
    extendedNotes: ["C", "E", "F#", "A", "G", "E", "C", "A", "F#", "F#", "F#", "G", "A"],
    hint: "D'oh! A yellow family", 
    category: "TV",
    genre: "TV",
    era: "90s",
    mood: "playful"
  },
  { 
    name: "Pink Floyd - Another", 
    notes: ["G", "D", "F", "E", "D", "C"], 
    extendedNotes: ["G", "D", "F", "E", "D", "C", "D", "G", "D", "F", "E", "D", "C"],
    hint: "Just another brick in the wall", 
    category: "Rock",
    genre: "Rock",
    era: "70s",
    mood: "dramatic"
  },

  // Pop & Rock
  { 
    name: "Take On Me", 
    notes: ["F#", "F#", "D", "B", "B", "E"], 
    extendedNotes: ["F#", "F#", "D", "B", "B", "E", "E", "E", "G#", "G#", "A", "B", "A"],
    hint: "An 80s synth-pop classic", 
    category: "80s",
    genre: "80s",
    era: "80s",
    mood: "energetic"
  },
  { 
    name: "Smoke on the Water", 
    notes: ["G", "A#", "C", "G", "A#", "C#"], 
    extendedNotes: ["G", "A#", "C", "G", "A#", "C#", "C", "G", "A#", "C", "A#", "G"],
    hint: "Deep Purple's iconic riff", 
    category: "Rock",
    genre: "Rock",
    era: "70s",
    mood: "energetic"
  },
  { 
    name: "Seven Nation Army", 
    notes: ["E", "E", "G", "E", "D", "C"], 
    extendedNotes: ["E", "E", "G", "E", "D", "C", "B", "E", "E", "G", "E", "D", "C", "D", "C"],
    hint: "A White Stripes stadium anthem", 
    category: "Rock",
    genre: "Rock",
    era: "2000s",
    mood: "energetic"
  },
  { 
    name: "Bohemian Rhapsody", 
    notes: ["A#", "G", "A#", "F", "D#", "D"], 
    extendedNotes: ["A#", "G", "A#", "F", "D#", "D", "C", "A#", "G", "F", "G", "A#"],
    hint: "Is this real life?", 
    category: "Rock",
    genre: "Rock",
    era: "70s",
    mood: "dramatic"
  },
  { 
    name: "Sweet Child", 
    notes: ["D", "D", "E", "G", "A", "G"], 
    extendedNotes: ["D", "D", "E", "G", "A", "G", "E", "D", "D", "E", "G", "A", "G", "E"],
    hint: "Guns N' Roses' iconic intro", 
    category: "Rock",
    genre: "Rock",
    era: "80s",
    mood: "nostalgic"
  },
  { 
    name: "Thunderstruck", 
    notes: ["B", "A", "G#", "A", "B", "E"], 
    extendedNotes: ["B", "A", "G#", "A", "B", "E", "B", "A", "G#", "A", "B", "G#", "A"],
    hint: "AC/DC's electrifying opener", 
    category: "Rock",
    genre: "Rock",
    era: "90s",
    mood: "energetic"
  },
  { 
    name: "Back in Black", 
    notes: ["E", "D", "A", "E", "D", "A"], 
    extendedNotes: ["E", "D", "A", "E", "D", "A", "E", "D", "A", "E", "B", "A", "G"],
    hint: "AC/DC's comeback anthem", 
    category: "Rock",
    genre: "Rock",
    era: "80s",
    mood: "energetic"
  },
  { 
    name: "Eye of Tiger", 
    notes: ["C", "C", "A#", "A#", "G#", "G#"], 
    extendedNotes: ["C", "C", "A#", "A#", "G#", "G#", "G", "G#", "A#", "C", "A#", "G#"],
    hint: "Rocky's training montage", 
    category: "80s",
    genre: "80s",
    era: "80s",
    mood: "energetic"
  },
  { 
    name: "Billie Jean", 
    notes: ["F#", "F#", "E", "F#", "F#", "B"], 
    extendedNotes: ["F#", "F#", "E", "F#", "F#", "B", "A", "G#", "F#", "E", "D#", "E", "F#"],
    hint: "The kid is not my son", 
    category: "80s",
    genre: "80s",
    era: "80s",
    mood: "energetic"
  },

  // Modern Pop
  { 
    name: "Uptown Funk", 
    notes: ["D", "F", "G", "A", "D", "C"], 
    extendedNotes: ["D", "F", "G", "A", "D", "C", "A", "G", "F", "D", "C", "D", "F"],
    hint: "Don't believe me just watch", 
    category: "Pop",
    genre: "Pop",
    era: "2010s",
    mood: "upbeat"
  },
  { 
    name: "Despacito", 
    notes: ["A", "A", "G", "G", "F", "F"], 
    extendedNotes: ["A", "A", "G", "G", "F", "F", "E", "E", "F", "G", "A", "A", "G"],
    hint: "A Spanish viral sensation", 
    category: "Pop",
    genre: "Pop",
    era: "2010s",
    mood: "upbeat"
  },
  { 
    name: "Shape of You", 
    notes: ["C#", "C#", "B", "A", "B", "C#"], 
    extendedNotes: ["C#", "C#", "B", "A", "B", "C#", "D", "E", "F#", "E", "D", "C#", "B"],
    hint: "Ed Sheeran's dance hit", 
    category: "Pop",
    genre: "Pop",
    era: "2010s",
    mood: "upbeat"
  },
  { 
    name: "Bad Guy", 
    notes: ["G", "G", "D#", "D", "D", "A#"], 
    extendedNotes: ["G", "G", "D#", "D", "D", "A#", "G", "G", "D#", "D", "C", "A#", "G"],
    hint: "Billie Eilish's breakout hit", 
    category: "Pop",
    genre: "Pop",
    era: "2010s",
    mood: "mysterious"
  },
  { 
    name: "Blinding Lights", 
    notes: ["F", "D#", "F", "G", "G#", "G"], 
    extendedNotes: ["F", "D#", "F", "G", "G#", "G", "F", "D#", "C", "D#", "F", "G"],
    hint: "The Weeknd's 80s throwback", 
    category: "Pop",
    genre: "Pop",
    era: "2020s",
    mood: "nostalgic"
  },
  { 
    name: "Dance Monkey", 
    notes: ["F", "F", "F", "F", "E", "D"], 
    extendedNotes: ["F", "F", "F", "F", "E", "D", "C", "D", "E", "F", "F", "E", "D"],
    hint: "Dance for me, dance for me", 
    category: "Pop",
    genre: "Pop",
    era: "2010s",
    mood: "upbeat"
  },

  // Viral & Memes
  { 
    name: "Coffin Dance", 
    notes: ["F", "F", "A#", "F", "D#", "F"], 
    extendedNotes: ["F", "F", "A#", "F", "D#", "F", "C", "F", "F", "A#", "F", "G#", "G"],
    hint: "A viral funeral meme", 
    category: "Meme",
    genre: "Meme",
    era: "2020s",
    mood: "playful"
  },
  { 
    name: "Never Gonna Give", 
    notes: ["G", "A", "C", "A", "E", "E"], 
    extendedNotes: ["G", "A", "C", "A", "E", "E", "D", "G", "A", "C", "A", "D", "D"],
    hint: "You know the rules...", 
    category: "Meme",
    genre: "Meme",
    era: "80s",
    mood: "upbeat"
  },
  { 
    name: "Baby Shark", 
    notes: ["C", "D", "E", "E", "E", "E", "E"], 
    extendedNotes: ["C", "D", "E", "E", "E", "E", "E", "E", "E", "C", "D", "E", "E", "E"],
    hint: "Do do do do do do", 
    category: "Viral",
    genre: "Viral",
    era: "2010s",
    mood: "playful"
  },
  { 
    name: "Old Town Road", 
    notes: ["E", "E", "D", "E", "G", "A"], 
    extendedNotes: ["E", "E", "D", "E", "G", "A", "G", "E", "D", "E", "G", "E", "D"],
    hint: "Horse and tractor combo", 
    category: "Viral",
    genre: "Viral",
    era: "2010s",
    mood: "playful"
  },
  { 
    name: "Nokia Tune", 
    notes: ["E", "D", "F#", "G#", "C#", "B"], 
    extendedNotes: ["E", "D", "F#", "G#", "C#", "B", "D", "E", "B", "A", "C#", "E"],
    hint: "A classic phone ringtone", 
    category: "Pop Culture",
    genre: "Pop Culture",
    era: "90s",
    mood: "nostalgic"
  },

  // Disney
  { 
    name: "Let It Go", 
    notes: ["G", "A", "B", "B", "B", "A"], 
    extendedNotes: ["G", "A", "B", "B", "B", "A", "B", "E", "D", "E", "F#", "G", "A", "B"],
    hint: "The cold never bothered me", 
    category: "Disney",
    genre: "Disney",
    era: "2010s",
    mood: "epic"
  },
  { 
    name: "Under the Sea", 
    notes: ["C", "C", "C", "D", "E", "E"], 
    extendedNotes: ["C", "C", "C", "D", "E", "E", "E", "F", "G", "G", "G", "A", "G", "F"],
    hint: "Life is better under the ocean", 
    category: "Disney",
    genre: "Disney",
    era: "80s",
    mood: "upbeat"
  },
  { 
    name: "Circle of Life", 
    notes: ["F", "A#", "A", "G", "F", "D"], 
    extendedNotes: ["F", "A#", "A", "G", "F", "D", "F", "A#", "A", "G", "F", "E", "F"],
    hint: "Nants ingonyama bagithi", 
    category: "Disney",
    genre: "Disney",
    era: "90s",
    mood: "epic"
  },
  { 
    name: "Hakuna Matata", 
    notes: ["C", "E", "F", "G", "A", "G"], 
    extendedNotes: ["C", "E", "F", "G", "A", "G", "F", "E", "D", "C", "D", "E", "F"],
    hint: "No worries philosophy", 
    category: "Disney",
    genre: "Disney",
    era: "90s",
    mood: "playful"
  },
  { 
    name: "A Whole New World", 
    notes: ["D", "E", "F#", "G", "A", "B"], 
    extendedNotes: ["D", "E", "F#", "G", "A", "B", "A", "G", "F#", "E", "D", "E", "F#"],
    hint: "Magic carpet ride", 
    category: "Disney",
    genre: "Disney",
    era: "90s",
    mood: "peaceful"
  },
  { 
    name: "Be Our Guest", 
    notes: ["C", "C", "C", "D", "D#", "F"], 
    extendedNotes: ["C", "C", "C", "D", "D#", "F", "G", "A", "A#", "A", "G", "F"],
    hint: "Put our service to the test", 
    category: "Disney",
    genre: "Disney",
    era: "90s",
    mood: "playful"
  },

  // === INTERNATIONAL FOLK MELODIES ===
  // Japan
  { 
    name: "Sakura", 
    notes: ["D", "D", "F", "D", "D", "F"], 
    extendedNotes: ["D", "D", "F", "D", "D", "F", "G", "A", "A", "G", "F", "D", "D"],
    hint: "Cherry blossoms bloom in spring", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "Japan",
    flag: "🇯🇵"
  },
  { 
    name: "Koi No Yokan", 
    notes: ["A", "B", "D", "E", "D", "B"], 
    extendedNotes: ["A", "B", "D", "E", "D", "B", "A", "G", "A", "B", "D", "E"],
    hint: "Japanese love premonition", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "nostalgic",
    country: "Japan",
    flag: "🇯🇵"
  },

  // Korea
  { 
    name: "Arirang", 
    notes: ["G", "A", "C", "D", "E", "D"], 
    extendedNotes: ["G", "A", "C", "D", "E", "D", "C", "A", "G", "A", "C", "D"],
    hint: "Korea's beloved folk song", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "nostalgic",
    country: "Korea",
    flag: "🇰🇷"
  },
  { 
    name: "Doraji", 
    notes: ["E", "G", "A", "B", "A", "G"], 
    extendedNotes: ["E", "G", "A", "B", "A", "G", "E", "D", "E", "G", "A", "B"],
    hint: "Korean bellflower song", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "Korea",
    flag: "🇰🇷"
  },

  // China
  { 
    name: "Mo Li Hua", 
    notes: ["G", "A", "B", "D", "B", "A"], 
    extendedNotes: ["G", "A", "B", "D", "B", "A", "G", "E", "G", "A", "B", "D"],
    hint: "Beautiful jasmine flower", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "China",
    flag: "🇨🇳"
  },
  { 
    name: "Butterfly Lovers", 
    notes: ["E", "G", "A", "G", "E", "D"], 
    extendedNotes: ["E", "G", "A", "G", "E", "D", "E", "G", "A", "B", "A", "G"],
    hint: "Chinese Romeo and Juliet", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "dramatic",
    country: "China",
    flag: "🇨🇳"
  },

  // India
  { 
    name: "Raghupati Raghav", 
    notes: ["D", "E", "F#", "G", "A", "G"], 
    extendedNotes: ["D", "E", "F#", "G", "A", "G", "F#", "E", "D", "E", "F#", "G"],
    hint: "Gandhi's favorite hymn", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "India",
    flag: "🇮🇳"
  },
  { 
    name: "Vande Mataram", 
    notes: ["G", "A", "B", "C", "B", "A"], 
    extendedNotes: ["G", "A", "B", "C", "B", "A", "G", "F#", "G", "A", "B", "C"],
    hint: "I bow to thee, Mother", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "epic",
    country: "India",
    flag: "🇮🇳"
  },

  // Russia
  { 
    name: "Kalinka", 
    notes: ["A", "A", "G", "F#", "G", "A"], 
    extendedNotes: ["A", "A", "G", "F#", "G", "A", "B", "C", "B", "A", "G", "F#"],
    hint: "Russian folk dance song", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "energetic",
    country: "Russia",
    flag: "🇷🇺"
  },
  { 
    name: "Katyusha", 
    notes: ["E", "A", "G#", "A", "B", "C"], 
    extendedNotes: ["E", "A", "G#", "A", "B", "C", "B", "A", "G#", "A", "B", "E"],
    hint: "WWII Russian wartime song", 
    category: "International",
    genre: "Folk",
    era: "1940s",
    mood: "nostalgic",
    country: "Russia",
    flag: "🇷🇺"
  },

  // Ireland
  { 
    name: "Danny Boy", 
    notes: ["G", "C", "D", "E", "G", "E"], 
    extendedNotes: ["G", "C", "D", "E", "G", "E", "D", "C", "D", "E", "F", "G"],
    hint: "Oh Danny boy, the pipes are calling", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "nostalgic",
    country: "Ireland",
    flag: "🇮🇪"
  },
  { 
    name: "Molly Malone", 
    notes: ["D", "D", "E", "F#", "G", "A"], 
    extendedNotes: ["D", "D", "E", "F#", "G", "A", "B", "A", "G", "F#", "E", "D"],
    hint: "Cockles and mussels alive alive oh", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "upbeat",
    country: "Ireland",
    flag: "🇮🇪"
  },

  // Scotland
  { 
    name: "Auld Lang Syne", 
    notes: ["G", "C", "C", "C", "E", "D"], 
    extendedNotes: ["G", "C", "C", "C", "E", "D", "C", "D", "E", "D", "C", "A"],
    hint: "New Year's Eve classic", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "nostalgic",
    country: "Scotland",
    flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
  },
  { 
    name: "Loch Lomond", 
    notes: ["G", "B", "D", "E", "D", "B"], 
    extendedNotes: ["G", "B", "D", "E", "D", "B", "G", "A", "B", "D", "E", "G"],
    hint: "By the bonnie banks", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "Scotland",
    flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
  },

  // France
  { 
    name: "Frere Jacques", 
    notes: ["C", "D", "E", "C", "E", "F", "G"], 
    extendedNotes: ["C", "D", "E", "C", "E", "F", "G", "G", "A", "G", "F", "E", "C"],
    hint: "Are you sleeping, brother John?", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "playful",
    country: "France",
    flag: "🇫🇷"
  },
  { 
    name: "La Vie En Rose", 
    notes: ["C", "D", "E", "G", "G", "F"], 
    extendedNotes: ["C", "D", "E", "G", "G", "F", "E", "D", "C", "D", "E", "F"],
    hint: "Life in pink - Edith Piaf", 
    category: "International",
    genre: "Folk",
    era: "1940s",
    mood: "nostalgic",
    country: "France",
    flag: "🇫🇷"
  },

  // Germany
  { 
    name: "Stille Nacht", 
    notes: ["G", "A", "G", "E", "G", "A", "G"], 
    extendedNotes: ["G", "A", "G", "E", "G", "A", "G", "E", "D", "D", "B", "C", "C", "G"],
    hint: "Silent Night, Holy Night", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "Germany",
    flag: "🇩🇪"
  },
  { 
    name: "Du Du Liegst", 
    notes: ["G", "E", "G", "C", "B", "A"], 
    extendedNotes: ["G", "E", "G", "C", "B", "A", "G", "F", "E", "D", "C", "D", "E"],
    hint: "You lie in my heart", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "nostalgic",
    country: "Germany",
    flag: "🇩🇪"
  },

  // Italy
  { 
    name: "O Sole Mio", 
    notes: ["C", "E", "G", "C", "B", "A"], 
    extendedNotes: ["C", "E", "G", "C", "B", "A", "G", "F", "E", "D", "C", "E", "G"],
    hint: "My own sun - Neapolitan", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "upbeat",
    country: "Italy",
    flag: "🇮🇹"
  },
  { 
    name: "Bella Ciao", 
    notes: ["A", "B", "C", "A", "A", "B"], 
    extendedNotes: ["A", "B", "C", "A", "A", "B", "C", "D", "E", "D", "C", "B", "A"],
    hint: "Italian resistance song", 
    category: "International",
    genre: "Folk",
    era: "1940s",
    mood: "energetic",
    country: "Italy",
    flag: "🇮🇹"
  },

  // Spain
  { 
    name: "La Cucaracha", 
    notes: ["C", "C", "C", "F", "A", "C"], 
    extendedNotes: ["C", "C", "C", "F", "A", "C", "C", "C", "F", "A", "G", "F"],
    hint: "The cockroach can't walk", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "playful",
    country: "Mexico",
    flag: "🇲🇽"
  },
  { 
    name: "Malagueña", 
    notes: ["E", "F", "G#", "A", "B", "C"], 
    extendedNotes: ["E", "F", "G#", "A", "B", "C", "B", "A", "G#", "F", "E", "F"],
    hint: "Spanish flamenco classic", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "dramatic",
    country: "Spain",
    flag: "🇪🇸"
  },

  // Brazil
  { 
    name: "Aquarela do Brasil", 
    notes: ["C", "E", "G", "A", "G", "E"], 
    extendedNotes: ["C", "E", "G", "A", "G", "E", "C", "D", "E", "F", "G", "A"],
    hint: "Watercolor of Brazil", 
    category: "International",
    genre: "Folk",
    era: "1930s",
    mood: "upbeat",
    country: "Brazil",
    flag: "🇧🇷"
  },
  { 
    name: "Garota de Ipanema", 
    notes: ["G", "E", "E", "D", "E", "G"], 
    extendedNotes: ["G", "E", "E", "D", "E", "G", "A", "G", "E", "D", "E", "D"],
    hint: "The Girl from Ipanema", 
    category: "International",
    genre: "Folk",
    era: "1960s",
    mood: "peaceful",
    country: "Brazil",
    flag: "🇧🇷"
  },

  // Argentina
  { 
    name: "El Condor Pasa", 
    notes: ["G", "A", "B", "G", "E", "D"], 
    extendedNotes: ["G", "A", "B", "G", "E", "D", "C", "D", "E", "G", "A", "B"],
    hint: "I'd rather be a sparrow than a snail", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "Peru",
    flag: "🇵🇪"
  },
  { 
    name: "La Cumparsita", 
    notes: ["D", "E", "F", "A", "G", "F"], 
    extendedNotes: ["D", "E", "F", "A", "G", "F", "E", "D", "C", "D", "E", "F"],
    hint: "Classic Argentine tango", 
    category: "International",
    genre: "Folk",
    era: "1910s",
    mood: "dramatic",
    country: "Argentina",
    flag: "🇦🇷"
  },

  // Greece
  { 
    name: "Zorba Dance", 
    notes: ["E", "F", "G", "A", "G", "F"], 
    extendedNotes: ["E", "F", "G", "A", "G", "F", "E", "D", "E", "F", "G", "A"],
    hint: "Greek sirtaki gets faster", 
    category: "International",
    genre: "Folk",
    era: "1960s",
    mood: "energetic",
    country: "Greece",
    flag: "🇬🇷"
  },
  { 
    name: "Never On Sunday", 
    notes: ["E", "E", "F", "G", "A", "G"], 
    extendedNotes: ["E", "E", "F", "G", "A", "G", "F", "E", "D", "E", "F", "G"],
    hint: "Greek Oscar winner", 
    category: "International",
    genre: "Folk",
    era: "1960s",
    mood: "upbeat",
    country: "Greece",
    flag: "🇬🇷"
  },

  // Israel
  { 
    name: "Hava Nagila", 
    notes: ["E", "F", "G#", "A", "B", "C"], 
    extendedNotes: ["E", "F", "G#", "A", "B", "C", "B", "A", "G#", "F", "E", "F"],
    hint: "Let us rejoice!", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "energetic",
    country: "Israel",
    flag: "🇮🇱"
  },
  { 
    name: "Yerushalayim", 
    notes: ["D", "E", "F", "G", "A", "G"], 
    extendedNotes: ["D", "E", "F", "G", "A", "G", "F", "E", "D", "E", "F", "G"],
    hint: "Jerusalem of Gold", 
    category: "International",
    genre: "Folk",
    era: "1960s",
    mood: "nostalgic",
    country: "Israel",
    flag: "🇮🇱"
  },

  // Egypt / Middle East
  { 
    name: "Enta Omri", 
    notes: ["D", "E", "F", "G", "A", "A#"], 
    extendedNotes: ["D", "E", "F", "G", "A", "A#", "A", "G", "F", "E", "D", "E"],
    hint: "You are my life - Um Kulthum", 
    category: "International",
    genre: "Folk",
    era: "1960s",
    mood: "dramatic",
    country: "Egypt",
    flag: "🇪🇬"
  },

  // Nigeria / Africa
  { 
    name: "Kumbaya", 
    notes: ["G", "C", "C", "D", "E", "E"], 
    extendedNotes: ["G", "C", "C", "D", "E", "E", "D", "C", "D", "E", "D", "C"],
    hint: "Come by here, my Lord", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "Africa",
    flag: "🌍"
  },
  { 
    name: "Shosholoza", 
    notes: ["G", "A", "B", "G", "E", "G"], 
    extendedNotes: ["G", "A", "B", "G", "E", "G", "A", "B", "D", "B", "G", "E"],
    hint: "South African work song", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "energetic",
    country: "South Africa",
    flag: "🇿🇦"
  },

  // Australia
  { 
    name: "Waltzing Matilda", 
    notes: ["G", "E", "E", "E", "D", "C"], 
    extendedNotes: ["G", "E", "E", "E", "D", "C", "D", "E", "G", "A", "G", "E"],
    hint: "Australian bush ballad", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "nostalgic",
    country: "Australia",
    flag: "🇦🇺"
  },

  // Sweden
  { 
    name: "Midsommar", 
    notes: ["G", "G", "A", "G", "F#", "E"], 
    extendedNotes: ["G", "G", "A", "G", "F#", "E", "D", "E", "F#", "G", "A", "G"],
    hint: "Swedish midsummer dance", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "playful",
    country: "Sweden",
    flag: "🇸🇪"
  },

  // Poland
  { 
    name: "Mazurek", 
    notes: ["G", "C", "D", "E", "D", "C"], 
    extendedNotes: ["G", "C", "D", "E", "D", "C", "B", "C", "D", "E", "F", "G"],
    hint: "Polish national dance", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "energetic",
    country: "Poland",
    flag: "🇵🇱"
  },

  // Czech Republic
  { 
    name: "Beer Barrel Polka", 
    notes: ["C", "C", "C", "E", "G", "E"], 
    extendedNotes: ["C", "C", "C", "E", "G", "E", "C", "D", "E", "F", "G", "A"],
    hint: "Roll out the barrel!", 
    category: "International",
    genre: "Folk",
    era: "1930s",
    mood: "upbeat",
    country: "Czech Republic",
    flag: "🇨🇿"
  },

  // Hungary
  { 
    name: "Csardas", 
    notes: ["A", "B", "C", "D", "E", "D"], 
    extendedNotes: ["A", "B", "C", "D", "E", "D", "C", "B", "A", "G#", "A", "B"],
    hint: "Hungarian folk dance", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "energetic",
    country: "Hungary",
    flag: "🇭🇺"
  },

  // Turkey
  { 
    name: "Üsküdar", 
    notes: ["D", "E", "F", "G", "A", "G"], 
    extendedNotes: ["D", "E", "F", "G", "A", "G", "F", "E", "D", "E", "F", "G"],
    hint: "Going to Üsküdar", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "Turkey",
    flag: "🇹🇷"
  },

  // Thailand
  { 
    name: "Loy Krathong", 
    notes: ["G", "A", "B", "D", "B", "A"], 
    extendedNotes: ["G", "A", "B", "D", "B", "A", "G", "E", "G", "A", "B", "D"],
    hint: "Thai floating lantern festival", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "Thailand",
    flag: "🇹🇭"
  },

  // Vietnam
  { 
    name: "Ly Ngua O", 
    notes: ["D", "E", "G", "A", "G", "E"], 
    extendedNotes: ["D", "E", "G", "A", "G", "E", "D", "C", "D", "E", "G", "A"],
    hint: "Vietnamese black horse song", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "nostalgic",
    country: "Vietnam",
    flag: "🇻🇳"
  },

  // Philippines
  { 
    name: "Bahay Kubo", 
    notes: ["C", "D", "E", "G", "G", "E"], 
    extendedNotes: ["C", "D", "E", "G", "G", "E", "D", "C", "D", "E", "F", "G"],
    hint: "Nipa hut - Filipino nursery song", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "playful",
    country: "Philippines",
    flag: "🇵🇭"
  },

  // Indonesia
  { 
    name: "Bengawan Solo", 
    notes: ["E", "G", "A", "G", "E", "D"], 
    extendedNotes: ["E", "G", "A", "G", "E", "D", "C", "D", "E", "G", "A", "B"],
    hint: "Indonesian river song", 
    category: "International",
    genre: "Folk",
    era: "1940s",
    mood: "peaceful",
    country: "Indonesia",
    flag: "🇮🇩"
  },

  // Hawaii
  { 
    name: "Aloha Oe", 
    notes: ["C", "E", "G", "A", "G", "E"], 
    extendedNotes: ["C", "E", "G", "A", "G", "E", "C", "D", "E", "F", "G", "A"],
    hint: "Farewell to thee - Hawaiian queen", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "nostalgic",
    country: "Hawaii",
    flag: "🌺"
  },

  // Jamaica
  { 
    name: "Jamaica Farewell", 
    notes: ["C", "E", "G", "A", "G", "F"], 
    extendedNotes: ["C", "E", "G", "A", "G", "F", "E", "D", "C", "D", "E", "G"],
    hint: "Leaving little Kingston town", 
    category: "International",
    genre: "Folk",
    era: "1950s",
    mood: "nostalgic",
    country: "Jamaica",
    flag: "🇯🇲"
  },

  // Cuba
  { 
    name: "Guantanamera", 
    notes: ["G", "A", "B", "C", "B", "A"], 
    extendedNotes: ["G", "A", "B", "C", "B", "A", "G", "F", "G", "A", "B", "C"],
    hint: "Girl from Guantanamo", 
    category: "International",
    genre: "Folk",
    era: "1920s",
    mood: "upbeat",
    country: "Cuba",
    flag: "🇨🇺"
  },

  // Trinidad
  { 
    name: "Banana Boat Song", 
    notes: ["C", "C", "D", "E", "E", "D"], 
    extendedNotes: ["C", "C", "D", "E", "E", "D", "C", "A", "G", "A", "C", "D"],
    hint: "Day-O! Daylight come", 
    category: "International",
    genre: "Folk",
    era: "1950s",
    mood: "upbeat",
    country: "Jamaica",
    flag: "🇯🇲"
  },

  // Canada
  { 
    name: "O Canada", 
    notes: ["G", "E", "E", "A", "G", "C"], 
    extendedNotes: ["G", "E", "E", "A", "G", "C", "B", "A", "G", "F", "E", "D"],
    hint: "True patriot love", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "epic",
    country: "Canada",
    flag: "🇨🇦"
  },

  // USA
  { 
    name: "Amazing Grace", 
    notes: ["G", "C", "E", "C", "E", "D"], 
    extendedNotes: ["G", "C", "E", "C", "E", "D", "C", "A", "G", "C", "E", "D"],
    hint: "That saved a wretch like me", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "peaceful",
    country: "USA",
    flag: "🇺🇸"
  },
  { 
    name: "Oh Susanna", 
    notes: ["C", "D", "E", "G", "G", "A"], 
    extendedNotes: ["C", "D", "E", "G", "G", "A", "G", "E", "C", "D", "E", "E", "D"],
    hint: "Came from Alabama", 
    category: "International",
    genre: "Folk",
    era: "Traditional",
    mood: "upbeat",
    country: "USA",
    flag: "🇺🇸"
  },
];

export const INTERNATIONAL_MELODIES = MELODIES.filter(m => m.country && m.flag);

export const NOTE_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getDailySeed(): number {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getDailyMelody(): Melody {
  const seed = getDailySeed();
  const index = Math.floor(seededRandom(seed) * MELODIES.length);
  return MELODIES[index];
}

export function getDailyPuzzleNumber(): number {
  const startDate = new Date('2025-01-01');
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function getDailyTheme(): Theme {
  const seed = getDailySeed();
  const index = Math.floor(seededRandom(seed + 1) * THEMES.length);
  return THEMES[index];
}

export function getRandomInternationalMelody(excludeNames: string[] = []): Melody {
  const available = INTERNATIONAL_MELODIES.filter(m => !excludeNames.includes(m.name));
  const pool = available.length > 0 ? available : INTERNATIONAL_MELODIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getMelodiesByCountry(country: string): Melody[] {
  return MELODIES.filter(m => m.country === country);
}

export function getAllCountries(): { country: string; flag: string }[] {
  const countries = new Map<string, string>();
  INTERNATIONAL_MELODIES.forEach(m => {
    if (m.country && m.flag) {
      countries.set(m.country, m.flag);
    }
  });
  return Array.from(countries).map(([country, flag]) => ({ country, flag }));
}
