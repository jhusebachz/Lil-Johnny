import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

export function useDashboardHeroAnimation() {
  const heroOpacity = useState(() => new Animated.Value(0))[0];
  const heroLift = useState(() => new Animated.Value(18))[0];
  const logoFloat = useState(() => new Animated.Value(0))[0];
  const haloPulse = useState(() => new Animated.Value(0.94))[0];

  useEffect(() => {
    const reveal = Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroLift, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -8,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulse, {
          toValue: 1.04,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(haloPulse, {
          toValue: 0.94,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    reveal.start();
    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [haloPulse, heroLift, heroOpacity, logoFloat]);

  return {
    haloPulse,
    heroLift,
    heroOpacity,
    logoFloat,
  };
}
