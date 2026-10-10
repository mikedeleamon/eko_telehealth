import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';
import { useTranslation } from '../../i18n/useTranslation';
import { addDays, addMonths, localeTag, sameDay, startOfDay, ymd } from '../../utils/schedule';

export interface DaySummary {
  /** Visits that still hold the doctor's time. */
  count: number;
  /** At least one is waiting on the doctor (a request) or the patient (payment). */
  hasPending: boolean;
}

interface Props {
  /** Any date in the month to show. */
  month: Date;
  selected: Date;
  onSelectDay: (day: Date) => void;
  onChangeMonth: (month: Date) => void;
  summaries: Map<string, DaySummary>;
  /** YYYY-MM-DD → whether the block covers the whole day or only part of it. */
  blocked: Map<string, 'all' | 'partial'>;
  /** Days before this can't be picked (booking and blocking only look forward). */
  minDate?: Date;
  /** Renders without its own card chrome, for use inside a sheet. */
  bare?: boolean;
}

/**
 * The Scheduler's month view: a Monday-first grid with each day's visit count,
 * an orange marker when something on it is still pending, and blocked days
 * greyed out. Tapping a day opens it in the day view.
 */
export default function MonthGrid({ month, selected, onSelectDay, onChangeMonth, summaries, blocked, minDate, bare }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t, locale } = useTranslation();
  const tag = localeTag(locale);
  const today = startOfDay(new Date());

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  // Monday-first, the convention on Nigerian and French calendars alike.
  const lead = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -lead);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((lead + daysInMonth) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));
  // Weekday headers from a known Monday, so they follow the locale.
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(tag, { weekday: 'narrow' }),
  );
  const title = first.toLocaleDateString(tag, { month: 'long', year: 'numeric' });

  return (
    <View style={bare ? null : styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onChangeMonth(addMonths(first, -1))}
          accessibilityRole="button"
          accessibilityLabel={t('scheduler.previousMonth')}
        >
          <FontAwesome name="chevron-left" size={14} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>{title.charAt(0).toUpperCase() + title.slice(1)}</Text>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onChangeMonth(addMonths(first, 1))}
          accessibilityRole="button"
          accessibilityLabel={t('scheduler.nextMonth')}
        >
          <FontAwesome name="chevron-right" size={14} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {weekdayLabels.map((label, i) => (
          <Text key={i} style={styles.weekday}>{label}</Text>
        ))}
      </View>

      {Array.from({ length: weeks }, (_, w) => (
        <View key={w} style={styles.weekRow}>
          {cells.slice(w * 7, w * 7 + 7).map((day) => {
            const key = ymd(day);
            const inMonth = day.getMonth() === first.getMonth();
            const summary = summaries.get(key);
            const block = blocked.get(key);
            const isSelected = sameDay(day, selected);
            const isToday = sameDay(day, today);
            const disabled = !!minDate && day.getTime() < startOfDay(minDate).getTime();
            const a11yParts = [day.toLocaleDateString(tag, { weekday: 'long', month: 'long', day: 'numeric' })];
            if (summary?.count) a11yParts.push(t('scheduler.appointmentsCount', { count: summary.count }));
            if (block === 'all') a11yParts.push(t('scheduler.blockedAllDay'));
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.cell,
                  block === 'all' && styles.cellBlocked,
                  isToday && !isSelected && styles.cellToday,
                  isSelected && styles.cellSelected,
                ]}
                onPress={() => onSelectDay(day)}
                disabled={disabled}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled }}
                accessibilityLabel={a11yParts.join(', ')}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    (!inMonth || disabled) && styles.outOfMonth,
                    block === 'all' && styles.dayBlocked,
                    isSelected && styles.textSelected,
                  ]}
                >
                  {day.getDate()}
                </Text>
                <View style={styles.markerRow}>
                  {summary?.count ? (
                    <View style={[styles.countPill, isSelected && styles.countPillSelected]}>
                      <Text style={[styles.countText, isSelected && styles.countTextSelected]}>{summary.count}</Text>
                    </View>
                  ) : null}
                  {summary?.hasPending ? <View style={[styles.pendingDot, isSelected && styles.pendingDotSelected]} /> : null}
                  {block === 'partial' ? <View style={[styles.partialBar, isSelected && styles.partialBarSelected]} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: Colors.surface, borderRadius: 22, padding: 14, marginHorizontal: 16,
      ...Platform.select({
        ios: { shadowColor: 'rgba(39, 42, 58, 0.10)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10 },
        android: { elevation: 3 },
      }),
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    navBtn: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.field,
      alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 16, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
    weekRow: { flexDirection: 'row' },
    weekday: {
      flex: 1, textAlign: 'center', fontSize: 12, color: Colors.textGray,
      fontFamily: 'Poppins_600SemiBold', paddingVertical: 6,
    },
    cell: {
      flex: 1, aspectRatio: 0.82, margin: 2, borderRadius: 12,
      alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6,
    },
    cellToday: { borderWidth: 1.5, borderColor: Colors.primary },
    cellSelected: { backgroundColor: Colors.primary },
    cellBlocked: { backgroundColor: Colors.field },
    dayNumber: { fontSize: 14, fontWeight: '600', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
    outOfMonth: { color: Colors.textLight },
    dayBlocked: { color: Colors.textGray, textDecorationLine: 'line-through' },
    textSelected: { color: Colors.white },
    markerRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, minHeight: 16 },
    countPill: {
      minWidth: 18, height: 16, borderRadius: 8, paddingHorizontal: 4,
      backgroundColor: Colors.primaryFaded, alignItems: 'center', justifyContent: 'center',
    },
    countPillSelected: { backgroundColor: 'rgba(255,255,255,0.25)' },
    countText: { fontSize: 10, fontWeight: '700', color: Colors.primary, fontFamily: 'Poppins_700Bold' },
    countTextSelected: { color: Colors.white },
    pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.orange },
    pendingDotSelected: { backgroundColor: Colors.white },
    partialBar: { width: 10, height: 3, borderRadius: 2, backgroundColor: Colors.textGray },
    partialBarSelected: { backgroundColor: Colors.white },
  });
