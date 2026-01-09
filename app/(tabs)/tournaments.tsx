import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy, 
  Zap, 
  Users, 
  Clock, 
  ChevronRight, 
  X, 
  Gift,
  Target,
  Crown,
  Medal,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { TournamentProvider, useTournament } from '@/contexts/TournamentContext';
import { Tournament, TournamentMatch } from '@/constants/tournaments';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

function TournamentsContent() {
  const {
    stats,
    activeTournaments,
    upcomingTournaments,
    completedTournaments,
    selectedTournament,
    setSelectedTournament,
    showBracket,
    setShowBracket,
    showJoinModal,
    setShowJoinModal,
    isLoading,
    canClaimDailyToken,
    claimDailyToken,
    joinTournament,
    getBracket,
    getLeaderboard,
    getTournamentStatus,
  } = useTournament();

  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed'>('active');

  const handleClaimToken = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    claimDailyToken();
  };

  const handleJoinTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowJoinModal(true);
  };

  const handleConfirmJoin = () => {
    if (selectedTournament) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      joinTournament(selectedTournament);
    }
  };

  const handleViewBracket = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowBracket(true);
  };

  const renderTournamentCard = (tournament: Tournament & { isJoined?: boolean }) => {
    const statusText = getTournamentStatus(tournament);
    const typeIcon = tournament.type === 'fever' ? Zap : 
                     tournament.type === 'duel' ? Users : 
                     tournament.type === 'speed' ? Clock : Target;
    const TypeIcon = typeIcon;

    return (
      <TouchableOpacity
        key={tournament.id}
        style={styles.tournamentCard}
        onPress={() => tournament.status === 'completed' ? handleViewBracket(tournament) : handleJoinTournament(tournament)}
      >
        <LinearGradient
          colors={
            tournament.status === 'active' 
              ? ['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']
              : tournament.status === 'upcoming'
              ? ['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']
              : ['rgba(107, 114, 128, 0.2)', 'rgba(107, 114, 128, 0.05)']
          }
          style={styles.tournamentGradient}
        >
          <View style={styles.tournamentHeader}>
            <View style={styles.tournamentIconContainer}>
              <TypeIcon size={24} color={tournament.status === 'active' ? '#A78BFA' : tournament.status === 'upcoming' ? '#22C55E' : Colors.textSecondary} />
            </View>
            <View style={styles.tournamentInfo}>
              <Text style={styles.tournamentName}>{tournament.name}</Text>
              <Text style={styles.tournamentType}>{tournament.type.toUpperCase()} • {statusText}</Text>
            </View>
            {tournament.isJoined && (
              <View style={styles.joinedBadge}>
                <Text style={styles.joinedText}>Joined</Text>
              </View>
            )}
          </View>

          <Text style={styles.tournamentDesc} numberOfLines={2}>
            {tournament.description}
          </Text>

          <View style={styles.tournamentMeta}>
            <View style={styles.metaItem}>
              <Users size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {tournament.currentParticipants}/{tournament.maxParticipants}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Zap size={14} color="#FBBF24" />
              <Text style={styles.metaText}>
                {tournament.entryTokens === 0 ? 'Free' : `${tournament.entryTokens} Token${tournament.entryTokens > 1 ? 's' : ''}`}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderBracketMatch = (match: TournamentMatch, roundIndex: number) => {
    return (
      <View key={match.id} style={styles.matchContainer}>
        <View style={[
          styles.matchPlayer,
          match.winnerId === match.player1.id && styles.matchWinner,
        ]}>
          <Text style={[
            styles.matchPlayerName,
            match.winnerId === match.player1.id && styles.matchWinnerText,
          ]}>
            {match.player1.name}
          </Text>
          <Text style={styles.matchScore}>{match.scores?.player1 ?? '-'}</Text>
        </View>
        <View style={[
          styles.matchPlayer,
          match.player2 && match.winnerId === match.player2.id && styles.matchWinner,
        ]}>
          <Text style={[
            styles.matchPlayerName,
            match.player2 && match.winnerId === match.player2.id && styles.matchWinnerText,
          ]}>
            {match.player2?.name ?? 'BYE'}
          </Text>
          <Text style={styles.matchScore}>{match.scores?.player2 ?? '-'}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tournaments...</Text>
      </View>
    );
  }

  const currentTournaments = activeTab === 'active' ? activeTournaments :
                            activeTab === 'upcoming' ? upcomingTournaments :
                            completedTournaments;

  return (
    <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Trophy size={28} color="#FBBF24" />
              <Text style={styles.title}>Tournaments</Text>
            </View>
            <Text style={styles.subtitle}>Compete for glory and rewards</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Crown size={20} color="#FBBF24" />
              <Text style={styles.statValue}>{stats.totalWins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statCard}>
              <Medal size={20} color="#A78BFA" />
              <Text style={styles.statValue}>{stats.totalMatches}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statCard}>
              <Zap size={20} color="#22C55E" />
              <Text style={styles.statValue}>{stats.tokens}</Text>
              <Text style={styles.statLabel}>Tokens</Text>
            </View>
          </View>

          {canClaimDailyToken && (
            <TouchableOpacity style={styles.dailyReward} onPress={handleClaimToken}>
              <LinearGradient
                colors={['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.1)']}
                style={styles.dailyRewardGradient}
              >
                <Gift size={24} color="#FBBF24" />
                <View style={styles.dailyRewardText}>
                  <Text style={styles.dailyRewardTitle}>Daily Token Available!</Text>
                  <Text style={styles.dailyRewardSubtitle}>Tap to claim your free entry token</Text>
                </View>
                <ChevronRight size={24} color="#FBBF24" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.tabContainer}>
            {(['active', 'upcoming', 'completed'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tournamentsList}>
            {currentTournaments.length === 0 ? (
              <View style={styles.emptyState}>
                <Trophy size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No {activeTab} tournaments</Text>
              </View>
            ) : (
              currentTournaments.map(renderTournamentCard)
            )}
          </View>

          <View style={styles.leaderboardSection}>
            <Text style={styles.sectionTitle}>Top Players This Week</Text>
            {getLeaderboard('').slice(0, 5).map((entry, index) => (
              <View key={entry.playerId} style={styles.leaderboardRow}>
                <Text style={[
                  styles.leaderboardRank,
                  index === 0 && styles.goldRank,
                  index === 1 && styles.silverRank,
                  index === 2 && styles.bronzeRank,
                ]}>
                  #{entry.rank}
                </Text>
                <Text style={styles.leaderboardName}>{entry.playerName}</Text>
                <Text style={styles.leaderboardScore}>{entry.score.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal visible={showJoinModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowJoinModal(false)}
              >
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>

              {selectedTournament && (
                <>
                  <Trophy size={48} color="#FBBF24" style={styles.modalIcon} />
                  <Text style={styles.modalTitle}>{selectedTournament.name}</Text>
                  <Text style={styles.modalDesc}>{selectedTournament.description}</Text>

                  <View style={styles.prizeSection}>
                    <Text style={styles.prizeSectionTitle}>Prize Pool</Text>
                    {selectedTournament.prizePool.map((prize, i) => (
                      <View key={i} style={styles.prizeRow}>
                        <Text style={styles.prizeIcon}>{prize.icon}</Text>
                        <Text style={styles.prizeRank}>
                          {typeof prize.rank === 'number' ? `#${prize.rank}` : prize.rank}
                        </Text>
                        <Text style={styles.prizeReward}>{prize.reward}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.entryInfo}>
                    <Text style={styles.entryLabel}>Entry Fee:</Text>
                    <Text style={styles.entryValue}>
                      {selectedTournament.entryTokens === 0 
                        ? 'Free' 
                        : `${selectedTournament.entryTokens} Token${selectedTournament.entryTokens > 1 ? 's' : ''}`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.joinButton,
                      stats.tokens < selectedTournament.entryTokens && styles.joinButtonDisabled,
                    ]}
                    onPress={handleConfirmJoin}
                    disabled={stats.tokens < selectedTournament.entryTokens}
                  >
                    <Text style={styles.joinButtonText}>
                      {stats.tokens < selectedTournament.entryTokens 
                        ? 'Not Enough Tokens' 
                        : 'Join Tournament'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={showBracket} animationType="slide" transparent>
          <View style={styles.bracketModalOverlay}>
            <View style={styles.bracketModalContent}>
              <View style={styles.bracketHeader}>
                <Text style={styles.bracketTitle}>
                  {selectedTournament?.name} - Bracket
                </Text>
                <TouchableOpacity onPress={() => setShowBracket(false)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.bracketContainer}>
                  {selectedTournament && getBracket(selectedTournament.id)?.rounds.map((round, roundIndex) => (
                    <View key={roundIndex} style={styles.bracketRound}>
                      <Text style={styles.roundTitle}>
                        {roundIndex === 0 ? 'Round 1' : 
                         roundIndex === getBracket(selectedTournament.id)!.rounds.length - 1 ? 'Final' :
                         `Round ${roundIndex + 1}`}
                      </Text>
                      {round.map((match) => renderBracketMatch(match, roundIndex))}
                    </View>
                  ))}
                </View>
              </ScrollView>

              {selectedTournament && getBracket(selectedTournament.id)?.finalWinner && (
                <View style={styles.winnerBanner}>
                  <Crown size={24} color="#FBBF24" />
                  <Text style={styles.winnerText}>
                    Champion: {getBracket(selectedTournament.id)?.finalWinner?.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function TournamentsScreen() {
  return (
    <TournamentProvider>
      <TournamentsContent />
    </TournamentProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    marginTop: 4,
  },
  dailyReward: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dailyRewardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dailyRewardText: {
    flex: 1,
    marginLeft: 12,
  },
  dailyRewardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FBBF24',
  },
  dailyRewardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#A78BFA',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  tournamentsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tournamentCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tournamentGradient: {
    padding: 16,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tournamentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tournamentType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  joinedBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  tournamentDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  tournamentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 12,
  },
  leaderboardSection: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    width: 40,
  },
  goldRank: {
    color: '#FBBF24',
  },
  silverRank: {
    color: '#94A3B8',
  },
  bronzeRank: {
    color: '#CD7F32',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  leaderboardScore: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#A78BFA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 40,
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 24,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  prizeSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  prizeSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prizeIcon: {
    fontSize: 20,
    width: 30,
  },
  prizeRank: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    width: 50,
  },
  prizeReward: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  entryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  entryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  entryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FBBF24',
  },
  joinButton: {
    backgroundColor: '#A78BFA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bracketModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  bracketModalContent: {
    flex: 1,
    paddingTop: 60,
  },
  bracketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bracketTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  bracketContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 20,
  },
  bracketRound: {
    width: 160,
    gap: 16,
  },
  roundTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  matchContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  matchPlayer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  matchWinner: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  matchPlayerName: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  matchWinnerText: {
    fontWeight: '600' as const,
  },
  matchScore: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 8,
  },
  winnerText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FBBF24',
  },
});
