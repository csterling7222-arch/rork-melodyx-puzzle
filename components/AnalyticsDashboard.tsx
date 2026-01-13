import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  Flame,
  Award,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Calendar,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { AnalyticsDashboardData, MistakePattern } from '@/constants/learningAdvanced';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

interface AnalyticsDashboardProps {
  data: AnalyticsDashboardData;
  onViewDetail?: (section: string) => void;
  compact?: boolean;
}

export default function AnalyticsDashboard({
  data,
  onViewDetail,
  compact = false,
}: AnalyticsDashboardProps) {
  const weeklyStats = useMemo(() => {
    const totalLessons = data.weeklyProgress.reduce((acc, d) => acc + d.lessonsCompleted, 0);
    const totalMinutes = data.weeklyProgress.reduce((acc, d) => acc + d.minutesPracticed, 0);
    const totalXp = data.weeklyProgress.reduce((acc, d) => acc + d.xpEarned, 0);
    const avgAccuracy = data.weeklyProgress.filter(d => d.accuracy > 0).length > 0
      ? Math.round(data.weeklyProgress.filter(d => d.accuracy > 0).reduce((acc, d) => acc + d.accuracy, 0) / 
          data.weeklyProgress.filter(d => d.accuracy > 0).length)
      : 0;
    
    return { totalLessons, totalMinutes, totalXp, avgAccuracy };
  }, [data.weeklyProgress]);

  const accuracyTrend = useMemo(() => {
    if (data.accuracyTrend.length < 2) return 'stable';
    const recent = data.accuracyTrend.slice(-3);
    const older = data.accuracyTrend.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((acc, d) => acc + d.value, 0) / recent.length;
    const olderAvg = older.reduce((acc, d) => acc + d.value, 0) / older.length;
    
    if (recentAvg > olderAvg + 5) return 'up';
    if (recentAvg < olderAvg - 5) return 'down';
    return 'stable';
  }, [data.accuracyTrend]);

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp size={14} color="#22C55E" />;
      case 'down': return <TrendingDown size={14} color="#EF4444" />;
      default: return <Minus size={14} color={Colors.textSecondary} />;
    }
  };

  const renderWeeklyChart = () => {
    const maxValue = Math.max(...data.weeklyProgress.map(d => d.minutesPracticed), 1);
    const barWidth = (CHART_WIDTH - 60) / 7;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>📊 Weekly Practice</Text>
        <View style={styles.chartContent}>
          <View style={styles.chartBars}>
            {data.weeklyProgress.map((day, i) => {
              const height = Math.max(4, (day.minutesPracticed / maxValue) * 100);
              const dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
              const isToday = i === data.weeklyProgress.length - 1;
              
              return (
                <View key={day.date} style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      { 
                        height, 
                        width: barWidth - 8,
                        backgroundColor: isToday ? '#22C55E' : '#A78BFA',
                        opacity: day.minutesPracticed > 0 ? 1 : 0.3,
                      }
                    ]}
                  />
                  <Text style={[styles.chartDayLabel, isToday && styles.chartDayLabelToday]}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#A78BFA' }]} />
              <Text style={styles.legendText}>Minutes</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderAccuracyChart = () => {
    const points = data.accuracyTrend.slice(-7);
    const maxVal = 100;
    const chartHeight = 80;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartTitleRow}>
          <Text style={styles.chartTitle}>🎯 Accuracy Trend</Text>
          <View style={styles.trendBadge}>
            {renderTrendIcon(accuracyTrend)}
            <Text style={[
              styles.trendText,
              { color: accuracyTrend === 'up' ? '#22C55E' : accuracyTrend === 'down' ? '#EF4444' : Colors.textSecondary }
            ]}>
              {accuracyTrend === 'up' ? 'Improving' : accuracyTrend === 'down' ? 'Declining' : 'Stable'}
            </Text>
          </View>
        </View>
        <View style={[styles.lineChartContainer, { height: chartHeight }]}>
          {points.map((point, i) => {
            const x = (i / Math.max(points.length - 1, 1)) * (CHART_WIDTH - 40);
            const y = chartHeight - (point.value / maxVal) * chartHeight;
            
            return (
              <View
                key={point.date}
                style={[
                  styles.chartPoint,
                  {
                    left: x,
                    top: y,
                    backgroundColor: point.value >= 80 ? '#22C55E' : point.value >= 60 ? '#F59E0B' : '#EF4444',
                  }
                ]}
              />
            );
          })}
          <View style={styles.chartBaseline} />
        </View>
      </View>
    );
  };

  const renderStatCards = () => (
    <View style={styles.statsGrid}>
      <View style={[styles.statCard, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
        <Target size={20} color="#22C55E" />
        <Text style={styles.statValue}>{weeklyStats.avgAccuracy}%</Text>
        <Text style={styles.statLabel}>Avg Accuracy</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: 'rgba(167,139,250,0.1)' }]}>
        <Clock size={20} color="#A78BFA" />
        <Text style={styles.statValue}>{weeklyStats.totalMinutes}m</Text>
        <Text style={styles.statLabel}>Practice Time</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: 'rgba(251,191,36,0.1)' }]}>
        <Award size={20} color="#FBBF24" />
        <Text style={styles.statValue}>{weeklyStats.totalXp}</Text>
        <Text style={styles.statLabel}>XP Earned</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
        <Flame size={20} color="#EF4444" />
        <Text style={styles.statValue}>{weeklyStats.totalLessons}</Text>
        <Text style={styles.statLabel}>Lessons</Text>
      </View>
    </View>
  );

  const renderMistakePatterns = () => {
    if (data.mistakePatterns.length === 0) {
      return (
        <View style={styles.emptyMistakes}>
          <Lightbulb size={24} color="#22C55E" />
          <Text style={styles.emptyMistakesText}>Great job! No common mistakes detected.</Text>
        </View>
      );
    }

    return (
      <View style={styles.mistakesContainer}>
        <View style={styles.mistakesHeader}>
          <AlertTriangle size={18} color="#F59E0B" />
          <Text style={styles.mistakesTitle}>Areas to Improve</Text>
        </View>
        {data.mistakePatterns.slice(0, 3).map((mistake, i) => (
          <MistakePatternItem key={i} mistake={mistake} />
        ))}
      </View>
    );
  };

  const renderSkillBreakdown = () => (
    <View style={styles.skillsContainer}>
      <Text style={styles.sectionTitle}>📈 Skill Progress</Text>
      {data.skillBreakdown.slice(0, compact ? 4 : 6).map(skill => (
        <View key={skill.skillId} style={styles.skillRow}>
          <Text style={styles.skillName}>{skill.name}</Text>
          <View style={styles.skillProgressContainer}>
            <View style={styles.skillProgressBar}>
              <View
                style={[
                  styles.skillProgressFill,
                  { width: `${Math.min(100, (skill.xp / skill.xpToNext) * 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.skillLevel}>Lv.{skill.level}</Text>
          </View>
          <View style={styles.skillTrend}>
            {renderTrendIcon(skill.trend)}
          </View>
        </View>
      ))}
    </View>
  );

  const renderComparison = () => (
    <View style={styles.comparisonContainer}>
      <Text style={styles.sectionTitle}>🏆 Your Ranking</Text>
      <View style={styles.comparisonContent}>
        <View style={styles.rankCircle}>
          <Text style={styles.rankPercentile}>Top {100 - data.comparisons.percentile}%</Text>
        </View>
        <View style={styles.comparisonStats}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Your Accuracy</Text>
            <Text style={[
              styles.comparisonValue,
              data.comparisons.userAccuracy > data.comparisons.averageAccuracy && styles.comparisonValueGood
            ]}>
              {data.comparisons.userAccuracy}%
            </Text>
            <Text style={styles.comparisonAvg}>avg: {data.comparisons.averageAccuracy}%</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Your Streak</Text>
            <Text style={[
              styles.comparisonValue,
              data.comparisons.userStreak > data.comparisons.averageStreak && styles.comparisonValueGood
            ]}>
              {data.comparisons.userStreak} days
            </Text>
            <Text style={styles.comparisonAvg}>avg: {data.comparisons.averageStreak} days</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {renderStatCards()}
        <TouchableOpacity 
          style={styles.viewMoreBtn}
          onPress={() => onViewDetail?.('analytics')}
        >
          <BarChart3 size={16} color={Colors.accent} />
          <Text style={styles.viewMoreText}>View Full Analytics</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Calendar size={20} color={Colors.accent} />
        <Text style={styles.headerTitle}>Weekly Analytics</Text>
      </View>

      {renderStatCards()}
      {renderWeeklyChart()}
      {renderAccuracyChart()}
      {renderMistakePatterns()}
      {renderSkillBreakdown()}
      {renderComparison()}
    </ScrollView>
  );
}

function MistakePatternItem({ mistake }: { mistake: MistakePattern }) {
  return (
    <View style={styles.mistakeItem}>
      <View style={styles.mistakeNotes}>
        <Text style={styles.mistakeFrom}>{mistake.fromNote}</Text>
        <Text style={styles.mistakeArrow}>→</Text>
        <Text style={styles.mistakeTo}>{mistake.toNote}</Text>
      </View>
      <View style={styles.mistakeInfo}>
        <Text style={styles.mistakeCount}>{mistake.count}x</Text>
        <Text style={styles.mistakeSuggestion} numberOfLines={1}>{mistake.suggestion}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: (SCREEN_WIDTH - 70) / 2,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  chartContent: {
    height: 140,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingBottom: 20,
  },
  chartBarContainer: {
    alignItems: 'center',
  },
  chartBar: {
    borderRadius: 4,
  },
  chartDayLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 6,
  },
  chartDayLabelToday: {
    color: '#22C55E',
    fontWeight: '600' as const,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  lineChartContainer: {
    position: 'relative',
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  chartBaseline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  mistakesContainer: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mistakesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mistakesTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  mistakeItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  mistakeNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  mistakeFrom: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  mistakeArrow: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  mistakeTo: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#22C55E',
  },
  mistakeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mistakeCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mistakeSuggestion: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  emptyMistakes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  emptyMistakesText: {
    flex: 1,
    fontSize: 13,
    color: '#22C55E',
  },
  skillsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillName: {
    width: 100,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  skillProgressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  skillProgressFill: {
    height: '100%',
    backgroundColor: '#A78BFA',
    borderRadius: 3,
  },
  skillLevel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    width: 35,
  },
  skillTrend: {
    width: 20,
    alignItems: 'center',
  },
  comparisonContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  comparisonContent: {
    flexDirection: 'row',
    gap: 16,
  },
  rankCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34,197,94,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  rankPercentile: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#22C55E',
    textAlign: 'center' as const,
  },
  comparisonStats: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginRight: 8,
  },
  comparisonValueGood: {
    color: '#22C55E',
  },
  comparisonAvg: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.accent,
  },
});
