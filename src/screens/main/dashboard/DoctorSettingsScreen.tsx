import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import Cross from '../../../components/common/Cross';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const MENU_ITEMS = [
  { icon: 'user', label: 'Edit Profile', screen: 'EditProfile', color: '#5A5DED' },
  { icon: 'bell', label: 'Notifications', screen: 'Notifications', color: '#0097A7' },
  { icon: 'cog', label: 'Preferences', screen: 'Preferences', color: '#607D8B' },
  { icon: 'lock', label: 'Change Password', screen: 'ChangePassword', color: '#E91E63' },
  { icon: 'star', label: 'Reviews', screen: 'Reviews', color: '#FFC107' },
  { icon: 'info-circle', label: 'About Us', screen: 'AboutUs', color: '#4CAF50' },
];

export default function DoctorSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Cross size={160} opacity={0.09} rotation={14} style={{ top: -56, right: -44 }} />
        <Cross size={90} opacity={0.07} rotation={-12} style={{ bottom: -20, left: 24 }} />
        <Cross size={60} opacity={0.06} rotation={18} style={{ top: -16, left: -20 }} />
        <Cross size={48} opacity={0.06} rotation={-16} style={{ bottom: 30, right: 100 }} />

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <FontAwesome name="user-md" size={34} color={Colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. Sarah Johnson'}
            </Text>
            <Text style={styles.userEmail}>{user?.email ?? 'dr.johnson@ekotelehealth.com'}</Text>
            <View style={styles.memberBadge}>
              <FontAwesome name="user-md" size={11} color={Colors.green} />
              <Text style={styles.memberText}>  Doctor Account</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <FontAwesome name="pencil" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen as any)}
            activeOpacity={0.78}
          >
            <View style={[styles.menuIconBox, { backgroundColor: item.color + '20' }]}>
              <FontAwesome name={item.icon as any} size={18} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <FontAwesome name="chevron-right" size={13} color={Colors.textGray} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <View style={[styles.menuIconBox, { backgroundColor: Colors.error + '18' }]}>
            <FontAwesome name="sign-out" size={18} color={Colors.error} />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Eko Telehealth v1.0.0</Text>
        <View style={{ height: 24 + (insets.bottom || 0) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    paddingHorizontal: 20, paddingBottom: 24, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 19, fontWeight: '800', color: Colors.white, fontFamily: 'Poppins_700Bold' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, marginBottom: 4, fontFamily: 'Poppins_400Regular' },
  memberBadge: { flexDirection: 'row', alignItems: 'center' },
  memberText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_400Regular' },
  editBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: 16 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 18, padding: 14, marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  menuIconBox: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textDark, fontFamily: 'Poppins_500Medium' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 18, padding: 14, marginTop: 8,
    borderWidth: 1, borderColor: Colors.error + '30',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.error, fontFamily: 'Poppins_600SemiBold' },
  version: { textAlign: 'center', fontSize: 13, color: Colors.textGray, marginTop: 24 },
});
