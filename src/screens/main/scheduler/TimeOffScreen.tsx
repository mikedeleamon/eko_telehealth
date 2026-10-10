import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch, FlatList, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import DatePickerSheet from '../../../components/scheduler/DatePickerSheet';
import { useAddTimeOff, useRemoveTimeOff, useTimeOff } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { TAB_BAR_SPACE } from '../../../constants/layout';
import type { TimeOffBlock } from '../../../api/types';
import { formatShortDate, formatTime, sameDay, startOfDay, ymd } from '../../../utils/schedule';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/** Every 30 minutes, 06:00–22:00 — the same increments as the working-hours editor. */
const TIME_OPTIONS = Array.from({ length: (22 - 6) * 2 + 1 }, (_, i) => 6 * 60 + i * 30);

type DateField = 'from' | 'to';

function dayFromParam(value: unknown): Date {
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return startOfDay(new Date());
}

/**
 * "Block out availability": whole days (a vacation, a conference) or a window
 * on one day (a long lunch). Patients can't book blocked time. Visits already
 * booked inside a new block are NOT cancelled — some are paid and there's no
 * refund path — so saving lists them for the doctor to deal with instead.
 */
export default function TimeOffScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t, locale } = useTranslation();
  const today = startOfDay(new Date());

  const { data: blocks = [], isLoading } = useTimeOff();
  const addTimeOff = useAddTimeOff();
  const removeTimeOff = useRemoveTimeOff();

  const initial = dayFromParam(route.params?.date);
  const firstDay = initial.getTime() < today.getTime() ? today : initial;
  const [allDay, setAllDay] = useState(true);
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(firstDay);
  const [startMinute, setStartMinute] = useState(12 * 60);
  const [endMinute, setEndMinute] = useState(13 * 60);
  const [reason, setReason] = useState('');
  const [picking, setPicking] = useState<DateField | null>(null);

  const minuteLabel = (minute: number) => formatTime(new Date(2024, 0, 1, Math.floor(minute / 60), minute % 60), locale);

  const setFrom = (d: Date) => {
    setFromDate(d);
    if (toDate.getTime() < d.getTime()) setToDate(d);
  };

  const submit = async () => {
    if (allDay && toDate.getTime() < fromDate.getTime()) return Alert.alert('', t('timeOff.endDateAfterStart'));
    if (!allDay && endMinute <= startMinute) return Alert.alert('', t('timeOff.endAfterStart'));
    try {
      const result = await addTimeOff.mutateAsync({
        startDate: ymd(fromDate),
        ...(allDay ? { endDate: ymd(toDate) } : { startMinute, endMinute }),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      setReason('');
      if (result.conflicts.length > 0) {
        const lines = result.conflicts.map((a) => {
          const when = a.startAt ? `${formatShortDate(new Date(a.startAt), locale)} ${formatTime(new Date(a.startAt), locale)}` : `${a.date} ${a.time}`;
          return `• ${a.patientName ?? a.doctor} · ${when}`;
        });
        Alert.alert(
          t('timeOff.conflictsTitle'),
          `${t('timeOff.conflictsBody', { count: result.conflicts.length })}\n\n${lines.join('\n')}`,
        );
      } else {
        Alert.alert(t('timeOff.savedTitle'), t('timeOff.savedBody'));
      }
    } catch (err) {
      Alert.alert(t('timeOff.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  const confirmRemove = (block: TimeOffBlock) => {
    Alert.alert(t('scheduler.unblockTitle'), t('scheduler.unblockBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('scheduler.unblock'),
        onPress: () =>
          removeTimeOff.mutate(block.id, {
            onError: (err) =>
              Alert.alert(t('scheduler.couldNotUnblock'), err instanceof Error ? err.message : t('common.somethingWentWrong')),
          }),
      },
    ]);
  };

  /** How a saved block reads in the list. */
  const describe = (block: TimeOffBlock): string => {
    const start = new Date(block.startAt);
    // endAt is exclusive; the last day blocked is the day before it.
    const lastDay = startOfDay(new Date(new Date(block.endAt).getTime() - 1));
    if (block.allDay) {
      return sameDay(start, lastDay)
        ? t('timeOff.singleAllDay', { date: formatShortDate(start, locale) })
        : t('timeOff.rangeAllDay', { from: formatShortDate(start, locale), to: formatShortDate(lastDay, locale) });
    }
    return t('timeOff.window', {
      date: formatShortDate(start, locale),
      start: formatTime(start, locale),
      end: formatTime(new Date(block.endAt), locale),
    });
  };

  const timeChips = (value: number, onPick: (m: number) => void, keyPrefix: string) => (
    <FlatList
      horizontal
      data={TIME_OPTIONS}
      keyExtractor={(m) => `${keyPrefix}-${m}`}
      showsHorizontalScrollIndicator={false}
      style={styles.timeRow}
      initialScrollIndex={Math.max(0, TIME_OPTIONS.indexOf(value) - 1)}
      getItemLayout={(_, index) => ({ length: TIME_CHIP_WIDTH + 8, offset: (TIME_CHIP_WIDTH + 8) * index, index })}
      renderItem={({ item: m }) => {
        const active = value === m;
        return (
          <TouchableOpacity
            style={[styles.timeChip, active && styles.chipActive]}
            onPress={() => onPick(m)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{minuteLabel(m)}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );

  return (
    <View style={styles.container}>
      <EkoHeader title={t('timeOff.title')} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>{t('timeOff.intro')}</Text>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('timeOff.newBlock')}</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{t('timeOff.allDay')}</Text>
              <Switch
                value={allDay}
                onValueChange={setAllDay}
                trackColor={{ false: Colors.borderGray, true: Colors.primaryLight }}
                thumbColor={allDay ? Colors.primary : Colors.textGray}
                accessibilityLabel={t('timeOff.allDay')}
              />
            </View>

            {allDay ? (
              <View style={styles.dateRow}>
                <DateButton label={t('timeOff.from')} value={formatShortDate(fromDate, locale)} onPress={() => setPicking('from')} />
                <DateButton label={t('timeOff.to')} value={formatShortDate(toDate, locale)} onPress={() => setPicking('to')} />
              </View>
            ) : (
              <>
                <View style={styles.dateRow}>
                  <DateButton label={t('timeOff.date')} value={formatShortDate(fromDate, locale)} onPress={() => setPicking('from')} />
                </View>
                <Text style={styles.fieldLabel}>{t('timeOff.startTime')}</Text>
                {timeChips(startMinute, setStartMinute, 'start')}
                <Text style={styles.fieldLabel}>{t('timeOff.endTime')}</Text>
                {timeChips(endMinute, setEndMinute, 'end')}
              </>
            )}

            <Text style={styles.fieldLabel}>{t('timeOff.reason')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('timeOff.reasonPlaceholder')}
              placeholderTextColor={Colors.textGray}
              value={reason}
              onChangeText={setReason}
              maxLength={120}
              accessibilityLabel={t('timeOff.reason')}
            />

            <EkoButton title={t('timeOff.save')} variant="primary" onPress={submit} loading={addTimeOff.isPending} style={styles.save} />
          </View>

          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : blocks.length === 0 ? (
            <View style={styles.empty}>
              <FontAwesome name="calendar-check-o" size={36} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>{t('timeOff.empty')}</Text>
              <Text style={styles.emptyHint}>{t('timeOff.emptyHint')}</Text>
            </View>
          ) : (
            blocks.map((block) => (
              <View key={block.id} style={styles.blockCard}>
                <View style={styles.blockIcon}>
                  <FontAwesome name="ban" size={17} color={Colors.textMedium} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.blockWhen}>{describe(block)}</Text>
                  {block.reason ? <Text style={styles.blockReason}>{block.reason}</Text> : null}
                </View>
                <TouchableOpacity
                  onPress={() => confirmRemove(block)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('scheduler.unblock')}
                >
                  <Text style={styles.reopen}>{t('scheduler.unblock')}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerSheet
        visible={picking !== null}
        title={picking === 'to' ? t('timeOff.to') : allDay ? t('timeOff.from') : t('timeOff.date')}
        value={picking === 'to' ? toDate : fromDate}
        minDate={picking === 'to' ? fromDate : today}
        onSelect={(d) => (picking === 'to' ? setToDate(startOfDay(d)) : setFrom(startOfDay(d)))}
        onClose={() => setPicking(null)}
      />
    </View>
  );
}

const TIME_CHIP_WIDTH = 86;

function DateButton({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <TouchableOpacity style={styles.dateBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.dateBtnLabel}>{label}</Text>
      <View style={styles.dateBtnValueRow}>
        <Text style={styles.dateBtnValue}>{value}</Text>
        <FontAwesome name="calendar" size={13} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: TAB_BAR_SPACE },
  intro: { fontSize: 13, color: Colors.textGray, lineHeight: 19, marginBottom: 14, fontFamily: 'Poppins_400Regular' },
  loader: { marginTop: 24 },

  formCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  formTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 10, fontFamily: 'Poppins_700Bold' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleLabel: { fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },
  dateRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  dateBtn: { flex: 1, backgroundColor: Colors.field, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  dateBtnLabel: { fontSize: 11.5, color: Colors.textGray, fontFamily: 'Poppins_500Medium' },
  dateBtnValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  dateBtnValue: { fontSize: 14.5, fontWeight: '600', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginTop: 14, marginBottom: 8, fontFamily: 'Poppins_600SemiBold' },
  timeRow: { flexGrow: 0 },
  timeChip: {
    width: TIME_CHIP_WIDTH, marginRight: 8, paddingVertical: 9, borderRadius: 20, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.bgLight,
  },
  chipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  chipTextActive: { color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },
  input: {
    borderWidth: 1.5, borderColor: Colors.borderGray, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Colors.textDark, backgroundColor: Colors.surface, fontFamily: 'Poppins_400Regular',
  },
  save: { marginTop: 18 },

  empty: { alignItems: 'center', marginTop: 20, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginTop: 12, fontFamily: 'Poppins_700Bold' },
  emptyHint: { fontSize: 13, color: Colors.textGray, marginTop: 4, textAlign: 'center', fontFamily: 'Poppins_400Regular' },

  blockCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  blockIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.field,
    alignItems: 'center', justifyContent: 'center',
  },
  blockWhen: { fontSize: 14.5, fontWeight: '600', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  blockReason: { fontSize: 12.5, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  reopen: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
});
