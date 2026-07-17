import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import { useSaveSettings, useSettings } from '../../../hooks/queries';
import type { UserSettings } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/**
 * Preferences persist server-side (GET/PATCH /me/settings) so they follow the
 * user across devices. Each toggle saves immediately — there's no Save button,
 * so leaving the screen must not lose the change.
 */
export default function SettingsScreen({ navigation }: Props) {
  const { data: settings, isLoading } = useSettings();
  const saveSettings = useSaveSettings();

  const toggle = (key: keyof UserSettings) => (value: boolean) => {
    saveSettings.mutate(
      { [key]: value },
      {
        onError: (err) =>
          // The cache still holds the server's value, so the switch snaps back
          // on its own — just explain why.
          Alert.alert('Could not save setting', err instanceof Error ? err.message : 'Please try again.'),
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
    settingKey: keyof UserSettings;
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
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <EkoHeader title="Settings" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <ToggleRow label="Push Notifications" sub="Appointment reminders and updates" settingKey="pushNotifications" />
            <ToggleRow label="Email Notifications" settingKey="emailNotifications" />
            <ToggleRow label="SMS Notifications" settingKey="smsNotifications" />
          </View>
          <Text style={styles.note}>
            Security messages like verification codes are always sent, whatever these are set to.
          </Text>

          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <ToggleRow label="Dark Mode" sub="Coming soon" settingKey="darkMode" />
            <ToggleRow label="Location Access" sub="For finding nearby doctors" settingKey="locationAccess" />
          </View>

          <Text style={styles.version}>Eko Telehealth v1.0.0</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textGray, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: Colors.textDark },
  toggleSub: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  note: { fontSize: 11, color: Colors.textGray, marginTop: 8, marginHorizontal: 4, lineHeight: 16 },
  loader: { marginTop: 40 },
  version: { textAlign: 'center', fontSize: 13, color: Colors.textGray, marginTop: 32 },
});
