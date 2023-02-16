import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandler, PanGestureHandlerEventPayload } from "react-native-gesture-handler"
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { window } from "../../constants/Layout"

const { width } = window

interface SwipeListProps {
  minHeight: number;
  style: any;
  children: any;
}

export default function SwipeList({ style, children, minHeight }: SwipeListProps) {
  const translateY = useSharedValue(44)
  const lastTranslationY = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      translateY.value = translateY.value + lastTranslationY.value - e.translationY
      lastTranslationY.value = e.translationY
    })
    .onEnd((e: any) => {
      lastTranslationY.value = 0
    })

  const animatedStyle = useAnimatedStyle(() => ({
    minHeight,
    height: translateY.value,
    width: width - 16,
    marginHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 8,
    paddingHorizontal: 16
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, style]}>
        {children}
      </Animated.View>
    </GestureDetector>
  )
}
