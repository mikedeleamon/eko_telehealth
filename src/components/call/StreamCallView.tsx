import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ParticipantView,
  StreamCall,
  StreamVideo,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { videoService } from '../../services/video';
import { StreamVideoService } from '../../services/video/StreamVideoService';

/**
 * Renders live Stream Video tracks over the call screen: the remote participant
 * fills the screen, the local participant sits in a picture-in-picture tile.
 *
 * This module statically imports the native Stream Video SDK, so it must only
 * ever be reached through a lazy import (React.lazy) from the call screen. That
 * keeps the WebRTC native module out of mock/chat builds until a real Stream
 * call is in progress.
 */
function CallStage() {
  const { useRemoteParticipants, useLocalParticipant } = useCallStateHooks();
  const [remoteParticipant] = useRemoteParticipants();
  const localParticipant = useLocalParticipant();

  return (
    <View style={StyleSheet.absoluteFill}>
      {remoteParticipant ? (
        <ParticipantView
          participant={remoteParticipant}
          trackType="videoTrack"
          objectFit="cover"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {localParticipant ? (
        <ParticipantView
          participant={localParticipant}
          trackType="videoTrack"
          objectFit="cover"
          mirror
          style={styles.localTile}
        />
      ) : null}
    </View>
  );
}

export default function StreamCallView() {
  // Only mounted in stream mode during an active call, so these are populated.
  const service = videoService instanceof StreamVideoService ? videoService : null;
  const client = service?.getClient() ?? null;
  const call = service?.getCall() ?? null;
  if (!client || !call) return null;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallStage />
      </StreamCall>
    </StreamVideo>
  );
}

const styles = StyleSheet.create({
  localTile: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 90,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
