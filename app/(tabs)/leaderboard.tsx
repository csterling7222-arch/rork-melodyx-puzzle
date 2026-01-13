import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Flame, Crown, Medal, Award, Music, Heart, Pencil } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  streak?: number;
  rank: number;
  isCurrentUser?: boolean;
}

const MOCK_DAILY_LEADERS: LeaderboardEntry[] = [
  { id: '1', username: 'MelodyMaster', score: 1, streak: 42, rank: 1 },
  { id: '2', username: 'NotePro', score: 2, streak: 38, rank: 2 },
  { id: '3', username: 'SoundWizard', score: 2, streak: 35, rank: 3 },
  { id: '4', username: 'TuneHunter', score: 3, streak: 31, rank: 4 },
  { id: '5', username: 'HarmonyKing', score: 3, streak: 28, rank: 5 },
  { id: '6', username: 'RhythmQueen', score: 3, streak: 25, rank: 6 },
  { id: '7', username: 'BeatSeeker', score: 4, streak: 22, rank: 7 },
  { id: '8', username: 'NoteNinja', score: 4, streak: 19, rank: 8 },
  { id: '9', username: 'You', score: 4, streak: 12, rank: 9, isCurrentUser: true },
  { id: '10', username: 'MusicMind', score: 5, streak: 15, rank: 10 },
];

const MOCK_FEVER_LEADERS: LeaderboardEntry[] = [
  { id: '1', username: 'FeverChamp', score: 125000, rank: 1 },
  { id: '2', username: 'ChainMaster', score: 98500, rank: 2 },
  { id: '3', username: 'ComboKing', score: 87200, rank: 3 },
  { id: '4', username: 'ScoreHunter', score: 76800, rank: 4 },
  { id: '5', username: 'PointsPro', score: 65400, rank: 5 },
  { id: '6', username: 'MultiplierMax', score: 54100, rank: 6 },
  { id: '7', username: 'FeverFan', score: 43200, rank: 7 },
  { id: '8', username: 'ChainChaser', score: 32800, rank: 8 },
  { id: '9', username: 'You', score: 28500, rank: 9, isCurrentUser: true },
  { id: '10', username: 'ScoreStar', score: 21600, rank: 10 },
];

const MOCK_STREAK_LEADERS: LeaderboardEntry[] = [
  { id: '1', username: 'StreakLegend', score: 0, streak: 156, rank: 1 },
  { id: '2', username: 'DailyDevotee', score: 0, streak: 134, rank: 2 },
  { id: '3', username: 'ConsistentCat', score: 0, streak: 112, rank: 3 },
  { id: '4', username: 'NeverMiss', score: 0, streak: 98, rank: 4 },
  { id: '5', username: 'EverydayPlayer', score: 0, streak: 87, rank: 5 },
  { id: '6', username: 'StreakSeeker', score: 0, streak: 76, rank: 6 },
  { id: '7', username: 'DailyDose', score: 0, streak: 65, rank: 7 },
  { id: '8', username: 'You', score: 0, streak: 12, rank: 8, isCurrentUser: true },
  { id: '9', username: 'KeepGoing', score: 0, streak: 54, rank: 9 },
  { id: '10', username: 'StreakStarter', score: 0, streak: 43, rank: 10 },
];

interface CreatorEntry {
  id: string;
  username: string;
  melodiesCreated: number;
  totalPlays: number;
  totalLikes: number;
  avgRating: number;
  rank: number;
  isCurrentUser?: boolean;
  featuredMelody?: string;
}

const MOCK_CREATOR_LEADERS: CreatorEntry[] = [
  { id: '1', username: 'MelodyMaker', melodiesCreated: 42, totalPlays: 15420, totalLikes: 3240, avgRating: 4.8, rank: 1, featuredMelody: 'Summer Breeze' },
  { id: '2', username: 'TuneSmith', melodiesCreated: 38, totalPlays: 12800, totalLikes: 2890, avgRating: 4.7, rank: 2, featuredMelody: 'Midnight Jazz' },
  { id: '3', username: 'NoteWizard', melodiesCreated: 35, totalPlays: 11200, totalLikes: 2450, avgRating: 4.6, rank: 3, featuredMelody: 'Ocean Waves' },
  { id: '4', username: 'SoundArtist', melodiesCreated: 31, totalPlays: 9800, totalLikes: 2100, avgRating: 4.5, rank: 4, featuredMelody: 'City Lights' },
  { id: '5', username: 'BeatCreator', melodiesCreated: 28, totalPlays: 8400, totalLikes: 1850, avgRating: 4.4, rank: 5, featuredMelody: 'Forest Path' },
  { id: '6', username: 'HarmonyPro', melodiesCreated: 24, totalPlays: 7200, totalLikes: 1620, avgRating: 4.3, rank: 6, featuredMelody: 'Rainy Day' },
  { id: '7', username: 'ChordMaster', melodiesCreated: 21, totalPlays: 6100, totalLikes: 1380, avgRating: 4.2, rank: 7, featuredMelody: 'Spring Morning' },
  { id: '8', username: 'You', melodiesCreated: 5, totalPlays: 420, totalLikes: 85, avgRating: 4.1, rank: 8, isCurrentUser: true, featuredMelody: 'My First Tune' },
  { id: '9', username: 'RhythmKing', melodiesCreated: 18, totalPlays: 5200, totalLikes: 1150, avgRating: 4.0, rank: 9, featuredMelody: 'Desert Wind' },
  { id: '10', username: 'MelodyNewbie', melodiesCreated: 15, totalPlays: 4300, totalLikes: 920, avgRating: 3.9, rank: 10, featuredMelody: 'First Steps' },
];

type TabType = 'daily' | 'fever' | 'streaks' | 'creators';

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown size={20} color="#FFD700" />;
  if (rank === 2) return <Medal size={20} color="#C0C0C0" />;
  if (rank === 3) return <Award size={20} color="#CD7F32" />;
  return null;
}

function getRankColor(rank: number): string {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return Colors.textSecondary;
}

function LeaderboardRow({ entry, type }: { entry: LeaderboardEntry; type: TabType }) {
  const displayValue = type === 'streaks' ? entry.streak : entry.score;
  const suffix = type === 'daily' ? ' guesses' : type === 'streaks' ? ' days' : ' pts';
  
  return (
    <View style={[
      styles.row,
      entry.isCurrentUser && styles.currentUserRow,
    ]}>
      <View style={styles.rankContainer}>
        {getRankIcon(entry.rank) || (
          <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
            {entry.rank}
          </Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.username, entry.isCurrentUser && styles.currentUserText]}>
          {entry.username}
        </Text>
        {type === 'daily' && entry.streak && (
          <View style={styles.streakBadge}>
            <Flame size={12} color={Colors.present} />
            <Text style={styles.streakText}>{entry.streak}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.scoreText, entry.isCurrentUser && styles.currentUserText]}>
        {type === 'fever' ? displayValue?.toLocaleString() : displayValue}{suffix}
      </Text>
    </View>
  );
}

function CreatorRow({ entry }: { entry: CreatorEntry }) {
  return (
    <View style={[
      styles.row,
      styles.creatorRow,
      entry.isCurrentUser && styles.currentUserRow,
    ]}>
      <View style={styles.rankContainer}>
        {getRankIcon(entry.rank) || (
          <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
            {entry.rank}
          </Text>
        )}
      </View>
      <View style={styles.creatorInfo}>
        <Text style={[styles.username, entry.isCurrentUser && styles.currentUserText]}>
          {entry.username}
        </Text>
        {entry.featuredMelody && (
          <Text style={styles.featuredMelody} numberOfLines={1}>
            🎵 {entry.featuredMelody}
          </Text>
        )}
        <View style={styles.creatorStats}>
          <View style={styles.creatorStat}>
            <Pencil size={10} color={Colors.textMuted} />
            <Text style={styles.creatorStatText}>{entry.melodiesCreated}</Text>
          </View>
          <View style={styles.creatorStat}>
            <Heart size={10} color="#EF4444" />
            <Text style={styles.creatorStatText}>{entry.totalLikes.toLocaleString()}</Text>
          </View>
          <View style={styles.creatorStat}>
            <Music size={10} color={Colors.accent} />
            <Text style={styles.creatorStatText}>{entry.totalPlays.toLocaleString()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.ratingBadge}>
        <Text style={styles.ratingText}>⭐ {entry.avgRating.toFixed(1)}</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getLeaderboardData = () => {
    switch (activeTab) {
      case 'daily':
        return MOCK_DAILY_LEADERS;
      case 'fever':
        return MOCK_FEVER_LEADERS;
      case 'streaks':
        return MOCK_STREAK_LEADERS;
      case 'creators':
        return [];
    }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'daily', label: 'Daily', icon: <Trophy size={16} color={activeTab === 'daily' ? Colors.background : Colors.textSecondary} /> },
    { key: 'fever', label: 'Fever', icon: <Flame size={16} color={activeTab === 'fever' ? Colors.background : Colors.textSecondary} /> },
    { key: 'streaks', label: 'Streaks', icon: <Flame size={16} color={activeTab === 'streaks' ? Colors.background : Colors.textSecondary} /> },
    { key: 'creators', label: 'Creators', icon: <Pencil size={16} color={activeTab === 'creators' ? Colors.background : Colors.textSecondary} /> },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Compete with players worldwide</Text>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {activeTab !== 'creators' ? (
          <View style={styles.topThree}>
            {getLeaderboardData().slice(0, 3).map((entry, index) => (
              <View 
                key={entry.id} 
                style={[
                  styles.podiumItem,
                  index === 0 && styles.firstPlace,
                  index === 1 && styles.secondPlace,
                  index === 2 && styles.thirdPlace,
                ]}
              >
                <View style={[styles.podiumAvatar, { backgroundColor: getRankColor(entry.rank) + '30' }]}>
                  {getRankIcon(entry.rank)}
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{entry.username}</Text>
                <Text style={styles.podiumScore}>
                  {activeTab === 'fever' 
                    ? entry.score.toLocaleString()
                    : activeTab === 'streaks' 
                      ? `${entry.streak} days`
                      : `${entry.score} guesses`
                  }
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.topThree}>
            {MOCK_CREATOR_LEADERS.slice(0, 3).map((entry, index) => (
              <View 
                key={entry.id} 
                style={[
                  styles.podiumItem,
                  index === 0 && styles.firstPlace,
                  index === 1 && styles.secondPlace,
                  index === 2 && styles.thirdPlace,
                ]}
              >
                <View style={[styles.podiumAvatar, { backgroundColor: getRankColor(entry.rank) + '30' }]}>
                  {getRankIcon(entry.rank)}
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{entry.username}</Text>
                <View style={styles.creatorPodiumStats}>
                  <Text style={styles.podiumScore}>{entry.melodiesCreated} melodies</Text>
                  <Text style={styles.podiumSubScore}>❤️ {entry.totalLikes.toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab !== 'creators' ? (
          <View style={styles.listContainer}>
            {getLeaderboardData().slice(3).map(entry => (
              <LeaderboardRow key={entry.id} entry={entry} type={activeTab} />
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {MOCK_CREATOR_LEADERS.slice(3).map(entry => (
              <CreatorRow key={entry.id} entry={entry} />
            ))}
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            🔒 Sign in to save your scores and compete globally
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
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
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  activeTab: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topThree: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 24,
    paddingTop: 20,
  },
  podiumItem: {
    alignItems: 'center',
    width: 100,
  },
  firstPlace: {
    order: 2,
  },
  secondPlace: {
    order: 1,
  },
  thirdPlace: {
    order: 3,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  currentUserRow: {
    backgroundColor: Colors.accent + '15',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  currentUserText: {
    color: Colors.accent,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.present + '20',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.present,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  disclaimer: {
    marginTop: 24,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  creatorRow: {
    paddingVertical: 16,
  },
  creatorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  featuredMelody: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 2,
  },
  creatorStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  creatorStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorStatText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  ratingBadge: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  creatorPodiumStats: {
    alignItems: 'center',
  },
  podiumSubScore: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
