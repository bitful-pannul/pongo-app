import { Ionicons } from "@expo/vector-icons";
import React, { ComponentProps, useCallback } from "react";
import { Text, TouchableOpacity, View, StyleSheet, TouchableOpacityProps } from "react-native";
import useColors from "../../hooks/useColors";
import { uq_purple } from "../../constants/Colors";

interface ButtonProps extends TouchableOpacityProps {
  onPress: () => void
  title?: string
  iconName?: ComponentProps<typeof Ionicons>["name"]
  color?: string
  background?: string
  disabled?: boolean
  small?: boolean
  unstyled?: boolean
  viewStyle?: any
}

export default function Button({
  onPress,
  title,
  iconName,
  style,
  viewStyle,
  color = 'white',
  background = uq_purple,
  disabled = false,
  small = false,
  unstyled = false,
}: ButtonProps) {
  const onPressButton = useCallback(() => {
    if (!disabled) {
      onPress()
    }
  }, [disabled, onPress])

  const { color: defaultColor } = useColors()
  const textColor = unstyled ? defaultColor : color

  const styles = StyleSheet.create({
    button: {
      width: small ? undefined:  '80%',
      marginHorizontal: small ? undefined : '10%',
      borderRadius: 8,
    },
    view: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      padding: small ? 6 : 8,
      paddingHorizontal: small ? 12 : 20,
    },
    shadow: {
      backgroundColor: background,
      elevation: 2,
      shadowColor: background,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.7,
      shadowRadius: 2,
      borderRadius: 8,
    },
    text: {
      color: textColor,
      fontSize: small ? 16 : 18,
    }
  })

  return (
    <TouchableOpacity onPress={onPressButton} style={[styles.button, style]}>
      <View style={[styles.view, !unstyled && styles.shadow, viewStyle]}>
        {Boolean(title) && <Text style={styles.text}>{title}</Text>}
        {Boolean(iconName) && <Ionicons name={iconName} size={20} color={textColor} style={{ marginLeft: 8 }} />}
      </View>
    </TouchableOpacity>
  )
}
