import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundThemeId, BACKGROUND_THEMES } from '@/constants/backgrounds';
import { ParticleField, FloatingNotes, GlowPulse } from '@/components/ParticleEffects';

const { width, height } = Dimensions.get('window');

interface ThemedBackgroundProps {
  theme: BackgroundThemeId;
  isDark?: boolean;
  children: React.ReactNode;
  intensity?: number;
  animated?: boolean;
  showParticles?: boolean;
}

function WavePattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string; glow: string }; animated: boolean }) {
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const wave3Anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wave1Anim, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(wave1Anim, {
            toValue: 0,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(wave2Anim, {
            toValue: 1,
            duration: 4500,
            useNativeDriver: true,
          }),
          Animated.timing(wave2Anim, {
            toValue: 0,
            duration: 4500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(wave3Anim, {
            toValue: 1,
            duration: 5500,
            useNativeDriver: true,
          }),
          Animated.timing(wave3Anim, {
            toValue: 0,
            duration: 5500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.25,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, wave1Anim, wave2Anim, wave3Anim, pulseAnim]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.wave,
          {
            backgroundColor: colors.accent,
            opacity: pulseAnim,
            transform: [
              {
                translateY: wave1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 25],
                }),
              },
              {
                scaleX: wave1Anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.08, 1],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.wave2,
          {
            backgroundColor: colors.secondary,
            opacity: 0.25,
            transform: [
              {
                translateY: wave2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -18],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.wave3,
          {
            backgroundColor: colors.glow,
            opacity: 0.15,
            transform: [
              {
                translateY: wave3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, -12],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

function NotesPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string }; animated: boolean }) {
  const floatAnims = useRef(
    Array.from({ length: 15 }, () => new Animated.Value(0))
  ).current;

  const notePositions = useMemo(() => 
    Array.from({ length: 15 }, () => ({
      left: Math.random() * width,
      top: Math.random() * height,
      size: 14 + Math.random() * 18,
      rotation: Math.random() * 40 - 20,
    })), []);

  useEffect(() => {
    if (!animated) return;

    floatAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500 + index * 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2500 + index * 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [animated, floatAnims]);

  const notes = ['♪', '♫', '♬', '♩', '𝄞', '𝄢'];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {notePositions.map((pos, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.musicNote,
            {
              left: pos.left,
              top: pos.top,
              fontSize: pos.size,
              color: colors.accent,
              opacity: 0.18,
              transform: [
                {
                  translateY: floatAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -25],
                  }),
                },
                { rotate: `${pos.rotation}deg` },
              ],
            },
          ]}
        >
          {notes[index % notes.length]}
        </Animated.Text>
      ))}
    </View>
  );
}

function NebulaPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string; glow: string }; animated: boolean }) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const drift1 = useRef(new Animated.Value(0)).current;
  const drift2 = useRef(new Animated.Value(0)).current;
  const drift3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(drift1, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(drift1, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(drift2, {
            toValue: 1,
            duration: 6500,
            useNativeDriver: true,
          }),
          Animated.timing(drift2, {
            toValue: 0,
            duration: 6500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(drift3, {
            toValue: 1,
            duration: 7000,
            useNativeDriver: true,
          }),
          Animated.timing(drift3, {
            toValue: 0,
            duration: 7000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, glowAnim, drift1, drift2, drift3]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.nebulaOrb,
          {
            backgroundColor: colors.accent,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.12, 0.28],
            }),
            transform: [
              {
                translateX: drift1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-35, 35],
                }),
              },
              {
                translateY: drift1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 25],
                }),
              },
              { scale: 1.6 },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.nebulaOrb2,
          {
            backgroundColor: colors.secondary,
            opacity: 0.18,
            transform: [
              {
                translateX: drift2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [25, -25],
                }),
              },
              {
                translateY: drift2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 12],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.nebulaOrb3,
          {
            backgroundColor: colors.glow,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.08, 0.2],
            }),
            transform: [
              {
                translateX: drift3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, -20],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

function ForestPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string; glow: string }; animated: boolean }) {
  const swayAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, swayAnim, floatAnim]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.leaf,
          {
            backgroundColor: colors.accent,
            opacity: 0.1,
            transform: [
              {
                rotate: swayAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-6deg', '6deg'],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.leaf2,
          {
            backgroundColor: colors.secondary,
            opacity: 0.08,
            transform: [
              {
                rotate: swayAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['4deg', '-4deg'],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.leaf3,
          {
            backgroundColor: colors.glow,
            opacity: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.05, 0.15],
            }),
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

function FlamesPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string; glow: string }; animated: boolean }) {
  const flicker1 = useRef(new Animated.Value(0)).current;
  const flicker2 = useRef(new Animated.Value(0)).current;
  const flicker3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flicker1, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(flicker1, {
            toValue: 0.5,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(flicker1, {
            toValue: 0.85,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(flicker1, {
            toValue: 0.4,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(flicker2, {
            toValue: 0.75,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(flicker2, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(flicker2, {
            toValue: 0.6,
            duration: 140,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(flicker3, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flicker3, {
            toValue: 0.5,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(flicker3, {
            toValue: 0.7,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, flicker1, flicker2, flicker3]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.flame,
          {
            backgroundColor: colors.accent,
            opacity: flicker1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.06, 0.18],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.flame2,
          {
            backgroundColor: colors.glow,
            opacity: flicker2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.04, 0.14],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.flame3,
          {
            backgroundColor: '#FBBF24',
            opacity: flicker3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.03, 0.1],
            }),
          },
        ]}
      />
    </View>
  );
}

function AuroraPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string; glow: string }; animated: boolean }) {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wave1, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(wave1, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(wave2, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(wave2, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmer, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, wave1, wave2, shimmer]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.auroraWave1,
          {
            backgroundColor: colors.accent,
            opacity: shimmer.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.25],
            }),
            transform: [
              {
                translateY: wave1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 20],
                }),
              },
              {
                scaleX: wave1.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.auroraWave2,
          {
            backgroundColor: colors.glow,
            opacity: 0.15,
            transform: [
              {
                translateY: wave2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, -15],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

function OceanPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string; glow: string }; animated: boolean }) {
  const wave = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wave, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bubble, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, wave, bubble]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.oceanWave,
          {
            backgroundColor: colors.accent,
            opacity: wave.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.2],
            }),
            transform: [
              {
                translateY: wave.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 30],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.oceanDeep,
          {
            backgroundColor: colors.glow,
            opacity: bubble.interpolate({
              inputRange: [0, 1],
              outputRange: [0.05, 0.15],
            }),
          },
        ]}
      />
    </View>
  );
}

function CosmicPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string; glow: string }; animated: boolean }) {
  const starTwinkle = useRef(new Animated.Value(0)).current;
  const nebulaGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(starTwinkle, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(starTwinkle, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(nebulaGlow, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(nebulaGlow, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, starTwinkle, nebulaGlow]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.cosmicNebula,
          {
            backgroundColor: colors.accent,
            opacity: nebulaGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0.08, 0.2],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.cosmicNebula2,
          {
            backgroundColor: colors.glow,
            opacity: starTwinkle.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.25],
            }),
          },
        ]}
      />
    </View>
  );
}

function GridPattern({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.gridOverlay, { borderColor: colors.accent }]} />
      <View style={[styles.gridLine1, { backgroundColor: colors.accent }]} />
      <View style={[styles.gridLine2, { backgroundColor: colors.accent }]} />
    </View>
  );
}

export default function ThemedBackground({
  theme,
  isDark = true,
  children,
  intensity = 1,
  animated = true,
  showParticles = true,
}: ThemedBackgroundProps) {
  const themeConfig = BACKGROUND_THEMES[theme];
  const colors = isDark ? themeConfig.colors.dark : themeConfig.colors.light;

  const shouldAnimate = animated && Platform.OS !== 'web';

  const renderPattern = () => {
    switch (themeConfig.pattern) {
      case 'waves':
        return <WavePattern colors={colors} animated={shouldAnimate} />;
      case 'notes':
        return <NotesPattern colors={colors} animated={shouldAnimate} />;
      case 'nebula':
        return <NebulaPattern colors={colors} animated={shouldAnimate} />;
      case 'forest':
        return <ForestPattern colors={colors} animated={shouldAnimate} />;
      case 'flames':
        return <FlamesPattern colors={colors} animated={shouldAnimate} />;
      case 'aurora':
        return <AuroraPattern colors={colors} animated={shouldAnimate} />;
      case 'ocean':
        return <OceanPattern colors={colors} animated={shouldAnimate} />;
      case 'cosmic':
        return <CosmicPattern colors={colors} animated={shouldAnimate} />;
      case 'grid':
        return <GridPattern colors={colors} />;
      case 'solid':
      default:
        return null;
    }
  };

  const particleColors = [colors.particle, colors.accent];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
      />
      <View style={[StyleSheet.absoluteFill, { opacity: intensity }]}>
        {renderPattern()}
      </View>
      {showParticles && shouldAnimate && themeConfig.hasGlow && (
        <GlowPulse color={colors.glow} intensity={intensity * 0.8} />
      )}
      {showParticles && shouldAnimate && (
        <>
          <ParticleField 
            type={themeConfig.particleType} 
            colors={particleColors} 
            count={12} 
            intensity={intensity * 0.7} 
          />
          {themeConfig.pattern === 'notes' && (
            <FloatingNotes colors={particleColors} count={6} />
          )}
        </>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: -60,
    right: -60,
    height: 180,
    borderTopLeftRadius: 500,
    borderTopRightRadius: 500,
  },
  wave2: {
    position: 'absolute',
    bottom: -60,
    left: -100,
    right: -100,
    height: 220,
    borderTopLeftRadius: 600,
    borderTopRightRadius: 600,
  },
  wave3: {
    position: 'absolute',
    bottom: -30,
    left: -80,
    right: -80,
    height: 150,
    borderTopLeftRadius: 400,
    borderTopRightRadius: 400,
  },
  musicNote: {
    position: 'absolute',
    fontWeight: '300' as const,
  },
  nebulaOrb: {
    position: 'absolute',
    top: '15%',
    left: '5%',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  nebulaOrb2: {
    position: 'absolute',
    bottom: '25%',
    right: '0%',
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  nebulaOrb3: {
    position: 'absolute',
    top: '50%',
    left: '30%',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  leaf: {
    position: 'absolute',
    top: -120,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    transform: [{ rotate: '45deg' }],
  },
  leaf2: {
    position: 'absolute',
    bottom: -100,
    left: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
    transform: [{ rotate: '-30deg' }],
  },
  leaf3: {
    position: 'absolute',
    top: '40%',
    right: '10%',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  flame: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
  },
  flame2: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: '35%',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  flame3: {
    position: 'absolute',
    bottom: 0,
    left: '30%',
    right: '30%',
    height: '25%',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
  auroraWave1: {
    position: 'absolute',
    top: '10%',
    left: -50,
    right: -50,
    height: 150,
    borderRadius: 75,
  },
  auroraWave2: {
    position: 'absolute',
    top: '30%',
    left: -30,
    right: -30,
    height: 100,
    borderRadius: 50,
  },
  oceanWave: {
    position: 'absolute',
    bottom: 0,
    left: -50,
    right: -50,
    height: 200,
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
  },
  oceanDeep: {
    position: 'absolute',
    bottom: '20%',
    left: '10%',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  cosmicNebula: {
    position: 'absolute',
    top: '20%',
    left: '5%',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  cosmicNebula2: {
    position: 'absolute',
    bottom: '30%',
    right: '10%',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  gridOverlay: {
    flex: 1,
    borderWidth: 0.5,
    opacity: 0.12,
  },
  gridLine1: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.1,
  },
  gridLine2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    opacity: 0.1,
  },
});
