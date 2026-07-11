import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import Cross from './Cross';

interface Props {
  title: string;
  onBack?: () => void;
  rightAction?: { icon: string; onPress: () => void };
  transparent?: boolean;
}

export default function EkoHeader({ title, onBack, rightAction, transparent }: Props) {
  const insets = useSafeAreaInsets();

  if (transparent) {
    return (
      <View style={[styles.transparentContainer, { paddingTop: insets.top + 8 }]}>
        <StatusBar barStyle="light-content" />
        {onBack ? (
          <TouchableOpacity style={styles.sideBtn} onPress={onBack}>
            <FontAwesome name="arrow-left" size={18} color={Colors.white} />
          </TouchableOpacity>
        ) : <View style={styles.sideBtn} />}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {rightAction ? (
          <TouchableOpacity style={styles.sideBtn} onPress={rightAction.onPress}>
            <FontAwesome name={rightAction.icon as any} size={20} color={Colors.white} />
          </TouchableOpacity>
        ) : <View style={styles.sideBtn} />}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.container, { paddingTop: insets.top + 8 }]}
    >
      <StatusBar barStyle="light-content" />

      {/* Medical cross motifs */}
      <Cross size={120} opacity={0.09} rotation={12} style={{ top: -40, right: -24 }} />
      <Cross size={84} opacity={0.07} rotation={-10} style={{ bottom: -28, left: 36 }} />
      <Cross size={60} opacity={0.06} rotation={18} style={{ top: -16, left: -18 }} />
      <Cross size={48} opacity={0.06} rotation={-14} style={{ top: 6, right: 96 }} />
      <Cross size={40} opacity={0.05} rotation={22} style={{ bottom: 0, right: 70 }} />
      <Cross size={32} opacity={0.05} rotation={-18} style={{ bottom: 8, right: 20 }} />
      <Cross size={28} opacity={0.05} rotation={14} style={{ top: -6, left: 70 }} />
      <Cross size={24} opacity={0.04} rotation={-12} style={{ top: 18, right: 160 }} />
      <Cross size={20} opacity={0.04} rotation={26} style={{ bottom: 16, left: 110 }} />

      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity style={styles.sideBtn} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name="arrow-left" size={18} color={Colors.white} />
          </TouchableOpacity>
        ) : <View style={styles.sideBtn} />}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {rightAction ? (
          <TouchableOpacity style={styles.sideBtn} onPress={rightAction.onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name={rightAction.icon as any} size={20} color={Colors.white} />
          </TouchableOpacity>
        ) : <View style={styles.sideBtn} />}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  transparentContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: 'transparent',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  sideBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700',
    color: Colors.white, fontFamily: 'Poppins_700Bold',
  },
});
