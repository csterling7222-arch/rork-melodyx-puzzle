import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%' as `${number}%`, height = 20, borderRadius = 8, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function TextSkeleton({ lines = 1, style }: { lines?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 && lines > 1 ? '70%' as `${number}%` : '100%' as `${number}%`}
          height={14}
          style={index < lines - 1 ? styles.lineSpacing : undefined}
        />
      ))}
    </View>
  );
}

export function CardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} style={styles.smallSpacing} />
        </View>
      </View>
      <TextSkeleton lines={2} style={styles.cardBody} />
      <View style={styles.cardFooter}>
        <Skeleton width={60} height={28} borderRadius={14} />
        <Skeleton width={60} height={28} borderRadius={14} />
      </View>
    </View>
  );
}

export function ListItemSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.listItem, style]}>
      <Skeleton width={44} height={44} borderRadius={12} />
      <View style={styles.listItemContent}>
        <Skeleton width={'60%' as `${number}%`} height={16} />
        <Skeleton width={'40%' as `${number}%`} height={12} style={styles.smallSpacing} />
      </View>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

export function GridSkeleton({ columns = 2, items = 4, style }: { columns?: number; items?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.grid, { flexWrap: 'wrap' }, style]}>
      {Array.from({ length: items }).map((_, index) => (
        <View key={index} style={[styles.gridItem, { width: `${100 / columns - 2}%` as `${number}%` }]}>
          <Skeleton height={100} borderRadius={12} />
          <Skeleton width={'80%' as `${number}%`} height={14} style={styles.smallSpacing} />
          <Skeleton width={'50%' as `${number}%`} height={12} style={styles.tinySpacing} />
        </View>
      ))}
    </View>
  );
}

export function ProfileSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.profile, style]}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width={150} height={22} style={styles.mediumSpacing} />
      <Skeleton width={100} height={14} style={styles.smallSpacing} />
      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <Skeleton width={40} height={24} />
          <Skeleton width={60} height={12} style={styles.tinySpacing} />
        </View>
        <View style={styles.profileStat}>
          <Skeleton width={40} height={24} />
          <Skeleton width={60} height={12} style={styles.tinySpacing} />
        </View>
        <View style={styles.profileStat}>
          <Skeleton width={40} height={24} />
          <Skeleton width={60} height={12} style={styles.tinySpacing} />
        </View>
      </View>
    </View>
  );
}

export function GameCardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.gameCard, style]}>
      <Skeleton height={160} borderRadius={16} />
      <View style={styles.gameCardContent}>
        <Skeleton width={'70%' as `${number}%`} height={18} />
        <Skeleton width={'50%' as `${number}%`} height={14} style={styles.smallSpacing} />
        <View style={styles.gameCardActions}>
          <Skeleton width={100} height={36} borderRadius={18} />
          <Skeleton width={36} height={36} borderRadius={18} />
        </View>
      </View>
    </View>
  );
}

export function LeaderboardSkeleton({ items = 5, style }: { items?: number; style?: ViewStyle }) {
  return (
    <View style={style}>
      {Array.from({ length: items }).map((_, index) => (
        <View key={index} style={styles.leaderboardItem}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.leaderboardContent}>
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={12} style={styles.tinySpacing} />
          </View>
          <Skeleton width={50} height={20} borderRadius={10} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surfaceLight,
  },
  textContainer: {
    width: '100%',
  },
  lineSpacing: {
    marginBottom: 8,
  },
  smallSpacing: {
    marginTop: 6,
  },
  tinySpacing: {
    marginTop: 4,
  },
  mediumSpacing: {
    marginTop: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardBody: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    marginBottom: 12,
  },
  profile: {
    alignItems: 'center',
    padding: 20,
  },
  profileStats: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 20,
  },
  profileStat: {
    alignItems: 'center',
  },
  gameCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gameCardContent: {
    padding: 16,
  },
  gameCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  leaderboardContent: {
    flex: 1,
  },
});

export default Skeleton;
