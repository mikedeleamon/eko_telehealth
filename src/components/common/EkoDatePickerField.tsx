import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { maskDateInput } from '../../utils/format';
import CalendarSheet from './CalendarSheet';

interface Props {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  /** Disable future days in the calendar (e.g. dates of birth). */
  disableFuture?: boolean;
}

/**
 * Date entry that accepts both manual typing (masked + validated as
 * DD-MM-YYYY) and a tap-to-open calendar. Matches EkoTextField's look.
 */
export default function EkoDatePickerField({
  label, value, onChangeText, placeholder = 'DD-MM-YYYY',
  error, containerStyle, disableFuture = false,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [calendar, setCalendar] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.container,
          focused && { borderColor: Colors.borderFocus, backgroundColor: Colors.white },
          error ? styles.containerError : null,
        ]}
      >
        <FontAwesome name="calendar" size={17} color={focused ? Colors.borderFocus : Colors.textGray} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textGray}
          value={value}
          onChangeText={(t) => onChangeText(maskDateInput(t))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={10}
        />
        <TouchableOpacity onPress={() => setCalendar(true)} style={styles.calBtn} hitSlop={hit}>
          <FontAwesome name="calendar-o" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <CalendarSheet
        visible={calendar}
        value={value}
        onSelect={onChangeText}
        onClose={() => setCalendar(false)}
        disableFuture={disableFuture}
        title={label ?? 'Select Date'}
      />
    </View>
  );
}

const hit = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  container: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    backgroundColor: '#F5F6FA', borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 16, height: 54,
  },
  containerError: { borderColor: Colors.error },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  calBtn: { padding: 4, marginLeft: 8 },
  error: { fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: 2, fontFamily: 'Poppins_400Regular' },
});
