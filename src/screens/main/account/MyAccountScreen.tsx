import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import { useAuth } from '../../../context/AuthContext';
import Cross from '../../../components/common/Cross';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const MENU_ITEMS = [
  { icon: 'user', labelKey: 'account.editProfile', screen: 'EditProfile', color: '#5A5DED' },
  { icon: 'heartbeat', labelKey: 'account.patientOverview', screen: 'PatientOverview', color: '#F97653' },
  { icon: 'medkit', labelKey: 'account.myHealth', screen: 'MyHealth', color: '#3FBE6E' },
  { icon: 'shield', labelKey: 'account.insurance', screen: 'Insurance', color: '#00CAAE' },
  { icon: 'medkit', labelKey: 'account.preferredPharmacy', screen: 'PreferredPharmacy', color: '#FF7043' },
  { icon: 'credit-card', labelKey: 'account.paymentInfo', screen: 'PaymentInfo', color: '#00897B' },
  { icon: 'users', labelKey: 'account.dependentsMenu', screen: 'AddDependent', color: '#7C4DFF' },
  { icon: 'bell', labelKey: 'account.notifications', screen: 'Notifications', color: '#0097A7' },
  { icon: 'cog', labelKey: 'account.settings', screen: 'Settings', color: '#607D8B' },
  { icon: 'lock', labelKey: 'account.changePassword', screen: 'ChangePassword', color: '#E91E63' },
  { icon: 'star', labelKey: 'account.peerReviews', screen: 'PeerReview', color: '#FFC107' },
  { icon: 'info-circle', labelKey: 'account.aboutUs', screen: 'AboutUs', color: '#4CAF50' },
];

export default function MyAccountScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(t('account.signOut'), t('account.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.signOut'), style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Purple gradient profile header */}
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
        <Cross size={38} opacity={0.05} rotation={22} style={{ top: 10, right: 120 }} />
        <Cross size={30} opacity={0.05} rotation={12} style={{ top: 70, left: 8 }} />
        <Cross size={26} opacity={0.05} rotation={-18} style={{ bottom: 26, right: 28 }} />
        <Cross size={22} opacity={0.04} rotation={14} style={{ top: 6, right: 180 }} />
        <Cross size={20} opacity={0.04} rotation={-12} style={{ bottom: 64, left: 130 }} />

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={34} color={Colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user ? `${user.firstName} ${user.lastName}` : 'John Doe'}
            </Text>
            <Text style={styles.userEmail}>{user?.email ?? 'patient@ekotelehealth.com'}</Text>
            <View style={styles.memberBadge}>
              <FontAwesome name={user?.accountType === 'Doctor' ? 'user-md' : 'check-circle'} size={11} color={Colors.green} />
              <Text style={styles.memberText}>  {user?.accountType === 'Doctor' ? t('account.doctorAccount') : t('account.patientAccount')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
            accessibilityRole="button"
            accessibilityLabel={t('account.editProfile')}
          >
            <FontAwesome name="pencil" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map(item => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen as any)}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={t(item.labelKey)}
          >
            <View style={[styles.menuIconBox, { backgroundColor: item.color + '20' }]}>
              <FontAwesome name={item.icon as any} size={18} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{t(item.labelKey)}</Text>
            <FontAwesome name="chevron-right" size={13} color={Colors.textGray} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <View style={[styles.menuIconBox, { backgroundColor: Colors.error + '18' }]}>
            <FontAwesome name="sign-out" size={18} color={Colors.error} />
          </View>
          <Text style={styles.logoutText}>{t('account.signOut')}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 + (insets.bottom || 0) }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
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
    width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 19, fontWeight: '800', color: Colors.white, fontFamily: 'Poppins_700Bold' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, marginBottom: 4, fontFamily: 'Poppins_400Regular' },
  memberBadge: { flexDirection: 'row', alignItems: 'center' },
  memberText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_400Regular' },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  content: { padding: 16 },

  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 18, padding: 14, marginTop: 8,
    borderWidth: 1, borderColor: Colors.error + '30',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.error, fontFamily: 'Poppins_600SemiBold' },
});
