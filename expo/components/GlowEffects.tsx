import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

interface InstrumentGlowProps {
  instrument: 'piano' | 'guitar' | 'bass' | 'drums' | 'keyboard';
  isActive: boolean;
  isPremium?: boolean;
  intensity?: number;
}

const INSTRUMENT_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  piano: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  guitar: {
    primary: '#F97316',
    secondary: '#FB923C',
    glow: 'rgba(249, 115, 22, 0.4)',
  },
  bass: {
    primary: '#06B6D4',
    secondary: '#22D3EE',
    glow: 'rgba(6, 182, 212, 0.4)',
  },
  drums: {
    primary: '#EF4444',
    secondary: '#F87171',
    glow: 'rgba(239, 68, 68, 0.4)',
  },
  keyboard: {
    primary: '#10B981',
    secondary: '#34D399',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
};

export function InstrumentGlow({ instrument, isActive, isPremium = false, intensity = 1 }: InstrumentGlowProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const colors = INSTRUMENT_COLORS[instrument] || INSTRUMENT_COLORS.piano;

  useEffect(() => {
    if (!isActive || Platform.OS === 'web') return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    return () => {
      pulseAnim.setValue(0);
      glowAnim.setValue(0);
    };
  }, [isActive, pulseAnim, glowAnim]);

  if (!isActive || Platform.OS === 'web') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.outerGlow,
          {
            backgroundColor: colors.glow,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1 * intensity, 0.35 * intensity],
            }),
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, isPremium ? 1.15 : 1.08],
                }),
              },
            ],
          },
        ]}
      />
      {isPremium && (
        <>
          <Animated.View
            style={[
              styles.innerGlow,
              {
                backgroundColor: colors.primary,
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 0.4],
                }),
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1.05],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkleRing,
              {
                borderColor: colors.secondary,
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.6],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1.1],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}
    </View>
  );
}

interface NoteHitGlowProps {
  color: string;
  isActive: boolean;
  x?: number;
  y?: number;
}

export function NoteHitGlow({ color, isActive, x = 0, y = 0 }: NoteHitGlowProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive || Platform.OS === 'web') return;

    scaleAnim.setValue(0);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [isActive, scaleAnim, opacityAnim]);

  if (Platform.OS === 'web') return null;

  return (
    <Animated.View
      style={[
        styles.noteHitGlow,
        {
          left: x - 30,
          top: y - 30,
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [
            {
              scale: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1.5],
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
    />
  );
}

interface FeverGlowProps {
  isActive: boolean;
  multiplier?: number;
}

export function FeverGlow({ isActive, multiplier = 1 }: FeverGlowProps) {
  const borderPulse = useRef(new Animated.Value(0)).current;
  const intensityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive || Platform.OS === 'web') return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(borderPulse, {
            toValue: 1,
            duration: 400 / Math.min(multiplier, 3),
            useNativeDriver: true,
          }),
          Animated.timing(borderPulse, {
            toValue: 0,
            duration: 400 / Math.min(multiplier, 3),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(intensityAnim, {
            toValue: 1,
            duration: 600 / Math.min(multiplier, 3),
            useNativeDriver: true,
          }),
          Animated.timing(intensityAnim, {
            toValue: 0.5,
            duration: 600 / Math.min(multiplier, 3),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    return () => {
      borderPulse.setValue(0);
      intensityAnim.setValue(0);
    };
  }, [isActive, multiplier, borderPulse, intensityAnim]);

  if (!isActive || Platform.OS === 'web') return null;

  const baseIntensity = Math.min(multiplier * 0.15, 0.6);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.feverBorderTop,
          {
            opacity: intensityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [baseIntensity * 0.5, baseIntensity],
            }),
            transform: [
              {
                scaleX: borderPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.02],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.feverBorderBottom,
          {
            opacity: intensityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [baseIntensity * 0.5, baseIntensity],
            }),
            transform: [
              {
                scaleX: borderPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.02],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.feverCornerTL,
          {
            opacity: intensityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [baseIntensity * 0.3, baseIntensity * 0.8],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.feverCornerTR,
          {
            opacity: intensityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [baseIntensity * 0.3, baseIntensity * 0.8],
            }),
          },
        ]}
      />
    </View>
  );
}

interface SuccessGlowProps {
  isActive: boolean;
  color?: string;
}

export function SuccessGlow({ isActive, color = '#22C55E' }: SuccessGlowProps) {
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive || Platform.OS === 'web') return;

    expandAnim.setValue(0);

    Animated.sequence([
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, expandAnim]);

  if (!isActive || Platform.OS === 'web') return null;

  return (
    <Animated.View
      style={[
        styles.successGlow,
        {
          backgroundColor: color,
          opacity: expandAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.4, 0],
          }),
          transform: [
            {
              scale: expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.5],
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  outerGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 30,
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  sparkleRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 25,
    borderWidth: 2,
  },
  noteHitGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  feverBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF6B35',
  },
  feverBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF6B35',
  },
  feverCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderTopLeftRadius: 30,
    backgroundColor: '#FF6B35',
  },
  feverCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderTopRightRadius: 30,
    backgroundColor: '#FF6B35',
  },
  successGlow: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    height: 200,
    borderRadius: 100,
  },
});

export default {
  InstrumentGlow,
  NoteHitGlow,
  FeverGlow,
  SuccessGlow,
};
