import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ScrollView, StatusBar, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { SPECIALTY_CHIPS } from '../../../constants';
import { useAppointments, useConversations, useDoctors } from '../../../hooks/queries';
import DoctorCard from '../../../components/doctors/DoctorCard';
import AppointmentCard from '../../../components/appointments/AppointmentCard';
import Cross from '../../../components/common/Cross';
import { useAuth } from '../../../context/AuthContext';
import { EMPTY_FILTERS, type DoctorFilters } from './FilterScreen';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function MyDoctorsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  // Set by FilterScreen navigating back with merge:true.
  const filters: DoctorFilters = route.params?.filters ?? EMPTY_FILTERS;

  const chips = [{ label: 'All', count: null, color: Colors.primary }, ...SPECIALTY_CHIPS];

  const { data: doctors = [] } = useDoctors();
  const { data: appointments = [] } = useAppointments();
  const { data: conversationList = [] } = useConversations();

  const filtered = doctors.filter(d => {
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase());
    const matchChip = activeChip === 'All' || d.specialty.toLowerCase().includes(activeChip.toLowerCase()) || d.category === activeChip;
    const matchSpecialty = !filters.specialties.length || filters.specialties.includes(d.category);
    const matchRating = d.rating >= filters.minRating;
    const matchAvailable = !filters.availableOnly || d.available;
    return matchSearch && matchChip && matchSpecialty && matchRating && matchAvailable;
  });

  const todayAppts = appointments.filter(a => a.status === 'upcoming').slice(0, 2);
  const unreadCount = conversationList.reduce((n, c) => n + c.unread, 0);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Purple gradient header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Medical cross motifs */}
        <Cross size={150} opacity={0.09} rotation={14} style={{ top: -50, right: -36 }} />
        <Cross size={90} opacity={0.07} rotation={-12} style={{ bottom: 10, left: -28 }} />
        <Cross size={64} opacity={0.06} rotation={18} style={{ bottom: -16, left: 110 }} />
        <Cross size={48} opacity={0.06} rotation={-16} style={{ top: 8, right: 150 }} />
        <Cross size={40} opacity={0.05} rotation={22} style={{ top: 70, right: 90 }} />
        <Cross size={34} opacity={0.05} rotation={-18} style={{ bottom: 64, right: 30 }} />
        <Cross size={28} opacity={0.05} rotation={24} style={{ top: 96, left: 24 }} />
        <Cross size={24} opacity={0.04} rotation={-14} style={{ top: 30, left: 60 }} />
        <Cross size={20} opacity={0.04} rotation={16} style={{ bottom: 90, right: 130 }} />

        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            {user?.role === 'Doctor' ? `Welcome,\nDr. ${user.lastName}` : 'Find Your\nConsultation'}
          </Text>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Messages')}
            >
              <FontAwesome name="comment" size={19} color={Colors.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('AccountTab')}>
              <FontAwesome name="user" size={16} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <FontAwesome name="bell" size={19} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={15} color={Colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Condition, Procedure, Doctor Name"
            placeholderTextColor={Colors.textGray}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <FontAwesome name="times-circle" size={15} color={Colors.textGray} />
            </TouchableOpacity>
          )}
          <View style={styles.searchDivider} />
          <TouchableOpacity onPress={() => navigation.navigate('Filter', { filters })}>
            <FontAwesome
              name="sliders"
              size={16}
              color={
                filters.specialties.length || filters.minRating > 0 || filters.availableOnly
                  ? Colors.primary
                  : Colors.textGray
              }
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Specialty chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top specialties Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {chips.map(chip => {
              const active = activeChip === chip.label;
              return (
                <TouchableOpacity
                  key={chip.label}
                  style={[styles.chip, { backgroundColor: chip.color }, active && styles.chipActive]}
                  onPress={() => setActiveChip(chip.label)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipLabel}>{chip.label}</Text>
                  {chip.count ? (
                    <View style={styles.chipCount}>
                      <Text style={styles.chipCountText}>{chip.count}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Today's Appointments */}
        {todayAppts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Today's Appointments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AppointmentsTab')}>
                <Text style={styles.viewAll}>View List</Text>
              </TouchableOpacity>
            </View>
            {todayAppts.map(a => (
              <AppointmentCard key={a.id} appointment={a} cardColor={Colors.cardColors[1]} onPress={() => navigation.navigate('AppointmentDetails', { appointment: a })} />
            ))}
          </View>
        )}

        {/* Doctor list */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>
              {activeChip === 'All' ? 'All Doctors' : activeChip}
            </Text>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <FontAwesome name="user-md" size={40} color={Colors.textLight} />
              <Text style={styles.emptyText}>No doctors found</Text>
            </View>
          ) : (
            filtered.map((item, index) => (
              <DoctorCard
                key={item.id}
                doctor={item}
                onPress={() => navigation.navigate('DoctorOverview', { doctor: item })}
                onChat={() => navigation.navigate('Chat', { doctor: item })}
                cardColor={Colors.cardColors[index % Colors.cardColors.length]}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgLight },

  header: {
    paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, lineHeight: 33, fontFamily: 'Poppins_700Bold' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },

  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -3, right: -3,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, color: Colors.white, fontWeight: '800' },

  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 16,
    paddingHorizontal: 14, height: 48, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  searchDivider: { width: 1, height: 18, backgroundColor: Colors.borderGray },

  body: { flex: 1 },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  viewAll: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  chipsRow: { paddingBottom: 4, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, gap: 6,
  },
  chipActive: { opacity: 1, borderWidth: 2, borderColor: Colors.white },
  chipLabel: { fontSize: 13, fontWeight: '600', color: Colors.white, fontFamily: 'Poppins_600SemiBold' },
  chipCount: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1,
  },
  chipCountText: { fontSize: 11, color: Colors.white, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 15, color: Colors.textGray, marginTop: 10, fontFamily: 'Poppins_400Regular' },
});
