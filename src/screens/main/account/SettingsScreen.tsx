import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import SCHeader from '../../../components/common/SCHeader';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function SettingsScreen({ navigation }: Props) {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [locationAccess, setLocationAccess] = useState(true);

  const ToggleRow = ({
    label,
    sub,
    value,
    onToggle,
  }: {
    label: string;
    sub?: string;
    value: boolean;
    onToggle: (v: boolean) => void;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.borderGray, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.textGray}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <SCHeader title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <ToggleRow label="Push Notifications" sub="Appointment reminders and updates" value={pushNotifs} onToggle={setPushNotifs} />
          <ToggleRow label="Email Notifications" value={emailNotifs} onToggle={setEmailNotifs} />
          <ToggleRow label="SMS Notifications" value={smsNotifs} onToggle={setSmsNotifs} />
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <ToggleRow label="Dark Mode" sub="Coming soon" value={darkMode} onToggle={setDarkMode} />
          <ToggleRow label="Location Access" sub="For finding nearby doctors" value={locationAccess} onToggle={setLocationAccess} />
        </View>

        <Text style={styles.version}>Eko Telehealth v1.0.0</Text>
      </ScrollView>
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
  version: { textAlign: 'center', fontSize: 13, color: Colors.textGray, marginTop: 32 },
});
