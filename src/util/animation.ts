import { Animated, EasingFunction } from "react-native"

export const createPulse = (value: Animated.Value, max: number, min: number, easing: EasingFunction) => Animated.loop(
  Animated.sequence([
    Animated.timing(value, {
        toValue: max,
        duration: 500,
        useNativeDriver: true,
        easing,
    }),
    Animated.timing(value, {
        toValue: min,
        duration: 500,
        useNativeDriver: true,
        easing,
    }),
  ]),
  {
    iterations: -1
  }
)
