import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { parseDMY, formatDMY, MONTH_NAMES } from '../../utils/format';

interface Props {
  visible: boolean;
  /** Current value as DD-MM-YYYY, used to preselect and open on that month. */
  value?: string;
  onSelect: (dmy: string) => void;
  onClose: () => void;
  /** When true, days after today are disabled — used for dates of birth. */
  disableFuture?: boolean;
  title?: string;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const YEAR_SPAN = 120; // years back from today the year picker offers

export default function CalendarSheet({
  visible, value, onSelect, onClose, disableFuture = false, title = 'Select Date',
}: Props) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const selected = value ? parseDMY(value) : null;
  const initial = selected ?? today;

  // View month is independent of the selection so the user can browse freely.
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [yearPicker, setYearPicker] = useState(false);

  // Re-sync the visible month whenever the sheet is reopened for a new field.
  React.useEffect(() => {
    if (visible) {
      const base = (value ? parseDMY(value) : null) ?? today;
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
      setYearPicker(false);
    }
  }, [visible]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const isDisabled = (day: number) =>
    disableFuture && new Date(viewYear, viewMonth, day).getTime() > today.getTime();

  const isSelected = (day: number) =>
    !!selected &&
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const pick = (day: number) => {
    if (isDisabled(day)) return;
    onSelect(formatDMY(new Date(viewYear, viewMonth, day)));
    onClose();
  };

  const years = useMemo(() => {
    const current = today.getFullYear();
    const arr: number[] = [];
    for (let y = current; y >= current - YEAR_SPAN; y--) arr.push(y);
    return arr;
  }, [today]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>

          {/* Month / year header */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => goMonth(-1)} style={styles.navBtn} hitSlop={hit}>
              <FontAwesome name="chevron-left" size={16} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setYearPicker(v => !v)} style={styles.monthLabelBtn}>
              <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
              <FontAwesome name={yearPicker ? 'caret-up' : 'caret-down'} size={14} color={Colors.textGray} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => goMonth(1)} style={styles.navBtn} hitSlop={hit}>
              <FontAwesome name="chevron-right" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {yearPicker ? (
            <ScrollView style={styles.yearScroll} contentContainerStyle={styles.yearGrid}>
              {years.map(y => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearCell, y === viewYear && styles.yearCellActive]}
                  onPress={() => { setViewYear(y); setYearPicker(false); }}
                >
                  <Text style={[styles.yearText, y === viewYear && styles.yearTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <>
              <View style={styles.weekRow}>
                {WEEKDAY_LABELS.map(d => (
                  <Text key={d} style={styles.weekLabel}>{d}</Text>
                ))}
              </View>
              <View style={styles.grid}>
                {cells.map((day, i) => (
                  <View key={i} style={styles.cell}>
                    {day != null && (
                      <TouchableOpacity
                        style={[styles.dayBtn, isSelected(day) && styles.dayBtnSelected]}
                        onPress={() => pick(day)}
                        disabled={isDisabled(day)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isToday(day) && !isSelected(day) && styles.dayTextToday,
                            isSelected(day) && styles.dayTextSelected,
                            isDisabled(day) && styles.dayTextDisabled,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 32,
  },
  grabber: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderGray, marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textDark, textAlign: 'center', marginBottom: 12, fontFamily: 'Poppins_700Bold' },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center',
  },
  monthLabelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },

  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: Colors.textGray, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayBtnSelected: { backgroundColor: Colors.primary },
  dayText: { fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  dayTextToday: { color: Colors.primary, fontWeight: '700' },
  dayTextSelected: { color: Colors.white, fontWeight: '700' },
  dayTextDisabled: { color: Colors.textLight },

  yearScroll: { maxHeight: 260 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  yearCell: { width: '31%', paddingVertical: 12, alignItems: 'center', borderRadius: 12, marginBottom: 8, backgroundColor: Colors.bgLight },
  yearCellActive: { backgroundColor: Colors.primary },
  yearText: { fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },
  yearTextActive: { color: Colors.white, fontWeight: '700' },
});
