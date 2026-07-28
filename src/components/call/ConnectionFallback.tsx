import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  /** Raised once the connection has been poor for a sustained stretch. */
  prompted: boolean;
  /** True once the user has dropped the camera for bandwidth. */
  voiceOnly: boolean;
  onSwitchToVoice: () => void;
  onRestoreVideo: () => void;
  onContinueInChat: () => void;
  onDismiss: () => void;
}

/**
 * The weak-bandwidth fallback's prompt and banner (patient-feedback item 10).
 *
 * Deliberately a suggestion, not an action: a call that cuts the camera by
 * itself mid-examination — without the doctor or patient agreeing — is worse
 * than a laggy picture. The same two exits are always available manually from
 * the call bar, so this only shortens the path to them when the network is
 * clearly struggling.
 */
export default function ConnectionFallback({
  prompted,
  voiceOnly,
  onSwitchToVoice,
  onRestoreVideo,
  onContinueInChat,
  onDismiss,
}: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();

  if (voiceOnly) {
    return (
      <View style={styles.banner} accessibilityRole="alert">
        <FontAwesome name="signal" size={13} color={Colors.white} />
        <Text style={styles.bannerText} numberOfLines={1}>{t('call.voiceOnlyBanner')}</Text>
        <TouchableOpacity onPress={onRestoreVideo} accessibilityRole="button" accessibilityLabel={t('call.turnVideoBackOn')}>
          <Text style={styles.bannerAction}>{t('call.turnVideoBackOn')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!prompted) return null;

  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.cardHead}>
        <FontAwesome name="exclamation-triangle" size={15} color={Colors.orange} />
        <Text style={styles.cardTitle}>{t('call.connectionPoor')}</Text>
      </View>
      <Text style={styles.cardHint}>{t('call.connectionPoorHint')}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.primaryAction} onPress={onSwitchToVoice} accessibilityRole="button" accessibilityLabel={t('call.switchToVoice')}>
          <FontAwesome name="microphone" size={13} color={Colors.white} />
          <Text style={styles.primaryActionText}>{t('call.switchToVoice')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={onContinueInChat} accessibilityRole="button" accessibilityLabel={t('call.continueInChat')}>
          <FontAwesome name="comment" size={13} color={Colors.white} />
          <Text style={styles.secondaryActionText}>{t('call.continueInChat')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissAction} onPress={onDismiss} accessibilityRole="button" accessibilityLabel={t('call.stayOnVideo')}>
          <Text style={styles.dismissText}>{t('call.stayOnVideo')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  banner: {
    position: 'absolute', top: 100, left: 16, right: 16, zIndex: 18,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
  },
  bannerText: { flex: 1, color: Colors.white, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  bannerAction: { color: Colors.white, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline', fontFamily: 'Poppins_600SemiBold' },

  card: {
    position: 'absolute', bottom: 150, left: 16, right: 16, zIndex: 22,
    backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: Colors.white, fontSize: 14, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  cardHint: { color: 'rgba(255,255,255,0.75)', fontSize: 12.5, lineHeight: 18, marginTop: 6, fontFamily: 'Poppins_400Regular' },
  cardActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  primaryAction: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 14, height: 38,
  },
  primaryActionText: { color: Colors.white, fontSize: 12.5, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },
  secondaryAction: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 14, height: 38,
  },
  secondaryActionText: { color: Colors.white, fontSize: 12.5, fontWeight: '600', fontFamily: 'Poppins_500Medium' },
  dismissAction: { paddingHorizontal: 8, height: 38, justifyContent: 'center' },
  dismissText: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontFamily: 'Poppins_500Medium' },
});
