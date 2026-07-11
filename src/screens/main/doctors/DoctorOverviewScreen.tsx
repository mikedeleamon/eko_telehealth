import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const today = new Date();
const CALENDAR = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  return { day: DAYS[d.getDay()], date: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
});

const VISIT_TYPES = ['Home Visit', 'Clinic Visit', 'Video Visit'];
const SLOTS = ['09-10:00', '10-11:00', '11-12:00', '01-02:00', '02-03:00', '03-04:00'];

export default function DoctorOverviewScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const doctor = route.params?.doctor ?? {
    name: 'Dr. Amara Okafor', specialty: 'Therapist, Primary care doctor',
    rating: 4.5, reviews: 79, location: 'Victoria Island, Lagos', fee: '₦15,000', available: true, avatar: null,
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule'>(
    route.params?.initialTab === 'schedule' ? 'schedule' : 'overview'
  );
  const [selectedDay, setSelectedDay] = useState(0);
  const [visitType, setVisitType] = useState('Home Visit');
  const [selectedSlot, setSelectedSlot] = useState<string | null>('01-02:00');

  const specialty = String(doctor.specialty ?? '').split(',')[0].trim();
  const month = CALENDAR[selectedDay];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Photo header */}
      <View style={styles.photoWrap}>
        <View style={styles.photo}>
          {doctor.avatar ? (
            <Image source={{ uri: doctor.avatar }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#DCE7F5', '#EEF3FA']} style={StyleSheet.absoluteFill}>
              <View style={styles.placeholderIcon}>
                <FontAwesome name="user-md" size={120} color="rgba(108,92,231,0.22)" />
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Back */}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="arrow-left" size={22} color={Colors.accent} />
        </TouchableOpacity>

        {/* Vertical tabs */}
        <View style={[styles.sideTabs, { top: insets.top + 70 }]}>
          {(['overview', 'schedule'] as const).map((t) => {
            const active = activeTab === t;
            return (
              <TouchableOpacity key={t} style={styles.sideTabItem} onPress={() => setActiveTab(t)} activeOpacity={0.8}>
                <Text style={[styles.sideTabLabel, { color: active ? Colors.accent : Colors.textGray }]}>
                  {t === 'overview' ? 'Overview' : 'Schedule'}
                </Text>
                {active ? <View style={styles.sideDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Floating action buttons straddling the photo bottom */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AudioCall', { doctor })} activeOpacity={0.85}>
          <FontAwesome name="phone" size={20} color={Colors.green} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Chat', { doctor })} activeOpacity={0.85}>
          <FontAwesome name="comment" size={20} color={Colors.red} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('VideoCall', { doctor })} activeOpacity={0.85}>
          <FontAwesome name="video-camera" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Name + rating */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{doctor.name}</Text>
          <FontAwesome name="star" size={18} color="#F5A623" style={{ marginLeft: 8 }} />
          <Text style={styles.ratingText}>{doctor.rating}</Text>
        </View>

        {/* Specialty pill */}
        <View style={styles.specialtyPill}>
          <Text style={styles.specialtyText}>{specialty || 'Specialist'}</Text>
        </View>

        {activeTab === 'overview' ? (
          <>
            <Text style={styles.sectionHeading}>Get Closer with me</Text>
            <Text style={styles.bio}>
              {doctor.name} is a board-certified {specialty.toLowerCase() || 'specialist'} dedicated to
              compassionate, patient-centered care. With years of clinical experience, {doctor.name.split(' ')[0]}{' '}
              helps patients feel heard, understood, and supported every step of the way — whether through a
              video visit, clinic appointment, or home visit.
            </Text>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: Colors.accent }]}>
                <Text style={styles.statLabel}>Patient</Text>
                <Text style={styles.statValue}>10K</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
                <Text style={styles.statLabel}>Experience</Text>
                <Text style={styles.statValue}>3 Years</Text>
              </View>
              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: '#00CAAE' }]}
                onPress={() => navigation.navigate('Reviews', { doctor })}
                activeOpacity={0.85}
              >
                <Text style={styles.statLabel}>Rating</Text>
                <Text style={styles.statValue}>{doctor.rating}</Text>
                <FontAwesome name="arrow-right" size={16} color={Colors.white} style={{ marginTop: 4 }} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.monthLabel}>{MONTHS[month.month]},{month.year}</Text>

            {/* Date selector */}
            <View style={styles.dateRow}>
              <View style={styles.calBtn}>
                <FontAwesome name="calendar" size={20} color={Colors.white} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 12 }}>
                {CALENDAR.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dayChip, selectedDay === i && styles.dayChipActive]}
                    onPress={() => setSelectedDay(i)}
                  >
                    <Text style={[styles.dayName, selectedDay === i && styles.dayActiveText]}>{item.day}</Text>
                    <Text style={[styles.dayNum, selectedDay === i && styles.dayActiveText]}>{item.date}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Visit types */}
            <View style={styles.visitRow}>
              {VISIT_TYPES.map((v) => {
                const active = visitType === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[styles.visitBtn, active && styles.visitBtnActive]}
                    onPress={() => setVisitType(v)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.visitText, active && styles.visitTextActive]}>
                      {v.replace(' ', '\n')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time slots */}
            <View style={styles.slotsGrid}>
              {SLOTS.map((slot) => {
                const active = selectedSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slot, active && styles.slotActive]}
                    onPress={() => setSelectedSlot(slot)}
                    activeOpacity={0.85}
                  >
                    <FontAwesome name="clock-o" size={13} color={active ? Colors.white : Colors.textGray} />
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>  {slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.bookBtn}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('CreateAppointment', { doctor, slot: selectedSlot, date: month, type: visitType })}
            >
              <Text style={styles.bookBtnText}>MAKE AN APPOINTMENT</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const PHOTO_HEIGHT = 360;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  photoWrap: { height: PHOTO_HEIGHT, width: '100%' },
  photo: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  placeholderIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  backBtn: { position: 'absolute', left: 16, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  sideTabs: { position: 'absolute', left: 2, alignItems: 'center' },
  sideTabItem: { height: 110, width: 40, alignItems: 'center', justifyContent: 'center' },
  sideTabLabel: {
    width: 110, textAlign: 'center', fontSize: 15, fontWeight: '600',
    transform: [{ rotate: '-90deg' }], fontFamily: 'Poppins_600SemiBold',
  },
  sideDot: { position: 'absolute', top: 16, right: 4, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent },

  actionRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 18,
    marginTop: -28, zIndex: 5,
  },
  actionBtn: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: 'rgba(39,42,58,0.18)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },

  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 26, fontWeight: '800', color: Colors.textDark, flexShrink: 1, fontFamily: 'Poppins_700Bold' },
  ratingText: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginLeft: 4, fontFamily: 'Poppins_600SemiBold' },

  specialtyPill: {
    alignSelf: 'flex-start', backgroundColor: Colors.accent,
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, marginBottom: 22,
  },
  specialtyText: { fontSize: 14, fontWeight: '600', color: Colors.white, fontFamily: 'Poppins_600SemiBold' },

  // Overview
  sectionHeading: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginBottom: 10, fontFamily: 'Poppins_700Bold' },
  bio: { fontSize: 14, color: Colors.textGray, lineHeight: 24, marginBottom: 24, fontFamily: 'Poppins_400Regular' },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 14,
    minHeight: 96, justifyContent: 'center',
  },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 4, fontFamily: 'Poppins_400Regular' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.white, fontFamily: 'Poppins_700Bold' },

  // Schedule
  monthLabel: { fontSize: 13, fontWeight: '700', color: Colors.textDark, marginBottom: 14, letterSpacing: 0.5, fontFamily: 'Poppins_600SemiBold' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  calBtn: {
    width: 60, height: 64, borderRadius: 16, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  dayChip: {
    width: 60, height: 64, borderRadius: 16, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.borderGray,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayName: { fontSize: 12, color: Colors.textGray, marginBottom: 4, fontFamily: 'Poppins_400Regular' },
  dayNum: { fontSize: 18, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  dayActiveText: { color: Colors.white },

  visitRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  visitBtn: {
    flex: 1, height: 70, borderRadius: 16, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.borderGray,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  visitBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  visitText: { fontSize: 14, fontWeight: '600', color: Colors.textGray, textAlign: 'center', lineHeight: 18, fontFamily: 'Poppins_600SemiBold' },
  visitTextActive: { color: Colors.white },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  slot: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '30.5%', paddingVertical: 12, borderRadius: 14,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.borderGray,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  slotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotText: { fontSize: 12, fontWeight: '600', color: Colors.textMedium, fontFamily: 'Poppins_600SemiBold' },
  slotTextActive: { color: Colors.white },

  bookBtn: {
    height: 58, borderRadius: 30, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  bookBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white, letterSpacing: 0.5, fontFamily: 'Poppins_700Bold' },
});
