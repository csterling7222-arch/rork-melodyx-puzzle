import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Flame, Target, BarChart3 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DistributionBar({ guessNumber, count, maxCount }: { guessNumber: number; count: number; maxCount: number }) {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
  
  return (
    <View style={styles.distributionRow}>
      <Text style={styles.guessNumber}>{guessNumber}</Text>
      <View style={styles.barContainer}>
        <View 
          style={[
            styles.bar, 
            { 
              width: `${Math.max(percentage, 8)}%`,
              backgroundColor: count > 0 ? Colors.correct : Colors.surfaceLight,
            }
          ]} 
        >
          <Text style={styles.barCount}>{count}</Text>
        </View>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { stats } = useGame();

  const winPercentage = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;

  const maxDistribution = Math.max(...stats.guessDistribution, 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <Text style={styles.subtitle}>Your Melodyx journey</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <StatCard
            icon={<Target size={24} color={Colors.accent} />}
            value={stats.gamesPlayed}
            label="Played"
            color={Colors.accent}
          />
          <StatCard
            icon={<Trophy size={24} color={Colors.correct} />}
            value={`${winPercentage}%`}
            label="Win Rate"
            color={Colors.correct}
          />
          <StatCard
            icon={<Flame size={24} color={Colors.present} />}
            value={stats.currentStreak}
            label="Current Streak"
            color={Colors.present}
          />
          <StatCard
            icon={<BarChart3 size={24} color="#3B82F6" />}
            value={stats.maxStreak}
            label="Max Streak"
            color="#3B82F6"
          />
        </View>

        <View style={styles.distributionSection}>
          <Text style={styles.sectionTitle}>Guess Distribution</Text>
          <View style={styles.distributionContainer}>
            {stats.guessDistribution.map((count, index) => (
              <DistributionBar
                key={index}
                guessNumber={index + 1}
                count={count}
                maxCount={maxDistribution}
              />
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How to Play</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              🎵 Guess the daily melody in 6 tries
            </Text>
            <Text style={styles.infoText}>
              🟩 Green = Correct note in correct position
            </Text>
            <Text style={styles.infoText}>
              🟨 Yellow = Correct note in wrong position
            </Text>
            <Text style={styles.infoText}>
              ⬛ Gray = Note not in the melody
            </Text>
            <Text style={styles.infoText}>
              💡 Hint available after 3 guesses
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  distributionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  distributionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guessNumber: {
    width: 20,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  barContainer: {
    flex: 1,
    height: 28,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
    minWidth: 28,
  },
  barCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  infoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  infoContent: {
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
