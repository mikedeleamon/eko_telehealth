import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';
import { useTranslation } from '../../i18n/useTranslation';
import { addDays, localeTag, sameDay, startOfDay, ymd } from '../../utils/schedule';

interface Props {
  selected: Date;
  onSelect: (day: Date) => void;
  /** The calendar tile at the start of the strip — opens the month view. */
  onOpenMonth: () => void;
  /** Days (YYYY-MM-DD) with at least one appointment — get a dot. */
  busyDays: Set<string>;
  /** Days blocked from midnight to midnight — rendered muted. */
  blockedDays: Set<string>;
  /** First day offered — the run starts no earlier (booking only looks forward). */
  minDate?: Date;
}

const CHIP_WIDTH = 62;
const CHIP_GAP = 10;
const DAYS_BEFORE = 21;
const DAYS_AFTER = 49;

/**
 * The day picker under the Scheduler header: a calendar tile that opens the
 * month view, then a scrollable run of day chips around the selected day.
 * The run is rebuilt around the selection, so jumping to a far-off date from
 * the month view still lands with that day in view.
 */
export default function DateStrip({ selected, onSelect, onOpenMonth, busyDays, blockedDays, minDate }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t, locale } = useTranslation();
  const listRef = useRef<FlatList<Date>>(null);
  const today = startOfDay(new Date());

  // Re-anchor only when the selection leaves the current run, so tapping a
  // neighbouring chip doesn't reshuffle the list under the user's finger.
  const anchorRef = useRef(startOfDay(selected));
  const offset = Math.round((startOfDay(selected).getTime() - anchorRef.current.getTime()) / 86_400_000);
  if (offset < -DAYS_BEFORE + 3 || offset > DAYS_AFTER - 3) anchorRef.current = startOfDay(selected);
  const anchorKey = ymd(anchorRef.current);

  const minKey = minDate ? ymd(minDate) : '';
  const days = useMemo(
    () => {
      const run = Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, i) => addDays(anchorRef.current, i - DAYS_BEFORE));
      return minDate ? run.filter((d) => d.getTime() >= startOfDay(minDate).getTime()) : run;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [anchorKey, minKey],
  );
  const selectedIndex = days.findIndex((d) => sameDay(d, selected));

  useEffect(() => {
    if (selectedIndex < 0) return;
    // Keep one chip of context to the left of the selection.
    listRef.current?.scrollToIndex({ index: Math.max(0, selectedIndex - 1), animated: true });
  }, [selectedIndex, anchorKey]);

  const tag = localeTag(locale);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.calendarTile}
        onPress={onOpenMonth}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('scheduler.openMonth')}
      >
        <FontAwesome name="calendar" size={30} color={Colors.white} />
      </TouchableOpacity>
      <FlatList
        ref={listRef}
        horizontal
        data={days}
        keyExtractor={(d) => ymd(d)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({ length: CHIP_WIDTH + CHIP_GAP, offset: (CHIP_WIDTH + CHIP_GAP) * index, index })}
        initialScrollIndex={Math.max(0, selectedIndex - 1)}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const key = ymd(item);
          const isSelected = sameDay(item, selected);
          const isToday = sameDay(item, today);
          const blocked = blockedDays.has(key);
          const weekday = item.toLocaleDateString(tag, { weekday: 'short' });
          return (
            <TouchableOpacity
              style={[
                styles.chip,
                blocked && styles.chipBlocked,
                isToday && !isSelected && styles.chipToday,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => onSelect(item)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={item.toLocaleDateString(tag, { weekday: 'long', month: 'long', day: 'numeric' })}
            >
              <Text style={[styles.weekday, isSelected && styles.textSelected]}>{weekday}</Text>
              <Text style={[styles.dayNumber, blocked && styles.dayBlocked, isSelected && styles.textSelected]}>
                {item.getDate()}
              </Text>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: busyDays.has(key) ? (isSelected ? Colors.white : Colors.primary) : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
    calendarTile: {
      width: 64, height: 84, borderRadius: 18, backgroundColor: Colors.primary,
      alignItems: 'center', justifyContent: 'center', marginRight: 6,
    },
    listContent: { paddingHorizontal: 6, paddingVertical: 8 },
    chip: {
      width: CHIP_WIDTH, height: 84, marginRight: CHIP_GAP, borderRadius: 18,
      backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios: { shadowColor: 'rgba(39, 42, 58, 0.10)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8 },
        android: { elevation: 2 },
      }),
    },
    chipToday: { borderWidth: 1.5, borderColor: Colors.primary },
    chipSelected: { backgroundColor: Colors.primary },
    chipBlocked: { backgroundColor: Colors.field },
    weekday: { fontSize: 13, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
    dayNumber: { fontSize: 22, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold', marginTop: 2 },
    dayBlocked: { color: Colors.textGray, textDecorationLine: 'line-through' },
    textSelected: { color: Colors.white },
    dot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  });
