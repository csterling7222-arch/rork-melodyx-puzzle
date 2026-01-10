import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleProps {
  delay: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
  duration: number;
  type: 'float' | 'pulse' | 'sparkle' | 'orbit';
}

function Particle({ delay, startX, startY, color, size, duration, type }: ParticleProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    if (type === 'float') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: -30 - Math.random() * 20,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(opacity, {
                  toValue: 0.6,
                  duration: duration * 0.3,
                  useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                  toValue: 0,
                  duration: duration * 0.7,
                  useNativeDriver: true,
                }),
              ]),
            ]),
            Animated.timing(translateY, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        )
      );
    } else if (type === 'pulse') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.sequence([
                Animated.timing(scale, {
                  toValue: 1.5,
                  duration: duration * 0.5,
                  useNativeDriver: true,
                }),
                Animated.timing(scale, {
                  toValue: 0.5,
                  duration: duration * 0.5,
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.timing(opacity, {
                  toValue: 0.8,
                  duration: duration * 0.3,
                  useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                  toValue: 0.2,
                  duration: duration * 0.7,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ])
        )
      );
    } else if (type === 'sparkle') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.sequence([
                Animated.timing(opacity, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.timing(scale, {
                  toValue: 1.2,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(scale, {
                  toValue: 0.3,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]),
            ]),
            Animated.delay(duration - 300),
          ])
        )
      );
    } else if (type === 'orbit') {
      const radius = 15;
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: radius,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0.5,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: radius,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: 0,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: -radius,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                toValue: 0,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: -radius,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: 0,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0.2,
                duration: duration * 0.25,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(translateY, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        )
      );
    }

    Animated.parallel(animations).start();
  }, [delay, duration, type, translateY, translateX, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    />
  );
}

interface MusicNoteParticleProps {
  delay: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
}

function MusicNoteParticle({ delay, startX, startY, color, size }: MusicNoteParticleProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const note = useMemo(() => {
    const noteSymbols = ['♪', '♫', '♬', '♩', '𝄞'];
    return noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -60,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.4,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [delay, translateY, opacity, rotate]);

  return (
    <Animated.Text
      style={[
        styles.musicNote,
        {
          left: startX,
          top: startY,
          fontSize: size,
          color,
          opacity,
          transform: [
            { translateY },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['-15deg', '15deg'],
              }),
            },
          ],
        },
      ]}
    >
      {note}
    </Animated.Text>
  );
}

interface SoundWaveProps {
  color: string;
  intensity?: number;
}

export function SoundWaveEffect({ color, intensity = 1 }: SoundWaveProps) {
  const waves = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    waves.forEach((wave, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(wave, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [waves]);

  if (Platform.OS === 'web') return null;

  return (
    <View style={styles.waveContainer} pointerEvents="none">
      {waves.map((wave, index) => (
        <Animated.View
          key={index}
          style={[
            styles.soundWave,
            {
              backgroundColor: color,
              opacity: wave.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1 * intensity, 0.3 * intensity],
              }),
              transform: [
                {
                  scaleY: wave.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.2],
                  }),
                },
              ],
              left: `${15 + index * 17}%`,
            },
          ]}
        />
      ))}
    </View>
  );
}

interface ParticleFieldProps {
  type: 'ambient' | 'fever' | 'zen' | 'eco' | 'celebration';
  colors: string[];
  count?: number;
  intensity?: number;
}

export function ParticleField({ type, colors, count = 20, intensity = 1 }: ParticleFieldProps) {
  const particles = useMemo(() => {
    const particleTypes: ('float' | 'pulse' | 'sparkle' | 'orbit')[] = 
      type === 'fever' ? ['sparkle', 'pulse'] :
      type === 'zen' ? ['float', 'orbit'] :
      type === 'eco' ? ['float'] :
      type === 'celebration' ? ['sparkle', 'pulse', 'float'] :
      ['float', 'pulse'];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: Math.random() * 2000,
      startX: Math.random() * SCREEN_WIDTH,
      startY: Math.random() * SCREEN_HEIGHT,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: (4 + Math.random() * 6) * intensity,
      duration: 2000 + Math.random() * 3000,
      type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
    }));
  }, [type, colors, count, intensity]);

  if (Platform.OS === 'web') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => (
        <Particle
          key={p.id}
          delay={p.delay}
          startX={p.startX}
          startY={p.startY}
          color={p.color}
          size={p.size}
          duration={p.duration}
          type={p.type}
        />
      ))}
    </View>
  );
}

interface FloatingNotesProps {
  colors: string[];
  count?: number;
}

export function FloatingNotes({ colors, count = 8 }: FloatingNotesProps) {
  const notes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: Math.random() * 4000,
      startX: Math.random() * SCREEN_WIDTH,
      startY: SCREEN_HEIGHT * 0.3 + Math.random() * SCREEN_HEIGHT * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 16 + Math.random() * 12,
    }));
  }, [colors, count]);

  if (Platform.OS === 'web') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {notes.map(n => (
        <MusicNoteParticle
          key={n.id}
          delay={n.delay}
          startX={n.startX}
          startY={n.startY}
          color={n.color}
          size={n.size}
        />
      ))}
    </View>
  );
}

interface GlowPulseProps {
  color: string;
  size?: number;
  intensity?: number;
}

export function GlowPulse({ color, size = 200, intensity = 1 }: GlowPulseProps) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.25 * intensity,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.1 * intensity,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [scale, opacity, intensity]);

  if (Platform.OS === 'web') return null;

  return (
    <Animated.View
      style={[
        styles.glowPulse,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
  musicNote: {
    position: 'absolute',
    fontWeight: '300' as const,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  soundWave: {
    position: 'absolute',
    width: 6,
    height: 60,
    borderRadius: 3,
    bottom: 20,
  },
  glowPulse: {
    position: 'absolute',
    top: '10%',
    alignSelf: 'center',
  },
});

export default {
  ParticleField,
  FloatingNotes,
  SoundWaveEffect,
  GlowPulse,
};
