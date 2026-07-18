import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const OPTIONS = [
  { icon: 'envelope', labelKey: 'auth.viaEmail', subKey: 'auth.viaEmailSub', screen: 'ForgotPassword' },
  { icon: 'mobile', labelKey: 'auth.viaSms', subKey: 'auth.viaSmsSub', screen: 'VerifyMobile' },
];

export default function ForgotPassLandingScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('a11y.back')}>
          <FontAwesome name="arrow-left" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <FontAwesome name="lock" size={32} color={Colors.accent} />
        </View>

        <Text style={styles.title}>{t('auth.forgotOrNew')}</Text>
        <Text style={styles.subtitle}>{t('auth.chooseReset')}</Text>

        {OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.screen}
            style={styles.card}
            onPress={() => navigation.navigate(opt.screen as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t(opt.labelKey)}
          >
            <View style={styles.cardIcon}>
              <FontAwesome name={opt.icon as any} size={22} color={Colors.accent} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t(opt.labelKey)}</Text>
              <Text style={styles.cardSub}>{t(opt.subKey)}</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Colors.accent} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },

  body: { flex: 1, paddingHorizontal: 28, paddingTop: 16 },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accentFaded,
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1.5, borderColor: Colors.borderGray,
    shadowColor: Colors.shadowCard, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 3,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.accentFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 3, fontFamily: 'Poppins_700Bold' },
  cardSub: { fontSize: 13, color: Colors.textGray, lineHeight: 18, fontFamily: 'Poppins_400Regular' },
});
