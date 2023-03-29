import { Platform } from 'react-native';

export const keyboardOffset = Platform.OS === 'ios' ? 46 : 82

export const isIos = Platform.OS === 'ios'

export const isAndroid = Platform.OS === 'android'

export const isWeb = Platform.OS === 'web'

export const keyboardAvoidBehavior = isIos ? 'padding' : undefined
