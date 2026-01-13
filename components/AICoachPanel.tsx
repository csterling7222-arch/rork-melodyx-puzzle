import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Brain,
  Sparkles,
  MessageCircle,
  Zap,
  Target,
  ChevronRight,
  Volume2,
  RefreshCw,
  Crown,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { AICoachPersonality, AIGeneratedDrill } from '@/constants/learningAdvanced';
import * as Haptics from 'expo-haptics';

interface AICoachPanelProps {
  coach: AICoachPersonality;
  coaches: AICoachPersonality[];
  onCoachSelect: (coachId: string) => void;
  onGenerateDrill: (focusArea?: string) => Promise<AIGeneratedDrill | null>;
  currentDrill: AIGeneratedDrill | null;
  onStartDrill: (drill: AIGeneratedDrill) => void;
  isGenerating: boolean;
  feedback?: string;
  isPremium: boolean;
}

const FOCUS_AREAS = [
  { id: 'ear_training', name: 'Ear Training', icon: '👂', color: '#A78BFA' },
  { id: 'rhythm', name: 'Rhythm', icon: '🥁', color: '#F59E0B' },
  { id: 'intervals', name: 'Intervals', icon: '📏', color: '#22C55E' },
  { id: 'chords', name: 'Chords', icon: '🎼', color: '#06B6D4' },
  { id: 'improvisation', name: 'Improv', icon: '🎸', color: '#EC4899' },
  { id: 'sight_reading', name: 'Sight Reading', icon: '📖', color: '#8B5CF6' },
];

export default function AICoachPanel({
  coach,
  coaches,
  onCoachSelect,
  onGenerateDrill,
  currentDrill,
  onStartDrill,
  isGenerating,
  feedback,
  isPremium,
}: AICoachPanelProps) {
  const [showCoachSelector, setShowCoachSelector] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (feedback) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [feedback, fadeAnim]);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleGenerateDrill = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await onGenerateDrill(selectedFocus || undefined);
  }, [onGenerateDrill, selectedFocus]);

  const handleFocusSelect = useCallback((focusId: string) => {
    setSelectedFocus(prev => prev === focusId ? null : focusId);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  const renderCoachSelector = () => (
    <View style={styles.coachSelectorContainer}>
      <Text style={styles.selectorTitle}>Choose Your Coach</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {coaches.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.coachOption,
              coach.id === c.id && styles.coachOptionSelected,
              c.isPremium && !isPremium && styles.coachOptionLocked,
            ]}
            onPress={() => {
              if (!c.isPremium || isPremium) {
                onCoachSelect(c.id);
                setShowCoachSelector(false);
              }
            }}
            disabled={c.isPremium && !isPremium}
          >
            <Text style={styles.coachAvatar}>{c.avatar}</Text>
            <Text style={[styles.coachOptionName, coach.id === c.id && styles.coachOptionNameSelected]}>
              {c.name}
            </Text>
            <Text style={styles.coachSpecialty} numberOfLines={1}>{c.specialty}</Text>
            {c.isPremium && !isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={10} color="#FBBF24" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFocusAreas = () => (
    <View style={styles.focusContainer}>
      <Text style={styles.focusTitle}>Focus Area (Optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {FOCUS_AREAS.map(area => (
          <TouchableOpacity
            key={area.id}
            style={[
              styles.focusChip,
              selectedFocus === area.id && { backgroundColor: area.color + '30', borderColor: area.color },
            ]}
            onPress={() => handleFocusSelect(area.id)}
          >
            <Text style={styles.focusEmoji}>{area.icon}</Text>
            <Text style={[
              styles.focusName,
              selectedFocus === area.id && { color: area.color },
            ]}>
              {area.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCurrentDrill = () => {
    if (!currentDrill) return null;

    return (
      <View style={styles.drillContainer}>
        <View style={styles.drillHeader}>
          <Zap size={18} color="#FBBF24" />
          <Text style={styles.drillTitle}>Generated Drill</Text>
        </View>
        
        <Text style={styles.drillName}>{currentDrill.name}</Text>
        <Text style={styles.drillDesc}>{currentDrill.description}</Text>
        
        <View style={styles.drillMeta}>
          <View style={styles.drillMetaItem}>
            <Target size={14} color={Colors.textSecondary} />
            <Text style={styles.drillMetaText}>Difficulty {currentDrill.difficulty}/5</Text>
          </View>
          <View style={styles.drillMetaItem}>
            <Volume2 size={14} color={Colors.textSecondary} />
            <Text style={styles.drillMetaText}>{currentDrill.notes.length} notes</Text>
          </View>
        </View>

        <View style={styles.drillReasoning}>
          <Brain size={14} color="#A78BFA" />
          <Text style={styles.drillReasoningText}>{currentDrill.reasoning}</Text>
        </View>

        <TouchableOpacity
          style={styles.startDrillBtn}
          onPress={() => onStartDrill(currentDrill)}
        >
          <Text style={styles.startDrillText}>Start Drill</Text>
          <ChevronRight size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.coachHeader}
        onPress={() => setShowCoachSelector(!showCoachSelector)}
      >
        <Animated.View style={[styles.coachAvatarContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.coachAvatarLarge}>{coach.avatar}</Text>
        </Animated.View>
        
        <View style={styles.coachInfo}>
          <View style={styles.coachNameRow}>
            <Text style={styles.coachName}>{coach.name}</Text>
            <View style={[styles.styleBadge, { backgroundColor: getStyleColor(coach.style) + '20' }]}>
              <Text style={[styles.styleBadgeText, { color: getStyleColor(coach.style) }]}>
                {coach.style}
              </Text>
            </View>
          </View>
          <Text style={styles.coachSpecialtyMain}>{coach.specialty}</Text>
        </View>

        <MessageCircle size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      {showCoachSelector && renderCoachSelector()}

      {feedback && (
        <Animated.View style={[styles.feedbackContainer, { opacity: fadeAnim }]}>
          <View style={styles.feedbackBubble}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        </Animated.View>
      )}

      {renderFocusAreas()}

      <TouchableOpacity
        style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
        onPress={handleGenerateDrill}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <ActivityIndicator size="small" color="#0F172A" />
            <Text style={styles.generateBtnText}>Generating...</Text>
          </>
        ) : (
          <>
            <Sparkles size={20} color="#0F172A" />
            <Text style={styles.generateBtnText}>Generate AI Drill</Text>
          </>
        )}
      </TouchableOpacity>

      {currentDrill && renderCurrentDrill()}

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn}>
          <RefreshCw size={16} color={Colors.textSecondary} />
          <Text style={styles.quickActionText}>New Variation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn}>
          <Target size={16} color={Colors.textSecondary} />
          <Text style={styles.quickActionText}>Adaptive Mode</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStyleColor(style: string): string {
  switch (style) {
    case 'encouraging': return '#22C55E';
    case 'technical': return '#3B82F6';
    case 'challenging': return '#EF4444';
    case 'zen': return '#10B981';
    default: return '#A78BFA';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  coachAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(167,139,250,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachAvatarLarge: {
    fontSize: 28,
  },
  coachInfo: {
    flex: 1,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  styleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  styleBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  coachSpecialtyMain: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  coachSelectorContainer: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  coachOption: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coachOptionSelected: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  coachOptionLocked: {
    opacity: 0.5,
  },
  coachAvatar: {
    fontSize: 24,
    marginBottom: 6,
  },
  coachOptionName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  coachOptionNameSelected: {
    color: '#A78BFA',
  },
  coachSpecialty: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    marginTop: 2,
  },
  premiumBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(251,191,36,0.2)',
    padding: 4,
    borderRadius: 6,
  },
  feedbackContainer: {
    marginBottom: 16,
  },
  feedbackBubble: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 16,
    padding: 16,
    borderTopLeftRadius: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  focusContainer: {
    marginBottom: 16,
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  focusEmoji: {
    fontSize: 14,
  },
  focusName: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0F172A',
  },
  drillContainer: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  drillTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FBBF24',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  drillName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  drillDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  drillMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  drillMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drillMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  drillReasoning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(167,139,250,0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  drillReasoningText: {
    flex: 1,
    fontSize: 12,
    color: '#A78BFA',
    lineHeight: 18,
  },
  startDrillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingVertical: 12,
  },
  startDrillText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0F172A',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
