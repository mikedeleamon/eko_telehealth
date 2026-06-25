import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const OPTIONS = [
  { icon: 'envelope', label: 'Via Email', sub: "We'll send a reset link to your email address", screen: 'ForgotPassword' },
  { icon: 'mobile', label: 'Via SMS', sub: "We'll send a verification code to your phone number", screen: 'VerifyMobile' },
];

export default function ForgotPassLandingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FontAwesome name="arrow-left" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <FontAwesome name="lock" size={32} color={Colors.accent} />
        </View>

        <Text style={styles.title}>Forgot Password{'\n'}or need a new password?</Text>
        <Text style={styles.subtitle}>Choose how you'd like to reset your password</Text>

        {OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.screen}
            style={styles.card}
            onPress={() => navigation.navigate(opt.screen as any)}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <FontAwesome name={opt.icon as any} size={22} color={Colors.accent} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{opt.label}</Text>
              <Text style={styles.cardSub}>{opt.sub}</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Colors.accent} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },

  body: { flex: 1, paddingHorizontal: 28, paddingTop: 16 },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF0EB',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, alignSelf: 'center',
  },

  title: {
    fontSize: 26, fontWeight: '700', color: Colors.textDark,
    textAlign: 'center', marginBottom: 10, lineHeight: 34,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 14, color: Colors.textGray, textAlign: 'center',
    marginBottom: 36, fontFamily: 'Poppins_400Regular',
  },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1.5, borderColor: Colors.borderGray,
    shadowColor: Colors.shadowCard, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 3,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFF0EB',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 3, fontFamily: 'Poppins_700Bold' },
  cardSub: { fontSize: 13, color: Colors.textGray, lineHeight: 18, fontFamily: 'Poppins_400Regular' },
});
