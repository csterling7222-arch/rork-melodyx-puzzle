import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { 
  Music, 
  Target, 
  Lightbulb, 
  Share2, 
  ChevronRight,
  ChevronLeft,
  Volume2,
  Flame,
  Crown,
  Sparkles,
  Check,
  Gift,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { usePurchases } from '@/contexts/PurchasesContext';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}

interface SlideProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  example?: React.ReactNode;
  isPremiumSlide?: boolean;
}

const exampleStyles = StyleSheet.create({
  keyboard: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  key: {
    width: 44,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: 14,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cell: {
    width: 48,
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: 16,
  },
  shareExample: {
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  shareText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginVertical: 2,
  },
  premiumContainer: {
    marginTop: 16,
    width: '100%',
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  premiumFeatureText: {
    color: Colors.text,
    fontSize: 14,
  },
  trialBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'center',
  },
  trialBadgeText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700' as const,
  },
});

function Slide({ icon, title, description, example }: SlideProps) {
  return (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {example}
    </View>
  );
}

function PremiumSlide({ onStartTrial, hasUsedTrial }: { onStartTrial: () => void; hasUsedTrial: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.premiumIconContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Crown size={56} color="#FFD700" />
        <View style={styles.sparkleOverlay}>
          <Sparkles size={20} color="#FFD700" />
        </View>
      </Animated.View>
      <Text style={styles.premiumTitle}>Unlock Your Full Potential</Text>
      <Text style={styles.premiumSubtitle}>
        {hasUsedTrial 
          ? 'Subscribe to access all premium features'
          : 'Start your 7-day free trial today!'
        }
      </Text>
      
      <View style={exampleStyles.premiumContainer}>
        {[
          'All 5 instruments unlocked',
          'Unlimited practice mode',
          'Ad-free experience',
          'Exclusive keyboard skins',
          'Advanced learning lessons',
          'Priority support',
        ].map((feature, index) => (
          <View key={index} style={exampleStyles.premiumFeature}>
            <Check size={18} color={Colors.correct} />
            <Text style={exampleStyles.premiumFeatureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {!hasUsedTrial && (
        <TouchableOpacity style={styles.trialButton} onPress={onStartTrial}>
          <Gift size={20} color="#000" />
          <Text style={styles.trialButtonText}>Start 7-Day Free Trial</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.trialNote}>
        {hasUsedTrial 
          ? 'Then $4.99/month or $39.99/year'
          : 'No charge until trial ends. Cancel anytime.'
        }
      </Text>
    </View>
  );
}

function Dots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { startFreeTrial, hasUsedTrial, isPremium } = usePurchases();

  const SLIDES: SlideProps[] = [
    {
      icon: <Music size={56} color={Colors.accent} />,
      title: 'Welcome to Melodyx!',
      description: 'Guess the daily melody note-by-note. Each day brings a new musical puzzle to solve.',
      color: Colors.accent,
    },
    {
      icon: <Target size={56} color={Colors.correct} />,
      title: 'How to Play',
      description: 'Tap piano keys to build your guess. You have 6 attempts to find the hidden melody.',
      color: Colors.correct,
      example: (
        <View style={exampleStyles.keyboard}>
          {['C', 'D', 'E', 'F', 'G'].map((note, i) => (
            <View key={note} style={[exampleStyles.key, { backgroundColor: ['#EF4444', '#F97316', '#FBBF24', '#22C55E', '#06B6D4'][i] }]}>
              <Text style={exampleStyles.keyText}>{note}</Text>
            </View>
          ))}
        </View>
      ),
    },
    {
      icon: <Lightbulb size={56} color={Colors.present} />,
      title: 'Color Feedback',
      description: 'Green = correct position\nYellow = right note, wrong spot\nGray = not in melody',
      color: Colors.present,
      example: (
        <View style={exampleStyles.feedbackRow}>
          <View style={[exampleStyles.cell, { backgroundColor: Colors.correct }]}>
            <Text style={exampleStyles.cellText}>C</Text>
          </View>
          <View style={[exampleStyles.cell, { backgroundColor: Colors.present }]}>
            <Text style={exampleStyles.cellText}>E</Text>
          </View>
          <View style={[exampleStyles.cell, { backgroundColor: Colors.absent }]}>
            <Text style={exampleStyles.cellText}>G</Text>
          </View>
        </View>
      ),
    },
    {
      icon: <Volume2 size={56} color="#06B6D4" />,
      title: 'Listen & Learn',
      description: 'Tap keys to hear notes. Use audio hints after 2 guesses to hear the first 3 notes!',
      color: '#06B6D4',
    },
    {
      icon: <Flame size={56} color="#FF6B35" />,
      title: 'Modes & Streaks',
      description: 'Play daily puzzles to build streaks, or try Fever Mode for endless melody challenges!',
      color: '#FF6B35',
    },
    {
      icon: <Share2 size={56} color={Colors.correct} />,
      title: 'Share Your Results',
      description: 'Share your emoji grid with friends and challenge them to beat your score!',
      color: Colors.correct,
      example: (
        <View style={exampleStyles.shareExample}>
          <Text style={exampleStyles.shareText}>🟩🟨⬛🟩🟩🟩</Text>
          <Text style={exampleStyles.shareText}>Melodyx 2/6 🎵</Text>
        </View>
      ),
    },
  ];

  const TOTAL_SLIDES = isPremium ? SLIDES.length : SLIDES.length + 1;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
    }
  }, [visible, slideAnim, fadeAnim]);

  const animateToSlide = (newIndex: number) => {
    const direction = newIndex > currentIndex ? -1 : 1;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction * 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex(newIndex);
      slideAnim.setValue(-direction * 50);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (currentIndex < TOTAL_SLIDES - 1) {
      animateToSlide(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (currentIndex > 0) {
      animateToSlide(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onComplete();
  };

  const handleStartTrial = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const success = startFreeTrial();
    if (success) {
      onComplete();
    }
  };

  const isLastSlide = currentIndex === TOTAL_SLIDES - 1;
  const isFirstSlide = currentIndex === 0;
  const isPremiumSlide = !isPremium && currentIndex === SLIDES.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onComplete}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, isPremiumSlide && styles.premiumModal]}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.slideContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {isPremiumSlide ? (
              <PremiumSlide onStartTrial={handleStartTrial} hasUsedTrial={hasUsedTrial} />
            ) : (
              <Slide {...SLIDES[currentIndex]} />
            )}
          </Animated.View>

          <Dots count={TOTAL_SLIDES} activeIndex={currentIndex} />

          <View style={styles.buttonRow}>
            {!isFirstSlide && (
              <TouchableOpacity style={styles.navButton} onPress={handlePrev}>
                <ChevronLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.nextButton, 
                isLastSlide && styles.startButton,
                isPremiumSlide && !hasUsedTrial && styles.skipTrialButton,
              ]}
              onPress={handleNext}
            >
              <Text style={[
                styles.nextButtonText,
                isPremiumSlide && !hasUsedTrial && styles.skipTrialButtonText,
              ]}>
                {isLastSlide ? "Let's Play!" : isPremiumSlide ? 'Maybe Later' : 'Next'}
              </Text>
              {!isLastSlide && !isPremiumSlide && <ChevronRight size={20} color={Colors.background} />}
            </TouchableOpacity>

            {!isFirstSlide && <View style={styles.navButtonPlaceholder} />}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  premiumModal: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  slideContainer: {
    width: '100%',
    minHeight: 320,
  },
  slide: {
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD700' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  sparkleOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  trialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 20,
    width: '100%',
  },
  trialButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  trialNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonPlaceholder: {
    width: 48,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 4,
    flex: 1,
    maxWidth: 200,
  },
  startButton: {
    backgroundColor: Colors.correct,
  },
  skipTrialButton: {
    backgroundColor: Colors.surfaceLight,
  },
  nextButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  skipTrialButtonText: {
    color: Colors.text,
  },
});
