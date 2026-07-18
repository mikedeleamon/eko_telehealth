import React, { Suspense, lazy } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import { useCall } from '../../../hooks/useCall';
import { env } from '../../../config/env';
import { useTranslation } from '../../../i18n/useTranslation';

// Live Stream video tracks. Lazy-loaded so the native WebRTC SDK is pulled in
// only during an actual Stream call — mock/chat builds never touch it.
const StreamCallView = lazy(() => import('../../../components/call/StreamCallView'));

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function VideoCallScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const doctor = route.params?.doctor;
  const {
    state, statusLabel, muted, cameraOff, speakerOn, frontCamera,
    toggleMuted, toggleCamera, toggleSpeaker, flipCamera, hangUp,
  } = useCall({ roomName: route.params?.roomName ?? `visit-${doctor?.id ?? 'demo'}` });

  // Show real video only for a connected Stream call; mock mode keeps the
  // placeholder avatars so demos work with no backend or native rebuild.
  const showLiveVideo = env.realtimeProvider === 'stream' && state === 'connected';

  const endCall = async () => {
    await hangUp();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" hidden />
      <LinearGradient colors={['#1A1A3E', '#0D47A1']} style={styles.bg} />

      {showLiveVideo ? (
        <>
          {/* StreamCallView draws the remote video full-bleed + a local PiP tile */}
          <Suspense fallback={null}>
            <StreamCallView />
          </Suspense>
          <View style={styles.topBar} pointerEvents="none">
            <Text style={styles.topBarName}>{doctor?.name ?? 'Dr. Johnson'}</Text>
            <Text style={styles.topBarStatus}>{statusLabel}</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.remoteVideo}>
            <FontAwesome name="user-md" size={80} color="rgba(255,255,255,0.3)" />
            <Text style={styles.remoteName}>{doctor?.name ?? 'Dr. Johnson'}</Text>
            <Text style={styles.callStatus}>{statusLabel}</Text>
          </View>

          <View style={styles.localVideo}>
            <FontAwesome name="user" size={28} color="rgba(255,255,255,0.6)" />
            <Text style={styles.cameraOffText}>{cameraOff ? t('call.cameraOff') : frontCamera ? t('call.front') : t('call.back')}</Text>
          </View>
        </>
      )}

      <View style={styles.controls}>
        <CallBtn icon={muted ? 'microphone-slash' : 'microphone'} label={muted ? t('call.unmute') : t('call.mute')} onPress={toggleMuted} active={muted} />
        <CallBtn icon={speakerOn ? 'volume-up' : 'volume-off'} label={t('call.speaker')} onPress={toggleSpeaker} />
        <CallBtn icon={cameraOff ? 'video-slash' : 'video'} family="FontAwesome5" label={cameraOff ? t('call.camOff') : t('call.camOn')} onPress={toggleCamera} active={cameraOff} />
        <CallBtn icon="refresh" label={t('call.flip')} onPress={flipCamera} />

        <TouchableOpacity style={styles.endBtn} onPress={endCall} accessibilityRole="button" accessibilityLabel={t('a11y.endCall')}>
          <FontAwesome name="phone" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CallBtn({ icon, label, onPress, active, family = 'FontAwesome' }: { icon: string; label: string; onPress: () => void; active?: boolean; family?: 'FontAwesome' | 'FontAwesome5' }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const Icon = family === 'FontAwesome5' ? FontAwesome5 : FontAwesome;
  return (
    <TouchableOpacity style={styles.callBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}>
      <View style={[styles.callBtnCircle, active && styles.callBtnActive]}>
        <Icon name={icon as any} size={20} color={Colors.white} solid={family === 'FontAwesome5'} />
      </View>
      <Text style={styles.callBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject },
  remoteVideo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  remoteName: { fontSize: 22, fontWeight: '700', color: Colors.white, marginTop: 16 },
  callStatus: { fontSize: 16, color: 'rgba(255,255,255,0.65)', marginTop: 6 },
  localVideo: {
    position: 'absolute', top: 60, right: 20, width: 90, height: 130,
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraOffText: { fontSize: 9, color: Colors.white, marginTop: 4 },
  topBar: { position: 'absolute', top: 54, left: 0, right: 0, alignItems: 'center' },
  topBarName: { fontSize: 16, fontWeight: '700', color: Colors.white },
  topBarStatus: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontVariant: ['tabular-nums'] },
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 20, paddingBottom: 48, paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  callBtn: { alignItems: 'center' },
  callBtnCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  callBtnActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  callBtnLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  endBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
});
