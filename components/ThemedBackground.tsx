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

const { width, height } = Dimensions.get('window');

interface ThemedBackgroundProps {
  theme: BackgroundThemeId;
  isDark?: boolean;
  children: React.ReactNode;
  intensity?: number;
  animated?: boolean;
}

function WavePattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string }; animated: boolean }) {
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wave1Anim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(wave1Anim, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(wave2Anim, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(wave2Anim, {
            toValue: 0,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, wave1Anim, wave2Anim, pulseAnim]);

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
                  outputRange: [0, 20],
                }),
              },
              {
                scaleX: wave1Anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.05, 1],
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
            opacity: 0.2,
            transform: [
              {
                translateY: wave2Anim.interpolate({
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

function NotesPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string }; animated: boolean }) {
  const floatAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  ).current;

  const notePositions = useMemo(() => 
    Array.from({ length: 12 }, () => ({
      left: Math.random() * width,
      top: Math.random() * height,
      size: 12 + Math.random() * 16,
      rotation: Math.random() * 30 - 15,
    })), []);

  useEffect(() => {
    if (!animated) return;

    floatAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [animated, floatAnims]);

  const notes = ['♪', '♫', '♬', '♩'];

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
              opacity: 0.15,
              transform: [
                {
                  translateY: floatAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
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

function NebulaPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string }; animated: boolean }) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const drift1 = useRef(new Animated.Value(0)).current;
  const drift2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(drift1, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
          }),
          Animated.timing(drift1, {
            toValue: 0,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(drift2, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(drift2, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, glowAnim, drift1, drift2]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.nebulaOrb,
          {
            backgroundColor: colors.accent,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.25],
            }),
            transform: [
              {
                translateX: drift1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 30],
                }),
              },
              {
                translateY: drift1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                }),
              },
              { scale: 1.5 },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.nebulaOrb2,
          {
            backgroundColor: colors.secondary,
            opacity: 0.15,
            transform: [
              {
                translateX: drift2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, -20],
                }),
              },
              {
                translateY: drift2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 10],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

function ForestPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string }; animated: boolean }) {
  const swayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animated, swayAnim]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.leaf,
          {
            backgroundColor: colors.accent,
            opacity: 0.08,
            transform: [
              {
                rotate: swayAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-5deg', '5deg'],
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
            opacity: 0.06,
            transform: [
              {
                rotate: swayAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['3deg', '-3deg'],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

function FlamesPattern({ colors, animated }: { colors: { primary: string; secondary: string; accent: string }; animated: boolean }) {
  const flicker1 = useRef(new Animated.Value(0)).current;
  const flicker2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flicker1, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flicker1, {
            toValue: 0.6,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(flicker1, {
            toValue: 0.9,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(flicker1, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(flicker2, {
            toValue: 0.8,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(flicker2, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flicker2, {
            toValue: 0.7,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [animated, flicker1, flicker2]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.flame,
          {
            backgroundColor: colors.accent,
            opacity: flicker1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.05, 0.15],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.flame2,
          {
            backgroundColor: '#FBBF24',
            opacity: flicker2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.03, 0.1],
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
    </View>
  );
}

export default function ThemedBackground({
  theme,
  isDark = true,
  children,
  intensity = 1,
  animated = true,
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
      case 'grid':
        return <GridPattern colors={colors} />;
      case 'solid':
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      <View style={[StyleSheet.absoluteFill, { opacity: intensity }]}>
        {renderPattern()}
      </View>
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
    left: -50,
    right: -50,
    height: 200,
    borderTopLeftRadius: 500,
    borderTopRightRadius: 500,
  },
  wave2: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    right: -100,
    height: 250,
    borderTopLeftRadius: 600,
    borderTopRightRadius: 600,
  },
  musicNote: {
    position: 'absolute',
    fontWeight: '300' as const,
  },
  nebulaOrb: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  nebulaOrb2: {
    position: 'absolute',
    bottom: '30%',
    right: '5%',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  leaf: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    transform: [{ rotate: '45deg' }],
  },
  leaf2: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    transform: [{ rotate: '-30deg' }],
  },
  flame: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  flame2: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: '30%',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
  gridOverlay: {
    flex: 1,
    borderWidth: 0.5,
    opacity: 0.1,
  },
});
