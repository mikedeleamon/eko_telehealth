import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, StatusBar, Platform, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoButton from '../../../components/common/EkoButton';
import Cross from '../../../components/common/Cross';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { LANGUAGE_OPTIONS } from '../../../constants';
import { sanitizePhoneInput, isValidPhone } from '../../../utils/format';
import { pickPhoto, FileTooLargeError } from '../../../utils/pickMedia';
import { useTranslation } from '../../../i18n/useTranslation';
import { TAB_BAR_SPACE } from '../../../constants/layout';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function EditProfileScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  // Who this account holder can communicate with (task 2.5) — distinct from
  // the app's own display language, set separately in Settings.
  const [spokenLanguages, setSpokenLanguages] = useState<string[]>(user?.spokenLanguages ?? []);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar ?? null);

  const syncSession = (updated: typeof user) => {
    const session = useAuthStore.getState().session;
    if (session && updated) useAuthStore.getState().setSession({ ...session, user: updated });
  };

  const pickAvatarFrom = async (source: 'camera' | 'library') => {
    try {
      const file = await pickPhoto(source);
      if (!file) return;
      setAvatarUploading(true);
      const updated = await api.auth.updateAvatar(file);
      setAvatar(updated.avatar);
      syncSession(updated);
    } catch (err) {
      const message = err instanceof FileTooLargeError ? t('documents.tooLarge') : err instanceof Error ? err.message : t('common.somethingWentWrong');
      Alert.alert(t('account.couldNotUpdateAvatar'), message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const changeAvatar = () => {
    Alert.alert(t('account.profilePhoto'), undefined, [
      { text: t('account.takePhoto'), onPress: () => pickAvatarFrom('camera') },
      { text: t('account.chooseFromLibrary'), onPress: () => pickAvatarFrom('library') },
      { text: t('documents.cancel'), style: 'cancel' },
    ]);
  };

  const toggleLanguage = (lang: string) => {
    setSpokenLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  };

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) return Alert.alert('', t('account.nameEmpty'));
    if (phone.trim() && !isValidPhone(phone)) return Alert.alert('', t('account.validPhone'));
    setLoading(true);
    try {
      const updated = await api.auth.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        spokenLanguages,
      });
      // Refresh the persisted session so the whole app shows the new name.
      syncSession(updated);
      Alert.alert(t('auth.success'), t('account.profileUpdatedFull'), [{ text: t('common.ok'), onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert(t('account.couldNotUpdateProfile'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Purple gradient header */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <Cross size={150} opacity={0.09} rotation={14} style={{ top: -50, right: -36 }} />
          <Cross size={70} opacity={0.07} rotation={-12} style={{ bottom: 10, left: -20 }} />
          <Cross size={44} opacity={0.06} rotation={20} style={{ top: 30, right: 90 }} />
          <Cross size={30} opacity={0.05} rotation={-16} style={{ bottom: 50, right: 40 }} />

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('a11y.back')}>
            <FontAwesome name="arrow-left" size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('account.editProfile')}</Text>
        </LinearGradient>

        {/* Overlapping avatar + name */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={changeAvatar}
            activeOpacity={0.85}
            disabled={avatarUploading}
            accessibilityRole="button"
            accessibilityLabel={t('account.profilePhoto')}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} resizeMode="cover" accessibilityIgnoresInvertColors />
            ) : (
              <FontAwesome name="user" size={44} color={Colors.primary} />
            )}
            {avatarUploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={Colors.white} size="small" />
              </View>
            ) : (
              <View style={styles.avatarBadge}>
                <FontAwesome name="camera" size={13} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>
          {user ? `${user.firstName} ${user.lastName}` : 'John Williamson'}
        </Text>

        {/* Form (fields unchanged) */}
        <View style={styles.form}>
          <EkoTextField label={t('account.firstName')} placeholder={t('account.firstName')} icon="user" value={firstName} onChangeText={setFirstName} />
          <EkoTextField label={t('account.lastName')} placeholder={t('account.lastName')} icon="user" value={lastName} onChangeText={setLastName} />
          {/* Email is the login identifier + password-reset destination, so it
              can't be changed from a profile save — it would need a verified
              email-change flow. Shown read-only. */}
          <EkoTextField label={t('account.email')} placeholder={t('account.email')} icon="envelope-o" value={user?.email ?? ''} editable={false} />
          <EkoTextField label={t('account.phone')} placeholder={t('account.phonePlaceholder')} icon="phone" value={phone} onChangeText={(val) => setPhone(sanitizePhoneInput(val))} keyboardType="phone-pad" />

          <Text style={styles.chipLabel}>{t('account.spokenLanguages')}</Text>
          <View style={styles.chipRow}>
            {LANGUAGE_OPTIONS.map((lang) => {
              const active = spokenLanguages.includes(lang);
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleLanguage(lang)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{lang}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <EkoButton title={t('account.update')} variant="accent" onPress={save} loading={loading} style={styles.btn} />
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingBottom: TAB_BAR_SPACE },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 64,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center', marginLeft: -8 },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: Colors.white,
    marginTop: 10, fontFamily: 'Poppins_700Bold',
  },

  avatarWrap: { alignItems: 'center', marginTop: -50 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: Colors.white,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.18)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute', right: 0, bottom: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  name: {
    fontSize: 19, fontWeight: '700', color: Colors.textDark,
    textAlign: 'center', marginTop: 12, marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
  },

  form: { paddingHorizontal: 20 },
  chipLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginTop: 4, marginBottom: 8, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.field,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500' },
  chipTextActive: { color: Colors.white },
  btn: { marginTop: 8 },
});
