import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function SCButton({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, color, style, textStyle,
}: Props) {
  const bg = color ?? (
    variant === 'primary' ? Colors.primary :
    variant === 'accent' ? Colors.accent :
    variant === 'secondary' ? Colors.bgGray :
    'transparent'
  );

  const height = size === 'sm' ? 42 : size === 'lg' ? 60 : 52;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;
  const textColor =
    variant === 'secondary' ? Colors.textDark :
    (variant === 'outline' || variant === 'ghost') ? (color ?? Colors.primary) :
    Colors.white;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: (variant === 'outline' || variant === 'ghost') ? 'transparent' : bg,
          height,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? (color ?? Colors.primary) : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[styles.label, { fontSize, color: textColor }, textStyle]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: 'Poppins_700Bold',
  },
});
