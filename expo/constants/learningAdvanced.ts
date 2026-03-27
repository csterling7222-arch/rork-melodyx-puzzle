export type InputMethod = 'keyboard' | 'voice' | 'midi' | 'touch';
export type FeedbackType = 'correct' | 'wrong' | 'close' | 'timing_off' | 'dynamics_off';
export type CoachingStyle = 'encouraging' | 'technical' | 'challenging' | 'zen';
export type SessionType = 'warmup' | 'drill' | 'lesson' | 'practice' | 'assessment' | 'jam' | 'challenge';

export interface PitchDetectionConfig {
  minConfidence: number;
  noiseThreshold: number;
  calibrationOffset: number;
  adaptiveThreshold: boolean;
  smoothingFactor: number;
}

export interface TimingAnalysis {
  expectedMs: number;
  actualMs: number;
  deviationMs: number;
  rating: 'perfect' | 'good' | 'early' | 'late' | 'missed';
}

export interface DynamicsAnalysis {
  expectedVelocity: number;
  actualVelocity: number;
  rating: 'perfect' | 'good' | 'too_soft' | 'too_loud';
}

export interface NoteAttemptAnalysis {
  note: string;
  expected: string;
  pitchAccuracy: number;
  timing: TimingAnalysis;
  dynamics: DynamicsAnalysis;
  feedback: FeedbackType;
  confidenceScore: number;
}

export interface AIPersonalizationProfile {
  preferredGenres: string[];
  strengthAreas: string[];
  weaknessAreas: string[];
  learningPace: 'slow' | 'normal' | 'fast' | 'adaptive';
  preferredSessionLength: number;
  motivationStyle: CoachingStyle;
  challengeLevel: number;
  focusSkills: string[];
  avoidSkills: string[];
  instrumentPreferences: string[];
  timeOfDayPreference: 'morning' | 'afternoon' | 'evening' | 'any';
  weeklyGoalMinutes: number;
  lastUpdated: string;
}

export interface AIGeneratedDrill {
  id: string;
  name: string;
  description: string;
  notes: string[];
  durations: number[];
  tempo: number;
  difficulty: number;
  skillFocus: string[];
  reasoning: string;
  estimatedMinutes: number;
  variationsAvailable: number;
}

export interface AICoachPersonality {
  id: string;
  name: string;
  avatar: string;
  style: CoachingStyle;
  specialty: string;
  voiceTone: string;
  encouragementPhrases: string[];
  correctionPhrases: string[];
  celebrationPhrases: string[];
  isPremium: boolean;
}

export const AI_COACH_PERSONALITIES: AICoachPersonality[] = [
  {
    id: 'melody',
    name: 'Melody',
    avatar: '🎵',
    style: 'encouraging',
    specialty: 'Beginner-friendly ear training',
    voiceTone: 'warm and supportive',
    encouragementPhrases: [
      "You're doing amazing! Keep it up!",
      "Every note you play makes you better!",
      "I believe in you - let's try again!",
      "That was so close! You've got this!",
    ],
    correctionPhrases: [
      "Let's try that note again - listen carefully...",
      "Good effort! The note was a bit off - here's the correct one.",
      "Almost there! Focus on the pitch a little more.",
    ],
    celebrationPhrases: [
      "🎉 Perfect! You're a natural!",
      "Incredible work! You nailed it!",
      "That was beautiful! Your ear is getting so sharp!",
    ],
    isPremium: false,
  },
  {
    id: 'maestro',
    name: 'Maestro Max',
    avatar: '🎼',
    style: 'technical',
    specialty: 'Advanced theory and composition',
    voiceTone: 'precise and knowledgeable',
    encouragementPhrases: [
      "Excellent technique - let's refine it further.",
      "Your musical understanding is developing well.",
      "Focus on the intervals - precision is key.",
    ],
    correctionPhrases: [
      "That interval was a minor third - we need a major third here.",
      "Your timing is 50ms behind - tighten up that rhythm.",
      "The note was flat by approximately 20 cents.",
    ],
    celebrationPhrases: [
      "Technically flawless execution!",
      "Your precision is remarkable!",
      "That's concert-level accuracy!",
    ],
    isPremium: true,
  },
  {
    id: 'jazz_cat',
    name: 'Jazz Cat',
    avatar: '🎷',
    style: 'challenging',
    specialty: 'Jazz improvisation and swing',
    voiceTone: 'cool and laid-back',
    encouragementPhrases: [
      "Dig that groove, cat! Keep swinging!",
      "You're finding your voice - let it flow!",
      "That's the spirit! Jazz is about expression!",
    ],
    correctionPhrases: [
      "Swing those notes, baby! Feel the groove!",
      "Let loose a little - jazz is about freedom!",
      "Try adding some blue notes - make it yours!",
    ],
    celebrationPhrases: [
      "Now THAT'S what I call jazz! 🎺",
      "You're grooving like a pro, cool cat!",
      "That improvisation was smokin'!",
    ],
    isPremium: true,
  },
  {
    id: 'zen_master',
    name: 'Zen Master',
    avatar: '🧘',
    style: 'zen',
    specialty: 'Mindful practice and wellness',
    voiceTone: 'calm and meditative',
    encouragementPhrases: [
      "Breathe... let the music flow through you.",
      "There is no wrong note, only learning.",
      "Be present with each sound you create.",
    ],
    correctionPhrases: [
      "Observe the difference... feel it in your body.",
      "Let go of expectation, embrace the journey.",
      "Each attempt brings you closer to harmony.",
    ],
    celebrationPhrases: [
      "You have found your center. Beautiful.",
      "The music and you are one.",
      "Peace and precision together. Namaste. 🙏",
    ],
    isPremium: false,
  },
];

export interface AdvancedLesson {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  targetNotes: string[];
  durations: number[];
  tempo: number;
  timeSignature: [number, number];
  keySignature: string;
  requiredAccuracy: number;
  xpReward: number;
  coinReward: number;
  estimatedMinutes: number;
  skillFocus: string[];
  prerequisites: string[];
  unlockLevel: number;
  isPremium: boolean;
  hints: string[];
  theoryContent: TheoryContent[];
  practiceGoals: PracticeGoal[];
  variations: LessonVariation[];
  audioBackingTrack?: string;
  videoTutorialUrl?: string;
  midiFile?: string;
}

export interface TheoryContent {
  id: string;
  type: 'text' | 'diagram' | 'animation' | 'interactive';
  title: string;
  content: string;
  imageUrl?: string;
  interactiveConfig?: Record<string, unknown>;
}

export interface PracticeGoal {
  mode: string;
  targetAccuracy: number;
  targetSpeed: number;
  bonusXp: number;
}

export interface LessonVariation {
  id: string;
  name: string;
  description: string;
  transform: 'transpose' | 'tempo' | 'rhythm' | 'harmony' | 'style' | 'improvise';
  parameters: Record<string, number | string>;
  unlockXp: number;
  icon: string;
}

export interface SkillTreeNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  level: number;
  maxLevel: number;
  xpRequired: number[];
  prerequisites: string[];
  children: string[];
  bonuses: SkillBonus[];
  category: string;
}

export interface SkillBonus {
  type: 'xp_multiplier' | 'accuracy_boost' | 'hint_reveal' | 'tempo_control' | 'unlock';
  value: number;
  description: string;
}

export const SKILL_TREE: SkillTreeNode[] = [
  {
    id: 'pitch_basics',
    name: 'Pitch Basics',
    description: 'Foundation of pitch recognition',
    icon: '🎵',
    color: '#22C55E',
    level: 0,
    maxLevel: 5,
    xpRequired: [0, 100, 300, 600, 1000],
    prerequisites: [],
    children: ['interval_recognition', 'chromatic_hearing'],
    bonuses: [
      { type: 'xp_multiplier', value: 1.1, description: '+10% XP in pitch lessons' },
    ],
    category: 'ear_training',
  },
  {
    id: 'interval_recognition',
    name: 'Interval Recognition',
    description: 'Identify distances between notes',
    icon: '📏',
    color: '#A78BFA',
    level: 0,
    maxLevel: 5,
    xpRequired: [200, 500, 900, 1500, 2500],
    prerequisites: ['pitch_basics'],
    children: ['chord_recognition', 'melody_dictation'],
    bonuses: [
      { type: 'accuracy_boost', value: 5, description: '+5% accuracy in interval tests' },
    ],
    category: 'ear_training',
  },
  {
    id: 'chromatic_hearing',
    name: 'Chromatic Hearing',
    description: 'Master all 12 notes',
    icon: '🎹',
    color: '#06B6D4',
    level: 0,
    maxLevel: 5,
    xpRequired: [200, 500, 900, 1500, 2500],
    prerequisites: ['pitch_basics'],
    children: ['scale_recognition'],
    bonuses: [
      { type: 'hint_reveal', value: 1, description: 'Reveals sharps/flats hints' },
    ],
    category: 'ear_training',
  },
  {
    id: 'chord_recognition',
    name: 'Chord Recognition',
    description: 'Identify chord qualities',
    icon: '🎼',
    color: '#F59E0B',
    level: 0,
    maxLevel: 5,
    xpRequired: [500, 1000, 2000, 3500, 5500],
    prerequisites: ['interval_recognition'],
    children: ['chord_progressions', 'voicing_analysis'],
    bonuses: [
      { type: 'xp_multiplier', value: 1.15, description: '+15% XP in harmony lessons' },
    ],
    category: 'harmony',
  },
  {
    id: 'rhythm_fundamentals',
    name: 'Rhythm Fundamentals',
    description: 'Master basic time keeping',
    icon: '🥁',
    color: '#EF4444',
    level: 0,
    maxLevel: 5,
    xpRequired: [0, 100, 300, 600, 1000],
    prerequisites: [],
    children: ['syncopation', 'polyrhythm'],
    bonuses: [
      { type: 'tempo_control', value: 10, description: '+10% tempo range' },
    ],
    category: 'rhythm',
  },
  {
    id: 'syncopation',
    name: 'Syncopation',
    description: 'Off-beat mastery',
    icon: '⚡',
    color: '#EC4899',
    level: 0,
    maxLevel: 5,
    xpRequired: [300, 700, 1200, 2000, 3200],
    prerequisites: ['rhythm_fundamentals'],
    children: ['groove_master'],
    bonuses: [
      { type: 'accuracy_boost', value: 8, description: '+8% timing accuracy' },
    ],
    category: 'rhythm',
  },
  {
    id: 'improvisation_basics',
    name: 'Improv Basics',
    description: 'Foundation of creative expression',
    icon: '🎸',
    color: '#8B5CF6',
    level: 0,
    maxLevel: 5,
    xpRequired: [500, 1200, 2200, 3800, 6000],
    prerequisites: ['interval_recognition', 'syncopation'],
    children: ['jazz_improv', 'blues_improv'],
    bonuses: [
      { type: 'unlock', value: 1, description: 'Unlocks Improv Jam mode' },
    ],
    category: 'improvisation',
  },
];

export interface AnalyticsDashboardData {
  weeklyProgress: DailyProgress[];
  skillBreakdown: SkillProgress[];
  accuracyTrend: TrendPoint[];
  practiceTimeTrend: TrendPoint[];
  mistakePatterns: MistakePattern[];
  streakHistory: StreakRecord[];
  milestones: MilestoneRecord[];
  comparisons: PeerComparison;
}

export interface DailyProgress {
  date: string;
  lessonsCompleted: number;
  minutesPracticed: number;
  xpEarned: number;
  accuracy: number;
  notesPlayed: number;
}

export interface SkillProgress {
  skillId: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  recentGain: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface MistakePattern {
  fromNote: string;
  toNote: string;
  count: number;
  percentage: number;
  suggestion: string;
}

export interface StreakRecord {
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}

export interface MilestoneRecord {
  id: string;
  name: string;
  achievedAt: string;
  xpRewarded: number;
}

export interface PeerComparison {
  rank: number;
  totalUsers: number;
  percentile: number;
  averageAccuracy: number;
  userAccuracy: number;
  averageStreak: number;
  userStreak: number;
}

export const ADVANCED_CURRICULA = [
  {
    id: 'ear_training_complete',
    name: 'Complete Ear Training',
    description: 'Master pitch recognition from basics to advanced',
    icon: '👂',
    color: '#A78BFA',
    estimatedHours: 20,
    lessonsCount: 45,
    difficulty: 'beginner_to_advanced' as const,
    isPremium: false,
    category: 'Ear Training',
    modules: [
      { id: 'pitch_basics', name: 'Pitch Basics', lessons: 8 },
      { id: 'intervals', name: 'Interval Training', lessons: 12 },
      { id: 'chords', name: 'Chord Recognition', lessons: 10 },
      { id: 'progressions', name: 'Chord Progressions', lessons: 8 },
      { id: 'transcription', name: 'Melody Transcription', lessons: 7 },
    ],
  },
  {
    id: 'rhythm_mastery',
    name: 'Rhythm Mastery',
    description: 'From basic beats to complex polyrhythms',
    icon: '🥁',
    color: '#F59E0B',
    estimatedHours: 15,
    lessonsCount: 35,
    difficulty: 'beginner_to_advanced' as const,
    isPremium: false,
    category: 'Rhythm',
    modules: [
      { id: 'basics', name: 'Rhythm Basics', lessons: 6 },
      { id: 'subdivisions', name: 'Subdivisions', lessons: 8 },
      { id: 'syncopation', name: 'Syncopation', lessons: 7 },
      { id: 'odd_meters', name: 'Odd Time Signatures', lessons: 7 },
      { id: 'polyrhythm', name: 'Polyrhythm', lessons: 7 },
    ],
  },
  {
    id: 'jazz_improvisation',
    name: 'Jazz Improvisation',
    description: 'Learn to improvise like the masters',
    icon: '🎷',
    color: '#8B5CF6',
    estimatedHours: 30,
    lessonsCount: 50,
    difficulty: 'intermediate_to_master' as const,
    isPremium: true,
    category: 'Improvisation',
    modules: [
      { id: 'blues_scale', name: 'Blues Foundation', lessons: 8 },
      { id: 'ii_v_i', name: 'II-V-I Mastery', lessons: 12 },
      { id: 'bebop', name: 'Bebop Language', lessons: 10 },
      { id: 'standards', name: 'Jazz Standards', lessons: 12 },
      { id: 'free_form', name: 'Free Improvisation', lessons: 8 },
    ],
  },
  {
    id: 'composition_fundamentals',
    name: 'Composition Fundamentals',
    description: 'Create your own music from scratch',
    icon: '✍️',
    color: '#10B981',
    estimatedHours: 25,
    lessonsCount: 40,
    difficulty: 'intermediate' as const,
    isPremium: true,
    category: 'Composition',
    modules: [
      { id: 'melody_writing', name: 'Melody Writing', lessons: 10 },
      { id: 'harmony', name: 'Harmonic Foundation', lessons: 10 },
      { id: 'form', name: 'Musical Form', lessons: 8 },
      { id: 'arrangement', name: 'Basic Arrangement', lessons: 7 },
      { id: 'production', name: 'Production Basics', lessons: 5 },
    ],
  },
  {
    id: 'classical_repertoire',
    name: 'Classical Repertoire',
    description: 'Master pieces from the classical canon',
    icon: '🎻',
    color: '#EC4899',
    estimatedHours: 35,
    lessonsCount: 55,
    difficulty: 'intermediate_to_virtuoso' as const,
    isPremium: true,
    category: 'Classical',
    modules: [
      { id: 'baroque', name: 'Baroque Period', lessons: 12 },
      { id: 'classical', name: 'Classical Period', lessons: 12 },
      { id: 'romantic', name: 'Romantic Period', lessons: 12 },
      { id: 'modern', name: 'Modern Classical', lessons: 10 },
      { id: 'contemporary', name: 'Contemporary', lessons: 9 },
    ],
  },
  {
    id: 'pop_songwriting',
    name: 'Pop Songwriting',
    description: 'Write catchy hooks and memorable melodies',
    icon: '🎤',
    color: '#EF4444',
    estimatedHours: 18,
    lessonsCount: 32,
    difficulty: 'beginner_to_intermediate' as const,
    isPremium: false,
    category: 'Songwriting',
    modules: [
      { id: 'hooks', name: 'Hook Writing', lessons: 8 },
      { id: 'chord_progressions', name: 'Pop Progressions', lessons: 8 },
      { id: 'song_structure', name: 'Song Structure', lessons: 6 },
      { id: 'lyrics', name: 'Lyric Writing', lessons: 5 },
      { id: 'production', name: 'Pop Production', lessons: 5 },
    ],
  },
  {
    id: 'guitar_techniques',
    name: 'Guitar Mastery',
    description: 'Essential guitar techniques and styles',
    icon: '🎸',
    color: '#F97316',
    estimatedHours: 22,
    lessonsCount: 38,
    difficulty: 'beginner_to_advanced' as const,
    isPremium: true,
    category: 'Instrument-Specific',
    modules: [
      { id: 'basics', name: 'Guitar Basics', lessons: 8 },
      { id: 'chords', name: 'Chord Voicings', lessons: 8 },
      { id: 'lead', name: 'Lead Techniques', lessons: 8 },
      { id: 'styles', name: 'Genre Styles', lessons: 8 },
      { id: 'advanced', name: 'Advanced Techniques', lessons: 6 },
    ],
  },
  {
    id: 'music_theory_deep',
    name: 'Deep Music Theory',
    description: 'Comprehensive understanding of music fundamentals',
    icon: '📚',
    color: '#06B6D4',
    estimatedHours: 28,
    lessonsCount: 48,
    difficulty: 'beginner_to_advanced' as const,
    isPremium: false,
    category: 'Theory',
    modules: [
      { id: 'fundamentals', name: 'Fundamentals', lessons: 10 },
      { id: 'scales_modes', name: 'Scales & Modes', lessons: 10 },
      { id: 'harmony_deep', name: 'Advanced Harmony', lessons: 10 },
      { id: 'counterpoint', name: 'Counterpoint', lessons: 8 },
      { id: 'analysis', name: 'Musical Analysis', lessons: 10 },
    ],
  },
];

export const WARMUP_ROUTINES = [
  {
    id: 'quick_5min',
    name: '5-Minute Warmup',
    description: 'Quick ear training to start your day',
    duration: 5,
    exercises: [
      { type: 'pitch_matching', count: 5, difficulty: 1 },
      { type: 'interval_recognition', count: 5, difficulty: 2 },
      { type: 'rhythm_tap', count: 3, difficulty: 1 },
    ],
  },
  {
    id: 'standard_15min',
    name: '15-Minute Practice',
    description: 'Balanced warmup covering all skills',
    duration: 15,
    exercises: [
      { type: 'pitch_matching', count: 8, difficulty: 2 },
      { type: 'interval_recognition', count: 10, difficulty: 2 },
      { type: 'chord_recognition', count: 8, difficulty: 2 },
      { type: 'rhythm_tap', count: 8, difficulty: 2 },
      { type: 'melody_repeat', count: 5, difficulty: 2 },
    ],
  },
  {
    id: 'intensive_30min',
    name: '30-Minute Intensive',
    description: 'Deep practice session for serious improvement',
    duration: 30,
    exercises: [
      { type: 'pitch_matching', count: 15, difficulty: 3 },
      { type: 'interval_recognition', count: 20, difficulty: 3 },
      { type: 'chord_recognition', count: 15, difficulty: 3 },
      { type: 'chord_progressions', count: 10, difficulty: 3 },
      { type: 'rhythm_tap', count: 15, difficulty: 3 },
      { type: 'melody_repeat', count: 10, difficulty: 3 },
      { type: 'improvisation_prompt', count: 5, difficulty: 3 },
    ],
  },
  {
    id: 'zen_mindful',
    name: 'Mindful Practice',
    description: 'Relaxed, meditative ear training',
    duration: 20,
    exercises: [
      { type: 'pitch_matching', count: 10, difficulty: 1 },
      { type: 'interval_recognition', count: 10, difficulty: 1 },
      { type: 'chord_recognition', count: 5, difficulty: 1 },
      { type: 'melody_repeat', count: 5, difficulty: 1 },
    ],
  },
];

export const CHALLENGE_MODES = [
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'How fast can you identify notes?',
    icon: '⚡',
    rules: 'Identify notes as fast as possible. Timer counts down!',
    scoring: 'base_accuracy * speed_bonus',
    timeLimit: 60,
    xpMultiplier: 2.0,
  },
  {
    id: 'perfect_streak',
    name: 'Perfect Streak',
    description: 'How many perfect scores in a row?',
    icon: '🔥',
    rules: 'One mistake and you\'re out. Go for the high score!',
    scoring: 'streak_length * difficulty_multiplier',
    timeLimit: null,
    xpMultiplier: 1.5,
  },
  {
    id: 'blind_master',
    name: 'Blind Master',
    description: 'No visual feedback - pure ear!',
    icon: '👁️',
    rules: 'Play without seeing your input. Trust your ears!',
    scoring: 'accuracy * blind_bonus',
    timeLimit: 120,
    xpMultiplier: 2.5,
  },
  {
    id: 'tempo_ramp',
    name: 'Tempo Ramp',
    description: 'Melodies get faster and faster!',
    icon: '📈',
    rules: 'Start slow, end blazing fast. Keep up!',
    scoring: 'rounds_completed * final_tempo_bonus',
    timeLimit: 180,
    xpMultiplier: 1.8,
  },
  {
    id: 'improv_battle',
    name: 'Improv Battle',
    description: 'Create variations on a theme!',
    icon: '🎸',
    rules: 'AI plays, you improvise back. Creativity scored!',
    scoring: 'creativity_score * variation_bonus',
    timeLimit: 300,
    xpMultiplier: 2.2,
  },
];

export const ACCESSIBILITY_SETTINGS = {
  visualModes: [
    { id: 'standard', name: 'Standard', description: 'Default color scheme' },
    { id: 'high_contrast', name: 'High Contrast', description: 'Maximum visibility' },
    { id: 'colorblind_protanopia', name: 'Protanopia', description: 'Red-green colorblind' },
    { id: 'colorblind_deuteranopia', name: 'Deuteranopia', description: 'Green-red colorblind' },
    { id: 'colorblind_tritanopia', name: 'Tritanopia', description: 'Blue-yellow colorblind' },
    { id: 'reduced_motion', name: 'Reduced Motion', description: 'Minimal animations' },
  ],
  audioModes: [
    { id: 'standard', name: 'Standard', description: 'Default audio' },
    { id: 'enhanced_bass', name: 'Enhanced Bass', description: 'Boosted low frequencies' },
    { id: 'enhanced_treble', name: 'Enhanced Treble', description: 'Boosted high frequencies' },
    { id: 'mono', name: 'Mono Audio', description: 'Single channel audio' },
  ],
  inputModes: [
    { id: 'touch', name: 'Touch', description: 'Standard touch input' },
    { id: 'large_touch', name: 'Large Touch', description: 'Bigger touch targets' },
    { id: 'voice', name: 'Voice', description: 'Sing or hum notes' },
    { id: 'switch', name: 'Switch Control', description: 'External switch device' },
  ],
  feedbackModes: [
    { id: 'visual', name: 'Visual Only', description: 'Screen feedback only' },
    { id: 'haptic', name: 'Haptic Only', description: 'Vibration feedback only' },
    { id: 'audio', name: 'Audio Only', description: 'Sound feedback only' },
    { id: 'all', name: 'All Feedback', description: 'Full multi-sensory feedback' },
  ],
};

export const LEARNING_ACHIEVEMENTS = [
  { id: 'first_lesson', name: 'First Steps', icon: '🌟', xp: 25, requirement: { type: 'lessons', value: 1 } },
  { id: 'week_streak', name: 'Week Warrior', icon: '🔥', xp: 100, requirement: { type: 'streak', value: 7 } },
  { id: 'month_streak', name: 'Monthly Master', icon: '💎', xp: 500, requirement: { type: 'streak', value: 30 } },
  { id: 'perfect_10', name: 'Perfect Ten', icon: '🎯', xp: 150, requirement: { type: 'perfect_lessons', value: 10 } },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', xp: 200, requirement: { type: 'speed_challenge', value: 50 } },
  { id: 'ear_master', name: 'Golden Ear', icon: '👂', xp: 300, requirement: { type: 'ear_skill', value: 10 } },
  { id: 'rhythm_king', name: 'Rhythm King', icon: '🥁', xp: 300, requirement: { type: 'rhythm_skill', value: 10 } },
  { id: 'improv_star', name: 'Improv Star', icon: '🎸', xp: 400, requirement: { type: 'improv_sessions', value: 50 } },
  { id: 'theory_guru', name: 'Theory Guru', icon: '📚', xp: 350, requirement: { type: 'theory_lessons', value: 30 } },
  { id: 'curriculum_complete', name: 'Scholar', icon: '🎓', xp: 1000, requirement: { type: 'curricula', value: 1 } },
  { id: 'all_instruments', name: 'Multi-Instrumentalist', icon: '🎹', xp: 500, requirement: { type: 'instruments', value: 5 } },
  { id: 'practice_100h', name: 'Dedicated', icon: '⏱️', xp: 750, requirement: { type: 'practice_hours', value: 100 } },
  { id: 'notes_100k', name: 'Note Master', icon: '🎵', xp: 600, requirement: { type: 'notes_played', value: 100000 } },
  { id: 'combo_100', name: 'Combo Legend', icon: '🔗', xp: 400, requirement: { type: 'max_combo', value: 100 } },
];

export const DEFAULT_PERSONALIZATION_PROFILE: AIPersonalizationProfile = {
  preferredGenres: [],
  strengthAreas: [],
  weaknessAreas: [],
  learningPace: 'adaptive',
  preferredSessionLength: 15,
  motivationStyle: 'encouraging',
  challengeLevel: 50,
  focusSkills: [],
  avoidSkills: [],
  instrumentPreferences: ['piano'],
  timeOfDayPreference: 'any',
  weeklyGoalMinutes: 60,
  lastUpdated: new Date().toISOString(),
};

export const PITCH_DETECTION_PRESETS: Record<string, PitchDetectionConfig> = {
  standard: {
    minConfidence: 0.7,
    noiseThreshold: 0.1,
    calibrationOffset: 0,
    adaptiveThreshold: true,
    smoothingFactor: 0.8,
  },
  sensitive: {
    minConfidence: 0.5,
    noiseThreshold: 0.05,
    calibrationOffset: 0,
    adaptiveThreshold: true,
    smoothingFactor: 0.6,
  },
  strict: {
    minConfidence: 0.85,
    noiseThreshold: 0.15,
    calibrationOffset: 0,
    adaptiveThreshold: false,
    smoothingFactor: 0.9,
  },
  noisy_environment: {
    minConfidence: 0.6,
    noiseThreshold: 0.25,
    calibrationOffset: 0,
    adaptiveThreshold: true,
    smoothingFactor: 0.95,
  },
};
