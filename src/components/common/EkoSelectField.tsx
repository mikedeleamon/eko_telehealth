import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import EkoTextField from './EkoTextField';

interface Props {
  label?: string;
  icon?: string;
  placeholder?: string;
  /** The currently selected option label (or the OTHER sentinel). */
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
  /**
   * When true, an "Other" entry is appended; selecting it reveals a text
   * field. The typed value is surfaced through otherValue/onChangeOther.
   */
  allowOther?: boolean;
  otherValue?: string;
  onChangeOther?: (v: string) => void;
  otherPlaceholder?: string;
}

export const OTHER_OPTION = 'Other';

export default function EkoSelectField({
  label, icon, placeholder = 'Select', value, options, onSelect,
  error, containerStyle, allowOther = false,
  otherValue = '', onChangeOther, otherPlaceholder = 'Please specify',
}: Props) {
  const [open, setOpen] = useState(false);
  const list = allowOther ? [...options, OTHER_OPTION] : options;
  const showOther = allowOther && value === OTHER_OPTION;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.container, error ? styles.containerError : null]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        {icon ? (
          <FontAwesome name={icon as any} size={17} color={Colors.textGray} style={styles.icon} />
        ) : null}
        <Text style={[styles.value, !value && { color: Colors.textGray }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <FontAwesome name="chevron-down" size={13} color={Colors.textGray} />
      </TouchableOpacity>

      {showOther ? (
        <EkoTextField
          placeholder={otherPlaceholder}
          icon="pencil"
          value={otherValue}
          onChangeText={onChangeOther}
          containerStyle={styles.otherField}
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{label ?? 'Select an option'}</Text>
            <ScrollView style={styles.optionScroll} bounces={false}>
              {list.map((opt) => {
                const active = value === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.option}
                    onPress={() => { onSelect(opt); setOpen(false); }}
                  >
                    <FontAwesome
                      name={active ? 'dot-circle-o' : 'circle-o'}
                      size={20}
                      color={active ? Colors.primary : Colors.textGray}
                    />
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    backgroundColor: '#F5F6FA', borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 16, height: 54,
  },
  containerError: { borderColor: Colors.error },
  icon: { marginRight: 10 },
  value: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  otherField: { marginTop: 10, marginBottom: 0 },
  error: { fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: 2, fontFamily: 'Poppins_400Regular' },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, maxHeight: '70%',
  },
  grabber: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderGray, marginBottom: 14,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.textDark, marginBottom: 12, fontFamily: 'Poppins_700Bold' },
  optionScroll: { flexGrow: 0 },
  option: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  optionText: { fontSize: 16, color: Colors.textDark, marginLeft: 14, fontFamily: 'Poppins_400Regular' },
  optionTextActive: { color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
});
