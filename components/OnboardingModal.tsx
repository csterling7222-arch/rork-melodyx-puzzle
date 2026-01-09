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
  Flame
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

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
});

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
    
    if (currentIndex < SLIDES.length - 1) {
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

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const isFirstSlide = currentIndex === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onComplete}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
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
            <Slide {...SLIDES[currentIndex]} />
          </Animated.View>

          <Dots count={SLIDES.length} activeIndex={currentIndex} />

          <View style={styles.buttonRow}>
            {!isFirstSlide && (
              <TouchableOpacity style={styles.navButton} onPress={handlePrev}>
                <ChevronLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.nextButton, isLastSlide && styles.startButton]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {isLastSlide ? "Let's Play!" : 'Next'}
              </Text>
              {!isLastSlide && <ChevronRight size={20} color={Colors.background} />}
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
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
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
  nextButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
