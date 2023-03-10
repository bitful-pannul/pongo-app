import { Dimensions, Platform } from 'react-native';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export const window = {
  width,
  height,
}
export const isSmallDevice = width < 375

export const isLargeDevice = width > 700

export const keyboardOffset = Platform.OS === 'ios' ? 46 : 82

export const isIos = Platform.OS === 'ios'

export const isWeb = Platform.OS === 'web'

export const keyboardAvoidBehavior = isIos ? 'padding' : undefined
