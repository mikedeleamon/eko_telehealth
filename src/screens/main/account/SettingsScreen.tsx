import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, useThemeMode, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { api } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { useAuthStore } from '../../../store/authStore';
import { useCurrencies, useSaveSettings, useSettings } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { SUPPORTED_LOCALES } from '../../../store/localeStore';
import { THEME_MODES, type ThemeMode } from '../../../store/themeStore';
import type { UserSettings } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/** Keys of UserSettings that are plain on/off switches (excludes themeMode). */
type BooleanSettingKey = {
  [K in keyof UserSettings]: UserSettings[K] extends boolean ? K : never;
}[keyof UserSettings];

/**
 * Preferences persist server-side (GET/PATCH /me/settings) so they follow the
 * user across devices. Each toggle saves immediately — there's no Save button,
 * so leaving the screen must not lose the change.
 */
export default function SettingsScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t, locale, setLocale } = useTranslation();
  const { mode: themeMode, setMode: setThemeMode } = useThemeMode();
  const { data: settings, isLoading } = useSettings();
  const saveSettings = useSaveSettings();
  const { user } = useAuth();
  const { data: currencies = [] } = useCurrencies();
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingTwoFactor, setSavingTwoFactor] = useState(false);

  // Display currency (task 2.4) lives on the user profile, not the
  // userSettings table — save through the same PATCH /auth/me + session
  // refresh path EditProfileScreen uses, not useSaveSettings.
  const selectCurrency = async (code: string) => {
    if (code === user?.preferredCurrency || savingCurrency) return;
    setSavingCurrency(true);
    try {
      const updated = await api.auth.updateProfile({ preferredCurrency: code });
      const session = useAuthStore.getState().session;
      if (session) useAuthStore.getState().setSession({ ...session, user: updated });
    } catch (err) {
      Alert.alert(t('settings.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    } finally {
      setSavingCurrency(false);
    }
  };

  // 2FA lives on the user profile (like preferredCurrency), not userSettings —
  // same PATCH /auth/me + session refresh path as selectCurrency above.
  const toggleTwoFactor = async (value: boolean) => {
    if (savingTwoFactor) return;
    setSavingTwoFactor(true);
    try {
      const updated = await api.auth.updateProfile({ twoFactorEnabled: value });
      const session = useAuthStore.getState().session;
      if (session) useAuthStore.getState().setSession({ ...session, user: updated });
    } catch (err) {
      Alert.alert(t('settings.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    } finally {
      setSavingTwoFactor(false);
    }
  };

  // Theme lives in a local persisted store so it applies instantly on launch;
  // we also persist the full preference server-side so it follows the user
  // across devices (ThemeServerSync reconciles it back in on load).
  const applyThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveSettings.mutate({ themeMode: mode });
  };

  const toggle = (key: BooleanSettingKey) => (value: boolean) => {
    saveSettings.mutate(
      { [key]: value },
      {
        onError: (err) =>
          // The cache still holds the server's value, so the switch snaps back
          // on its own — just explain why.
          Alert.alert(t('settings.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong')),
      },
    );
  };

  const ToggleRow = ({
    label,
    sub,
    settingKey,
  }: {
    label: string;
    sub?: string;
    settingKey: BooleanSettingKey;
  }) => {
    const value = settings?.[settingKey] ?? false;
    return (
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>{label}</Text>
          {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={toggle(settingKey)}
          disabled={isLoading || saveSettings.isPending}
          trackColor={{ false: Colors.borderGray, true: Colors.primaryLight }}
          thumbColor={value ? Colors.primary : Colors.textGray}
          accessibilityLabel={label}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('settings.title')} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.card}>
            {SUPPORTED_LOCALES.map((l, i) => {
              const active = locale === l.code;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.langRow, i < SUPPORTED_LOCALES.length - 1 && styles.rowDivider]}
                  onPress={() => setLocale(l.code)}
                  accessibilityRole="radio"
                  accessibilityLabel={t(l.labelKey)}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={styles.langLabel}>{t(l.labelKey)}</Text>
                  {active ? <FontAwesome name="check" size={16} color={Colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>{t('settings.currency')}</Text>
          <View style={styles.card}>
            {currencies.map((c, i) => {
              const active = (user?.preferredCurrency ?? 'NGN') === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.langRow, i < currencies.length - 1 && styles.rowDivider]}
                  onPress={() => selectCurrency(c.code)}
                  disabled={savingCurrency}
                  accessibilityRole="radio"
                  accessibilityLabel={`${c.code} (${c.symbol})`}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={styles.langLabel}>{c.code} ({c.symbol})</Text>
                  {active ? <FontAwesome name="check" size={16} color={Colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.note}>{t('settings.currencySub')}</Text>

          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          <View style={styles.card}>
            <ToggleRow label={t('settings.pushNotifications')} sub={t('settings.pushNotificationsSub')} settingKey="pushNotifications" />
            <ToggleRow label={t('settings.emailNotifications')} settingKey="emailNotifications" />
            <ToggleRow label={t('settings.smsNotifications')} settingKey="smsNotifications" />
          </View>
          <Text style={styles.note}>
            {t('settings.securityNote')}
          </Text>

          <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{t('settings.twoFactor')}</Text>
                <Text style={styles.toggleSub}>{t('settings.twoFactorSub')}</Text>
              </View>
              <Switch
                value={user?.twoFactorEnabled ?? false}
                onValueChange={toggleTwoFactor}
                disabled={savingTwoFactor}
                trackColor={{ false: Colors.borderGray, true: Colors.primaryLight }}
                thumbColor={user?.twoFactorEnabled ? Colors.primary : Colors.textGray}
                accessibilityLabel={t('settings.twoFactor')}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <View style={styles.segment} accessibilityRole="radiogroup">
            {THEME_MODES.map((m) => {
              const active = themeMode === m.mode;
              return (
                <TouchableOpacity
                  key={m.mode}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  onPress={() => applyThemeMode(m.mode)}
                  accessibilityRole="radio"
                  accessibilityLabel={t(m.labelKey)}
                  accessibilityState={{ selected: active }}
                >
                  <FontAwesome name={m.icon as any} size={16} color={active ? Colors.white : Colors.textGray} />
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t(m.labelKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.note}>{t('settings.themeSystemSub')}</Text>

          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
          <View style={styles.card}>
            <ToggleRow label={t('settings.locationAccess')} sub={t('settings.locationAccessSub')} settingKey="locationAccess" />
          </View>

          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.langRow}
              onPress={() => navigation.navigate('ReportProblem')}
              accessibilityRole="button"
              accessibilityLabel={t('settings.reportProblem')}
            >
              <Text style={styles.langLabel}>{t('settings.reportProblem')}</Text>
              <FontAwesome name="chevron-right" size={14} color={Colors.textGray} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.langRow, styles.rowDivider]}
              onPress={() => navigation.navigate('TermsOfService')}
              accessibilityRole="button"
              accessibilityLabel={t('settings.termsOfService')}
            >
              <Text style={styles.langLabel}>{t('settings.termsOfService')}</Text>
              <FontAwesome name="chevron-right" size={14} color={Colors.textGray} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.langRow}
              onPress={() => navigation.navigate('PrivacyPolicy')}
              accessibilityRole="button"
              accessibilityLabel={t('settings.privacyPolicy')}
            >
              <Text style={styles.langLabel}>{t('settings.privacyPolicy')}</Text>
              <FontAwesome name="chevron-right" size={14} color={Colors.textGray} />
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>{t('common.appName')} {t('account.version', { version: '1.0.0' })}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textGray, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  langRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  segment: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14, padding: 4,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  segmentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 11,
  },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 14, fontWeight: '500', color: Colors.textGray },
  segmentTextActive: { color: Colors.white, fontWeight: '700' },
  langLabel: { fontSize: 15, fontWeight: '500', color: Colors.textDark },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: Colors.textDark },
  toggleSub: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  note: { fontSize: 11, color: Colors.textGray, marginTop: 8, marginHorizontal: 4, lineHeight: 16 },
  loader: { marginTop: 40 },
  version: { textAlign: 'center', fontSize: 13, color: Colors.textGray, marginTop: 32 },
});
