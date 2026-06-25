import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function VideoCallScreen({ navigation, route }: Props) {
  const doctor = route.params?.doctor;
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [frontCamera, setFrontCamera] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" hidden />
      <LinearGradient colors={['#1A1A3E', '#0D47A1']} style={styles.bg} />

      <View style={styles.remoteVideo}>
        <FontAwesome name="user-md" size={80} color="rgba(255,255,255,0.3)" />
        <Text style={styles.remoteName}>{doctor?.name ?? 'Dr. Johnson'}</Text>
        <Text style={styles.callStatus}>00:03:42</Text>
      </View>

      <View style={styles.localVideo}>
        <FontAwesome name="user" size={28} color="rgba(255,255,255,0.6)" />
        <Text style={styles.cameraOffText}>{cameraOff ? 'Camera off' : frontCamera ? 'Front' : 'Back'}</Text>
      </View>

      <View style={styles.controls}>
        <CallBtn icon={muted ? 'microphone-slash' : 'microphone'} label={muted ? 'Unmute' : 'Mute'} onPress={() => setMuted(!muted)} active={muted} />
        <CallBtn icon={speakerOn ? 'volume-up' : 'volume-off'} label="Speaker" onPress={() => setSpeakerOn(!speakerOn)} />
        <CallBtn icon={cameraOff ? 'video-slash' : 'video-camera'} label={cameraOff ? 'Cam Off' : 'Cam On'} onPress={() => setCameraOff(!cameraOff)} active={cameraOff} />
        <CallBtn icon="refresh" label="Flip" onPress={() => setFrontCamera((v) => !v)} />

        <TouchableOpacity style={styles.endBtn} onPress={() => navigation.goBack()}>
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
  controls: {
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
