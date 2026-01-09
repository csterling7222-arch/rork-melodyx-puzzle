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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Instrument } from '@/constants/instruments';
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
}

function InstrumentSelector({ compact = false, showLabel = true }: InstrumentSelectorProps) {
  const { 
    currentInstrument, 
    instruments, 
    selectInstrument, 
    isPremium,
    previewPlaying,
    setPreviewPlaying,
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

  const CurrentIcon = ICON_MAP[currentInstrument.icon] || Piano;

  const renderInstrumentItem = (instrument: Instrument & { locked: boolean }) => {
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
          ]}>
            {instrument.description}
          </Text>
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
            
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

export default memo(InstrumentSelector);

const styles = StyleSheet.create({
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
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.textMuted,
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
  closeButton: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
