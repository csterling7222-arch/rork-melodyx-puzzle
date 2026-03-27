import { Animated, Easing } from 'react-native';
import { shouldReduceAnimations, getOptimalTransitionDuration } from './glitchFreeEngine';

export type AnimationPreset = 
  | 'fadeIn' | 'fadeOut' | 'fadeInUp' | 'fadeInDown'
  | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown'
  | 'scaleIn' | 'scaleOut' | 'pulse' | 'shake'
  | 'bounce' | 'spring' | 'elastic'
  | 'success' | 'error' | 'celebration'
  | 'noteCorrect' | 'noteWrong' | 'streak';

interface AnimationConfig {
  duration?: number;
  delay?: number;
  useNativeDriver?: boolean;
  easing?: typeof Easing.linear;
}

const DEFAULT_DURATION = 300;

export function getAnimationDuration(base: number = DEFAULT_DURATION): number {
  if (shouldReduceAnimations()) {
    return Math.min(base * 0.5, 150);
  }
  return Math.min(base, getOptimalTransitionDuration() * 1.5);
}

export function createFadeAnimation(
  value: Animated.Value,
  toValue: number,
  config?: AnimationConfig
): Animated.CompositeAnimation {
  const duration = config?.duration ?? getAnimationDuration();
  
  return Animated.timing(value, {
    toValue,
    duration,
    delay: config?.delay ?? 0,
    useNativeDriver: config?.useNativeDriver ?? true,
    easing: config?.easing ?? Easing.out(Easing.ease),
  });
}

export function createSlideAnimation(
  value: Animated.Value,
  toValue: number,
  config?: AnimationConfig
): Animated.CompositeAnimation {
  const duration = config?.duration ?? getAnimationDuration();
  
  return Animated.timing(value, {
    toValue,
    duration,
    delay: config?.delay ?? 0,
    useNativeDriver: config?.useNativeDriver ?? true,
    easing: config?.easing ?? Easing.out(Easing.cubic),
  });
}

export function createScaleAnimation(
  value: Animated.Value,
  toValue: number,
  config?: AnimationConfig
): Animated.CompositeAnimation {
  return Animated.spring(value, {
    toValue,
    tension: 100,
    friction: 8,
    useNativeDriver: config?.useNativeDriver ?? true,
  });
}

export function createBounceAnimation(
  value: Animated.Value,
  config?: AnimationConfig
): Animated.CompositeAnimation {
  if (shouldReduceAnimations()) {
    return createScaleAnimation(value, 1, config);
  }
  
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1.1,
      duration: getAnimationDuration(100),
      useNativeDriver: config?.useNativeDriver ?? true,
      easing: Easing.out(Easing.ease),
    }),
    Animated.spring(value, {
      toValue: 1,
      tension: 200,
      friction: 5,
      useNativeDriver: config?.useNativeDriver ?? true,
    }),
  ]);
}

export function createShakeAnimation(
  value: Animated.Value,
  intensity: number = 10,
  config?: AnimationConfig
): Animated.CompositeAnimation {
  if (shouldReduceAnimations()) {
    return Animated.timing(value, {
      toValue: 0,
      duration: 0,
      useNativeDriver: config?.useNativeDriver ?? true,
    });
  }
  
  const shakeCount = 3;
  const shakeDuration = getAnimationDuration(50);
  
  const shakeSequence: Animated.CompositeAnimation[] = [];
  
  for (let i = 0; i < shakeCount; i++) {
    shakeSequence.push(
      Animated.timing(value, {
        toValue: intensity,
        duration: shakeDuration,
        useNativeDriver: config?.useNativeDriver ?? true,
        easing: Easing.linear,
      }),
      Animated.timing(value, {
        toValue: -intensity,
        duration: shakeDuration,
        useNativeDriver: config?.useNativeDriver ?? true,
        easing: Easing.linear,
      })
    );
  }
  
  shakeSequence.push(
    Animated.timing(value, {
      toValue: 0,
      duration: shakeDuration,
      useNativeDriver: config?.useNativeDriver ?? true,
      easing: Easing.linear,
    })
  );
  
  return Animated.sequence(shakeSequence);
}

export function createPulseAnimation(
  value: Animated.Value,
  minScale: number = 0.95,
  maxScale: number = 1.05,
  config?: AnimationConfig
): Animated.CompositeAnimation {
  if (shouldReduceAnimations()) {
    return Animated.timing(value, {
      toValue: 1,
      duration: 0,
      useNativeDriver: config?.useNativeDriver ?? true,
    });
  }
  
  const duration = config?.duration ?? getAnimationDuration(400);
  
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: maxScale,
        duration: duration / 2,
        useNativeDriver: config?.useNativeDriver ?? true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(value, {
        toValue: minScale,
        duration: duration / 2,
        useNativeDriver: config?.useNativeDriver ?? true,
        easing: Easing.inOut(Easing.ease),
      }),
    ])
  );
}

export function createSuccessAnimation(
  scaleValue: Animated.Value,
  opacityValue: Animated.Value
): Animated.CompositeAnimation {
  if (shouldReduceAnimations()) {
    return Animated.parallel([
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(opacityValue, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]);
  }
  
  return Animated.parallel([
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: getAnimationDuration(150),
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
    ]),
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: getAnimationDuration(200),
      useNativeDriver: true,
    }),
  ]);
}

export function createErrorAnimation(
  translateValue: Animated.Value,
  opacityValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.parallel([
    createShakeAnimation(translateValue, 8),
    Animated.sequence([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: getAnimationDuration(100),
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(opacityValue, {
        toValue: 0.7,
        duration: getAnimationDuration(200),
        useNativeDriver: true,
      }),
    ]),
  ]);
}

export function createNoteCorrectAnimation(
  scaleValue: Animated.Value,
  colorValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.15,
        duration: getAnimationDuration(80),
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
    ]),
    Animated.timing(colorValue, {
      toValue: 1,
      duration: getAnimationDuration(150),
      useNativeDriver: false,
    }),
  ]);
}

export function createNoteWrongAnimation(
  translateValue: Animated.Value,
  colorValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.parallel([
    createShakeAnimation(translateValue, 6),
    Animated.timing(colorValue, {
      toValue: 1,
      duration: getAnimationDuration(150),
      useNativeDriver: false,
    }),
  ]);
}

export function createStreakAnimation(
  scaleValue: Animated.Value,
  rotateValue: Animated.Value
): Animated.CompositeAnimation {
  if (shouldReduceAnimations()) {
    return Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true });
  }
  
  return Animated.parallel([
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.3,
        duration: getAnimationDuration(150),
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 80,
        friction: 5,
        useNativeDriver: true,
      }),
    ]),
    Animated.sequence([
      Animated.timing(rotateValue, {
        toValue: 0.05,
        duration: getAnimationDuration(75),
        useNativeDriver: true,
      }),
      Animated.timing(rotateValue, {
        toValue: -0.05,
        duration: getAnimationDuration(75),
        useNativeDriver: true,
      }),
      Animated.timing(rotateValue, {
        toValue: 0,
        duration: getAnimationDuration(75),
        useNativeDriver: true,
      }),
    ]),
  ]);
}

export function createCelebrationAnimation(
  values: Animated.Value[]
): Animated.CompositeAnimation {
  if (shouldReduceAnimations() || values.length === 0) {
    return Animated.delay(0);
  }
  
  const animations = values.map((value, index) => 
    Animated.sequence([
      Animated.delay(index * 50),
      Animated.spring(value, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ])
  );
  
  return Animated.parallel(animations);
}

export function createStaggeredEntrance(
  values: Animated.Value[],
  staggerDelay: number = 50
): Animated.CompositeAnimation {
  if (shouldReduceAnimations()) {
    return Animated.parallel(
      values.map(value => 
        Animated.timing(value, { toValue: 1, duration: 100, useNativeDriver: true })
      )
    );
  }
  
  return Animated.stagger(
    staggerDelay,
    values.map(value =>
      Animated.spring(value, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      })
    )
  );
}

export function createFadeInUp(
  opacityValue: Animated.Value,
  translateValue: Animated.Value,
  config?: AnimationConfig
): Animated.CompositeAnimation {
  const duration = config?.duration ?? getAnimationDuration();
  
  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: 1,
      duration,
      delay: config?.delay ?? 0,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }),
    Animated.timing(translateValue, {
      toValue: 0,
      duration,
      delay: config?.delay ?? 0,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }),
  ]);
}

export function createModalEntrance(
  scaleValue: Animated.Value,
  opacityValue: Animated.Value
): Animated.CompositeAnimation {
  if (shouldReduceAnimations()) {
    return Animated.parallel([
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(opacityValue, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]);
  }
  
  scaleValue.setValue(0.9);
  opacityValue.setValue(0);
  
  return Animated.parallel([
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }),
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: getAnimationDuration(200),
      useNativeDriver: true,
    }),
  ]);
}

export function createModalExit(
  scaleValue: Animated.Value,
  opacityValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.timing(scaleValue, {
      toValue: 0.9,
      duration: getAnimationDuration(150),
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }),
    Animated.timing(opacityValue, {
      toValue: 0,
      duration: getAnimationDuration(150),
      useNativeDriver: true,
    }),
  ]);
}

export function isAnimationEnabled(): boolean {
  return !shouldReduceAnimations();
}
