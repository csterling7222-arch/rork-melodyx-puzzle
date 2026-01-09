import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Swords, Zap, Users, Clock, Trophy, 
  ChevronRight, Play, Crown
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useDuels } from '@/contexts/DuelsContext';
import { useUser } from '@/contexts/UserContext';

type DuelMode = 'race' | 'async' | 'duet';

function ModeCard({ 
  mode, 
  title, 
  description, 
  icon, 
  onSelect,
  disabled,
}: { 
  mode: DuelMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: (mode: DuelMode) => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity 
      style={[styles.modeCard, disabled && styles.modeCardDisabled]}
      onPress={() => !disabled && onSelect(mode)}
      disabled={disabled}
    >
      <View style={styles.modeIconContainer}>
        {icon}
      </View>
      <View style={styles.modeInfo}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeDesc}>{description}</Text>
      </View>
      <ChevronRight size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function DuelHistoryItem({ 
  opponent, 
  won, 
  yourGuesses, 
  theirGuesses,
  date,
}: { 
  opponent: string;
  won: boolean;
  yourGuesses: number;
  theirGuesses: number;
  date: string;
}) {
  return (
    <View style={[styles.historyItem, won ? styles.historyWon : styles.historyLost]}>
      <View style={styles.historyLeft}>
        <View style={[styles.resultBadge, { backgroundColor: won ? Colors.correct + '20' : Colors.absent + '20' }]}>
          {won ? (
            <Trophy size={14} color={Colors.correct} />
          ) : (
            <Text style={styles.lostIcon}>✗</Text>
          )}
        </View>
        <View>
          <Text style={styles.opponentName}>{opponent}</Text>
          <Text style={styles.historyDate}>{date}</Text>
        </View>
      </View>
      <View style={styles.historyScore}>
        <Text style={[styles.scoreText, won && styles.scoreWon]}>{yourGuesses}</Text>
        <Text style={styles.scoreDivider}>vs</Text>
        <Text style={[styles.scoreText, !won && styles.scoreWon]}>{theirGuesses}</Text>
      </View>
    </View>
  );
}

export default function DuelsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const { 
    completedDuels, 
    stats, 
    quickMatch,
    currentDuel,
  } = useDuels();
  
  const [isSearching, setIsSearching] = useState(false);

  const handleStartDuel = useCallback((mode: DuelMode) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsSearching(true);
    
    setTimeout(() => {
      quickMatch(profile.id, profile.username, mode);
      setIsSearching(false);
    }, 1500);
  }, [profile.id, profile.username, quickMatch]);

  const winRate = stats.total > 0 
    ? Math.round((stats.wins / stats.total) * 100) 
    : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Duels</Text>
        <Text style={styles.subtitle}>Challenge other players</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Swords size={20} color={Colors.accent} />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Duels</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={20} color={Colors.correct} />
            <Text style={styles.statValue}>{stats.wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statCard}>
            <Crown size={20} color="#FFD700" />
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Match</Text>
          
          {isSearching ? (
            <View style={styles.searchingCard}>
              <View style={styles.searchingPulse}>
                <Users size={32} color={Colors.accent} />
              </View>
              <Text style={styles.searchingText}>Finding opponent...</Text>
            </View>
          ) : (
            <View style={styles.modesContainer}>
              <ModeCard
                mode="race"
                title="Race Mode"
                description="First to solve wins! Real-time competition"
                icon={<Zap size={24} color={Colors.accent} />}
                onSelect={handleStartDuel}
              />
              <ModeCard
                mode="async"
                title="Async Challenge"
                description="Play at your own pace, compare results"
                icon={<Clock size={24} color={Colors.present} />}
                onSelect={handleStartDuel}
              />
              <ModeCard
                mode="duet"
                title="Duet Mode"
                description="Take turns guessing notes together"
                icon={<Users size={24} color={Colors.correct} />}
                onSelect={handleStartDuel}
                disabled
              />
            </View>
          )}
        </View>

        {currentDuel && currentDuel.status === 'active' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Duel</Text>
            <TouchableOpacity style={styles.activeDuelCard}>
              <View style={styles.activeDuelInfo}>
                <Swords size={24} color={Colors.accent} />
                <View style={styles.activeDuelText}>
                  <Text style={styles.activeDuelOpponent}>
                    vs {currentDuel.player2?.username || 'Waiting...'}
                  </Text>
                  <Text style={styles.activeDuelMelody}>
                    {currentDuel.melody.name}
                  </Text>
                </View>
              </View>
              <View style={styles.playButton}>
                <Play size={20} color={Colors.background} fill={Colors.background} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Duels</Text>
          
          {completedDuels.length === 0 ? (
            <View style={styles.emptyState}>
              <Swords size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No duels yet</Text>
              <Text style={styles.emptySubtext}>Start a quick match above!</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {completedDuels.slice(0, 10).map(duel => {
                const isPlayer1 = duel.player1.id === profile.id;
                const you = isPlayer1 ? duel.player1 : duel.player2!;
                const opponent = isPlayer1 ? duel.player2! : duel.player1;
                const won = duel.winnerId === profile.id;
                
                return (
                  <DuelHistoryItem
                    key={duel.id}
                    opponent={opponent.username}
                    won={won}
                    yourGuesses={you.guesses}
                    theirGuesses={opponent.guesses}
                    date={new Date(duel.completedAt!).toLocaleDateString()}
                  />
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonTitle}>🎯 Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            • Friend invites via share link{'\n'}
            • Ranked matchmaking{'\n'}
            • Tournament mode{'\n'}
            • Global leaderboards
          </Text>
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  modesContainer: {
    gap: 12,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  modeCardDisabled: {
    opacity: 0.5,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modeDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  searchingPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  activeDuelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.accent + '20',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  activeDuelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  activeDuelText: {
    gap: 2,
  },
  activeDuelOpponent: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  activeDuelMelody: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
  },
  historyWon: {
    borderLeftColor: Colors.correct,
  },
  historyLost: {
    borderLeftColor: Colors.absent,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lostIcon: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  opponentName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  scoreWon: {
    color: Colors.correct,
  },
  scoreDivider: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  comingSoon: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
