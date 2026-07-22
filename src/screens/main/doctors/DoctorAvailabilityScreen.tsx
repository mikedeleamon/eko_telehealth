import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useDoctorAvailability, useSaveDoctorAvailability } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { AvailabilityBlock } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/** 0 = Sunday, matching AvailabilityBlock.weekday. */
const WEEKDAY_KEYS = [
  'availability.sun', 'availability.mon', 'availability.tue', 'availability.wed',
  'availability.thu', 'availability.fri', 'availability.sat',
];

/** Every 30 minutes, 06:00-22:00 — fixed-increment chips instead of a native time picker. */
const TIME_OPTIONS = Array.from({ length: (22 - 6) * 2 + 1 }, (_, i) => 6 * 60 + i * 30);
const SLOT_OPTIONS = [30, 45, 60, 90];

function formatMinuteOfDay(minute: number): string {
  const hour24 = Math.floor(minute / 60);
  const min = minute % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(min).padStart(2, '0')} ${period}`;
}

export default function DoctorAvailabilityScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: blocks = [], isLoading } = useDoctorAvailability();
  const saveAvailability = useSaveDoctorAvailability();

  const [formOpen, setFormOpen] = useState(false);
  const [weekday, setWeekday] = useState(1);
  const [startMinute, setStartMinute] = useState(9 * 60);
  const [endMinute, setEndMinute] = useState(17 * 60);
  const [slotMinutes, setSlotMinutes] = useState(60);

  const resetForm = () => {
    setWeekday(1);
    setStartMinute(9 * 60);
    setEndMinute(17 * 60);
    setSlotMinutes(60);
  };

  const sorted = [...blocks].sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);

  const submit = async () => {
    if (endMinute <= startMinute) return Alert.alert('', t('availability.endAfterStart'));
    try {
      await saveAvailability.mutateAsync([...blocks, { weekday, startMinute, endMinute, slotMinutes }]);
      setFormOpen(false);
      resetForm();
    } catch (err) {
      Alert.alert(t('availability.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  const confirmRemove = (block: AvailabilityBlock) => {
    Alert.alert(t('availability.removeTitle'), t('availability.removeConfirm'), [
      { text: t('documents.cancel'), style: 'cancel' },
      {
        text: t('documents.remove'),
        style: 'destructive',
        onPress: () =>
          saveAvailability.mutate(blocks.filter((b) => b !== block), {
            onError: (err) =>
              Alert.alert(t('availability.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong')),
          }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('availability.title')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(b) => b.id ?? `${b.weekday}-${b.startMinute}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.note}>{t('availability.note')}</Text>}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome name="clock-o" size={40} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>{t('availability.empty')}</Text>
              <Text style={styles.emptyHint}>{t('availability.emptyHint')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.blockCard}>
              <View style={styles.blockIcon}>
                <FontAwesome name="calendar" size={18} color={Colors.primary} />
              </View>
              <View style={styles.blockInfo}>
                <Text style={styles.blockDay}>{t(WEEKDAY_KEYS[item.weekday])}</Text>
                <Text style={styles.blockMeta}>
                  {formatMinuteOfDay(item.startMinute)} – {formatMinuteOfDay(item.endMinute)} · {t('availability.slotLength', { count: item.slotMinutes })}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => confirmRemove(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={t('availability.remove')}
              >
                <FontAwesome name="trash-o" size={18} color={Colors.red} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <EkoButton title={t('availability.addHours')} variant="primary" onPress={() => setFormOpen(true)} />
      </View>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFormOpen(false)}>
            <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>{t('availability.newBlock')}</Text>

              <Text style={styles.fieldLabel}>{t('availability.day')}</Text>
              <View style={styles.chipRow}>
                {WEEKDAY_KEYS.map((key, i) => {
                  const active = weekday === i;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setWeekday(i)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(key)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>{t('availability.startTime')}</Text>
              <FlatList
                horizontal
                data={TIME_OPTIONS}
                keyExtractor={(m) => `start-${m}`}
                showsHorizontalScrollIndicator={false}
                style={styles.timeRow}
                renderItem={({ item: m }) => {
                  const active = startMinute === m;
                  return (
                    <TouchableOpacity
                      style={[styles.chip, styles.timeChip, active && styles.chipActive]}
                      onPress={() => setStartMinute(m)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatMinuteOfDay(m)}</Text>
                    </TouchableOpacity>
                  );
                }}
              />

              <Text style={styles.fieldLabel}>{t('availability.endTime')}</Text>
              <FlatList
                horizontal
                data={TIME_OPTIONS}
                keyExtractor={(m) => `end-${m}`}
                showsHorizontalScrollIndicator={false}
                style={styles.timeRow}
                renderItem={({ item: m }) => {
                  const active = endMinute === m;
                  return (
                    <TouchableOpacity
                      style={[styles.chip, styles.timeChip, active && styles.chipActive]}
                      onPress={() => setEndMinute(m)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatMinuteOfDay(m)}</Text>
                    </TouchableOpacity>
                  );
                }}
              />

              <Text style={styles.fieldLabel}>{t('availability.slotDuration')}</Text>
              <View style={styles.chipRow}>
                {SLOT_OPTIONS.map((m) => {
                  const active = slotMinutes === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSlotMinutes(m)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{t('availability.slotLength', { count: m })}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <EkoButton
                title={saveAvailability.isPending ? t('availability.saving') : t('availability.save')}
                variant="primary"
                onPress={submit}
                loading={saveAvailability.isPending}
                style={styles.sheetSubmit}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  flex: { flex: 1 },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  note: { fontSize: 12, color: Colors.textGray, marginBottom: 14, lineHeight: 17, fontFamily: 'Poppins_400Regular' },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginTop: 14, fontFamily: 'Poppins_700Bold' },
  emptyHint: { fontSize: 13, color: Colors.textGray, textAlign: 'center', marginTop: 6, lineHeight: 19, fontFamily: 'Poppins_400Regular' },

  blockCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  blockIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  blockInfo: { flex: 1, marginRight: 10 },
  blockDay: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  blockMeta: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },

  footer: { padding: 16, backgroundColor: Colors.bgLight, borderTopWidth: 1, borderTopColor: Colors.borderGray },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 16, fontFamily: 'Poppins_700Bold' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 8, fontFamily: 'Poppins_600SemiBold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  timeRow: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.bgLight,
  },
  timeChip: { marginRight: 8 },
  chipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  sheetSubmit: { width: '100%' },
});
