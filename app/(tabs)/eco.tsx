import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Leaf, TreePine, Droplets, Sun, Award,
  X, Check, ChevronRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useEco } from '@/contexts/EcoContext';
import { 
  ECO_POINTS_PER_TON, 
  ECO_MILESTONES,
  ECO_THEME_COLORS,
  getEcoMilestone,
  getNextMilestone,
} from '@/constants/sustainability';

function ProjectCard({ 
  project, 
  onSelect 
}: { 
  project: { id: string; name: string; description: string; icon: string; impact: string; region: string };
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity style={styles.projectCard} onPress={onSelect} activeOpacity={0.8}>
      <View style={styles.projectIcon}>
        <Text style={styles.projectEmoji}>{project.icon}</Text>
      </View>
      <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.projectDesc} numberOfLines={2}>{project.description}</Text>
        <View style={styles.projectMeta}>
          <Text style={styles.projectRegion}>{project.region}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function MilestoneCard({ 
  milestone, 
  achieved, 
  current 
}: { 
  milestone: typeof ECO_MILESTONES[0]; 
  achieved: boolean;
  current: boolean;
}) {
  return (
    <View style={[
      styles.milestoneCard,
      achieved && styles.milestoneAchieved,
      current && styles.milestoneCurrent,
    ]}>
      <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
      <Text style={[styles.milestoneName, achieved && styles.milestoneNameAchieved]}>
        {milestone.reward}
      </Text>
      <Text style={styles.milestonePoints}>{milestone.points} pts</Text>
      {achieved && (
        <View style={styles.achievedBadge}>
          <Check size={10} color={ECO_THEME_COLORS.primary} />
        </View>
      )}
    </View>
  );
}

export default function EcoScreen() {
  const insets = useSafeAreaInsets();
  const {
    ecoPoints,
    totalOffsetTons,
    ecoModeEnabled,
    solvedEcoMelodies,
    toggleEcoMode,
    purchaseOffset,
    ecoProjects,
    canAffordOffset,
  } = useEco();

  const [showOffsetModal, setShowOffsetModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<typeof ecoProjects[0] | null>(null);
  const [offsetAmount, setOffsetAmount] = useState(1);

  const currentMilestone = getEcoMilestone(ecoPoints);
  const nextMilestone = getNextMilestone(ecoPoints);

  const progressToNext = nextMilestone 
    ? ((ecoPoints - (currentMilestone?.points || 0)) / (nextMilestone.points - (currentMilestone?.points || 0))) * 100
    : 100;

  const handleToggleEcoMode = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleEcoMode();
  }, [toggleEcoMode]);

  const handleSelectProject = useCallback((project: typeof ecoProjects[0]) => {
    setSelectedProject(project);
    setShowOffsetModal(true);
  }, []);

  const handlePurchaseOffset = useCallback(() => {
    if (!selectedProject) return;
    const success = purchaseOffset(selectedProject.id, offsetAmount);
    if (success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setShowOffsetModal(false);
      setSelectedProject(null);
      setOffsetAmount(1);
    }
  }, [selectedProject, offsetAmount, purchaseOffset]);

  const pointsNeeded = offsetAmount * ECO_POINTS_PER_TON;
  const canAfford = canAffordOffset(offsetAmount);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Leaf size={28} color={ECO_THEME_COLORS.primary} />
        <Text style={styles.title}>Eco Mode</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsCard}>
          <View style={styles.mainStat}>
            <Text style={styles.statValue}>{ecoPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Eco Points</Text>
          </View>
          
          <View style={styles.statsDivider} />
          
          <View style={styles.secondaryStats}>
            <View style={styles.statItem}>
              <TreePine size={18} color={ECO_THEME_COLORS.primary} />
              <Text style={styles.smallStatValue}>{totalOffsetTons.toFixed(2)}</Text>
              <Text style={styles.smallStatLabel}>Tons CO₂</Text>
            </View>
            <View style={styles.statItem}>
              <Award size={18} color={ECO_THEME_COLORS.accent} />
              <Text style={styles.smallStatValue}>{solvedEcoMelodies.length}</Text>
              <Text style={styles.smallStatLabel}>Eco Solves</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.ecoToggle, ecoModeEnabled && styles.ecoToggleActive]}
          onPress={handleToggleEcoMode}
          activeOpacity={0.8}
        >
          <View style={styles.toggleLeft}>
            <View style={[styles.toggleIcon, ecoModeEnabled && styles.toggleIconActive]}>
              <Leaf size={24} color={ecoModeEnabled ? ECO_THEME_COLORS.text : Colors.textMuted} />
            </View>
            <View>
              <Text style={[styles.toggleTitle, ecoModeEnabled && styles.toggleTitleActive]}>
                Eco Puzzles
              </Text>
              <Text style={styles.toggleDesc}>
                {ecoModeEnabled ? 'Playing nature melodies' : 'Tap to enable eco mode'}
              </Text>
            </View>
          </View>
          <View style={[styles.toggleSwitch, ecoModeEnabled && styles.toggleSwitchActive]}>
            <View style={[styles.toggleKnob, ecoModeEnabled && styles.toggleKnobActive]} />
          </View>
        </TouchableOpacity>

        {nextMilestone && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>Next Milestone</Text>
              <Text style={styles.progressText}>
                {ecoPoints} / {nextMilestone.points}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progressToNext, 100)}%` }]} />
            </View>
            <View style={styles.nextMilestoneInfo}>
              <Text style={styles.nextMilestoneIcon}>{nextMilestone.icon}</Text>
              <Text style={styles.nextMilestoneName}>{nextMilestone.reward}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.milestonesRow}
          >
            {ECO_MILESTONES.map((milestone, index) => (
              <MilestoneCard
                key={milestone.points}
                milestone={milestone}
                achieved={ecoPoints >= milestone.points}
                current={currentMilestone?.points === milestone.points}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Carbon Offset Projects</Text>
            <Text style={styles.sectionSubtitle}>
              Use your points to make real impact
            </Text>
          </View>
          
          {ecoProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => handleSelectProject(project)}
            />
          ))}
        </View>

        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>Your Impact</Text>
          <View style={styles.impactStats}>
            <View style={styles.impactItem}>
              <TreePine size={32} color={ECO_THEME_COLORS.primary} />
              <Text style={styles.impactValue}>{Math.round(totalOffsetTons * 50)}</Text>
              <Text style={styles.impactLabel}>Trees Equivalent</Text>
            </View>
            <View style={styles.impactItem}>
              <Droplets size={32} color="#06B6D4" />
              <Text style={styles.impactValue}>{Math.round(totalOffsetTons * 1000)}</Text>
              <Text style={styles.impactLabel}>kg CO₂ Saved</Text>
            </View>
            <View style={styles.impactItem}>
              <Sun size={32} color="#FBBF24" />
              <Text style={styles.impactValue}>{Math.round(totalOffsetTons * 500)}</Text>
              <Text style={styles.impactLabel}>kWh Clean Energy</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showOffsetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOffsetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowOffsetModal(false)}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>

            {selectedProject && (
              <>
                <Text style={styles.modalEmoji}>{selectedProject.icon}</Text>
                <Text style={styles.modalTitle}>{selectedProject.name}</Text>
                <Text style={styles.modalDesc}>{selectedProject.description}</Text>
                
                <View style={styles.offsetSelector}>
                  <Text style={styles.offsetLabel}>Offset Amount (tons)</Text>
                  <View style={styles.offsetButtons}>
                    {[0.5, 1, 2, 5].map(amount => (
                      <TouchableOpacity
                        key={amount}
                        style={[
                          styles.offsetButton,
                          offsetAmount === amount && styles.offsetButtonActive,
                        ]}
                        onPress={() => setOffsetAmount(amount)}
                      >
                        <Text style={[
                          styles.offsetButtonText,
                          offsetAmount === amount && styles.offsetButtonTextActive,
                        ]}>
                          {amount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.costInfo}>
                  <Text style={styles.costLabel}>Cost:</Text>
                  <Text style={styles.costValue}>{pointsNeeded.toLocaleString()} points</Text>
                </View>
                <Text style={styles.impactPreview}>
                  {selectedProject.impact.replace('1 ton', `${offsetAmount} ton${offsetAmount !== 1 ? 's' : ''}`)}
                </Text>

                <TouchableOpacity
                  style={[styles.purchaseButton, !canAfford && styles.purchaseButtonDisabled]}
                  onPress={handlePurchaseOffset}
                  disabled={!canAfford}
                >
                  <Text style={styles.purchaseButtonText}>
                    {canAfford ? 'Purchase Offset' : 'Not Enough Points'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsCard: {
    backgroundColor: ECO_THEME_COLORS.background,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: ECO_THEME_COLORS.text,
  },
  statLabel: {
    fontSize: 14,
    color: ECO_THEME_COLORS.muted,
    marginTop: 4,
  },
  statsDivider: {
    height: 1,
    backgroundColor: ECO_THEME_COLORS.surface,
    marginVertical: 16,
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  smallStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: ECO_THEME_COLORS.text,
  },
  smallStatLabel: {
    fontSize: 12,
    color: ECO_THEME_COLORS.muted,
  },
  ecoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  ecoToggleActive: {
    backgroundColor: ECO_THEME_COLORS.background,
    borderWidth: 1,
    borderColor: ECO_THEME_COLORS.primary,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIconActive: {
    backgroundColor: ECO_THEME_COLORS.primary,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  toggleTitleActive: {
    color: ECO_THEME_COLORS.text,
  },
  toggleDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: ECO_THEME_COLORS.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.text,
  },
  toggleKnobActive: {
    transform: [{ translateX: 24 }],
  },
  progressSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: ECO_THEME_COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ECO_THEME_COLORS.primary,
    borderRadius: 4,
  },
  nextMilestoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  nextMilestoneIcon: {
    fontSize: 20,
  },
  nextMilestoneName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
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
  },
  milestonesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
    marginTop: 12,
  },
  milestoneCard: {
    width: 90,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  milestoneAchieved: {
    backgroundColor: ECO_THEME_COLORS.background,
  },
  milestoneCurrent: {
    borderWidth: 2,
    borderColor: ECO_THEME_COLORS.primary,
  },
  milestoneIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  milestoneName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  milestoneNameAchieved: {
    color: ECO_THEME_COLORS.text,
  },
  milestonePoints: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  achievedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ECO_THEME_COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  projectIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ECO_THEME_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectEmoji: {
    fontSize: 28,
  },
  projectInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  projectMeta: {
    marginTop: 6,
  },
  projectRegion: {
    fontSize: 11,
    color: ECO_THEME_COLORS.primary,
    fontWeight: '600' as const,
  },
  impactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  impactItem: {
    alignItems: 'center',
    gap: 8,
  },
  impactValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  impactLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalEmoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  offsetSelector: {
    marginBottom: 20,
  },
  offsetLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  offsetButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  offsetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  offsetButtonActive: {
    backgroundColor: ECO_THEME_COLORS.primary,
  },
  offsetButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  offsetButtonTextActive: {
    color: Colors.background,
  },
  costInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: ECO_THEME_COLORS.primary,
  },
  impactPreview: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  purchaseButton: {
    backgroundColor: ECO_THEME_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
});
