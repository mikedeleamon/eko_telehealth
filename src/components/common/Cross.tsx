import React from 'react';
import { View, ViewStyle } from 'react-native';

interface Props {
  size?: number;
  thickness?: number;
  color?: string;
  opacity?: number;
  rotation?: number;
  style?: ViewStyle;
}

/**
 * A faint, rounded medical-cross (plus) motif used to texture
 * the purple gradient headers. Pass position via `style`.
 */
export default function Cross({
  size = 90,
  thickness,
  color = '#FFFFFF',
  opacity = 0.08,
  rotation = 0,
  style,
}: Props) {
  const bar = thickness ?? size * 0.34;
  const radius = bar / 2.6;

  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          opacity,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      {/* vertical bar */}
      <View
        style={{
          position: 'absolute',
          left: (size - bar) / 2,
          top: 0,
          width: bar,
          height: size,
          borderRadius: radius,
          backgroundColor: color,
        }}
      />
      {/* horizontal bar */}
      <View
        style={{
          position: 'absolute',
          top: (size - bar) / 2,
          left: 0,
          width: size,
          height: bar,
          borderRadius: radius,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
