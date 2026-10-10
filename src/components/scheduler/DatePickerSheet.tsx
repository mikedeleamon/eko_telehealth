import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SheetModal from '../common/SheetModal';
import MonthGrid, { type DaySummary } from './MonthGrid';
import { useTheme, type ThemeColors } from '../../theme';

interface Props {
  visible: boolean;
  title: string;
  value: Date;
  onSelect: (day: Date) => void;
  onClose: () => void;
  minDate?: Date;
  /** Optional context for the grid — the doctor's busy and blocked days. */
  summaries?: Map<string, DaySummary>;
  blocked?: Map<string, 'all' | 'partial'>;
}

const EMPTY_SUMMARIES = new Map<string, DaySummary>();
const EMPTY_BLOCKED = new Map<string, 'all' | 'partial'>();

/**
 * Bottom-sheet date picker built on the Scheduler's month grid. Unlike
 * CalendarSheet (made for dates of birth, so it looks backward), this one
 * pages forward and can show the doctor's existing schedule while picking.
 */
export default function DatePickerSheet({ visible, title, value, onSelect, onClose, minDate, summaries, blocked }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const [month, setMonth] = useState(value);
  useEffect(() => {
    if (visible) setMonth(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <SheetModal visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>
          <MonthGrid
            bare
            month={month}
            selected={value}
            onChangeMonth={setMonth}
            onSelectDay={(day) => {
              onSelect(day);
              onClose();
            }}
            summaries={summaries ?? EMPTY_SUMMARIES}
            blocked={blocked ?? EMPTY_BLOCKED}
            minDate={minDate}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </SheetModal>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 20, paddingBottom: 40,
    },
    grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 10, fontFamily: 'Poppins_700Bold' },
  });
