import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  KeyboardAvoidingView,
} from 'react-native';
import { 
  X, 
  Bug, 
  Volume2, 
  Eye, 
  Zap, 
  AlertTriangle,
  HelpCircle,
  Send,
  Check,
  Crown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { 
  submitGlitchReport, 
  GlitchReport,
  getDeviceInfo,
  getCurrentFPS,
} from '@/utils/errorTracking';
import { 
  getGlitchDiagnostics, 
  getAdaptiveConfig,
  GlitchDiagnostics,
} from '@/utils/glitchFreeEngine';
import { usePurchases } from '@/contexts/PurchasesContext';

interface GlitchReportModalProps {
  visible: boolean;
  onClose: () => void;
}

type GlitchCategory = GlitchReport['category'];

interface CategoryOption {
  id: GlitchCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const CATEGORIES: CategoryOption[] = [
  { 
    id: 'audio', 
    label: 'Audio Issue', 
    icon: <Volume2 size={20} color={Colors.accent} />,
    description: 'Sound not playing, delays, or distortion',
  },
  { 
    id: 'visual', 
    label: 'Visual Bug', 
    icon: <Eye size={20} color={Colors.correct} />,
    description: 'UI glitches, animations, or display issues',
  },
  { 
    id: 'performance', 
    label: 'Performance', 
    icon: <Zap size={20} color="#FFD700" />,
    description: 'Lag, freezing, or slow response',
  },
  { 
    id: 'crash', 
    label: 'App Crash', 
    icon: <AlertTriangle size={20} color="#EF4444" />,
    description: 'App closed unexpectedly or froze',
  },
  { 
    id: 'other', 
    label: 'Other', 
    icon: <HelpCircle size={20} color={Colors.textSecondary} />,
    description: 'Something else not listed above',
  },
];

export function GlitchReportModal({ visible, onClose }: GlitchReportModalProps) {
  const { hasPrioritySupport, isPremium } = usePurchases();
  const [selectedCategory, setSelectedCategory] = useState<GlitchCategory | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<GlitchDiagnostics | null>(null);
  
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const deviceInfo = getDeviceInfo();
  const currentFPS = getCurrentFPS();
  const adaptiveConfig = getAdaptiveConfig();

  useEffect(() => {
    if (visible) {
      setDiagnostics(getGlitchDiagnostics());
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleCategorySelect = useCallback((category: GlitchCategory) => {
    setSelectedCategory(category);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedCategory || !description.trim()) return;

    setIsSubmitting(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const id = await submitGlitchReport(
        description.trim(),
        selectedCategory,
        undefined
      );
      setReportId(id);
      setIsSubmitted(true);
      console.log('[GlitchReport] Submitted:', id);
    } catch (error) {
      console.error('[GlitchReport] Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCategory, description]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedCategory(null);
      setDescription('');
      setIsSubmitted(false);
      setReportId(null);
      setShowDiagnostics(false);
      onClose();
    });
  }, [onClose, slideAnim, fadeAnim]);

  const toggleDiagnostics = useCallback(() => {
    setShowDiagnostics(prev => !prev);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  const canSubmit = selectedCategory && description.trim().length >= 10;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bug size={24} color={Colors.accent} />
              <Text style={styles.title}>Report a Glitch</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {hasPrioritySupport && (
            <View style={styles.priorityBadge}>
              <Crown size={14} color="#FFD700" />
              <Text style={styles.priorityText}>Priority Support Active</Text>
            </View>
          )}

          {isSubmitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Check size={48} color={Colors.correct} />
              </View>
              <Text style={styles.successTitle}>Report Submitted!</Text>
              <Text style={styles.successMessage}>
                Thank you for helping improve Melodyx. Your report ID is:
              </Text>
              <Text style={styles.reportId}>{reportId}</Text>
              {hasPrioritySupport && (
                <Text style={styles.priorityNote}>
                  As a premium member, your report will be reviewed within 24 hours.
                </Text>
              )}
              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionTitle}>What type of issue?</Text>
              <View style={styles.categories}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      selectedCategory === cat.id && styles.categoryCardSelected,
                    ]}
                    onPress={() => handleCategorySelect(cat.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryIcon}>{cat.icon}</View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                      <Text style={styles.categoryDesc}>{cat.description}</Text>
                    </View>
                    {selectedCategory === cat.id && (
                      <View style={styles.checkmark}>
                        <Check size={16} color={Colors.correct} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Describe the issue</Text>
              <TextInput
                style={styles.input}
                placeholder="Please describe what happened, what you were doing, and any error messages you saw..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>
                {description.length}/1000 (min 10 characters)
              </Text>

              <TouchableOpacity 
                style={styles.deviceInfo} 
                onPress={toggleDiagnostics}
                activeOpacity={0.8}
              >
                <View style={styles.deviceInfoHeader}>
                  <Text style={styles.deviceInfoTitle}>Diagnostics (auto-captured)</Text>
                  <Text style={styles.expandText}>{showDiagnostics ? '▲ Hide' : '▼ Show'}</Text>
                </View>
                <Text style={styles.deviceInfoText}>
                  Platform: {deviceInfo.platform} • FPS: {currentFPS} • 
                  Screen: {deviceInfo.screenWidth}x{deviceInfo.screenHeight}
                </Text>
                {showDiagnostics && diagnostics && (
                  <View style={styles.diagnosticsExpanded}>
                    <Text style={styles.diagnosticsText}>
                      Session: {diagnostics.sessionId.slice(0, 20)}...
                    </Text>
                    <Text style={styles.diagnosticsText}>
                      Performance: {diagnostics.deviceCapabilities.performanceLevel}
                    </Text>
                    <Text style={styles.diagnosticsText}>
                      Network: {diagnostics.deviceCapabilities.networkQuality}
                    </Text>
                    <Text style={styles.diagnosticsText}>
                      Events captured: {diagnostics.events.length}
                    </Text>
                    <Text style={styles.diagnosticsText}>
                      Crashes: {diagnostics.crashCount} • Memory warnings: {diagnostics.memoryWarnings}
                    </Text>
                    <Text style={styles.diagnosticsText}>
                      Audio: {adaptiveConfig.audioQuality} • Particles: {adaptiveConfig.particleCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !canSubmit && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Send size={18} color={canSubmit ? '#000' : Colors.textMuted} />
                    <Text style={[
                      styles.submitButtonText,
                      !canSubmit && styles.submitButtonTextDisabled,
                    ]}>
                      Submit Report
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {!isPremium && (
                <Text style={styles.premiumNote}>
                  💡 Premium members get priority bug fixes and beta access to new features.
                </Text>
              )}
            </ScrollView>
          )}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700' + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  categories: {
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.correct + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },
  deviceInfo: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  deviceInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceInfoTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  expandText: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  deviceInfoText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  diagnosticsExpanded: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLight,
    gap: 4,
  },
  diagnosticsText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  submitButtonTextDisabled: {
    color: Colors.textMuted,
  },
  premiumNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  successContainer: {
    padding: 40,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.correct + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  reportId: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  priorityNote: {
    fontSize: 13,
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 16,
  },
  doneButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
});
