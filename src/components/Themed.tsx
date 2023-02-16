/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import * as React from 'react';
import {
  Platform,
  Text as DefaultText,
  View as DefaultView,
  ScrollView as DefaultScrollView,
  TextInput as DefaultTextInput,
} from 'react-native';

import Colors from '../constants/Colors';
import useColors from '../hooks/useColors';
import useColorScheme from '../hooks/useColorScheme';
import { light_gray } from '../constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

type TextOptions = {
  mono?: boolean
  bold?: boolean
}

export type TextProps = ThemeProps & TextOptions & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];
export type ScrollViewProps = ThemeProps & DefaultScrollView['props'];
export type TextInputProps = ThemeProps & DefaultTextInput['props'];

export function Text({ mono = false, bold = false, ...props }: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const { color } = useColors()
  const fontFamily = !mono ? undefined : Platform.OS === 'ios' ? 'Courier New' : 'monospace'
  const fontWeight = bold ? '600' : undefined

  return <DefaultText style={[{ color, fontFamily, fontWeight }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const { backgroundColor } = useColors()

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function ScrollView(props: ScrollViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const { backgroundColor } = useColors()

  return <DefaultScrollView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function TextInput(props: TextInputProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const { backgroundColor } = useColors()

  return <DefaultTextInput style={[{ backgroundColor: 'white', padding: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: light_gray,
    fontSize: 18,
    height: 32,
    borderRadius: 4, }, style]} {...otherProps} />;
}
