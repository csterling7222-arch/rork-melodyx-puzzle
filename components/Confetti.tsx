import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Colors } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ConfettiShape = 'square' | 'circle' | 'star' | 'note' | 'ribbon';

interface ConfettiPieceProps {
  delay: number;
  startX: number;
  color: string;
  shape: ConfettiShape;
  size: number;
}

function ConfettiPiece({ delay, startX, color, shape, size }: ConfettiPieceProps) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const rotateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 120;
    const fallDuration = 2200 + Math.random() * 1200;
    
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 80,
          duration: fallDuration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX + drift,
          duration: fallDuration,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: 400 + Math.random() * 400,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateX, {
              toValue: 1,
              duration: 300 + Math.random() * 300,
              useNativeDriver: true,
            }),
            Animated.timing(rotateX, {
              toValue: 0,
              duration: 300 + Math.random() * 300,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.sequence([
          Animated.delay(fallDuration - 800),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [delay, startX, translateY, translateX, rotate, rotateX, opacity, scale]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateXInterpolate = rotateX.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const renderShape = () => {
    const baseStyle = {
      width: size,
      height: size,
      backgroundColor: color,
    };

    switch (shape) {
      case 'circle':
        return <View style={[baseStyle, { borderRadius: size / 2 }]} />;
      case 'star':
        return (
          <View style={[baseStyle, styles.star]}>
            <View style={[styles.starInner, { backgroundColor: color }]} />
          </View>
        );
      case 'note':
        return (
          <Animated.Text style={[styles.noteText, { color, fontSize: size * 1.5 }]}>
            ♪
          </Animated.Text>
        );
      case 'ribbon':
        return (
          <View style={[{ width: size * 0.4, height: size * 1.8, backgroundColor: color, borderRadius: size * 0.2 }]} />
        );
      case 'square':
      default:
        return <View style={[baseStyle, { borderRadius: 2 }]} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
            { rotateX: rotateXInterpolate },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      {renderShape()}
    </Animated.View>
  );
}

interface SparkleProps {
  delay: number;
  x: number;
  y: number;
  color: string;
}

function Sparkle({ delay, x, y, color }: SparkleProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [delay, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          left: x,
          top: y,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

interface ConfettiProps {
  isActive: boolean;
  count?: number;
  type?: 'standard' | 'celebration' | 'musical' | 'sparkle';
  colors?: string[];
}

const DEFAULT_COLORS = [
  Colors.correct,
  Colors.present,
  Colors.accent,
  '#FF6B35',
  '#3B82F6',
  '#EC4899',
  '#10B981',
  '#F59E0B',
];

const MUSICAL_COLORS = [
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#22C55E',
];

export default function Confetti({ 
  isActive, 
  count = 60, 
  type = 'standard',
  colors = DEFAULT_COLORS,
}: ConfettiProps) {
  const pieces = useMemo(() => {
    const shapes: ConfettiShape[] = 
      type === 'musical' ? ['note', 'circle', 'star'] :
      type === 'celebration' ? ['square', 'circle', 'star', 'ribbon'] :
      type === 'sparkle' ? ['circle'] :
      ['square', 'circle', 'ribbon'];

    const usedColors = type === 'musical' ? MUSICAL_COLORS : colors;

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: Math.random() * 600,
      startX: Math.random() * SCREEN_WIDTH,
      color: usedColors[Math.floor(Math.random() * usedColors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: 8 + Math.random() * 8,
    }));
  }, [count, type, colors]);

  const sparkles = useMemo(() => {
    if (type !== 'sparkle' && type !== 'celebration') return [];
    
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      delay: Math.random() * 1000,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT * 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [type, colors]);

  if (!isActive) return null;
  if (Platform.OS === 'web') return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map(piece => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          startX={piece.startX}
          color={piece.color}
          shape={piece.shape}
          size={piece.size}
        />
      ))}
      {sparkles.map(sparkle => (
        <Sparkle
          key={`sparkle-${sparkle.id}`}
          delay={sparkle.delay}
          x={sparkle.x}
          y={sparkle.y}
          color={sparkle.color}
        />
      ))}
    </View>
  );
}

interface BurstConfettiProps {
  isActive: boolean;
  originX?: number;
  originY?: number;
  count?: number;
  colors?: string[];
}

export function BurstConfetti({
  isActive,
  originX = SCREEN_WIDTH / 2,
  originY = SCREEN_HEIGHT / 2,
  count = 40,
  colors = DEFAULT_COLORS,
}: BurstConfettiProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const velocity = 150 + Math.random() * 100;
      return {
        id: i,
        angle,
        velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 6,
      };
    });
  }, [count, colors]);

  if (!isActive) return null;
  if (Platform.OS === 'web') return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map(particle => (
        <BurstParticle
          key={particle.id}
          originX={originX}
          originY={originY}
          angle={particle.angle}
          velocity={particle.velocity}
          color={particle.color}
          size={particle.size}
        />
      ))}
    </View>
  );
}

interface BurstParticleProps {
  originX: number;
  originY: number;
  angle: number;
  velocity: number;
  color: string;
  size: number;
}

function BurstParticle({ originX, originY, angle, velocity, color, size }: BurstParticleProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetX = Math.cos(angle) * velocity;
    const targetY = Math.sin(angle) * velocity;

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: targetY + 100,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [angle, velocity, translateX, translateY, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.burstParticle,
        {
          left: originX,
          top: originY,
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

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
  },
  star: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  starInner: {
    width: '60%',
    height: '60%',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  noteText: {
    fontWeight: '300' as const,
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  burstParticle: {
    position: 'absolute',
  },
});
