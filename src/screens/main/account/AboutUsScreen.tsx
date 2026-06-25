import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import SCHeader from '../../../components/common/SCHeader';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function AboutUsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <SCHeader title="About Us" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoArea}>
          <FontAwesome name="heartbeat" size={56} color={Colors.primary} />
          <Text style={styles.appName}>Eko Telehealth</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>
            Eko Telehealth makes quality healthcare accessible to everyone, everywhere. We connect patients
            with trusted doctors for video visits, clinic appointments, and home care — all at the snap of a finger.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What We Offer</Text>
          {[
            'Find and book doctors instantly',
            'Video, clinic, and home visits',
            'Manage your health records',
            'Prescription and pharmacy support',
            'Family / dependent care management',
          ].map((item) => (
            <View key={item} style={styles.featureRow}>
              <FontAwesome name="check-circle" size={14} color={Colors.success} />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Us</Text>
          <Text style={styles.cardText}>
            Email: support@ekotelehealth.com{'\n'}
            Phone: +1 (800) 555-CARE{'\n'}
            Hours: Mon–Fri, 9am–6pm EST
          </Text>
        </View>

        <Text style={styles.copyright}>© 2024 Eko Telehealth. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: 20, paddingBottom: 40 },
  logoArea: { alignItems: 'center', marginBottom: 24, paddingVertical: 20 },
  appName: { fontSize: 26, fontWeight: '900', color: Colors.textDark, marginTop: 10 },
  version: { fontSize: 13, color: Colors.textGray, marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  cardText: { fontSize: 14, color: Colors.textMedium, lineHeight: 21 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureText: { fontSize: 14, color: Colors.textMedium, marginLeft: 10 },
  copyright: { textAlign: 'center', fontSize: 12, color: Colors.textGray, marginTop: 8 },
});
