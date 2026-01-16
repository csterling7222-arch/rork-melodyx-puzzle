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
  Alert,
} from 'react-native';
import {
  X,
  Share2,
  Copy,
  Instagram,
  Youtube,
  Music,
  Hash,
  Sparkles,
  Check,
  Image as ImageIcon,
  Video,
  MessageCircle,
  MessageSquare,
  Camera,
  Crown,
  Zap,
  Palette,
  Type,
  Smile,
  Wand2,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Facebook,
  Send,
  RefreshCw,
  Lock,
  Linkedin,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/colors';
import { Melody } from '@/utils/melodies';
import { GuessResult } from '@/utils/gameLogic';
import {
  SHARE_PLATFORMS,
  SHARE_TEMPLATES,
  SHARE_STICKERS,
  SHARE_FILTERS,
  SHARE_EFFECTS,
  SHARE_WATERMARK,
  LEGAL_DISCLAIMER,
  ShareTemplate,
  ShareSticker,
  ShareFilter,
  ShareEffect,
} from '@/constants/socialShare';
import { useSocialShare } from '@/contexts/SocialShareContext';
import { usePurchases } from '@/contexts/PurchasesContext';



interface SocialShareModalProps {
  visible: boolean;
  onClose: () => void;
  melody: Melody | null;
  guesses: GuessResult[][];
  puzzleNumber: number;
  won: boolean;
  streak: number;
  mode?: 'daily' | 'fever' | 'learning';
  additionalData?: {
    score?: number;
    chain?: number;
    accuracy?: number;
    instrument?: string;
  };
}

interface PlatformButtonProps {
  icon: React.ReactNode;
  name: string;
  color: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}

function PlatformButton({ icon, name, color, onPress, selected, disabled }: PlatformButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.platformButton,
          { borderColor: selected ? color : Colors.surfaceLight },
          selected && { backgroundColor: color + '15' },
          disabled && styles.platformButtonDisabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View style={[styles.platformIconContainer, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={[styles.platformName, disabled && styles.textDisabled]}>{name}</Text>
        {selected && (
          <View style={[styles.selectedBadge, { backgroundColor: color }]}>
            <Check size={12} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function TemplateCard({ 
  template, 
  selected, 
  onPress, 
  isPremiumUser 
}: { 
  template: ShareTemplate; 
  selected: boolean; 
  onPress: () => void;
  isPremiumUser: boolean;
}) {
  const isLocked = template.isPremium && !isPremiumUser;

  return (
    <TouchableOpacity
      style={[
        styles.templateCard,
        selected && styles.templateCardSelected,
        isLocked && styles.templateCardLocked,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLocked}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateEmoji}>{template.emoji}</Text>
        <Text style={styles.templateTitle}>{template.name}</Text>
        {isLocked && <Lock size={14} color={Colors.textMuted} />}
        {template.isPremium && isPremiumUser && <Crown size={14} color="#FFD700" />}
      </View>
      <Text style={styles.templatePreview} numberOfLines={2}>
        {template.textTemplate.replace(/{[^}]+}/g, '...')}
      </Text>
      {selected && (
        <View style={styles.templateCheck}>
          <Check size={14} color={Colors.accent} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function StickerChip({ 
  sticker, 
  selected, 
  onPress, 
  isPremiumUser 
}: { 
  sticker: ShareSticker; 
  selected: boolean; 
  onPress: () => void;
  isPremiumUser: boolean;
}) {
  const isLocked = sticker.isPremium && !isPremiumUser;

  return (
    <TouchableOpacity
      style={[
        styles.stickerChip,
        selected && styles.stickerChipSelected,
        isLocked && styles.stickerChipLocked,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLocked}
    >
      <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>
      {isLocked && <Lock size={10} color={Colors.textMuted} style={styles.stickerLock} />}
    </TouchableOpacity>
  );
}

function FilterOption({ 
  filter, 
  selected, 
  onPress, 
  isPremiumUser 
}: { 
  filter: ShareFilter; 
  selected: boolean; 
  onPress: () => void;
  isPremiumUser: boolean;
}) {
  const isLocked = filter.isPremium && !isPremiumUser;

  return (
    <TouchableOpacity
      style={[
        styles.filterOption,
        selected && styles.filterOptionSelected,
        isLocked && styles.filterOptionLocked,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLocked}
    >
      <Text style={[styles.filterName, selected && styles.filterNameSelected]}>
        {filter.name}
      </Text>
      {isLocked && <Lock size={10} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

function EffectOption({ 
  effect, 
  selected, 
  onPress, 
  isPremiumUser 
}: { 
  effect: ShareEffect; 
  selected: boolean; 
  onPress: () => void;
  isPremiumUser: boolean;
}) {
  const isLocked = effect.isPremium && !isPremiumUser;

  return (
    <TouchableOpacity
      style={[
        styles.effectOption,
        selected && styles.effectOptionSelected,
        isLocked && styles.effectOptionLocked,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLocked}
    >
      <Sparkles size={14} color={selected ? Colors.accent : Colors.textMuted} />
      <Text style={[styles.effectName, selected && styles.effectNameSelected]}>
        {effect.name}
      </Text>
      {isLocked && <Lock size={10} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function SocialShareModal({
  visible,
  onClose,
  melody,
  guesses,
  puzzleNumber,
  won,
  streak,
  mode = 'daily',
  additionalData,
}: SocialShareModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const { isPremium } = usePurchases();
  const {
    shareState,
    canShare,
    getRemainingShares,
    recordShare,
    addToFavorites,
    addRecentSticker,
    generateAICaption,
    getHashtagsForPlatform,
    getPlatformConfig,
    formatContentForPlatform,
    getViralScore,
    isGeneratingCaption,
  } = useSocialShare();

  const [selectedPlatform, setSelectedPlatform] = useState<string>('x');
  const [selectedTemplate, setSelectedTemplate] = useState<ShareTemplate>(
    SHARE_TEMPLATES.find(t => t.category === (won ? 'win' : 'loss') && !t.isPremium) || SHARE_TEMPLATES[0]
  );
  const [customCaption, setCustomCaption] = useState('');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<ShareFilter>(SHARE_FILTERS[0]);
  const [selectedEffect, setSelectedEffect] = useState<ShareEffect>(SHARE_EFFECTS[0]);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(!isPremium);
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('templates');
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(false);

  const availableTemplates = useMemo(() => {
    const category = won ? 'win' : 'loss';
    if (mode === 'fever') return SHARE_TEMPLATES.filter(t => t.category === 'fever' || t.category === category);
    if (mode === 'learning') return SHARE_TEMPLATES.filter(t => t.category === 'learning' || t.category === category);
    return SHARE_TEMPLATES.filter(t => t.category === category || t.category === 'streak' || t.category === 'challenge');
  }, [won, mode]);

  const processTemplate = useCallback((template: ShareTemplate): string => {
    let text = template.textTemplate;
    
    text = text.replace(/{puzzleNumber}/g, String(puzzleNumber));
    text = text.replace(/{guessCount}/g, String(guesses.length));
    text = text.replace(/{streak}/g, String(streak));
    text = text.replace(/{songName}/g, melody?.name || 'Mystery Tune');
    text = text.replace(/{artist}/g, melody?.artist || 'Unknown Artist');
    text = text.replace(/{score}/g, String(additionalData?.score || 0));
    text = text.replace(/{chain}/g, String(additionalData?.chain || 0));
    text = text.replace(/{accuracy}/g, String(additionalData?.accuracy || 0));
    
    text = text.replace(/{streak > 1 \? streak \+ " days strong! " : ""}/g, 
      streak > 1 ? `${streak} days strong! ` : '');
    
    return text;
  }, [puzzleNumber, guesses.length, streak, melody, additionalData]);

  const getFullShareText = useCallback(() => {
    let text = customCaption || processTemplate(selectedTemplate);
    
    if (selectedStickers.length > 0) {
      const stickerEmojis = selectedStickers
        .map(id => SHARE_STICKERS.find(s => s.id === id)?.emoji)
        .filter(Boolean)
        .join(' ');
      text = `${stickerEmojis} ${text}`;
    }
    
    if (includeHashtags) {
      const hashtags = getHashtagsForPlatform(selectedPlatform, selectedTemplate.suggestedHashtags);
      text += `\n\n${hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
    }
    
    if (includeWatermark && !isPremium) {
      text += `\n\n${SHARE_WATERMARK.text}`;
    }
    
    const platformConfig = getPlatformConfig(selectedPlatform);
    if (platformConfig) {
      text = formatContentForPlatform(text, platformConfig);
    }
    
    return text;
  }, [
    customCaption, 
    selectedTemplate, 
    selectedStickers, 
    includeHashtags, 
    includeWatermark, 
    isPremium,
    selectedPlatform,
    processTemplate,
    getHashtagsForPlatform,
    getPlatformConfig,
    formatContentForPlatform,
  ]);

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

      const defaultTemplate = availableTemplates.find(t => !t.isPremium) || availableTemplates[0];
      setSelectedTemplate(defaultTemplate);
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      setCopied(false);
      setCustomCaption('');
      setSelectedStickers([]);
      setExpandedSection('templates');
    }
  }, [visible, scaleAnim, opacityAnim, availableTemplates]);

  const handleCopy = useCallback(async () => {
    if (!canShare()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const text = getFullShareText();
    
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } else {
        // On native, just copy to clipboard without opening share sheet
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('[SocialShare] Copy error:', error);
    }

    recordShare('clipboard', selectedTemplate.id, {
      hasStickers: selectedStickers.length > 0,
      hasFilters: selectedFilter.id !== 'none',
      hasEffects: selectedEffect.id !== 'none',
      shareType: 'text',
    });
  }, [canShare, getFullShareText, recordShare, selectedTemplate.id, selectedStickers.length, selectedFilter.id, selectedEffect.id]);

  const handleShareToPlatform = useCallback(async () => {
    const text = getFullShareText();
    
    console.log('[SocialShare] Attempting to share, platform:', Platform.OS);
    console.log('[SocialShare] Share text length:', text.length);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            text: text,
            title: `Melodyx #${puzzleNumber}`,
          });
          console.log('[SocialShare] Web share completed');
          recordShare('native', selectedTemplate.id, {
            hasStickers: selectedStickers.length > 0,
            hasFilters: selectedFilter.id !== 'none',
            hasEffects: selectedEffect.id !== 'none',
            shareType: 'text',
          });
        } else {
          await Clipboard.setStringAsync(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          Alert.alert('Copied!', 'Your result has been copied to clipboard. Paste it anywhere to share!');
        }
        return;
      }

      const shareContent: { message: string; title?: string; url?: string } = {
        message: text,
      };
      
      if (Platform.OS === 'ios') {
        shareContent.title = `Melodyx #${puzzleNumber}`;
      }
      
      console.log('[SocialShare] Calling Share.share with:', JSON.stringify(shareContent));
      
      const result = await Share.share(shareContent);
      
      console.log('[SocialShare] Share completed, action:', result.action);

      if (result.action === Share.sharedAction) {
        console.log('[SocialShare] User shared successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        recordShare('native', selectedTemplate.id, {
          hasStickers: selectedStickers.length > 0,
          hasFilters: selectedFilter.id !== 'none',
          hasEffects: selectedEffect.id !== 'none',
          shareType: 'text',
        });
      } else if (result.action === Share.dismissedAction) {
        console.log('[SocialShare] User dismissed share dialog');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('[SocialShare] Share error:', errorMessage);
      
      try {
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        Alert.alert('Copied!', 'Your result has been copied. You can paste it in any app to share!');
      } catch (clipboardError) {
        console.log('[SocialShare] Clipboard fallback error:', clipboardError);
        Alert.alert('Share Error', 'Unable to share. Please try again.');
      }
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  }, [getFullShareText, puzzleNumber, recordShare, selectedTemplate.id, selectedStickers.length, selectedFilter.id, selectedEffect.id]);

  const handleGenerateAICaption = useCallback(async () => {
    const caption = await generateAICaption({
      won,
      guessCount: guesses.length,
      streak,
      songName: melody?.name,
      artist: melody?.artist,
      puzzleNumber,
      platform: selectedPlatform,
    });
    setCustomCaption(caption);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [generateAICaption, won, guesses.length, streak, melody, puzzleNumber, selectedPlatform]);

  const handleStickerToggle = useCallback((stickerId: string) => {
    setSelectedStickers(prev => {
      if (prev.includes(stickerId)) {
        return prev.filter(id => id !== stickerId);
      }
      if (prev.length >= 5) return prev;
      addRecentSticker(stickerId);
      return [...prev, stickerId];
    });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [addRecentSticker]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const remainingShares = getRemainingShares();
  const viralScore = getViralScore();

  const getPlatformIcon = (platformId: string, color: string) => {
    switch (platformId) {
      case 'tiktok':
        return <Video size={20} color={color} />;
      case 'x':
        return <Text style={{ fontSize: 20, fontWeight: '900' as const, color }}>𝕏</Text>;
      case 'instagram':
        return <Instagram size={20} color={color} />;
      case 'facebook':
        return <Facebook size={20} color={color} />;
      case 'snapchat':
        return <Camera size={20} color={color} />;
      case 'youtube':
        return <Youtube size={20} color={color} />;
      case 'reddit':
        return <MessageCircle size={20} color={color} />;
      case 'whatsapp':
        return <Send size={20} color={color} />;
      case 'sms':
        return <MessageSquare size={20} color={color} />;
      case 'imessage':
        return <MessageCircle size={20} color={color} />;
      case 'linkedin':
        return <Linkedin size={20} color={color} />;
      default:
        return <Share2 size={20} color={color} />;
    }
  };

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
          <TouchableOpacity style={styles.closeButton} onPress={onClose} testID="close-share-modal">
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Share2 size={32} color={Colors.accent} />
              <Text style={styles.title}>Share Your Result</Text>
              <Text style={styles.subtitle}>
                Show off your music knowledge!
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <TrendingUp size={12} color={Colors.accent} />
                  <Text style={styles.statText}>Viral Score: {viralScore}</Text>
                </View>
                <View style={styles.statChip}>
                  <Zap size={12} color={Colors.warning} />
                  <Text style={styles.statText}>{shareState.shareStreak} share streak</Text>
                </View>
              </View>

              {!isPremium && remainingShares !== -1 && (
                <View style={styles.limitBanner}>
                  <Text style={styles.limitText}>
                    {remainingShares > 0 
                      ? `${remainingShares} free shares left today`
                      : 'Daily limit reached - Go Premium for unlimited!'}
                  </Text>
                  {remainingShares === 0 && (
                    <Crown size={14} color="#FFD700" />
                  )}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Platform</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.platformsRow}>
                  {SHARE_PLATFORMS.slice(0, 8).map(platform => (
                    <PlatformButton
                      key={platform.id}
                      icon={getPlatformIcon(platform.id, platform.color)}
                      name={platform.name}
                      color={platform.color}
                      onPress={() => setSelectedPlatform(platform.id)}
                      selected={selectedPlatform === platform.id}
                      disabled={!canShare()}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={() => toggleSection('templates')}
              >
                <View style={styles.sectionTitleRow}>
                  <Type size={16} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Templates</Text>
                </View>
                <ChevronDown 
                  size={18} 
                  color={Colors.textMuted}
                  style={expandedSection === 'templates' ? styles.chevronUp : undefined}
                />
              </TouchableOpacity>
              
              {expandedSection === 'templates' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.templatesRow}>
                    {availableTemplates.map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        selected={selectedTemplate.id === template.id && !customCaption}
                        onPress={() => {
                          setSelectedTemplate(template);
                          setCustomCaption('');
                          if (!template.isPremium || isPremium) {
                            addToFavorites(template.id);
                          }
                        }}
                        isPremiumUser={isPremium}
                      />
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={() => toggleSection('stickers')}
              >
                <View style={styles.sectionTitleRow}>
                  <Smile size={16} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Stickers</Text>
                  {selectedStickers.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{selectedStickers.length}</Text>
                    </View>
                  )}
                </View>
                <ChevronDown 
                  size={18} 
                  color={Colors.textMuted}
                  style={expandedSection === 'stickers' ? styles.chevronUp : undefined}
                />
              </TouchableOpacity>
              
              {expandedSection === 'stickers' && (
                <View style={styles.stickersGrid}>
                  {SHARE_STICKERS.map(sticker => (
                    <StickerChip
                      key={sticker.id}
                      sticker={sticker}
                      selected={selectedStickers.includes(sticker.id)}
                      onPress={() => handleStickerToggle(sticker.id)}
                      isPremiumUser={isPremium}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={() => toggleSection('effects')}
              >
                <View style={styles.sectionTitleRow}>
                  <Palette size={16} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Filters & Effects</Text>
                </View>
                <ChevronDown 
                  size={18} 
                  color={Colors.textMuted}
                  style={expandedSection === 'effects' ? styles.chevronUp : undefined}
                />
              </TouchableOpacity>
              
              {expandedSection === 'effects' && (
                <>
                  <Text style={styles.subLabel}>Filters</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filtersRow}>
                      {SHARE_FILTERS.map(filter => (
                        <FilterOption
                          key={filter.id}
                          filter={filter}
                          selected={selectedFilter.id === filter.id}
                          onPress={() => setSelectedFilter(filter)}
                          isPremiumUser={isPremium}
                        />
                      ))}
                    </View>
                  </ScrollView>

                  <Text style={[styles.subLabel, { marginTop: 12 }]}>Effects</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.effectsRow}>
                      {SHARE_EFFECTS.map(effect => (
                        <EffectOption
                          key={effect.id}
                          effect={effect}
                          selected={selectedEffect.id === effect.id}
                          onPress={() => setSelectedEffect(effect)}
                          isPremiumUser={isPremium}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Custom Caption</Text>
                <TouchableOpacity 
                  style={styles.aiButton} 
                  onPress={handleGenerateAICaption}
                  disabled={isGeneratingCaption}
                >
                  {isGeneratingCaption ? (
                    <RefreshCw size={14} color={Colors.accent} />
                  ) : (
                    <Wand2 size={14} color={Colors.accent} />
                  )}
                  <Text style={styles.aiButtonText}>
                    {isGeneratingCaption ? 'Generating...' : 'AI Generate'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.captionInput}
                placeholder="Write your own caption or use AI..."
                placeholderTextColor={Colors.textMuted}
                value={customCaption}
                onChangeText={setCustomCaption}
                multiline
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {(customCaption || processTemplate(selectedTemplate)).length}/500
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
                
                {!isPremium && (
                  <TouchableOpacity
                    style={[styles.optionChip, styles.optionChipDisabled]}
                    disabled
                  >
                    <Crown size={14} color={Colors.textMuted} />
                    <Text style={styles.optionText}>Remove Watermark</Text>
                    <Lock size={12} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
                
                {isPremium && (
                  <TouchableOpacity
                    style={[styles.optionChip, !includeWatermark && styles.optionChipActive]}
                    onPress={() => setIncludeWatermark(!includeWatermark)}
                  >
                    <Crown size={14} color={!includeWatermark ? Colors.accent : Colors.textMuted} />
                    <Text style={[styles.optionText, !includeWatermark && styles.optionTextActive]}>
                      No Watermark
                    </Text>
                  </TouchableOpacity>
                )}
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
                style={[styles.shareButton, styles.copyButton, !canShare() && styles.shareButtonDisabled]}
                onPress={handleCopy}
                disabled={!canShare()}
                testID="copy-share-button"
              >
                <Copy size={18} color={canShare() ? Colors.text : Colors.textMuted} />
                <Text style={[styles.shareButtonText, !canShare() && styles.textDisabled]}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButton, styles.primaryShareButton, { flex: 2 }, !canShare() && styles.shareButtonDisabled]}
                onPress={handleShareToPlatform}
                disabled={!canShare()}
                testID="share-button"
              >
                <Share2 size={20} color={canShare() ? Colors.background : Colors.textMuted} />
                <Text style={[styles.primaryShareButtonText, !canShare() && styles.textDisabled]}>
                  Share via Text, Apps & More
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mediaSection}>
              <Text style={styles.mediaSectionTitle}>Media Export</Text>
              <View style={styles.mediaOptionsRow}>
                <TouchableOpacity style={styles.mediaOption}>
                  <View style={[styles.mediaIconContainer, { backgroundColor: Colors.accent + '20' }]}>
                    <ImageIcon size={20} color={Colors.accent} />
                  </View>
                  <Text style={styles.mediaOptionText}>Image</Text>
                  <Text style={styles.comingSoonBadge}>Soon</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaOption}>
                  <View style={[styles.mediaIconContainer, { backgroundColor: Colors.fever + '20' }]}>
                    <Video size={20} color={Colors.fever} />
                  </View>
                  <Text style={styles.mediaOptionText}>Video</Text>
                  <Text style={styles.comingSoonBadge}>Soon</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaOption}>
                  <View style={[styles.mediaIconContainer, { backgroundColor: Colors.correct + '20' }]}>
                    <Music size={20} color={Colors.correct} />
                  </View>
                  <Text style={styles.mediaOptionText}>Audio</Text>
                  <Text style={styles.comingSoonBadge}>Soon</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!isPremium && (
              <TouchableOpacity style={styles.premiumBanner}>
                <View style={styles.premiumBannerContent}>
                  <Crown size={24} color="#FFD700" />
                  <View style={styles.premiumBannerText}>
                    <Text style={styles.premiumBannerTitle}>Go Premium</Text>
                    <Text style={styles.premiumBannerSubtitle}>
                      Unlimited shares, no watermarks, exclusive templates
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.legalLink}
              onPress={() => setShowLegalDisclaimer(!showLegalDisclaimer)}
            >
              <Text style={styles.legalLinkText}>Content & Legal Disclaimer</Text>
              <ChevronDown 
                size={14} 
                color={Colors.textMuted}
                style={showLegalDisclaimer ? styles.chevronUp : undefined}
              />
            </TouchableOpacity>

            {showLegalDisclaimer && (
              <View style={styles.legalSection}>
                <Text style={styles.legalText}>{LEGAL_DISCLAIMER}</Text>
              </View>
            )}

            <View style={styles.bottomPadding} />
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
    padding: 16,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
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
    marginBottom: 20,
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  limitText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  countBadge: {
    backgroundColor: Colors.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  platformsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  platformButton: {
    width: 72,
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 10,
    borderWidth: 2,
  },
  platformButtonDisabled: {
    opacity: 0.5,
  },
  platformIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  platformName: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templatesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  templateCard: {
    width: 150,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  templateCardLocked: {
    opacity: 0.6,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  templateEmoji: {
    fontSize: 16,
  },
  templateTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
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
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stickerChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stickerChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  stickerChipLocked: {
    opacity: 0.5,
  },
  stickerEmoji: {
    fontSize: 20,
  },
  stickerLock: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  subLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterOptionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  filterOptionLocked: {
    opacity: 0.5,
  },
  filterName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  filterNameSelected: {
    color: Colors.accent,
  },
  effectsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  effectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  effectOptionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  effectOptionLocked: {
    opacity: 0.5,
  },
  effectName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  effectNameSelected: {
    color: Colors.accent,
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
    flexWrap: 'wrap',
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
  optionChipDisabled: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  optionTextActive: {
    color: Colors.accent,
  },
  previewSection: {
    marginBottom: 16,
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
    maxHeight: 120,
  },
  previewText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  copyButton: {
    backgroundColor: Colors.surfaceLight,
  },
  platformShareButton: {
    backgroundColor: Colors.surfaceLight,
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
  textDisabled: {
    color: Colors.textMuted,
  },
  mediaSection: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  mediaSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  mediaOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mediaOption: {
    alignItems: 'center',
    gap: 6,
  },
  mediaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaOptionText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  comingSoonBadge: {
    fontSize: 9,
    color: Colors.accent,
    fontWeight: '600' as const,
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700' + '10',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700' + '30',
  },
  premiumBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  premiumBannerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  legalLinkText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  legalSection: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  legalText: {
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  bottomPadding: {
    height: 20,
  },
});
