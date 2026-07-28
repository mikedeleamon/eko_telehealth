import React, { useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { useTheme, type ThemeColors } from '../../theme';
import { formatMoney } from '../../utils/format';

export interface TrendPoint {
  bucket: string;
  label: string;
  value: number;
}

export type TrendChartVariant = 'bar' | 'line';

interface Props {
  points: TrendPoint[];
  /** Currency symbol for the peak-value caption. */
  symbol?: string;
  height?: number;
  variant?: TrendChartVariant;
}

const STROKE_WIDTH = 2.5;
const DOT_RADIUS = 4;

/**
 * A revenue-trend chart (SOW 1.18), drawn with plain Views — bar or line,
 * toggled by the caller. Always fills the width of its card, regardless of
 * how many buckets the selected timeframe has: bar columns are equal-share
 * flex children, and the line's coordinates are computed from the card's
 * measured width rather than a fixed per-point size, so a 5-day range and a
 * 90-day one both span the same card edge to edge instead of one filling it
 * by coincidence and the other needing a horizontal scroll.
 *
 * Neither this app nor the admin console carries a charting library, and one
 * isn't worth adding for a single series — a chart library is a native
 * rebuild and a bundle's worth of surface area to render a row of rectangles
 * or a connected line. The line variant is built the same way: no SVG
 * dependency, just absolutely-positioned Views rotated to form segments
 * (translate-rotate-translate around the segment's start point, the standard
 * no-library trick for drawing a line between two coordinates in RN).
 *
 * Two things this deliberately does NOT do, in either variant: it doesn't drop
 * empty buckets (a zero day is a real data point, and hiding it turns a patchy
 * fortnight into a clean climb), and it doesn't start the axis anywhere but
 * zero (a truncated baseline makes a 3% wobble look like a doubling).
 */
export default function TrendBars({ points, symbol = '₦', height = 120, variant = 'bar' }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);

  // Only the line variant needs a real pixel width — rotating a segment to
  // the correct angle needs an actual x-distance, which a flex layout alone
  // can't give us. The bar variant fills its card with plain flex:1 columns
  // and never touches this.
  const [canvasWidth, setCanvasWidth] = useState(0);
  const onCanvasLayout = (e: LayoutChangeEvent) => setCanvasWidth(e.nativeEvent.layout.width);

  const peak = Math.max(...points.map((p) => p.value), 0);
  // Label every point when there are few, and thin them out as the range
  // grows — 30 daily labels side by side overlap into an unreadable smear.
  const labelEvery = points.length <= 8 ? 1 : points.length <= 16 ? 2 : Math.ceil(points.length / 8);

  if (!points.length) return null;

  const stepX = points.length > 1 ? canvasWidth / (points.length - 1) : canvasWidth;
  const coords = points.map((p, i) => {
    const ratio = peak > 0 ? p.value / peak : 0;
    return { x: points.length > 1 ? i * stepX : canvasWidth / 2, y: height - ratio * height };
  });

  return (
    <View>
      <View style={styles.peakRow}>
        <Text style={styles.peakLabel}>{formatMoney(symbol, peak)}</Text>
        <View style={styles.peakRule} />
      </View>

      {variant === 'bar' ? (
        <View style={styles.barRow}>
          {points.map((point, i) => {
            // Zero-height bars are invisible and read as missing data rather
            // than as nothing earned, so an empty bucket keeps a 2px stub.
            const ratio = peak > 0 ? point.value / peak : 0;
            const barHeight = Math.max(2, Math.round(ratio * height));
            const showLabel = i % labelEvery === 0 || i === points.length - 1;
            return (
              <View
                key={point.bucket}
                style={styles.column}
                accessibilityRole="text"
                accessibilityLabel={`${point.label}: ${formatMoney(symbol, point.value)}`}
              >
                <View style={[styles.track, { height }]}>
                  <View
                    style={[
                      styles.bar,
                      { height: barHeight, backgroundColor: point.value > 0 ? Colors.primary : Colors.borderGray },
                    ]}
                  />
                </View>
                <Text style={styles.tick} numberOfLines={1}>{showLabel ? point.label : ''}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View>
          <View style={[styles.lineCanvas, { height }]} onLayout={onCanvasLayout}>
            {canvasWidth > 0 && (
              <>
                {coords.slice(0, -1).map((p, i) => {
                  const next = coords[i + 1];
                  const dx = next.x - p.x;
                  const dy = next.y - p.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                  return (
                    <View
                      key={points[i].bucket}
                      style={[
                        styles.segment,
                        {
                          left: p.x,
                          top: p.y - STROKE_WIDTH / 2,
                          width: length,
                          backgroundColor: Colors.primary,
                          transform: [{ translateX: length / 2 }, { rotate: `${angle}deg` }, { translateX: -length / 2 }],
                        },
                      ]}
                    />
                  );
                })}
                {coords.map((p, i) => (
                  <View
                    key={points[i].bucket}
                    accessibilityRole="text"
                    accessibilityLabel={`${points[i].label}: ${formatMoney(symbol, points[i].value)}`}
                    style={[
                      styles.dot,
                      {
                        left: p.x - DOT_RADIUS,
                        top: p.y - DOT_RADIUS,
                        backgroundColor: points[i].value > 0 ? Colors.primary : Colors.borderGray,
                      },
                    ]}
                  />
                ))}
              </>
            )}
          </View>
          <View style={styles.lineTickRow}>
            {points.map((point, i) => {
              const showLabel = i % labelEvery === 0 || i === points.length - 1;
              return (
                <Text key={point.bucket} style={[styles.tick, styles.lineTick]} numberOfLines={1}>
                  {showLabel ? point.label : ''}
                </Text>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  peakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  peakLabel: { fontSize: 11, color: Colors.textGray, fontVariant: ['tabular-nums'], fontFamily: 'Poppins_400Regular' },
  peakRule: { flex: 1, height: 1, backgroundColor: Colors.borderGray },

  // Equal-share flex columns rather than a fixed per-bar width, so the chart
  // spans the card at any bucket count instead of only at whichever range
  // happens to be wide enough to reach the edge.
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  column: { flex: 1, minWidth: 0, alignItems: 'center' },
  // Capped rather than a straight 70% of the column: with very few buckets
  // (a 3-point range) an uncapped share would draw a bar wider than it is
  // tall, which reads as a block, not a bar.
  track: { justifyContent: 'flex-end', width: '70%', maxWidth: 28 },
  bar: { width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  tick: { fontSize: 9.5, color: Colors.textGray, marginTop: 6, textAlign: 'center', fontFamily: 'Poppins_400Regular' },

  lineCanvas: { position: 'relative', width: '100%' },
  segment: { position: 'absolute', height: STROKE_WIDTH, borderRadius: STROKE_WIDTH / 2 },
  dot: {
    position: 'absolute', width: DOT_RADIUS * 2, height: DOT_RADIUS * 2, borderRadius: DOT_RADIUS,
    borderWidth: 1.5, borderColor: Colors.surface,
  },
  lineTickRow: { flexDirection: 'row' },
  lineTick: { flex: 1, minWidth: 0, marginTop: 6 },
});
