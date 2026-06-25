import React, { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle, TextInputProps,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface Props extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  pill?: boolean;
  focusColor?: string;
}

export default function SCTextField({
  label, icon, error, containerStyle,
  isPassword = false, pill = false, focusColor,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderRadius = pill ? 32 : 12;
  const activeBorderColor = focusColor ?? Colors.borderFocus;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.container,
          { borderRadius },
          focused && { borderColor: activeBorderColor, backgroundColor: Colors.white },
          error ? styles.containerError : null,
        ]}
      >
        {icon ? (
          <FontAwesome
            name={icon as any}
            size={17}
            color={focused ? activeBorderColor : Colors.textGray}
            style={styles.icon}
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textGray}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
            <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={17} color={Colors.textGray} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 16, height: 54,
  },
  containerError: { borderColor: Colors.error },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  eyeBtn: { padding: 4 },
  error: { fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: 2, fontFamily: 'Poppins_400Regular' },
});
