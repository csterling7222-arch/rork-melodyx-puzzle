import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Music,
  Play,
  Trash2,
  Save,
  Share2,
  ChevronRight,
  Eye,
  Globe,
  Lock,
  Sparkles,
  AlertCircle,
  Check,
  X,
  Users,
  Heart,
  TrendingUp,
  Clock,
  Swords,
  Sliders,
  Zap,
  ChevronDown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useAudio } from '@/hooks/useAudio';
import { useUserMelodies } from '@/contexts/UserMelodiesContext';
import { useUser } from '@/contexts/UserContext';
import {
  UGC_GENRES,
  UGC_MOODS,
  UGC_DIFFICULTY,
  UGCGenre,
  UGCMood,
  UGCDifficulty,
  MIN_NOTES,
  MAX_NOTES,
  DEFAULT_NOTE_LENGTH,
  NOTE_LENGTH_OPTIONS,
  getDifficultyForLength,
  UserMelody,
  getMelodyShareUrl,
} from '@/constants/ugc';
import { validateMelodyNotes, GuessResult } from '@/utils/gameLogic';
import {
  RHYTHM_PRESETS,
  TEMPO_OPTIONS,
  STYLE_OPTIONS,
  RhythmPreset,
  TempoVariant,
  StyleVariant,
  MelodyVariant,
  generateMelodyVariants,
  generateCustomVariant,
} from '@/utils/aiSongRecreator';
import GuessGrid from '@/components/GuessGrid';
import { NOTE_SCALE } from '@/utils/melodies';
import ThemedBackground from '@/components/ThemedBackground';
import { useTheme } from '@/contexts/ThemeContext';

type TabType = 'compose' | 'my-melodies' | 'discover';

const NOTE_COLORS: Record<string, { bg: string; text: string }> = {
  'C': { bg: '#EF4444', text: '#FFFFFF' },
  'C#': { bg: '#1F1F1F', text: '#FFFFFF' },
  'D': { bg: '#F97316', text: '#FFFFFF' },
  'D#': { bg: '#1F1F1F', text: '#FFFFFF' },
  'E': { bg: '#FBBF24', text: '#1F1F1F' },
  'F': { bg: '#22C55E', text: '#FFFFFF' },
  'F#': { bg: '#1F1F1F', text: '#FFFFFF' },
  'G': { bg: '#06B6D4', text: '#1F1F1F' },
  'G#': { bg: '#1F1F1F', text: '#FFFFFF' },
  'A': { bg: '#3B82F6', text: '#FFFFFF' },
  'A#': { bg: '#1F1F1F', text: '#FFFFFF' },
  'B': { bg: '#A855F7', text: '#FFFFFF' },
};

function ComposerTab() {
  const { playNote, playMelody, stopPlayback, playbackState } = useAudio();
  const { createMelody, validateMelody, createChallenge } = useUserMelodies();
  useUser();

  const [notes, setNotes] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [hint, setHint] = useState('');
  const [genre, setGenre] = useState<UGCGenre>('original');
  const [mood, setMood] = useState<UGCMood>('happy');
  const [targetLength, setTargetLength] = useState<number>(DEFAULT_NOTE_LENGTH);
  const [showLengthPicker, setShowLengthPicker] = useState(false);
  const [showGridPreview, setShowGridPreview] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMelody, setSavedMelody] = useState<UserMelody | null>(null);

  const [showRhythmEditor, setShowRhythmEditor] = useState(false);
  const [rhythmPreset, setRhythmPreset] = useState<RhythmPreset>('straight');
  const [swingAmount, setSwingAmount] = useState(0);
  const [tempo, setTempo] = useState<TempoVariant>('medium');
  const [styleVariant, setStyleVariant] = useState<StyleVariant>('original');
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState<MelodyVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<MelodyVariant | null>(null);

  const currentDifficulty = useMemo(() => getDifficultyForLength(targetLength), [targetLength]);

  const scaleAnims = useRef<Record<string, Animated.Value>>({});
  NOTE_SCALE.forEach(note => {
    if (!scaleAnims.current[note]) {
      scaleAnims.current[note] = new Animated.Value(1);
    }
  });

  const validation = useMemo(() => {
    return validateMelodyNotes(notes, targetLength, targetLength);
  }, [notes, targetLength]);

  const previewGuesses = useMemo((): GuessResult[][] => {
    if (notes.length === 0) return [];
    return [notes.slice(0, targetLength).map(note => ({ note, feedback: 'empty' as const }))];
  }, [notes, targetLength]);

  const fullValidation = useMemo(() => {
    if (notes.length === 0) return null;
    return validateMelody(notes, title, hint);
  }, [notes, title, hint, validateMelody]);

  const handleNotePress = useCallback((note: string) => {
    if (notes.length >= targetLength) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const anim = scaleAnims.current[note];
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();

    playNote(note);
    setNotes(prev => [...prev, note]);
  }, [notes.length, targetLength, playNote]);

  const handleRemoveLastNote = useCallback(() => {
    if (notes.length === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setNotes(prev => prev.slice(0, -1));
  }, [notes.length]);

  const handleClearAll = useCallback(() => {
    if (notes.length === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setNotes([]);
    setSavedMelody(null);
  }, [notes.length]);

  const handlePreview = useCallback(() => {
    if (notes.length === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (playbackState.isPlaying) {
      stopPlayback();
    } else {
      const tempoMs = Math.round((60 / TEMPO_OPTIONS[tempo].bpm) * 1000 * 0.5);
      const playNotes = selectedVariant ? selectedVariant.notes : notes;
      playMelody(playNotes, tempoMs);
    }
  }, [notes, playbackState.isPlaying, playMelody, stopPlayback, tempo, selectedVariant]);

  const handleGenerateVariants = useCallback(() => {
    if (notes.length < 3) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const variants = generateMelodyVariants(notes);
    setGeneratedVariants(variants);
    setShowVariantPicker(true);
    console.log('Generated variants:', variants.length);
  }, [notes]);

  const handleSelectVariant = useCallback((variant: MelodyVariant) => {
    setSelectedVariant(variant);
    setRhythmPreset(variant.rhythmPreset);
    setSwingAmount(variant.swingAmount);
    setStyleVariant(variant.style);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowVariantPicker(false);
  }, []);

  const handleApplyCustomRhythm = useCallback(() => {
    if (notes.length < 3) return;
    const customVariant = generateCustomVariant(
      notes,
      rhythmPreset,
      swingAmount,
      TEMPO_OPTIONS[tempo].bpm,
      styleVariant
    );
    setSelectedVariant(customVariant);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [notes, rhythmPreset, swingAmount, tempo, styleVariant]);

  const handleSave = useCallback(async () => {
    if (notes.length !== targetLength || !title.trim() || !hint.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsSaving(true);
    try {
      const result = await createMelody(
        title,
        notes,
        hint,
        genre,
        mood,
        currentDifficulty.id as UGCDifficulty,
        isPublic
      );

      if (result.success && result.melody) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setSavedMelody(result.melody);
        Alert.alert(
          'Melody Saved!',
          `Your melody "${title}" has been created.\nShare code: ${result.melody.shareCode}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to save melody');
      }
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Error', 'Failed to save melody');
    } finally {
      setIsSaving(false);
    }
  }, [targetLength, title, hint, notes, genre, mood, currentDifficulty.id, isPublic, createMelody]);

  const handleShare = useCallback(async () => {
    if (!savedMelody) return;

    try {
      const shareUrl = getMelodyShareUrl(savedMelody.shareCode);
      await Share.share({
        message: `🎵 Can you guess my melody "${savedMelody.title}"?\n\nChallenge code: ${savedMelody.shareCode}\n\n${shareUrl}`,
        title: `Melodyx Challenge: ${savedMelody.title}`,
      });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  }, [savedMelody]);

  const handleChallengeFriends = useCallback(async () => {
    if (!savedMelody) return;

    try {
      const challenge = await createChallenge(savedMelody.id);
      if (challenge) {
        const shareUrl = getMelodyShareUrl(savedMelody.shareCode);
        await Share.share({
          message: `⚔️ I challenge you to guess my melody!\n\n🎵 "${savedMelody.title}"\nCode: ${savedMelody.shareCode}\n\n${shareUrl}`,
          title: 'Melodyx Challenge',
        });
      }
    } catch (error) {
      console.log('Challenge error:', error);
    }
  }, [savedMelody, createChallenge]);

  const selectedGenre = UGC_GENRES.find(g => g.id === genre);
  const selectedMood = UGC_MOODS.find(m => m.id === mood);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.composerSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Compose Your Melody</Text>
            <Text style={styles.sectionSubtitle}>
              Target: {targetLength} notes • {currentDifficulty.name}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.lengthPickerBtn, { borderColor: currentDifficulty.color }]}
            onPress={() => {
              setShowLengthPicker(!showLengthPicker);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Text style={[styles.lengthPickerText, { color: currentDifficulty.color }]}>
              {targetLength} 🎵
            </Text>
          </TouchableOpacity>
        </View>

        {showLengthPicker && (
          <View style={styles.lengthPickerContainer}>
            <Text style={styles.lengthPickerLabel}>Select Note Length (5-30)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lengthOptionsScroll}>
              <View style={styles.lengthOptionsRow}>
                {NOTE_LENGTH_OPTIONS.map(option => {
                  const diffInfo = getDifficultyForLength(option.value);
                  const isSelected = targetLength === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.lengthOption,
                        isSelected && { backgroundColor: diffInfo.color + '30', borderColor: diffInfo.color },
                      ]}
                      onPress={() => {
                        setTargetLength(option.value);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }
                      }}
                    >
                      <Text style={[styles.lengthOptionValue, isSelected && { color: diffInfo.color }]}>
                        {option.value}
                      </Text>
                      <Text style={[styles.lengthOptionLabel, isSelected && { color: diffInfo.color }]}>
                        {diffInfo.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.customLengthRow}>
              <Text style={styles.customLengthLabel}>Custom:</Text>
              <TextInput
                style={styles.customLengthInput}
                keyboardType="number-pad"
                value={String(targetLength)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= MIN_NOTES && num <= MAX_NOTES) {
                    setTargetLength(num);
                  }
                }}
                maxLength={2}
              />
            </View>
          </View>
        )}

        <View style={styles.notesDisplay}>
          {notes.length === 0 ? (
            <Text style={styles.emptyNotes}>Tap keys below to start composing...</Text>
          ) : (
            <View style={styles.notesRow}>
              {notes.map((note, index) => {
                const colors = NOTE_COLORS[note] || { bg: '#666', text: '#FFF' };
                return (
                  <View key={index} style={[styles.noteChip, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.noteChipText, { color: colors.text }]}>{note}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.noteCountRow}>
          <Text style={[
            styles.noteCount,
            notes.length === targetLength && styles.noteCountValid,
            notes.length > targetLength && styles.noteCountError,
          ]}>
            {notes.length}/{targetLength} notes
          </Text>
          {notes.length < targetLength && notes.length > 0 && (
            <Text style={styles.noteCountHint}>
              {targetLength - notes.length} more needed
            </Text>
          )}
          {validation.warnings.length > 0 && (
            <View style={styles.warningBadge}>
              <AlertCircle size={12} color={Colors.warning} />
              <Text style={styles.warningText}>{validation.warnings[0]}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.previewGridToggle}
          onPress={() => setShowGridPreview(!showGridPreview)}
        >
          <Eye size={16} color={Colors.accent} />
          <Text style={styles.previewGridText}>
            {showGridPreview ? 'Hide' : 'Show'} Grid Preview
          </Text>
        </TouchableOpacity>

        {showGridPreview && (
          <View style={styles.gridPreviewContainer}>
            <GuessGrid
              guesses={previewGuesses}
              currentGuess={notes.length < targetLength ? notes : []}
              melodyLength={targetLength}
              maxGuesses={1}
            />
          </View>
        )}

        <View style={styles.pianoContainer}>
          <View style={styles.pianoRow}>
            {NOTE_SCALE.slice(0, 6).map(note => {
              const colors = NOTE_COLORS[note] || { bg: '#666', text: '#FFF' };
              const anim = scaleAnims.current[note];
              return (
                <Animated.View key={note} style={{ transform: [{ scale: anim }] }}>
                  <TouchableOpacity
                    style={[styles.pianoKey, { backgroundColor: colors.bg }]}
                    onPress={() => handleNotePress(note)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Piano key ${note}`}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.pianoKeyText, { color: colors.text }]}>{note}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
          <View style={styles.pianoRow}>
            {NOTE_SCALE.slice(6).map(note => {
              const colors = NOTE_COLORS[note] || { bg: '#666', text: '#FFF' };
              const anim = scaleAnims.current[note];
              return (
                <Animated.View key={note} style={{ transform: [{ scale: anim }] }}>
                  <TouchableOpacity
                    style={[styles.pianoKey, { backgroundColor: colors.bg }]}
                    onPress={() => handleNotePress(note)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Piano key ${note}`}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.pianoKeyText, { color: colors.text }]}>{note}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleRemoveLastNote}
            disabled={notes.length === 0}
          >
            <Trash2 size={18} color={notes.length === 0 ? Colors.textMuted : Colors.error} />
            <Text style={[styles.actionBtnText, notes.length === 0 && styles.actionBtnTextDisabled]}>
              Undo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.previewBtn, playbackState.isPlaying && styles.previewBtnActive]}
            onPress={handlePreview}
            disabled={notes.length === 0}
          >
            <Play size={18} color={notes.length === 0 ? Colors.textMuted : Colors.accent} />
            <Text style={[styles.actionBtnText, notes.length === 0 && styles.actionBtnTextDisabled]}>
              {playbackState.isPlaying ? 'Stop' : 'Preview'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.clearBtn]}
            onPress={handleClearAll}
            disabled={notes.length === 0}
          >
            <X size={18} color={notes.length === 0 ? Colors.textMuted : Colors.textSecondary} />
            <Text style={[styles.actionBtnText, notes.length === 0 && styles.actionBtnTextDisabled]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rhythm Editor Section */}
      <View style={styles.rhythmSection}>
        <TouchableOpacity
          style={styles.rhythmToggle}
          onPress={() => {
            setShowRhythmEditor(!showRhythmEditor);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
        >
          <View style={styles.rhythmToggleLeft}>
            <Sliders size={20} color={Colors.accent} />
            <View>
              <Text style={styles.rhythmToggleTitle}>Rhythm Editor</Text>
              <Text style={styles.rhythmToggleSubtitle}>
                {RHYTHM_PRESETS[rhythmPreset].name} • {TEMPO_OPTIONS[tempo].name}
              </Text>
            </View>
          </View>
          <ChevronDown
            size={20}
            color={Colors.textMuted}
            style={{ transform: [{ rotate: showRhythmEditor ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {showRhythmEditor && (
          <View style={styles.rhythmEditorContent}>
            <Text style={styles.rhythmLabel}>Rhythm Preset</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
              <View style={styles.presetsRow}>
                {(Object.keys(RHYTHM_PRESETS) as RhythmPreset[]).map((preset) => {
                  const info = RHYTHM_PRESETS[preset];
                  const isSelected = rhythmPreset === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.presetChip, isSelected && styles.presetChipActive]}
                      onPress={() => {
                        setRhythmPreset(preset);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <Text style={styles.presetIcon}>{info.icon}</Text>
                      <Text style={[styles.presetName, isSelected && styles.presetNameActive]}>
                        {info.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Text style={styles.rhythmLabel}>Swing Amount</Text>
                <Text style={styles.sliderValue}>{Math.round(swingAmount * 100)}%</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${swingAmount * 100}%` }]} />
                <View style={styles.sliderTicks}>
                  {[0, 25, 50, 75, 100].map((tick) => (
                    <TouchableOpacity
                      key={tick}
                      style={styles.sliderTickTouch}
                      onPress={() => setSwingAmount(tick / 100)}
                    >
                      <View style={[styles.sliderTick, swingAmount * 100 >= tick && styles.sliderTickActive]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.rhythmLabel}>Tempo</Text>
            <View style={styles.tempoRow}>
              {(Object.keys(TEMPO_OPTIONS) as TempoVariant[]).map((t) => {
                const info = TEMPO_OPTIONS[t];
                const isSelected = tempo === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tempoBtn, isSelected && styles.tempoBtnActive]}
                    onPress={() => {
                      setTempo(t);
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                  >
                    <Text style={styles.tempoIcon}>{info.icon}</Text>
                    <Text style={[styles.tempoName, isSelected && styles.tempoNameActive]}>
                      {info.name}
                    </Text>
                    <Text style={styles.tempoBpm}>{info.bpm} BPM</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.rhythmLabel}>Style</Text>
            <View style={styles.styleRow}>
              {(Object.keys(STYLE_OPTIONS) as StyleVariant[]).map((s) => {
                const info = STYLE_OPTIONS[s];
                const isSelected = styleVariant === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.styleBtn,
                      isSelected && { backgroundColor: info.color + '30', borderColor: info.color },
                    ]}
                    onPress={() => {
                      setStyleVariant(s);
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                  >
                    <Text style={styles.styleIcon}>{info.icon}</Text>
                    <Text style={[styles.styleName, isSelected && { color: info.color }]}>
                      {info.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.applyRhythmBtn, notes.length < 3 && styles.applyRhythmBtnDisabled]}
              onPress={handleApplyCustomRhythm}
              disabled={notes.length < 3}
            >
              <Check size={18} color={notes.length < 3 ? Colors.textMuted : Colors.background} />
              <Text style={[styles.applyRhythmText, notes.length < 3 && styles.applyRhythmTextDisabled]}>
                Apply Rhythm
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* AI Variants Section */}
      <View style={styles.variantsSection}>
        <TouchableOpacity
          style={[styles.generateVariantsBtn, notes.length < 3 && styles.generateVariantsBtnDisabled]}
          onPress={handleGenerateVariants}
          disabled={notes.length < 3}
        >
          <Zap size={18} color={notes.length < 3 ? Colors.textMuted : Colors.fever} />
          <Text style={[styles.generateVariantsText, notes.length < 3 && styles.generateVariantsTextDisabled]}>
            Generate AI Variants
          </Text>
        </TouchableOpacity>

        {selectedVariant && (
          <View style={styles.selectedVariantCard}>
            <Text style={styles.selectedVariantLabel}>Selected Variant</Text>
            <View style={styles.selectedVariantInfo}>
              <Text style={styles.selectedVariantName}>{selectedVariant.name}</Text>
              <Text style={styles.selectedVariantDesc}>{selectedVariant.description}</Text>
            </View>
            <TouchableOpacity
              style={styles.clearVariantBtn}
              onPress={() => setSelectedVariant(null)}
            >
              <X size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {showVariantPicker && generatedVariants.length > 0 && (
          <View style={styles.variantPickerContainer}>
            <Text style={styles.variantPickerTitle}>Choose a Variant</Text>
            {generatedVariants.map((variant) => (
              <TouchableOpacity
                key={variant.id}
                style={[
                  styles.variantOption,
                  selectedVariant?.id === variant.id && styles.variantOptionSelected,
                ]}
                onPress={() => handleSelectVariant(variant)}
              >
                <View style={styles.variantOptionLeft}>
                  <Text style={styles.variantOptionIcon}>
                    {STYLE_OPTIONS[variant.style].icon}
                  </Text>
                  <View>
                    <Text style={styles.variantOptionName}>{variant.name}</Text>
                    <Text style={styles.variantOptionDesc}>{variant.description}</Text>
                  </View>
                </View>
                <View style={styles.variantOptionMeta}>
                  <Text style={styles.variantOptionTempo}>{variant.tempo} BPM</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.metadataSection}>
        <Text style={styles.sectionTitle}>Melody Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your melody a name..."
            placeholderTextColor={Colors.textMuted}
            maxLength={40}
          />
          <Text style={styles.charCount}>{title.length}/40</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Hint *</Text>
          <TextInput
            style={[styles.textInput, styles.hintInput]}
            value={hint}
            onChangeText={setHint}
            placeholder="Add a hint for players..."
            placeholderTextColor={Colors.textMuted}
            maxLength={100}
            multiline
          />
          <Text style={styles.charCount}>{hint.length}/100</Text>
        </View>

        <View style={styles.pickerRow}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowGenrePicker(!showGenrePicker)}
          >
            <Text style={styles.pickerLabel}>Genre</Text>
            <View style={styles.pickerValue}>
              <Text style={styles.pickerIcon}>{selectedGenre?.icon}</Text>
              <Text style={styles.pickerText}>{selectedGenre?.name}</Text>
              <ChevronRight size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowMoodPicker(!showMoodPicker)}
          >
            <Text style={styles.pickerLabel}>Mood</Text>
            <View style={styles.pickerValue}>
              <Text style={styles.pickerIcon}>{selectedMood?.icon}</Text>
              <Text style={styles.pickerText}>{selectedMood?.name}</Text>
              <ChevronRight size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {showGenrePicker && (
          <View style={styles.optionsGrid}>
            {UGC_GENRES.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.optionChip, genre === g.id && { backgroundColor: g.color + '30', borderColor: g.color }]}
                onPress={() => { setGenre(g.id); setShowGenrePicker(false); }}
              >
                <Text style={styles.optionIcon}>{g.icon}</Text>
                <Text style={[styles.optionText, genre === g.id && { color: g.color }]}>{g.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showMoodPicker && (
          <View style={styles.optionsGrid}>
            {UGC_MOODS.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.optionChip, mood === m.id && { backgroundColor: m.color + '30', borderColor: m.color }]}
                onPress={() => { setMood(m.id); setShowMoodPicker(false); }}
              >
                <Text style={styles.optionIcon}>{m.icon}</Text>
                <Text style={[styles.optionText, mood === m.id && { color: m.color }]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.difficultySection}>
          <Text style={styles.inputLabel}>Difficulty (auto-set by length)</Text>
          <View style={styles.difficultyButtons}>
            {UGC_DIFFICULTY.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.difficultyBtn,
                  currentDifficulty.id === d.id && { backgroundColor: d.color + '30', borderColor: d.color },
                ]}
                disabled={true}
              >
                <Text style={[styles.difficultyText, currentDifficulty.id === d.id && { color: d.color }]}>
                  {d.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.visibilityToggle}
          onPress={() => setIsPublic(!isPublic)}
        >
          <View style={styles.visibilityLeft}>
            {isPublic ? (
              <Globe size={20} color={Colors.correct} />
            ) : (
              <Lock size={20} color={Colors.textMuted} />
            )}
            <View>
              <Text style={styles.visibilityTitle}>
                {isPublic ? 'Public Melody' : 'Private Melody'}
              </Text>
              <Text style={styles.visibilityDesc}>
                {isPublic ? 'Anyone can play and vote' : 'Only shareable via code'}
              </Text>
            </View>
          </View>
          <View style={[styles.toggle, isPublic && styles.toggleActive]}>
            <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>

      {fullValidation && fullValidation.errors.length > 0 && (
        <View style={styles.errorBox}>
          {fullValidation.errors.map((error, i) => (
            <View key={i} style={styles.errorRow}>
              <AlertCircle size={14} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.saveSection}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (notes.length !== targetLength || !title.trim() || !hint.trim()) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={notes.length !== targetLength || !title.trim() || !hint.trim() || isSaving}
          accessibilityLabel={`Save melody with ${notes.length} notes`}
          accessibilityRole="button"
        >
          {isSaving ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <>
              <Save size={20} color={Colors.background} />
              <Text style={styles.saveButtonText}>Save Melody</Text>
            </>
          )}
        </TouchableOpacity>

        {savedMelody && (
          <View style={styles.savedActions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Share2 size={18} color={Colors.accent} />
              <Text style={styles.shareButtonText}>Share Code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.challengeButton} onPress={handleChallengeFriends}>
              <Swords size={18} color={Colors.fever} />
              <Text style={styles.challengeButtonText}>Challenge Friends</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function MyMelodiesTab() {
  const { myMelodies, deleteMelody, creatorStats } = useUserMelodies();
  const { playMelody, stopPlayback } = useAudio();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlay = useCallback((melody: UserMelody) => {
    if (playingId === melody.id) {
      stopPlayback();
      setPlayingId(null);
    } else {
      playMelody(melody.notes, 400);
      setPlayingId(melody.id);
    }
  }, [playingId, playMelody, stopPlayback]);

  const handleDelete = useCallback((melody: UserMelody) => {
    Alert.alert(
      'Delete Melody',
      `Are you sure you want to delete "${melody.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMelody(melody.id),
        },
      ]
    );
  }, [deleteMelody]);

  const handleShare = useCallback(async (melody: UserMelody) => {
    try {
      await Share.share({
        message: `🎵 Can you guess my melody "${melody.title}"?\n\nCode: ${melody.shareCode}\n\n${getMelodyShareUrl(melody.shareCode)}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  }, []);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Creator Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Music size={20} color={Colors.accent} />
            <Text style={styles.statValue}>{creatorStats.totalMelodies}</Text>
            <Text style={styles.statLabel}>Created</Text>
          </View>
          <View style={styles.statItem}>
            <Eye size={20} color={Colors.secondary} />
            <Text style={styles.statValue}>{creatorStats.totalPlays}</Text>
            <Text style={styles.statLabel}>Plays</Text>
          </View>
          <View style={styles.statItem}>
            <Check size={20} color={Colors.correct} />
            <Text style={styles.statValue}>{creatorStats.totalSolves}</Text>
            <Text style={styles.statLabel}>Solves</Text>
          </View>
          <View style={styles.statItem}>
            <Heart size={20} color={Colors.error} />
            <Text style={styles.statValue}>{creatorStats.totalLikes}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
      </View>

      {myMelodies.length === 0 ? (
        <View style={styles.emptyState}>
          <Music size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No melodies yet</Text>
          <Text style={styles.emptySubtitle}>Create your first melody in the Compose tab!</Text>
        </View>
      ) : (
        <View style={styles.melodiesList}>
          {myMelodies.map(melody => (
            <View key={melody.id} style={styles.melodyCard}>
              <View style={styles.melodyHeader}>
                <View style={styles.melodyTitleRow}>
                  <Text style={styles.melodyTitle}>{melody.title}</Text>
                  {melody.isPublic ? (
                    <Globe size={14} color={Colors.correct} />
                  ) : (
                    <Lock size={14} color={Colors.textMuted} />
                  )}
                </View>
                <Text style={styles.melodyHint}>{melody.hint}</Text>
              </View>

              <View style={styles.melodyNotes}>
                {melody.notes.map((note, i) => {
                  const colors = NOTE_COLORS[note] || { bg: '#666', text: '#FFF' };
                  return (
                    <View key={i} style={[styles.miniNote, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.miniNoteText, { color: colors.text }]}>{note}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.melodyStats}>
                <View style={styles.melodyStatItem}>
                  <Eye size={12} color={Colors.textMuted} />
                  <Text style={styles.melodyStatText}>{melody.stats.plays}</Text>
                </View>
                <View style={styles.melodyStatItem}>
                  <Check size={12} color={Colors.correct} />
                  <Text style={styles.melodyStatText}>{melody.stats.solves}</Text>
                </View>
                <View style={styles.melodyStatItem}>
                  <Heart size={12} color={Colors.error} />
                  <Text style={styles.melodyStatText}>{melody.stats.likes}</Text>
                </View>
                <Text style={styles.melodyCode}>#{melody.shareCode}</Text>
              </View>

              <View style={styles.melodyActions}>
                <TouchableOpacity
                  style={styles.melodyActionBtn}
                  onPress={() => handlePlay(melody)}
                >
                  <Play size={16} color={playingId === melody.id ? Colors.accent : Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.melodyActionBtn}
                  onPress={() => handleShare(melody)}
                >
                  <Share2 size={16} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.melodyActionBtn}
                  onPress={() => handleDelete(melody)}
                >
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function DiscoverTab() {
  const { getPublicMelodies, voteMelody, getCreatorLeaderboard } = useUserMelodies();
  const { playMelody, stopPlayback } = useAudio();
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('trending');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const melodies = useMemo(() => getPublicMelodies(sortBy), [getPublicMelodies, sortBy]);
  const leaderboard = useMemo(() => getCreatorLeaderboard(), [getCreatorLeaderboard]);

  const handlePlay = useCallback((melody: UserMelody) => {
    if (playingId === melody.id) {
      stopPlayback();
      setPlayingId(null);
    } else {
      playMelody(melody.notes, 400);
      setPlayingId(melody.id);
    }
  }, [playingId, playMelody, stopPlayback]);

  const handleVote = useCallback(async (melodyId: string, vote: 'like' | 'dislike') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await voteMelody(melodyId, vote);
  }, [voteMelody]);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.discoverHeader}>
        <View style={styles.sortButtons}>
          {(['trending', 'popular', 'newest'] as const).map(sort => (
            <TouchableOpacity
              key={sort}
              style={[styles.sortBtn, sortBy === sort && styles.sortBtnActive]}
              onPress={() => setSortBy(sort)}
            >
              {sort === 'trending' && <TrendingUp size={14} color={sortBy === sort ? Colors.accent : Colors.textMuted} />}
              {sort === 'popular' && <Heart size={14} color={sortBy === sort ? Colors.accent : Colors.textMuted} />}
              {sort === 'newest' && <Clock size={14} color={sortBy === sort ? Colors.accent : Colors.textMuted} />}
              <Text style={[styles.sortBtnText, sortBy === sort && styles.sortBtnTextActive]}>
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.leaderboardBtn}
          onPress={() => setShowLeaderboard(!showLeaderboard)}
        >
          <Users size={16} color={Colors.accent} />
          <Text style={styles.leaderboardBtnText}>Creators</Text>
        </TouchableOpacity>
      </View>

      {showLeaderboard && (
        <View style={styles.leaderboardCard}>
          <Text style={styles.leaderboardTitle}>Top Creators</Text>
          {leaderboard.slice(0, 10).map((creator, index) => (
            <View key={creator.odId} style={styles.leaderboardRow}>
              <Text style={styles.leaderboardRank}>#{index + 1}</Text>
              <Text style={styles.leaderboardName}>{creator.odName}</Text>
              <View style={styles.leaderboardStats}>
                <Text style={styles.leaderboardStat}>{creator.melodyCount} 🎵</Text>
                <Text style={styles.leaderboardStat}>{creator.totalLikes} ❤️</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {melodies.length === 0 ? (
        <View style={styles.emptyState}>
          <Globe size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No public melodies yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to share one!</Text>
        </View>
      ) : (
        <View style={styles.melodiesList}>
          {melodies.map(melody => (
            <View key={melody.id} style={styles.melodyCard}>
              <View style={styles.melodyHeader}>
                <View style={styles.melodyTitleRow}>
                  <Text style={styles.melodyTitle}>{melody.title}</Text>
                  <Text style={styles.creatorName}>by {melody.creatorName}</Text>
                </View>
                <Text style={styles.melodyHint}>{melody.hint}</Text>
              </View>

              <View style={styles.melodyTags}>
                <View style={[styles.tag, { backgroundColor: UGC_GENRES.find(g => g.id === melody.genre)?.color + '30' }]}>
                  <Text style={styles.tagText}>{UGC_GENRES.find(g => g.id === melody.genre)?.icon} {melody.genre}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: UGC_MOODS.find(m => m.id === melody.mood)?.color + '30' }]}>
                  <Text style={styles.tagText}>{UGC_MOODS.find(m => m.id === melody.mood)?.icon} {melody.mood}</Text>
                </View>
              </View>

              <View style={styles.melodyStats}>
                <View style={styles.melodyStatItem}>
                  <Eye size={12} color={Colors.textMuted} />
                  <Text style={styles.melodyStatText}>{melody.stats.plays}</Text>
                </View>
                <View style={styles.melodyStatItem}>
                  <Check size={12} color={Colors.correct} />
                  <Text style={styles.melodyStatText}>{melody.stats.solves}</Text>
                </View>
              </View>

              <View style={styles.discoverActions}>
                <TouchableOpacity
                  style={styles.playPublicBtn}
                  onPress={() => handlePlay(melody)}
                >
                  <Play size={16} color={Colors.text} />
                  <Text style={styles.playPublicText}>
                    {playingId === melody.id ? 'Stop' : 'Preview'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.voteButtons}>
                  <TouchableOpacity
                    style={styles.voteBtn}
                    onPress={() => handleVote(melody.id, 'like')}
                  >
                    <Heart size={18} color={Colors.error} />
                    <Text style={styles.voteCount}>{melody.stats.likes}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('compose');

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'compose', label: 'Compose', icon: <Music size={18} /> },
    { key: 'my-melodies', label: 'My Melodies', icon: <Sparkles size={18} /> },
    { key: 'discover', label: 'Discover', icon: <Globe size={18} /> },
  ];

  return (
    <ThemedBackground theme="default" isDark={isDarkMode} animated={false}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Create & Guess</Text>
          <Text style={styles.subtitle}>Compose melodies for others to guess</Text>
        </View>

        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab.key);
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, {
                color: activeTab === tab.key ? Colors.accent : Colors.textMuted,
              })}
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'compose' && <ComposerTab />}
        {activeTab === 'my-melodies' && <MyMelodiesTab />}
        {activeTab === 'discover' && <DiscoverTab />}
      </View>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
  },
  tabActive: {
    backgroundColor: Colors.accent + '20',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.accent,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  composerSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  notesDisplay: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
    marginBottom: 12,
  },
  emptyNotes: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  notesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  noteChipText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  noteCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  noteCountValid: {
    color: Colors.correct,
  },
  noteCountError: {
    color: Colors.error,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 11,
    color: Colors.warning,
  },
  pianoContainer: {
    gap: 8,
    marginBottom: 16,
  },
  pianoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  pianoKey: {
    width: 48,
    height: 54,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pianoKeyText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  deleteBtn: {},
  previewBtn: {},
  previewBtnActive: {
    backgroundColor: Colors.accent + '30',
  },
  clearBtn: {},
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actionBtnTextDisabled: {
    color: Colors.textMuted,
  },
  metadataSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  pickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickerIcon: {
    fontSize: 16,
  },
  pickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionIcon: {
    fontSize: 14,
  },
  optionText: {
    fontSize: 13,
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lengthPickerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
  },
  lengthPickerText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  lengthPickerContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lengthPickerLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  lengthOptionsScroll: {
    marginBottom: 12,
  },
  lengthOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthOption: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 60,
  },
  lengthOptionValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  lengthOptionLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  customLengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customLengthLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  customLengthInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    width: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteCountHint: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  previewGridToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 12,
  },
  previewGridText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  gridPreviewContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  difficultySection: {
    marginBottom: 16,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  visibilityToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
  },
  visibilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visibilityTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  visibilityDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: Colors.correct,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.text,
  },
  toggleThumbActive: {
    marginLeft: 20,
  },
  errorBox: {
    backgroundColor: Colors.error + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  saveSection: {
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  savedActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent + '20',
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  challengeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.fever + '20',
    paddingVertical: 14,
    borderRadius: 12,
  },
  challengeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.fever,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  melodiesList: {
    gap: 12,
  },
  melodyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  melodyHeader: {
    marginBottom: 10,
  },
  melodyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  melodyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  creatorName: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  melodyHint: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  melodyNotes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  miniNote: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniNoteText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  melodyTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: Colors.text,
  },
  melodyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  melodyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  melodyStatText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  melodyCode: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 'auto',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  melodyActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  melodyActionBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  discoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
  },
  sortBtnActive: {
    backgroundColor: Colors.accent + '20',
  },
  sortBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sortBtnTextActive: {
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  leaderboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.accent + '15',
  },
  leaderboardBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  leaderboardCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leaderboardRank: {
    width: 30,
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  leaderboardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  leaderboardStat: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  discoverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  playPublicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  playPublicText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  voteCount: {
    fontSize: 13,
    color: Colors.text,
  },
  rhythmSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  rhythmToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rhythmToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rhythmToggleTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  rhythmToggleSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rhythmEditorContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rhythmLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  presetsScroll: {
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent,
  },
  presetIcon: {
    fontSize: 16,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  presetNameActive: {
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  sliderSection: {
    marginBottom: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  sliderTrack: {
    height: 32,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.accent,
    borderRadius: 8,
  },
  sliderTicks: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderTickTouch: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTick: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  sliderTickActive: {
    backgroundColor: Colors.background,
  },
  tempoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tempoBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tempoBtnActive: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent,
  },
  tempoIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  tempoName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tempoNameActive: {
    color: Colors.accent,
  },
  tempoBpm: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  styleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  styleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  styleIcon: {
    fontSize: 14,
  },
  styleName: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  applyRhythmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyRhythmBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  applyRhythmText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  applyRhythmTextDisabled: {
    color: Colors.textMuted,
  },
  variantsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  generateVariantsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.fever + '20',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.fever + '40',
  },
  generateVariantsBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.border,
  },
  generateVariantsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.fever,
  },
  generateVariantsTextDisabled: {
    color: Colors.textMuted,
  },
  selectedVariantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  selectedVariantLabel: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: '600' as const,
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 4,
  },
  selectedVariantInfo: {
    flex: 1,
  },
  selectedVariantName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  selectedVariantDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  clearVariantBtn: {
    padding: 8,
  },
  variantPickerContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  variantPickerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  variantOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  variantOptionSelected: {
    backgroundColor: Colors.accent + '15',
    borderColor: Colors.accent,
  },
  variantOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  variantOptionIcon: {
    fontSize: 24,
  },
  variantOptionName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  variantOptionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  variantOptionMeta: {
    alignItems: 'flex-end',
  },
  variantOptionTempo: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
});
