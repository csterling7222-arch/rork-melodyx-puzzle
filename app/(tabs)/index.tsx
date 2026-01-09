import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Music,
  Flame,
  Trophy,
  Map,
  Leaf,
  Share2,
  Play,
  Clock,
  Target,
  Zap,
  ChevronRight,
  BarChart3,
  Crown,
  Sparkles,
  Check,
  X,
  Gift,
  Star,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { useUser } from '@/contexts/UserContext';
import { useScreenTheme } from '@/contexts/ThemeContext';
import { useEco } from '@/contexts/EcoContext';
import ThemedBackground from '@/components/ThemedBackground';
import Confetti from '@/components/Confetti';
import OnboardingModal from '@/components/OnboardingModal';
import { generateShareText } from '@/utils/gameLogic';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'melodyx_onboarding_completed';

function AnimatedStatCard({ 
  value, 
  label, 
  icon, 
  color, 
  delay = 0 
}: { 
  value: string | number; 
  label: string; 
  icon: React.ReactNode; 
  color: string;
  delay?: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function ModeCard({
  icon,
  title,
  subtitle,
  color,
  onPress,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  badge?: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.modeCard, { borderColor: color + '30' }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={[styles.modeIconContainer, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <View style={styles.modeInfo}>
          <Text style={styles.modeTitle}>{title}</Text>
          <Text style={styles.modeSubtitle}>{subtitle}</Text>
        </View>
        {badge && (
          <View style={[styles.modeBadge, { backgroundColor: color }]}>
            <Text style={styles.modeBadgeText}>{badge}</Text>
          </View>
        )}
        <ChevronRight size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = React.useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.countdownContainer}>
      <Clock size={14} color={Colors.accent} />
      <Text style={styles.countdownText}>
        Next puzzle in{' '}
        <Text style={styles.countdownTime}>
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </Text>
      </Text>
    </View>
  );
}

function DailyRewardBanner({ 
  onClaim, 
  consecutiveDays, 
  canClaim 
}: { 
  onClaim: () => void; 
  consecutiveDays: number; 
  canClaim: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (canClaim) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [canClaim, pulseAnim, glowAnim]);

  if (!canClaim) return null;

  return (
    <Animated.View style={[rewardStyles.container, { transform: [{ scale: pulseAnim }] }]}>
      <Animated.View 
        style={[
          rewardStyles.glow, 
          { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] }) }
        ]} 
      />
      <View style={rewardStyles.content}>
        <View style={rewardStyles.iconContainer}>
          <Gift size={28} color="#FFD700" />
        </View>
        <View style={rewardStyles.textContainer}>
          <Text style={rewardStyles.title}>Daily Reward Ready!</Text>
          <Text style={rewardStyles.subtitle}>
            Day {consecutiveDays + 1} streak bonus
          </Text>
        </View>
        <TouchableOpacity style={rewardStyles.claimButton} onPress={onClaim}>
          <Text style={rewardStyles.claimText}>Claim</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const rewardStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: '#FFD700',
    margin: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFD700' + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  claimText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.background,
  },
});

function RewardClaimedModal({ 
  visible, 
  onClose, 
  reward 
}: { 
  visible: boolean; 
  onClose: () => void; 
  reward: { coins: number; bonus?: string } | null;
}) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      rotateAnim.setValue(0);
    }
  }, [visible, scaleAnim, rotateAnim]);

  if (!reward) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={claimedStyles.overlay}>
        <Animated.View style={[
          claimedStyles.modal,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          <Animated.View style={[
            claimedStyles.iconContainer,
            { transform: [{ rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            }) }] }
          ]}>
            <Star size={48} color="#FFD700" fill="#FFD700" />
          </Animated.View>
          <Text style={claimedStyles.title}>Reward Claimed!</Text>
          <View style={claimedStyles.rewardRow}>
            <Text style={claimedStyles.coins}>+{reward.coins}</Text>
            <Text style={claimedStyles.coinLabel}>🪙</Text>
          </View>
          {reward.bonus === 'free_hint' && (
            <Text style={claimedStyles.bonus}>+1 Free Hint!</Text>
          )}
          <TouchableOpacity style={claimedStyles.button} onPress={onClose}>
            <Text style={claimedStyles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const claimedStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFD700' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  coins: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#FFD700',
  },
  coinLabel: {
    fontSize: 28,
  },
  bonus: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.correct,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, isDarkMode, animationsEnabled } = useScreenTheme('home');
  const {
    puzzleNumber,
    gameStatus,
    guesses,
    stats,
    melody,
    melodyLength,
  } = useGame();
  const { inventory, dailyReward, claimDailyReward } = useUser();
  const { ecoPoints } = useEco();

  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState<{ coins: number; bonus?: string } | null>(null);
  const [hasShownWinConfetti, setHasShownWinConfetti] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const ecoProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!completed) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.log('Error checking onboarding status:', error);
      }
    };
    checkOnboarding();

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
    setShowOnboarding(false);
  };

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (gameStatus === 'won' && !hasShownWinConfetti) {
      setShowConfetti(true);
      setHasShownWinConfetti(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [gameStatus, headerAnim, hasShownWinConfetti]);

  useEffect(() => {
    const ecoProgress = Math.min(ecoPoints / 100, 1);
    Animated.timing(ecoProgressAnim, {
      toValue: ecoProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [ecoPoints, ecoProgressAnim]);

  const handleClaimReward = useCallback(() => {
    const reward = claimDailyReward();
    if (reward) {
      setClaimedReward(reward);
      setShowRewardModal(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [claimDailyReward]);

  const canClaimReward = !dailyReward.claimedToday;

  const handleShare = useCallback(async () => {
    if (gameStatus === 'playing') return;

    const shareText = generateShareText(guesses, puzzleNumber, gameStatus === 'won', melodyLength, stats.currentStreak);

    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await Share.share({ message: shareText });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [gameStatus, guesses, puzzleNumber, melodyLength, stats.currentStreak]);

  const navigateTo = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  }, [router]);

  const gameCompleted = gameStatus !== 'playing';
  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;

  return (
    <ThemedBackground theme={theme} isDark={isDarkMode} animated={animationsEnabled}>
      <Confetti isActive={showConfetti} count={100} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.logoRow}>
            <Text style={styles.logo}>Melodyx</Text>
            <View style={styles.coinsContainer}>
              <Text style={styles.coinsText}>🪙 {inventory.coins}</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Daily Melody Puzzle</Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DailyRewardBanner
            onClaim={handleClaimReward}
            consecutiveDays={dailyReward.consecutiveDays}
            canClaim={canClaimReward}
          />

          <View style={styles.ecoProgressCard}>
            <View style={styles.ecoProgressHeader}>
              <Zap size={16} color="#10B981" />
              <Text style={styles.ecoProgressTitle}>Eco Impact</Text>
              <Text style={styles.ecoProgressPoints}>{ecoPoints} pts</Text>
            </View>
            <View style={styles.ecoProgressBarContainer}>
              <Animated.View 
                style={[
                  styles.ecoProgressBar, 
                  { 
                    width: ecoProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) 
                  }
                ]} 
              />
            </View>
            <Text style={styles.ecoProgressSubtext}>
              {100 - (ecoPoints % 100)} pts to next offset milestone
            </Text>
          </View>

          <View style={styles.dailyCardWrapper}>
          <View style={styles.dailyCardGlow} />
          <View style={styles.dailyCard}>
            <View style={styles.dailyHeader}>
              <View style={styles.dailyTitleRow}>
                <View style={styles.dailyIconContainer}>
                  <Music size={24} color={Colors.accent} />
                </View>
                <View>
                  <Text style={styles.dailyLabel}>TODAY&apos;S CHALLENGE</Text>
                  <Text style={styles.dailyTitle}>Daily #{puzzleNumber}</Text>
                </View>
              </View>
              {gameCompleted ? (
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: gameStatus === 'won' ? Colors.correct + '20' : Colors.absent + '20' }
                ]}>
                  {gameStatus === 'won' ? (
                    <Check size={14} color={Colors.correct} />
                  ) : (
                    <X size={14} color={Colors.textMuted} />
                  )}
                  <Text style={[
                    styles.statusText,
                    { color: gameStatus === 'won' ? Colors.correct : Colors.textMuted }
                  ]}>
                    {gameStatus === 'won' ? 'Solved!' : 'Missed'}
                  </Text>
                </View>
              ) : (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>

            {gameCompleted ? (
              <View style={styles.completedContent}>
                <View style={styles.melodyReveal}>
                  <Text style={styles.melodyEmoji}>{melody.flag || '🎵'}</Text>
                  <View>
                    <Text style={styles.melodyName}>{melody.name}</Text>
                    <Text style={styles.melodyMeta}>{melody.genre} • {melody.era}</Text>
                  </View>
                </View>

                <View style={styles.resultStats}>
                  <View style={styles.resultStatItem}>
                    <Text style={styles.resultStatValue}>{guesses.length}/6</Text>
                    <Text style={styles.resultStatLabel}>Guesses</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultStatItem}>
                    <Text style={styles.resultStatValue}>{stats.currentStreak}🔥</Text>
                    <Text style={styles.resultStatLabel}>Streak</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Share2 size={18} color={Colors.text} />
                  <Text style={styles.shareButtonText}>
                    {copied ? 'Copied!' : 'Share Result'}
                  </Text>
                </TouchableOpacity>

                <CountdownTimer />
              </View>
            ) : (
              <View style={styles.dailyPlaySection}>
                <Text style={styles.dailyDescription}>
                  Guess the {melodyLength}-note melody in 6 tries
                </Text>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => navigateTo('/(tabs)/daily')}
                >
                  <Play size={24} color={Colors.background} fill={Colors.background} />
                  <Text style={styles.playButtonText}>Start Daily Puzzle</Text>
                </TouchableOpacity>
                <View style={styles.dailyHintRow}>
                  <Clock size={12} color={Colors.textMuted} />
                  <Text style={styles.dailyHintText}>New puzzle every day at midnight</Text>
                </View>
              </View>
            )}
          </View>
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              <AnimatedStatCard
                value={stats.currentStreak}
                label="Current Streak"
                icon={<Flame size={20} color="#FF6B35" />}
                color="#FF6B35"
                delay={0}
              />
              <AnimatedStatCard
                value={stats.maxStreak}
                label="Best Streak"
                icon={<Crown size={20} color="#FFD700" />}
                color="#FFD700"
                delay={100}
              />
              <AnimatedStatCard
                value={stats.gamesWon}
                label="Total Wins"
                icon={<Trophy size={20} color={Colors.correct} />}
                color={Colors.correct}
                delay={200}
              />
              <AnimatedStatCard
                value={`${winRate}%`}
                label="Win Rate"
                icon={<Target size={20} color={Colors.accent} />}
                color={Colors.accent}
                delay={300}
              />
            </View>
          </View>

          <View style={styles.modesSection}>
            <Text style={styles.sectionTitle}>Game Modes</Text>
            <View style={styles.modesGrid}>
              <ModeCard
                icon={<Flame size={22} color="#FF6B35" />}
                title="Sound Fever"
                subtitle="Endless chains & multipliers"
                color="#FF6B35"
                onPress={() => navigateTo('/(tabs)/fever')}
                badge="HOT"
              />
              <ModeCard
                icon={<Trophy size={22} color="#FFD700" />}
                title="Tournaments"
                subtitle="Weekly competitions"
                color="#FFD700"
                onPress={() => navigateTo('/(tabs)/tournaments')}
              />
              <ModeCard
                icon={<Map size={22} color={Colors.accent} />}
                title="Melody Quest"
                subtitle="Story adventure campaign"
                color={Colors.accent}
                onPress={() => navigateTo('/(tabs)/campaign')}
              />
              <ModeCard
                icon={<Leaf size={22} color="#10B981" />}
                title="Zen Mode"
                subtitle="Calming puzzles"
                color="#10B981"
                onPress={() => navigateTo('/(tabs)/wellness')}
              />
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigateTo('/(tabs)/stats')}
            >
              <BarChart3 size={20} color={Colors.accent} />
              <Text style={styles.quickActionText}>Statistics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigateTo('/(tabs)/shop')}
            >
              <Sparkles size={20} color="#FFD700" />
              <Text style={styles.quickActionText}>Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigateTo('/(tabs)/eco')}
            >
              <Zap size={20} color="#10B981" />
              <Text style={styles.quickActionText}>{ecoPoints} Eco</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <RewardClaimedModal
          visible={showRewardModal}
          onClose={() => setShowRewardModal(false)}
          reward={claimedReward}
        />

        <OnboardingModal 
          visible={showOnboarding} 
          onComplete={handleOnboardingComplete} 
        />
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  coinsContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  tagline: {
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
  ecoProgressCard: {
    backgroundColor: '#10B981' + '15',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981' + '30',
  },
  ecoProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ecoProgressTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
    flex: 1,
  },
  ecoProgressPoints: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  ecoProgressBarContainer: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  ecoProgressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  ecoProgressSubtext: {
    fontSize: 11,
    color: '#10B981',
    opacity: 0.8,
  },
  dailyCardWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  dailyCardGlow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: Colors.accent,
    borderRadius: 22,
    opacity: 0.15,
  },
  dailyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.accent + '50',
  },
  dailyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dailyLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.accent,
    letterSpacing: 1,
    marginBottom: 2,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dailyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.background,
    letterSpacing: 0.5,
  },
  dailyPlaySection: {
    alignItems: 'center',
  },
  dailyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  dailyHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  dailyHintText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dailyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  playText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  completedContent: {
    alignItems: 'center',
  },
  melodyReveal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
    marginBottom: 16,
  },
  melodyEmoji: {
    fontSize: 32,
  },
  melodyName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  melodyMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultStatItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultStatValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  resultStatLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  resultDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.surfaceLight,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.correct,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  countdownText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  countdownTime: {
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.background,
    letterSpacing: 0.3,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  modesSection: {
    marginBottom: 24,
  },
  modesGrid: {
    gap: 10,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modeSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});

export { DailyRewardBanner, RewardClaimedModal };
