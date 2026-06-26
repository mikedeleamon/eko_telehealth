import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { MOCK_APPOINTMENTS, MOCK_DOCTOR_SCHEDULE } from '../../../constants';
import AppointmentCard from '../../../components/appointments/AppointmentCard';
import Cross from '../../../components/common/Cross';
import { useAuth } from '../../../context/AuthContext';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function AppointmentsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isDoctor } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const source = isDoctor ? MOCK_DOCTOR_SCHEDULE : MOCK_APPOINTMENTS;
  const data = source.filter((a) => a.status === tab);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Cross size={130} opacity={0.09} rotation={14} style={{ top: -40, right: -18 }} />
        <Cross size={84} opacity={0.07} rotation={-12} style={{ bottom: -24, left: 40 }} />
        <Cross size={58} opacity={0.06} rotation={18} style={{ top: -12, left: -16 }} />
        <Cross size={46} opacity={0.06} rotation={-16} style={{ bottom: 44, right: 96 }} />
        <Cross size={36} opacity={0.05} rotation={22} style={{ top: 14, right: 90 }} />
        <Cross size={30} opacity={0.05} rotation={12} style={{ top: 60, left: -8 }} />
        <Cross size={26} opacity={0.05} rotation={-18} style={{ bottom: 12, left: 24 }} />
        <Cross size={22} opacity={0.04} rotation={14} style={{ top: 4, right: 170 }} />
        <Cross size={20} opacity={0.04} rotation={-12} style={{ bottom: 56, right: 24 }} />
        <Text style={styles.headerTitle}>Appointments</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}
            onPress={() => setTab('upcoming')}
          >
            <Text style={[styles.tabBtnText, tab === 'upcoming' && styles.tabBtnTextActive]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'past' && styles.tabBtnActive]}
            onPress={() => setTab('past')}
          >
            <Text style={[styles.tabBtnText, tab === 'past' && styles.tabBtnTextActive]}>History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
            showActions={isDoctor && item.status === 'upcoming'}
            onAccept={() => Alert.alert('Appointment Accepted', `You accepted the appointment with ${item.doctor}.`)}
            onDecline={() => Alert.alert('Appointment Declined', `You declined the appointment with ${item.doctor}.`)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="calendar-o" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No {tab} appointments</Text>
            {tab === 'upcoming' && !isDoctor && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('HomeTab')}
              >
                <Text style={styles.emptyBtnText}>Find a Doctor</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },

  header: {
    paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: Colors.white,
    marginBottom: 16, fontFamily: 'Poppins_700Bold',
  },

  tabRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16, padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13 },
  tabBtnActive: { backgroundColor: Colors.white },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_600SemiBold' },
  tabBtnTextActive: { color: Colors.primary, fontFamily: 'Poppins_700Bold' },

  list: { padding: 16, paddingBottom: 24 },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: Colors.textGray, marginTop: 12, marginBottom: 16, fontFamily: 'Poppins_400Regular' },
  emptyBtn: {
    backgroundColor: Colors.primary, borderRadius: 24,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white, fontFamily: 'Poppins_700Bold' },
});
