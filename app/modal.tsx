import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Music,
  Trophy,
  Flame,
  GraduationCap,
  Leaf,
  Star,
  Heart,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay: number;
}

function FeatureItem({ icon, title, description, color, delay }: FeatureItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);
    animation.start();

    return () => animation.stop();
  }, [delay, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.featureItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.featureIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
}

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => router.back());
  };

  const handleLinkPress = (url: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  };

  const features = [
    {
      icon: <Music size={22} color={Colors.accent} />,
      title: 'Daily Puzzles',
      description: 'Guess iconic melodies note by note with new challenges every day',
      color: Colors.accent,
    },
    {
      icon: <Flame size={22} color="#FF6B35" />,
      title: 'Sound Fever',
      description: 'Endless mode with combos, multipliers, and boss battles',
      color: '#FF6B35',
    },
    {
      icon: <Trophy size={22} color="#FFD700" />,
      title: 'Tournaments',
      description: 'Compete weekly against players worldwide for glory',
      color: '#FFD700',
    },
    {
      icon: <GraduationCap size={22} color={Colors.learning} />,
      title: 'Learning Mode',
      description: 'AI-powered lessons to improve your musical ear',
      color: Colors.learning,
    },
    {
      icon: <Leaf size={22} color="#10B981" />,
      title: 'Eco Impact',
      description: 'Play games and contribute to carbon offset initiatives',
      color: '#10B981',
    },
  ];

  return (
    <Pressable style={styles.overlay} onPress={handleClose}>
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.header}>
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pvwohus8v3p9gw2jrhjcb' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.title}>Melodyx</Text>
              <Text style={styles.subtitle}>Daily Melody Puzzle & Music Learning</Text>
              <Text style={styles.version}>Version 1.0.0</Text>
            </View>

            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.sectionTitle}>Features</Text>
              {features.map((feature, index) => (
                <FeatureItem
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  color={feature.color}
                  delay={index * 100}
                />
              ))}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>How to Play</Text>
              <View style={styles.howToPlay}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Listen to the melody hint</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Tap piano keys to guess notes</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Use color feedback to refine guesses</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={styles.stepText}>Solve in 6 tries to win!</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Feedback Legend</Text>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: Colors.correct }]} />
                  <Text style={styles.legendText}>Correct note & position</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: Colors.present }]} />
                  <Text style={styles.legendText}>Correct note, wrong position</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: Colors.absent }]} />
                  <Text style={styles.legendText}>Note not in melody</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.linksSection}>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => handleLinkPress('https://melodyx.app/privacy')}
                >
                  <Text style={styles.linkText}>Privacy Policy</Text>
                  <ExternalLink size={14} color={Colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => handleLinkPress('https://melodyx.app/terms')}
                >
                  <Text style={styles.linkText}>Terms of Service</Text>
                  <ExternalLink size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <View style={styles.madeWith}>
                  <Text style={styles.madeWithText}>Made with</Text>
                  <Heart size={14} color="#EF4444" fill="#EF4444" />
                  <Text style={styles.madeWithText}>for music lovers</Text>
                </View>
                <Text style={styles.copyright}>© 2024 Melodyx. All rights reserved.</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.primaryButton} onPress={handleClose}>
              <Star size={18} color={Colors.background} />
              <Text style={styles.primaryButtonText}>Start Playing</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Animated.View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '92%',
    maxWidth: 420,
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 16,
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
    textAlign: 'center' as const,
  },
  version: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceLight,
    marginVertical: 16,
  },
  howToPlay: {
    gap: 10,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  stepText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  linksSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 8,
  },
  madeWith: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  madeWithText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  copyright: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
    opacity: 0.7,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
});
