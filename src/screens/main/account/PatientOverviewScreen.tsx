import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function PatientOverviewScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chart' | 'about'>('chart');

  const CARE_TEAM = [
    { name: 'Dr. Sarah Johnson', role: 'Primary Care' },
    { name: 'Dr. Michael Chen', role: 'Eye Doctor' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome name="chevron-left" size={16} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.profileArea}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : 'John Doe'}</Text>
          <Text style={styles.email}>{user?.email ?? 'patient@example.com'}</Text>
        </View>

        <View style={styles.tabRow}>
          {(['chart', 'about'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.tabActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'chart' ? 'My Chart' : 'About'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'chart' ? (
          <>
            <Text style={styles.sectionTitle}>Care Team</Text>
            {CARE_TEAM.map((doc) => (
              <View key={doc.name} style={styles.careCard}>
                <View style={styles.careAvatar}>
                  <FontAwesome name="user-md" size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.careName}>{doc.name}</Text>
                  <Text style={styles.careRole}>{doc.role}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Recent Activities</Text>
            {['Video visit - Dr. Johnson', 'Lab results received', 'Medication refill requested'].map((item) => (
              <View key={item} style={styles.activityRow}>
                <FontAwesome name="clock-o" size={14} color={Colors.primary} style={styles.activityIcon} />
                <Text style={styles.activityText}>{item}</Text>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <InfoRow label="Full Name" value={user ? `${user.firstName} ${user.lastName}` : 'John Doe'} />
            <InfoRow label="Email" value={user?.email ?? 'patient@example.com'} />
            <InfoRow label="Blood Type" value="O+" />
            <InfoRow label="Allergies" value="None reported" />
            <InfoRow label="Emergency Contact" value="Jane Doe · (555) 123-4567" />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  header: { paddingBottom: 0 },
  backBtn: { marginLeft: 16, marginTop: 8, width: 36, height: 36, justifyContent: 'center' },
  profileArea: { alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  name: { fontSize: 20, fontWeight: '800', color: Colors.white },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16 },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.white },
  tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: Colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginTop: 16, marginBottom: 12 },
  careCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12,
    padding: 14, marginBottom: 8, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  careAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  careName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  careRole: { fontSize: 12, color: Colors.textGray },
  activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 10, padding: 12, marginBottom: 8 },
  activityIcon: { marginRight: 10 },
  activityText: { fontSize: 14, color: Colors.textDark },
  infoRow: {
    backgroundColor: Colors.white, borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  infoLabel: { fontSize: 13, color: Colors.textGray },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.textDark, flex: 1, textAlign: 'right' },
});
