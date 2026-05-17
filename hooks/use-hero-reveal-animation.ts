import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

export function useHeroRevealAnimation(duration = 460, startingLift = 18) {
  const heroOpacity = useState(() => new Animated.Value(0))[0];
  const heroLift = useState(() => new Animated.Value(startingLift))[0];

  useEffect(() => {
    const reveal = Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroLift, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    reveal.start();
  }, [duration, heroLift, heroOpacity]);

  return {
    heroLift,
    heroOpacity,
  };
}
