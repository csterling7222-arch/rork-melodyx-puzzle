import React, { useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { 
  Piano, 
  Guitar, 
  Activity, 
  Disc, 
  Waves, 
  ChevronDown, 
  Lock, 
  Play,
  Check,
  Crown,
  Sliders,
  Sparkles,
  Cpu,
  Save,
  Share2,
  Trash2,
  Gift,
  Zap,
  X,
  Clock,
  BookOpen,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Instrument, EffectPreset, AITonePreset, UserPreset } from '@/constants/instruments';
import { useInstrument } from '@/contexts/InstrumentContext';
import { useAudio } from '@/hooks/useAudio';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Piano,
  Guitar,
  Activity,
  Disc,
  Waves,
};

interface InstrumentSelectorProps {
  compact?: boolean;
  showLabel?: boolean;
  showEffectsButton?: boolean;
}

function UpgradeModal({ 
  visible, 
  onClose, 
  instrumentName,
  onStartTrial,
  onUpgrade,
  hasUsedTrial,
}: {
  visible: boolean;
  onClose: () => void;
  instrumentName: string;
  onStartTrial: () => void;
  onUpgrade: () => void;
  hasUsedTrial: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={upgradeStyles.overlay}>
        <View style={upgradeStyles.modal}>
          <TouchableOpacity style={upgradeStyles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={upgradeStyles.iconContainer}>
            <Crown size={48} color="#FFD700" />
            <Sparkles size={20} color="#FFD700" style={upgradeStyles.sparkle} />
          </View>
          
          <Text style={upgradeStyles.title}>Unlock {instrumentName}</Text>
          <Text style={upgradeStyles.subtitle}>
            Get premium effects, AI tones, and advanced sound banks
          </Text>
          
          <View style={upgradeStyles.features}>
            {[
              'Multiple effect presets',
              'AI-crafted tone presets',
              'Studio-quality sound banks',
              'Custom preset creation',
              'Shareable presets',
            ].map((feature, idx) => (
              <View key={idx} style={upgradeStyles.featureRow}>
                <Zap size={16} color={Colors.correct} />
                <Text style={upgradeStyles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          
          {!hasUsedTrial && (
            <TouchableOpacity style={upgradeStyles.trialButton} onPress={onStartTrial}>
              <Gift size={18} color="#000" />
              <Text style={upgradeStyles.trialButtonText}>Start 7-Day Free Trial</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={upgradeStyles.upgradeButton} onPress={onUpgrade}>
            <Text style={upgradeStyles.upgradeButtonText}>
              {hasUsedTrial ? 'Upgrade to Premium' : 'View Plans'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const upgradeStyles = StyleSheet.create({
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
    maxWidth: 340,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFD700' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  features: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
  },
  trialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    marginBottom: 12,
  },
  trialButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  upgradeButton: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});

function EffectsPanel({
  visible,
  onClose,
  effects,
  aiTones,
  currentEffectId,
  currentAIToneId,
  onSelectEffect,
  onSelectAITone,
  userPresets,
  onApplyPreset,
  onCreatePreset,
  onDeletePreset,
  onSharePreset,
  isPremium,
  instrumentName,
}: {
  visible: boolean;
  onClose: () => void;
  effects: (EffectPreset & { locked: boolean })[];
  aiTones: (AITonePreset & { locked: boolean })[];
  currentEffectId: string | null;
  currentAIToneId: string | null;
  onSelectEffect: (id: string) => void;
  onSelectAITone: (id: string) => void;
  userPresets: UserPreset[];
  onApplyPreset: (id: string) => void;
  onCreatePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onSharePreset: (id: string) => void;
  isPremium: boolean;
  instrumentName: string;
}) {
  const [activeTab, setActiveTab] = useState<'effects' | 'ai' | 'presets'>('effects');
  const [newPresetName, setNewPresetName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 300, friction: 25, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleCreatePreset = useCallback(() => {
    if (!newPresetName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your preset.');
      return;
    }
    onCreatePreset(newPresetName.trim());
    setNewPresetName('');
  }, [newPresetName, onCreatePreset]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[effectsStyles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={effectsStyles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <Animated.View style={[effectsStyles.panel, { transform: [{ translateY: slideAnim }] }]}>
          <View style={effectsStyles.handle} />
          
          <View style={effectsStyles.header}>
            <Text style={effectsStyles.title}>{instrumentName} Sound</Text>
            <TouchableOpacity onPress={onClose} style={effectsStyles.closeBtn}>
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={effectsStyles.tabs}>
            <TouchableOpacity
              style={[effectsStyles.tab, activeTab === 'effects' && effectsStyles.tabActive]}
              onPress={() => setActiveTab('effects')}
            >
              <Sliders size={16} color={activeTab === 'effects' ? Colors.text : Colors.textSecondary} />
              <Text style={[effectsStyles.tabText, activeTab === 'effects' && effectsStyles.tabTextActive]}>Effects</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[effectsStyles.tab, activeTab === 'ai' && effectsStyles.tabActive]}
              onPress={() => setActiveTab('ai')}
            >
              <Cpu size={16} color={activeTab === 'ai' ? Colors.text : Colors.textSecondary} />
              <Text style={[effectsStyles.tabText, activeTab === 'ai' && effectsStyles.tabTextActive]}>AI Tones</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[effectsStyles.tab, activeTab === 'presets' && effectsStyles.tabActive]}
              onPress={() => setActiveTab('presets')}
            >
              <Save size={16} color={activeTab === 'presets' ? Colors.text : Colors.textSecondary} />
              <Text style={[effectsStyles.tabText, activeTab === 'presets' && effectsStyles.tabTextActive]}>My Presets</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={effectsStyles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'effects' && (
              <View style={effectsStyles.grid}>
                {effects.map(effect => (
                  <TouchableOpacity
                    key={effect.id}
                    style={[
                      effectsStyles.effectCard,
                      currentEffectId === effect.id && effectsStyles.effectCardActive,
                      effect.locked && effectsStyles.effectCardLocked,
                    ]}
                    onPress={() => onSelectEffect(effect.id)}
                    disabled={effect.locked}
                  >
                    {effect.locked && (
                      <View style={effectsStyles.lockBadge}>
                        <Lock size={12} color={Colors.background} />
                      </View>
                    )}
                    {effect.isPremium && !effect.locked && (
                      <View style={effectsStyles.premiumBadge}>
                        <Crown size={10} color="#FFD700" />
                      </View>
                    )}
                    <Text style={[effectsStyles.effectName, effect.locked && effectsStyles.textLocked]}>
                      {effect.name}
                    </Text>
                    <Text style={[effectsStyles.effectDesc, effect.locked && effectsStyles.textLocked]} numberOfLines={2}>
                      {effect.description}
                    </Text>
                    {effect.amp && (
                      <Text style={effectsStyles.effectAmp}>🎸 {effect.amp}</Text>
                    )}
                    {currentEffectId === effect.id && (
                      <View style={effectsStyles.selectedCheck}>
                        <Check size={14} color={Colors.correct} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeTab === 'ai' && (
              <View style={effectsStyles.grid}>
                {aiTones.map(tone => (
                  <TouchableOpacity
                    key={tone.id}
                    style={[
                      effectsStyles.aiCard,
                      currentAIToneId === tone.id && effectsStyles.aiCardActive,
                      tone.locked && effectsStyles.effectCardLocked,
                    ]}
                    onPress={() => onSelectAITone(tone.id)}
                    disabled={tone.locked}
                  >
                    {tone.locked && (
                      <View style={effectsStyles.lockBadge}>
                        <Lock size={12} color={Colors.background} />
                      </View>
                    )}
                    <Text style={effectsStyles.aiIcon}>{tone.icon}</Text>
                    <Text style={[effectsStyles.aiName, tone.locked && effectsStyles.textLocked]}>
                      {tone.name}
                    </Text>
                    <Text style={[effectsStyles.aiDesc, tone.locked && effectsStyles.textLocked]} numberOfLines={2}>
                      {tone.description}
                    </Text>
                    <View style={effectsStyles.aiTags}>
                      <View style={effectsStyles.aiTag}>
                        <Text style={effectsStyles.aiTagText}>{tone.genre}</Text>
                      </View>
                      <View style={effectsStyles.aiTag}>
                        <Text style={effectsStyles.aiTagText}>{tone.mood}</Text>
                      </View>
                    </View>
                    {currentAIToneId === tone.id && (
                      <View style={effectsStyles.selectedCheck}>
                        <Check size={14} color={Colors.correct} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeTab === 'presets' && (
              <View style={effectsStyles.presetsContainer}>
                {isPremium && (
                  <View style={effectsStyles.createPresetRow}>
                    <TextInput
                      style={effectsStyles.presetInput}
                      placeholder="New preset name..."
                      placeholderTextColor={Colors.textMuted}
                      value={newPresetName}
                      onChangeText={setNewPresetName}
                    />
                    <TouchableOpacity style={effectsStyles.createPresetBtn} onPress={handleCreatePreset}>
                      <Save size={18} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                )}

                {userPresets.length === 0 ? (
                  <View style={effectsStyles.emptyPresets}>
                    <Save size={32} color={Colors.textMuted} />
                    <Text style={effectsStyles.emptyText}>No presets yet</Text>
                    <Text style={effectsStyles.emptySubtext}>
                      {isPremium ? 'Create your first preset above!' : 'Upgrade to Premium to create presets'}
                    </Text>
                  </View>
                ) : (
                  userPresets.map(preset => (
                    <View key={preset.id} style={effectsStyles.presetCard}>
                      <TouchableOpacity
                        style={effectsStyles.presetInfo}
                        onPress={() => onApplyPreset(preset.id)}
                      >
                        <Text style={effectsStyles.presetName}>{preset.name}</Text>
                        <Text style={effectsStyles.presetMeta}>
                          {new Date(preset.createdAt).toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                      <View style={effectsStyles.presetActions}>
                        <TouchableOpacity
                          style={effectsStyles.presetActionBtn}
                          onPress={() => onSharePreset(preset.id)}
                        >
                          <Share2 size={16} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={effectsStyles.presetActionBtn}
                          onPress={() => onDeletePreset(preset.id)}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const effectsStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  tabs: {
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
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  content: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  effectCard: {
    width: '47%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  effectCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  effectCardLocked: {
    opacity: 0.5,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.textMuted,
    borderRadius: 10,
    padding: 4,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700' + '30',
    borderRadius: 10,
    padding: 4,
  },
  effectName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  effectDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  effectAmp: {
    fontSize: 10,
    color: Colors.accent,
    marginTop: 6,
  },
  textLocked: {
    color: Colors.textMuted,
  },
  selectedCheck: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Colors.correct + '20',
    borderRadius: 10,
    padding: 4,
  },
  aiCard: {
    width: '47%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    alignItems: 'center',
  },
  aiCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  aiIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  aiName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  aiDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 8,
  },
  aiTags: {
    flexDirection: 'row',
    gap: 4,
  },
  aiTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiTagText: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  presetsContainer: {
    paddingBottom: 20,
  },
  createPresetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  presetInput: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  createPresetBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPresets: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  presetMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  presetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  presetActionBtn: {
    padding: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
});

function InstrumentSelector({ compact = false, showLabel = true, showEffectsButton = true }: InstrumentSelectorProps) {
  const { 
    currentInstrument, 
    currentEffect,
    currentAITone,
    instruments, 
    selectInstrument, 
    selectEffect,
    selectAITone,
    availableEffects,
    availableAITones,
    userPresets,
    applyUserPreset,
    createUserPreset,
    deleteUserPreset,
    shareUserPreset,
    isPremium,
    previewPlaying,
    setPreviewPlaying,
    showUpgradeModal,
    pendingInstrumentId,
    dismissUpgradeModal,
    startTrial,
    hasUsedTrial,
    showEffectsPanel,
    setShowEffectsPanel,
  } = useInstrument();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const { playMelody } = useAudio(previewingId || currentInstrument.id);

  const openModal = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setPreviewingId(null);
    });
  }, [fadeAnim, scaleAnim]);

  const handleSelect = useCallback((instrument: Instrument & { locked: boolean }) => {
    if (instrument.locked) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    selectInstrument(instrument.id);
    closeModal();
  }, [selectInstrument, closeModal]);

  const handlePreview = useCallback((instrument: Instrument & { locked: boolean }) => {
    if (instrument.locked || previewPlaying) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setPreviewingId(instrument.id);
    setPreviewPlaying(true);
    
    setTimeout(() => {
      playMelody(['C', 'E', 'G', 'C'], 250);
      setTimeout(() => {
        setPreviewPlaying(false);
        setPreviewingId(null);
      }, 1200);
    }, 50);
  }, [previewPlaying, setPreviewPlaying, playMelody]);

  const handleStartTrial = useCallback(() => {
    if (pendingInstrumentId) {
      startTrial(pendingInstrumentId);
      dismissUpgradeModal();
    }
  }, [pendingInstrumentId, startTrial, dismissUpgradeModal]);

  const handleUpgrade = useCallback(() => {
    dismissUpgradeModal();
  }, [dismissUpgradeModal]);

  const handleCreatePreset = useCallback((name: string) => {
    const preset = createUserPreset(name);
    if (preset) {
      Alert.alert('Preset Created!', `"${name}" saved successfully.`);
    }
  }, [createUserPreset]);

  const handleSharePreset = useCallback((presetId: string) => {
    const code = shareUserPreset(presetId);
    if (code) {
      Alert.alert('Share Code', `Share this code: ${code}`, [{ text: 'Copy', onPress: () => {} }, { text: 'OK' }]);
    }
  }, [shareUserPreset]);

  const handleDeletePreset = useCallback((presetId: string) => {
    Alert.alert('Delete Preset?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteUserPreset(presetId) },
    ]);
  }, [deleteUserPreset]);

  const CurrentIcon = ICON_MAP[currentInstrument.icon] || Piano;
  const pendingInstrument = pendingInstrumentId ? instruments.find(i => i.id === pendingInstrumentId) : null;

  const renderInstrumentItem = (instrument: Instrument & { locked: boolean; hasActiveTrial: boolean; isCached: boolean }) => {
    const Icon = ICON_MAP[instrument.icon] || Piano;
    const isSelected = instrument.id === currentInstrument.id;
    const isPreviewing = previewingId === instrument.id;
    
    return (
      <TouchableOpacity
        key={instrument.id}
        style={[
          styles.instrumentItem,
          isSelected && styles.instrumentItemSelected,
          instrument.locked && styles.instrumentItemLocked,
        ]}
        onPress={() => handleSelect(instrument)}
        activeOpacity={instrument.locked ? 0.5 : 0.7}
        testID={`instrument-${instrument.id}`}
      >
        <View style={styles.instrumentIconContainer}>
          <Icon 
            size={28} 
            color={instrument.locked ? Colors.textMuted : isSelected ? Colors.primary : Colors.text} 
          />
          {instrument.locked && (
            <View style={styles.lockBadge}>
              <Lock size={12} color={Colors.background} />
            </View>
          )}
          {instrument.hasActiveTrial && (
            <View style={styles.trialBadge}>
              <Clock size={10} color="#FFD700" />
            </View>
          )}
        </View>
        
        <View style={styles.instrumentInfo}>
          <View style={styles.instrumentNameRow}>
            <Text style={[
              styles.instrumentName,
              isSelected && styles.instrumentNameSelected,
              instrument.locked && styles.instrumentNameLocked,
            ]}>
              {instrument.name}
            </Text>
            {instrument.isPremium && (
              <Crown size={14} color={Colors.warning} style={styles.premiumIcon} />
            )}
          </View>
          <Text style={[
            styles.instrumentDesc,
            instrument.locked && styles.instrumentDescLocked,
          ]} numberOfLines={1}>
            {instrument.description}
          </Text>
          {instrument.features && instrument.features.length > 0 && (
            <Text style={styles.featureText} numberOfLines={1}>
              {instrument.features.slice(0, 2).join(' • ')}
            </Text>
          )}
        </View>
        
        <View style={styles.instrumentActions}>
          {!instrument.locked && (
            <TouchableOpacity
              style={[styles.previewButton, isPreviewing && styles.previewButtonActive]}
              onPress={() => handlePreview(instrument)}
              disabled={previewPlaying}
            >
              <Play 
                size={16} 
                color={isPreviewing ? Colors.primary : Colors.textSecondary} 
                fill={isPreviewing ? Colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          )}
          
          {isSelected && (
            <View style={styles.checkmark}>
              <Check size={18} color={Colors.correct} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={[styles.selector, compact && styles.selectorCompact]}
          onPress={openModal}
          activeOpacity={0.7}
          testID="instrument-selector"
        >
          <View style={styles.selectorContent}>
            <CurrentIcon size={compact ? 18 : 22} color={Colors.primary} />
            {showLabel && (
              <Text style={[styles.selectorText, compact && styles.selectorTextCompact]}>
                {currentInstrument.name}
              </Text>
            )}
          </View>
          <ChevronDown size={compact ? 16 : 18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {showEffectsButton && (
          <TouchableOpacity
            style={[styles.effectsButton, compact && styles.effectsButtonCompact]}
            onPress={() => setShowEffectsPanel(true)}
            activeOpacity={0.7}
          >
            <Sliders size={compact ? 16 : 18} color={currentEffect ? Colors.accent : Colors.textSecondary} />
            {currentEffect && (
              <View style={styles.effectIndicator} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={closeModal} 
            activeOpacity={1}
          />
          
          <Animated.View 
            style={[
              styles.modalContent,
              { 
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Instrument</Text>
              {!isPremium && (
                <View style={styles.premiumHint}>
                  <Crown size={14} color={Colors.warning} />
                  <Text style={styles.premiumHintText}>Premium unlocks more</Text>
                </View>
              )}
            </View>
            
            <ScrollView 
              style={styles.instrumentList}
              showsVerticalScrollIndicator={false}
            >
              {instruments.map(renderInstrumentItem)}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.tutorialsButton} onPress={() => {}}>
                <BookOpen size={16} color={Colors.textSecondary} />
                <Text style={styles.tutorialsButtonText}>Tutorials</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={dismissUpgradeModal}
        instrumentName={pendingInstrument?.name ?? 'this instrument'}
        onStartTrial={handleStartTrial}
        onUpgrade={handleUpgrade}
        hasUsedTrial={hasUsedTrial}
      />

      <EffectsPanel
        visible={showEffectsPanel}
        onClose={() => setShowEffectsPanel(false)}
        effects={availableEffects}
        aiTones={availableAITones}
        currentEffectId={currentEffect?.id ?? null}
        currentAIToneId={currentAITone?.id ?? null}
        onSelectEffect={selectEffect}
        onSelectAITone={selectAITone}
        userPresets={userPresets}
        onApplyPreset={applyUserPreset}
        onCreatePreset={handleCreatePreset}
        onDeletePreset={handleDeletePreset}
        onSharePreset={handleSharePreset}
        isPremium={isPremium}
        instrumentName={currentInstrument.name}
      />
    </>
  );
}

export default memo(InstrumentSelector);

const styles = StyleSheet.create({
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 140,
  },
  selectorCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 100,
    borderRadius: 10,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  selectorTextCompact: {
    fontSize: 13,
  },
  effectsButton: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  effectsButtonCompact: {
    padding: 8,
    borderRadius: 10,
  },
  effectIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: '90%',
    maxWidth: 380,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  premiumHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  premiumHintText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
  instrumentList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instrumentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginVertical: 4,
    backgroundColor: Colors.surfaceLight,
  },
  instrumentItemSelected: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  instrumentItemLocked: {
    opacity: 0.6,
  },
  instrumentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.textMuted,
    borderRadius: 8,
    padding: 3,
  },
  trialBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFD700' + '30',
    borderRadius: 8,
    padding: 3,
  },
  instrumentInfo: {
    flex: 1,
  },
  instrumentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instrumentName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  instrumentNameSelected: {
    color: Colors.primary,
  },
  instrumentNameLocked: {
    color: Colors.textMuted,
  },
  premiumIcon: {
    marginLeft: 2,
  },
  instrumentDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  instrumentDescLocked: {
    color: Colors.textMuted,
  },
  featureText: {
    fontSize: 10,
    color: Colors.accent,
    marginTop: 4,
  },
  instrumentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtonActive: {
    backgroundColor: Colors.primary + '20',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.correct + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tutorialsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  tutorialsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  closeButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
