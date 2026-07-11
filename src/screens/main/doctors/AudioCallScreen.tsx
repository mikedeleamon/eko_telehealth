import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useCall } from '../../../hooks/useCall';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function AudioCallScreen({ navigation, route }: Props) {
  const doctor = route.params?.doctor;
  const roomName = route.params?.roomName ?? `visit-${doctor?.id ?? 'demo'}`;
  const {
    statusLabel, muted, speakerOn,
    toggleMuted, toggleSpeaker, hangUp,
  } = useCall({ roomName, audioOnly: true });

  const endCall = async () => {
    await hangUp();
    navigation.goBack();
  };

  const switchToVideo = async () => {
    await hangUp();
    navigation.replace('VideoCall', { doctor, roomName });
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
      </View>

      <View style={styles.controls}>
        <CallBtn icon={muted ? 'microphone-slash' : 'microphone'} label={muted ? 'Unmute' : 'Mute'} onPress={toggleMuted} active={muted} />
        <CallBtn icon={speakerOn ? 'volume-up' : 'volume-off'} label="Speaker" onPress={toggleSpeaker} active={speakerOn} />
        <CallBtn icon="video-camera" label="Video" onPress={switchToVideo} />

        <TouchableOpacity style={styles.endBtn} onPress={endCall}>
          <FontAwesome name="phone" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CallBtn({ icon, label, onPress, active }: { icon: string; label: string; onPress: () => void; active?: boolean }) {
  return (
    <TouchableOpacity style={styles.callBtn} onPress={onPress}>
      <View style={[styles.callBtnCircle, active && styles.callBtnActive]}>
        <FontAwesome name={icon as any} size={20} color={Colors.white} />
      </View>
      <Text style={styles.callBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 20, paddingBottom: 60, paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  callBtn: { alignItems: 'center' },
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
