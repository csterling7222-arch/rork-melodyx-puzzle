import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Share,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  X,
  Share2,
  Copy,
  Twitter,
  Instagram,
  Youtube,
  Music,
  Hash,
  Sparkles,
  Check,
  Image as ImageIcon,
  Video,
  MessageCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Melody } from '@/utils/melodies';
import { GuessResult, generateShareText } from '@/utils/gameLogic';

interface SocialShareModalProps {
  visible: boolean;
  onClose: () => void;
  melody: Melody | null;
  guesses: GuessResult[][];
  puzzleNumber: number;
  won: boolean;
  streak: number;
}

interface PlatformButtonProps {
  icon: React.ReactNode;
  name: string;
  color: string;
  onPress: () => void;
  selected?: boolean;
}

function PlatformButton({ icon, name, color, onPress, selected }: PlatformButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.platformButton,
        { borderColor: selected ? color : Colors.surfaceLight },
        selected && { backgroundColor: color + '15' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.platformIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.platformName}>{name}</Text>
      {selected && (
        <View style={[styles.selectedBadge, { backgroundColor: color }]}>
          <Check size={12} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

interface ShareTemplateProps {
  title: string;
  preview: string;
  selected: boolean;
  onPress: () => void;
}

function ShareTemplate({ title, preview, selected, onPress }: ShareTemplateProps) {
  return (
    <TouchableOpacity
      style={[styles.templateCard, selected && styles.templateCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.templateTitle}>{title}</Text>
      <Text style={styles.templatePreview} numberOfLines={2}>{preview}</Text>
      {selected && (
        <View style={styles.templateCheck}>
          <Check size={14} color={Colors.accent} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const AI_CAPTIONS = [
  "Just crushed today's melody puzzle! 🎵",
  "My ears are getting sharper! 👂🔥",
  "Can you beat my score? Challenge accepted! 🎯",
  "Music genius mode: ACTIVATED 🧠🎶",
  "Another day, another melody mastered! 💪",
];

const AI_HASHTAGS = [
  '#Melodyx', '#MusicPuzzle', '#DailyChallenge', '#MusicGame',
  '#GuessThatTune', '#MusicTrivia', '#BrainGames', '#PuzzleGame',
];

export default function SocialShareModal({
  visible,
  onClose,
  melody,
  guesses,
  puzzleNumber,
  won,
  streak,
}: SocialShareModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [selectedPlatform, setSelectedPlatform] = useState<string>('twitter');
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [customCaption, setCustomCaption] = useState('');
  const [copied, setCopied] = useState(false);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);

  const baseShareText = generateShareText(guesses, puzzleNumber, won, melody?.notes.length || 6, streak);

  const templates = useMemo(() => [
    {
      title: 'Classic',
      text: baseShareText,
    },
    {
      title: 'Brag',
      text: won
        ? `🏆 CRUSHED IT! Melodyx #${puzzleNumber}\n${guesses.length}/6 guesses\n🔥 ${streak} day streak!\n\nCan you beat me?`
        : `Melodyx #${puzzleNumber}\nSo close! Better luck tomorrow 🎵\n\nPlay: melodyx.app`,
    },
    {
      title: 'Minimal',
      text: `Melodyx #${puzzleNumber} ${won ? '✅' : '❌'}\n${guesses.length}/6`,
    },
    {
      title: 'Story',
      text: won
        ? `Today I proved my ears work! 👂\n\nMelodyx #${puzzleNumber}: ${guesses.length}/6\n"${melody?.name || 'Mystery tune'}" 🎵\n\n${streak > 1 ? `${streak} days strong! ` : ''}Who else plays?`
        : `The melody stumped me today! 🤔\n\nMelodyx #${puzzleNumber}\nIt was "${melody?.name || 'a tricky one'}"\n\nTry it yourself!`,
    },
  ], [baseShareText, puzzleNumber, guesses.length, melody?.name, won, streak]);

  const getFullShareText = useCallback(() => {
    let text = customCaption || templates[selectedTemplate].text;
    
    if (includeHashtags) {
      const hashtags = AI_HASHTAGS.slice(0, 4).join(' ');
      text += `\n\n${hashtags}`;
    }
    
    return text;
  }, [customCaption, selectedTemplate, templates, includeHashtags]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      setCopied(false);
      setCustomCaption('');
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleCopy = useCallback(async () => {
    const text = getFullShareText();
    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await Share.share({ message: text });
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [getFullShareText]);

  const handleShareToTwitter = useCallback(async () => {
    const text = getFullShareText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    if (Platform.OS === 'web') {
      window.open(twitterUrl, '_blank');
    } else {
      await Share.share({ message: text, title: 'Share to X' });
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [getFullShareText]);

  const handleNativeShare = useCallback(async () => {
    const text = getFullShareText();
    try {
      await Share.share({
        message: text,
        title: `Melodyx #${puzzleNumber}`,
      });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('[SocialShare] Share error:', error);
    }
  }, [getFullShareText, puzzleNumber]);

  const handleGenerateAICaption = useCallback(() => {
    const randomCaption = AI_CAPTIONS[Math.floor(Math.random() * AI_CAPTIONS.length)];
    const streakText = streak > 1 ? ` 🔥 ${streak} day streak!` : '';
    setCustomCaption(`${randomCaption}${streakText}\n\nMelodyx #${puzzleNumber} ${won ? '✅' : ''} ${guesses.length}/6`);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [streak, puzzleNumber, won, guesses.length]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Share2 size={32} color={Colors.accent} />
              <Text style={styles.title}>Share Your Result</Text>
              <Text style={styles.subtitle}>
                Show off your music knowledge!
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Platform</Text>
              <View style={styles.platformsGrid}>
                <PlatformButton
                  icon={<Twitter size={20} color="#1DA1F2" />}
                  name="X/Twitter"
                  color="#1DA1F2"
                  onPress={() => setSelectedPlatform('twitter')}
                  selected={selectedPlatform === 'twitter'}
                />
                <PlatformButton
                  icon={<Instagram size={20} color="#E4405F" />}
                  name="Instagram"
                  color="#E4405F"
                  onPress={() => setSelectedPlatform('instagram')}
                  selected={selectedPlatform === 'instagram'}
                />
                <PlatformButton
                  icon={<Youtube size={20} color="#FF0000" />}
                  name="TikTok"
                  color="#FF0000"
                  onPress={() => setSelectedPlatform('tiktok')}
                  selected={selectedPlatform === 'tiktok'}
                />
                <PlatformButton
                  icon={<MessageCircle size={20} color="#25D366" />}
                  name="WhatsApp"
                  color="#25D366"
                  onPress={() => setSelectedPlatform('whatsapp')}
                  selected={selectedPlatform === 'whatsapp'}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Template</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.templatesRow}>
                  {templates.map((template, index) => (
                    <ShareTemplate
                      key={index}
                      title={template.title}
                      preview={template.text}
                      selected={selectedTemplate === index && !customCaption}
                      onPress={() => {
                        setSelectedTemplate(index);
                        setCustomCaption('');
                      }}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Custom Caption</Text>
                <TouchableOpacity style={styles.aiButton} onPress={handleGenerateAICaption}>
                  <Sparkles size={14} color={Colors.accent} />
                  <Text style={styles.aiButtonText}>AI Generate</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.captionInput}
                placeholder="Write your own caption..."
                placeholderTextColor={Colors.textMuted}
                value={customCaption}
                onChangeText={setCustomCaption}
                multiline
                maxLength={280}
              />
              <Text style={styles.charCount}>
                {(customCaption || templates[selectedTemplate].text).length}/280
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Options</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[styles.optionChip, includeHashtags && styles.optionChipActive]}
                  onPress={() => setIncludeHashtags(!includeHashtags)}
                >
                  <Hash size={14} color={includeHashtags ? Colors.accent : Colors.textMuted} />
                  <Text style={[styles.optionText, includeHashtags && styles.optionTextActive]}>
                    Hashtags
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionChip, includeEmojis && styles.optionChipActive]}
                  onPress={() => setIncludeEmojis(!includeEmojis)}
                >
                  <Text style={styles.emojiIcon}>😊</Text>
                  <Text style={[styles.optionText, includeEmojis && styles.optionTextActive]}>
                    Emojis
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>{getFullShareText()}</Text>
              </View>
            </View>

            <View style={styles.shareButtons}>
              <TouchableOpacity
                style={[styles.shareButton, styles.copyButton]}
                onPress={handleCopy}
              >
                <Copy size={18} color={Colors.text} />
                <Text style={styles.shareButtonText}>
                  {copied ? 'Copied!' : 'Copy Text'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButton, styles.twitterButton]}
                onPress={handleShareToTwitter}
              >
                <Twitter size={18} color="#1DA1F2" />
                <Text style={[styles.shareButtonText, { color: '#1DA1F2' }]}>
                  Post to X
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButton, styles.primaryShareButton]}
                onPress={handleNativeShare}
              >
                <Share2 size={18} color={Colors.background} />
                <Text style={styles.primaryShareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mediaSection}>
              <Text style={styles.mediaSectionTitle}>Coming Soon</Text>
              <View style={styles.mediaOptionsRow}>
                <View style={styles.mediaOption}>
                  <ImageIcon size={20} color={Colors.textMuted} />
                  <Text style={styles.mediaOptionText}>Image Export</Text>
                </View>
                <View style={styles.mediaOption}>
                  <Video size={20} color={Colors.textMuted} />
                  <Text style={styles.mediaOptionText}>Video Clip</Text>
                </View>
                <View style={styles.mediaOption}>
                  <Music size={20} color={Colors.textMuted} />
                  <Text style={styles.mediaOptionText}>Audio Snippet</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  platformButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
  },
  platformIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  platformName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templatesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  templateCard: {
    width: 140,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  templatePreview: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  templateCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  captionInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    minHeight: 80,
    color: Colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  optionTextActive: {
    color: Colors.accent,
  },
  emojiIcon: {
    fontSize: 14,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  previewBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  previewText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  copyButton: {
    backgroundColor: Colors.surfaceLight,
  },
  twitterButton: {
    backgroundColor: '#1DA1F2' + '15',
  },
  primaryShareButton: {
    backgroundColor: Colors.accent,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  primaryShareButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  mediaSection: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  mediaSectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 12,
    textAlign: 'center',
  },
  mediaOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mediaOption: {
    alignItems: 'center',
    gap: 6,
    opacity: 0.5,
  },
  mediaOptionText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
