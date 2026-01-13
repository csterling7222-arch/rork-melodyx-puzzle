import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Lock, Check, ChevronRight, Star, Zap } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { SkillTreeNode } from '@/constants/learningAdvanced';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkillTreeViewProps {
  nodes: (SkillTreeNode & { currentLevel: number; xpProgress: number })[];
  onNodePress?: (node: SkillTreeNode) => void;
  selectedNodeId?: string;
  compact?: boolean;
}

export default function SkillTreeView({
  nodes,
  onNodePress,
  selectedNodeId,
  compact = false,
}: SkillTreeViewProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNodePress = useCallback((node: SkillTreeNode) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onNodePress?.(node);
  }, [onNodePress, scaleAnim]);

  const isNodeUnlocked = useCallback((node: SkillTreeNode & { currentLevel: number }) => {
    if (node.prerequisites.length === 0) return true;
    return node.prerequisites.every(prereqId => {
      const prereq = nodes.find(n => n.id === prereqId);
      return prereq && prereq.currentLevel > 0;
    });
  }, [nodes]);

  const getNodeProgress = useCallback((node: SkillTreeNode & { currentLevel: number }) => {
    if (node.currentLevel >= node.maxLevel) return 100;
    const currentXp = node.xpRequired[node.currentLevel] || 0;
    const nextXp = node.xpRequired[node.currentLevel + 1] || node.xpRequired[node.currentLevel] || 100;
    return Math.min(100, (currentXp / nextXp) * 100);
  }, []);

  const renderNode = (node: SkillTreeNode & { currentLevel: number; xpProgress: number }) => {
    const unlocked = isNodeUnlocked(node);
    const progress = getNodeProgress(node);
    const isComplete = node.currentLevel >= node.maxLevel;
    const isSelected = selectedNodeId === node.id;

    return (
      <TouchableOpacity
        key={node.id}
        style={[
          styles.nodeContainer,
          !unlocked && styles.nodeContainerLocked,
          isSelected && styles.nodeContainerSelected,
          compact && styles.nodeContainerCompact,
        ]}
        onPress={() => unlocked && handleNodePress(node)}
        disabled={!unlocked}
        activeOpacity={0.7}
      >
        <View style={[styles.nodeIcon, { backgroundColor: node.color + '20' }]}>
          {!unlocked ? (
            <Lock size={compact ? 16 : 20} color={Colors.textMuted} />
          ) : isComplete ? (
            <Check size={compact ? 16 : 20} color={node.color} />
          ) : (
            <Text style={[styles.nodeEmoji, compact && styles.nodeEmojiCompact]}>{node.icon}</Text>
          )}
        </View>

        <View style={styles.nodeInfo}>
          <View style={styles.nodeHeader}>
            <Text style={[styles.nodeName, !unlocked && styles.nodeNameLocked, compact && styles.nodeNameCompact]}>
              {node.name}
            </Text>
            {isComplete && (
              <View style={styles.completeBadge}>
                <Star size={10} color="#FBBF24" fill="#FBBF24" />
              </View>
            )}
          </View>

          {!compact && (
            <Text style={[styles.nodeDesc, !unlocked && styles.nodeDescLocked]} numberOfLines={2}>
              {node.description}
            </Text>
          )}

          <View style={styles.nodeProgressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: node.color },
                ]}
              />
            </View>
            <Text style={[styles.levelText, { color: node.color }]}>
              Lv.{node.currentLevel}/{node.maxLevel}
            </Text>
          </View>

          {node.bonuses.length > 0 && !compact && (
            <View style={styles.bonusContainer}>
              <Zap size={12} color="#FBBF24" />
              <Text style={styles.bonusText}>{node.bonuses[0].description}</Text>
            </View>
          )}
        </View>

        {unlocked && !isComplete && (
          <ChevronRight size={18} color={Colors.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  const renderCategory = (category: string, categoryNodes: typeof nodes) => (
    <View key={category} style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{category.replace('_', ' ')}</Text>
      <View style={[styles.nodesGrid, compact && styles.nodesGridCompact]}>
        {categoryNodes.map(renderNode)}
      </View>
    </View>
  );

  const groupedNodes = nodes.reduce((acc, node) => {
    if (!acc[node.category]) acc[node.category] = [];
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, typeof nodes>);

  if (compact) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compactScroll}>
        <View style={styles.compactContainer}>
          {nodes.slice(0, 6).map(renderNode)}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌳 Skill Tree</Text>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Unlocked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.textMuted }]} />
            <Text style={styles.legendText}>Locked</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.entries(groupedNodes).map(([category, categoryNodes]) =>
          renderCategory(category, categoryNodes)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
    marginBottom: 12,
  },
  nodesGrid: {
    gap: 12,
  },
  nodesGridCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  nodeContainerLocked: {
    opacity: 0.5,
  },
  nodeContainerSelected: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  nodeContainerCompact: {
    padding: 12,
    width: (SCREEN_WIDTH - 60) / 2,
    marginRight: 10,
  },
  nodeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeEmoji: {
    fontSize: 22,
  },
  nodeEmojiCompact: {
    fontSize: 18,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nodeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  nodeNameLocked: {
    color: Colors.textMuted,
  },
  nodeNameCompact: {
    fontSize: 13,
  },
  completeBadge: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    padding: 4,
    borderRadius: 8,
  },
  nodeDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  nodeDescLocked: {
    color: Colors.textMuted,
  },
  nodeProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(251,191,36,0.1)',
    padding: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  bonusText: {
    fontSize: 10,
    color: '#FBBF24',
  },
  compactScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  compactContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
});
