import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  User, Award, Gift, Settings, 
  Coins, Sparkles, Edit2, Check, X,
  Leaf, ListMusic, ChevronRight, Palette,
  Sun, Moon, Eye, Zap, LogOut, UserPlus, Mail,
  PenTool, Music, Heart, TrendingUp, FlaskConical
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, useScreenTheme } from '@/contexts/ThemeContext';
import ThemedBackground from '@/components/ThemedBackground';
import { BackgroundThemeId } from '@/constants/backgrounds';
import { ACHIEVEMENTS, Achievement, TIER_COLORS } from '@/constants/achievements';
import { DAILY_REWARDS } from '@/constants/shop';
import { useRouter } from 'expo-router';
import { useEco } from '@/contexts/EcoContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useUserMelodies } from '@/contexts/UserMelodiesContext';
import { ECO_THEME_COLORS } from '@/constants/sustainability';

function AchievementBadge({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  return (
    <View style={[styles.badgeCard, !unlocked && styles.badgeLocked]}>
      <View style={[styles.badgeIcon, { backgroundColor: unlocked ? achievement.color + '30' : Colors.surfaceLight }]}>
        <Text style={styles.badgeEmoji}>{achievement.icon}</Text>
      </View>
      <Text style={[styles.badgeName, !unlocked && styles.badgeNameLocked]} numberOfLines={1}>
        {achievement.name}
      </Text>
      <Text style={[styles.badgeDesc, !unlocked && styles.badgeDescLocked]} numberOfLines={2}>
        {achievement.description}
      </Text>
      <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[achievement.tier] + '30' }]}>
        <Text style={[styles.tierText, { color: TIER_COLORS[achievement.tier] }]}>
          {achievement.tier.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

function DailyRewardCard({ 
  day, 
  coins, 
  icon, 
  bonus,
  isToday, 
  claimed,
  canClaim,
  onClaim,
}: { 
  day: number; 
  coins: number; 
  icon: string;
  bonus?: string;
  isToday: boolean;
  claimed: boolean;
  canClaim: boolean;
  onClaim: () => void;
}) {
  return (
    <TouchableOpacity 
      style={[
        styles.rewardCard,
        isToday && styles.rewardCardToday,
        claimed && styles.rewardCardClaimed,
      ]}
      onPress={canClaim ? onClaim : undefined}
      disabled={!canClaim}
    >
      <Text style={styles.rewardDay}>Day {day}</Text>
      <Text style={styles.rewardIcon}>{icon}</Text>
      <Text style={styles.rewardCoins}>{coins}</Text>
      {bonus && <Text style={styles.rewardBonus}>+💡</Text>}
      {claimed && (
        <View style={styles.claimedBadge}>
          <Check size={12} color={Colors.correct} />
        </View>
      )}
      {canClaim && (
        <View style={styles.claimBadge}>
          <Text style={styles.claimText}>CLAIM</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, isDarkMode, animationsEnabled } = useScreenTheme('profile');
  const {
    setBackgroundTheme,
    backgroundTheme,
    setDarkMode,
    toggleAnimations,
    toggleHighContrast,
    highContrast,
    getAvailableThemes,
  } = useTheme();
  const { 
    profile, 
    inventory, 
    progress, 
    achievements: unlockedAchievements,
    dailyReward,
    updateUsername,
    claimDailyReward,
  } = useUser();
  const { ecoPoints, totalOffsetTons } = useEco();
  const { playlists, solvedMelodies } = usePlaylist();
  const { creatorStats } = useUserMelodies();
  const { user: authUser, isAnonymous, signOut, isSigningOut } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.username);
  const [selectedCategory, setSelectedCategory] = useState<Achievement['category'] | 'all'>('all');

  const handleSaveName = useCallback(() => {
    if (editedName.trim()) {
      updateUsername(editedName.trim());
      setIsEditing(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [editedName, updateUsername]);

  const handleSignOut = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await signOut();
      router.replace('/auth');
    } catch (error) {
      console.log('Sign out error:', error);
    }
  }, [signOut, router]);

  const handleSignUp = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/auth');
  }, [router]);

  const handleClaimReward = useCallback(() => {
    const result = claimDailyReward();
    if (result) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [claimDailyReward]);

  const unlockedIds = unlockedAchievements.map(a => a.id);
  
  const filteredAchievements = selectedCategory === 'all' 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const categories: { key: Achievement['category'] | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'streak', label: '🔥 Streak' },
    { key: 'fever', label: '⚡ Fever' },
    { key: 'skill', label: '🎯 Skill' },
    { key: 'social', label: '👥 Social' },
    { key: 'special', label: '✨ Special' },
    { key: 'eco', label: '🌱 Eco' },
  ];

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  const availableThemes = getAvailableThemes();

  const handleThemeSelect = useCallback((themeId: BackgroundThemeId) => {
    setBackgroundTheme(themeId);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [setBackgroundTheme]);

  return (
    <ThemedBackground theme={theme} isDark={isDarkMode} animated={animationsEnabled}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Profile</Text>
            <View style={styles.betaBadge}>
              <FlaskConical size={12} color="#F97316" />
              <Text style={styles.betaText}>BETA</Text>
            </View>
          </View>
        </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <User size={40} color={Colors.text} />
          </View>
          
          <View style={styles.profileInfo}>
            {isEditing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  maxLength={20}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveName} style={styles.editButton}>
                  <Check size={20} color={Colors.correct} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.editButton}>
                  <X size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.username}>{profile.username}</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Edit2 size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            
            {profile.isPremium && (
              <View style={styles.premiumBadge}>
                <Sparkles size={12} color="#FFD700" />
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            )}
          </View>

          <View style={styles.walletSection}>
            <View style={styles.walletItem}>
              <Coins size={18} color="#FFD700" />
              <Text style={styles.walletValue}>{inventory.coins}</Text>
            </View>
            <View style={styles.walletItem}>
              <Text style={styles.walletIcon}>💡</Text>
              <Text style={styles.walletValue}>{inventory.hints}</Text>
            </View>
          </View>

          {authUser && (
            <View style={styles.accountInfo}>
              {authUser.email ? (
                <View style={styles.emailRow}>
                  <Mail size={14} color={Colors.textMuted} />
                  <Text style={styles.emailText}>{authUser.email}</Text>
                </View>
              ) : (
                <View style={styles.guestBadge}>
                  <Text style={styles.guestText}>Guest Account</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.quickLinks}>
          <TouchableOpacity 
            style={styles.quickLinkCard}
            onPress={() => router.push('/eco' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: ECO_THEME_COLORS.background }]}>
              <Leaf size={22} color={ECO_THEME_COLORS.primary} />
            </View>
            <View style={styles.quickLinkInfo}>
              <Text style={styles.quickLinkTitle}>Eco Mode</Text>
              <Text style={styles.quickLinkStat}>{ecoPoints} pts • {totalOffsetTons.toFixed(2)} tons offset</Text>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickLinkCard}
            onPress={() => router.push('/playlists' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: Colors.accent + '20' }]}>
              <ListMusic size={22} color={Colors.accent} />
            </View>
            <View style={styles.quickLinkInfo}>
              <Text style={styles.quickLinkTitle}>Playlists</Text>
              <Text style={styles.quickLinkStat}>{playlists.length} playlists • {solvedMelodies.length} melodies</Text>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickLinkCard}
            onPress={() => router.push('/create' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: '#EC4899' + '20' }]}>
              <PenTool size={22} color="#EC4899" />
            </View>
            <View style={styles.quickLinkInfo}>
              <Text style={styles.quickLinkTitle}>Create & Guess</Text>
              <Text style={styles.quickLinkStat}>{creatorStats.totalMelodies} created • {creatorStats.totalLikes} ❤️</Text>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {creatorStats.totalMelodies > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <PenTool size={20} color="#EC4899" />
              <Text style={styles.sectionTitle}>Creator Stats</Text>
            </View>
            <View style={styles.creatorStatsGrid}>
              <View style={styles.creatorStatItem}>
                <Music size={18} color="#EC4899" />
                <Text style={styles.creatorStatValue}>{creatorStats.totalMelodies}</Text>
                <Text style={styles.creatorStatLabel}>Created</Text>
              </View>
              <View style={styles.creatorStatItem}>
                <Eye size={18} color={Colors.secondary} />
                <Text style={styles.creatorStatValue}>{creatorStats.totalPlays}</Text>
                <Text style={styles.creatorStatLabel}>Plays</Text>
              </View>
              <View style={styles.creatorStatItem}>
                <Check size={18} color={Colors.correct} />
                <Text style={styles.creatorStatValue}>{creatorStats.totalSolves}</Text>
                <Text style={styles.creatorStatLabel}>Solves</Text>
              </View>
              <View style={styles.creatorStatItem}>
                <Heart size={18} color="#EF4444" />
                <Text style={styles.creatorStatValue}>{creatorStats.totalLikes}</Text>
                <Text style={styles.creatorStatLabel}>Likes</Text>
              </View>
            </View>
            {creatorStats.totalPlays > 0 && (
              <View style={styles.solveRateContainer}>
                <TrendingUp size={14} color={Colors.correct} />
                <Text style={styles.solveRateText}>
                  {Math.round(creatorStats.averageSolveRate * 100)}% solve rate
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gift size={20} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Daily Rewards</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rewardsRow}
          >
            {DAILY_REWARDS.map((reward, index) => {
              const day = index + 1;
              const isToday = dailyReward.consecutiveDays + 1 === day || 
                (dailyReward.consecutiveDays === 0 && day === 1);
              const claimed = dailyReward.claimedToday && dailyReward.consecutiveDays >= day;
              const canClaim = isToday && !dailyReward.claimedToday;
              
              return (
                <DailyRewardCard
                  key={day}
                  day={day}
                  coins={reward.coins}
                  icon={reward.icon}
                  bonus={reward.bonus}
                  isToday={isToday}
                  claimed={claimed}
                  canClaim={canClaim}
                  onClaim={handleClaimReward}
                />
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.achievementCount}>{unlockedCount}/{totalCount}</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.key && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat.key && styles.categoryTextActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.badgesGrid}>
            {filteredAchievements.map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                unlocked={unlockedIds.includes(achievement.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>

          <View style={styles.appearanceRow}>
            <TouchableOpacity
              style={[styles.appearanceOption, isDarkMode && styles.appearanceOptionActive]}
              onPress={() => setDarkMode(true)}
            >
              <Moon size={20} color={isDarkMode ? Colors.text : Colors.textMuted} />
              <Text style={[styles.appearanceText, isDarkMode && styles.appearanceTextActive]}>Dark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.appearanceOption, !isDarkMode && styles.appearanceOptionActive]}
              onPress={() => setDarkMode(false)}
            >
              <Sun size={20} color={!isDarkMode ? Colors.text : Colors.textMuted} />
              <Text style={[styles.appearanceText, !isDarkMode && styles.appearanceTextActive]}>Light</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Zap size={18} color={Colors.accent} />
              <Text style={styles.toggleLabel}>Animations</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleSwitch, animationsEnabled && styles.toggleSwitchActive]}
              onPress={toggleAnimations}
            >
              <View style={[styles.toggleKnob, animationsEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Eye size={18} color={Colors.accent} />
              <Text style={styles.toggleLabel}>High Contrast</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleSwitch, highContrast && styles.toggleSwitchActive]}
              onPress={toggleHighContrast}
            >
              <View style={[styles.toggleKnob, highContrast && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.themePickerLabel}>Background Theme</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themesRow}
          >
            {availableThemes.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.themeCard,
                  backgroundTheme === t.id && styles.themeCardActive,
                  t.isPremium && !profile.isPremium && styles.themeCardLocked,
                ]}
                onPress={() => handleThemeSelect(t.id)}
                disabled={t.isPremium && !profile.isPremium}
              >
                <View style={[styles.themePreview, { backgroundColor: t.colors.dark.primary }]}>
                  <View style={[styles.themeAccent, { backgroundColor: t.colors.dark.accent }]} />
                </View>
                <Text style={styles.themeName} numberOfLines={1}>{t.name}</Text>
                {t.isPremium && !profile.isPremium && (
                  <View style={styles.premiumLock}>
                    <Sparkles size={10} color="#FFD700" />
                  </View>
                )}
                {backgroundTheme === t.id && (
                  <View style={styles.themeCheck}>
                    <Check size={12} color={Colors.correct} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Quick Stats</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.totalWins}</Text>
              <Text style={styles.statLabel}>Total Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.perfectSolves}</Text>
              <Text style={styles.statLabel}>Perfect Solves</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.feverSolves}</Text>
              <Text style={styles.statLabel}>Fever Solves</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.feverHighScore.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Fever High</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          {isAnonymous && (
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              activeOpacity={0.8}
            >
              <UserPlus size={20} color={Colors.text} />
              <View style={styles.signUpInfo}>
                <Text style={styles.signUpTitle}>Create Account</Text>
                <Text style={styles.signUpSubtitle}>Save your progress across devices</Text>
              </View>
              <ChevronRight size={20} color={Colors.text} />
            </TouchableOpacity>
          )}

          {authUser && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleSignOut}
              disabled={isSigningOut}
              activeOpacity={0.8}
            >
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      </View>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  betaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F97316' + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F97316' + '40',
  },
  betaText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#F97316',
    letterSpacing: 0.5,
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
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 150,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD700' + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  walletSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  walletValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  walletIcon: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  achievementCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  rewardCard: {
    width: 70,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rewardCardToday: {
    borderColor: Colors.accent,
  },
  rewardCardClaimed: {
    opacity: 0.6,
  },
  rewardDay: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  rewardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  rewardCoins: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  rewardBonus: {
    fontSize: 12,
    marginTop: 2,
  },
  claimedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  claimBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  claimText: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  categoryChipActive: {
    backgroundColor: Colors.accent,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.text,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeEmoji: {
    fontSize: 26,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: Colors.textMuted,
  },
  badgeDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 8,
  },
  badgeDescLocked: {
    color: Colors.textMuted,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  accountInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  guestBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  guestText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  signUpInfo: {
    flex: 1,
    marginLeft: 12,
  },
  signUpTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  signUpSubtitle: {
    fontSize: 12,
    color: Colors.text + 'AA',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#EF4444' + '15',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EF4444' + '30',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  quickLinks: {
    gap: 10,
    marginBottom: 24,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  quickLinkStat: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  appearanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  appearanceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  appearanceOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  appearanceText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  appearanceTextActive: {
    color: Colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  toggleSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceLight,
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.accent,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.text,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  themePickerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: 6,
  },
  themesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  themeCard: {
    width: 80,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardActive: {
    borderColor: Colors.accent,
  },
  themeCardLocked: {
    opacity: 0.5,
  },
  themePreview: {
    width: 56,
    height: 40,
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  themeAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    opacity: 0.6,
  },
  themeName: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  premiumLock: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  themeCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.correct + '30',
    borderRadius: 8,
    padding: 2,
  },
  creatorStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  creatorStatItem: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  creatorStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  creatorStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  solveRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.correct + '15',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  solveRateText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.correct,
  },
});
