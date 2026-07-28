import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import { useCall } from '../../../hooks/useCall';
import CallGuestPanel from '../../../components/call/CallGuestPanel';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function AudioCallScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const doctor = route.params?.doctor;
  // The visit being joined. Callers must supply it — the room is derived from
  // it server-side, and the token request is the authorization check.
  const appointmentId = route.params?.appointmentId as string | undefined;
  const {
    state, statusLabel, awaitingAdmission, muted, speakerOn,
    toggleMuted, toggleSpeaker, hangUp,
  } = useCall({ appointmentId, audioOnly: true });

  const endCall = async () => {
    await hangUp();
    navigation.goBack();
  };

  const switchToVideo = async () => {
    await hangUp();
    navigation.replace('VideoCall', { doctor, appointmentId });
  };

  /**
   * The last rung of the bandwidth fallback. Voice is already the low-bandwidth
   * mode, so there's nothing further to drop to but text — offered here so a
   * call that still can't hold up has somewhere to go other than hanging up.
   */
  const continueInChat = async () => {
    await hangUp();
    navigation.replace('Chat', { doctor });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" hidden />
      <LinearGradient colors={['#1A1A3E', Colors.primary]} style={styles.bg} />

      <View style={styles.centerArea}>
        <View style={styles.avatar}>
          <FontAwesome name="user-md" size={70} color={Colors.white} />
        </View>
        <Text style={styles.name}>{doctor?.name ?? 'Dr. Johnson'}</Text>
        <Text style={styles.spec}>{doctor?.specialty ?? 'Primary Care'}</Text>
        <Text style={styles.timer}>{statusLabel}</Text>
        {awaitingAdmission && <Text style={styles.waitingHint}>{t('call.waitingToBeAdmittedHint')}</Text>}
      </View>

      {!awaitingAdmission && <CallGuestPanel appointmentId={appointmentId} active={state === 'connected'} />}

      <View style={styles.controls}>
        <CallBtn icon={muted ? 'microphone-slash' : 'microphone'} label={muted ? t('call.unmute') : t('call.mute')} onPress={toggleMuted} active={muted} />
        <CallBtn icon={speakerOn ? 'volume-up' : 'volume-off'} label={t('call.speaker')} onPress={toggleSpeaker} active={speakerOn} />
        <CallBtn icon="video-camera" label={t('call.video')} onPress={switchToVideo} />
        <CallBtn icon="comment" label={t('call.continueInChat')} onPress={continueInChat} />

        <TouchableOpacity style={styles.endBtn} onPress={endCall} accessibilityRole="button" accessibilityLabel={t('a11y.endCall')}>
          <FontAwesome name="phone" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CallBtn({ icon, label, onPress, active }: { icon: string; label: string; onPress: () => void; active?: boolean }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <TouchableOpacity style={styles.callBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}>
      <View style={[styles.callBtnCircle, active && styles.callBtnActive]}>
        <FontAwesome name={icon as any} size={20} color={Colors.white} />
      </View>
      <Text style={styles.callBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject },
  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  name: { fontSize: 24, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  spec: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  timer: { fontSize: 18, color: 'rgba(255,255,255,0.85)', fontVariant: ['tabular-nums'] },
  waitingHint: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center',
    marginTop: 14, paddingHorizontal: 40, lineHeight: 19,
  },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap', rowGap: 14, columnGap: 18,
    paddingHorizontal: 20, paddingBottom: 56, paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  callBtn: { alignItems: 'center', width: 66 },
  callBtnCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  callBtnActive: { backgroundColor: 'rgba(255,255,255,0.45)' },
  callBtnLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  endBtn: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '135deg' }],
  },
});
