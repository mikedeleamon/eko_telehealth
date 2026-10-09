import React, { useRef, useState } from 'react';
import { Animated, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

/** Scroll distance (px) over which the collapsible block fully retracts. */
const COLLAPSE_PX = 72;

/**
 * Drives a header that gives back space as the list scrolls.
 *
 * `progress` runs 0 → 1 over the first COLLAPSE_PX of scroll. Feed it to
 * <CollapsingHeaderSection> around whatever should retract — the title block,
 * typically — and leave interactive rows (tabs, search) outside it so they stay
 * reachable at every scroll position.
 *
 * Deliberately NOT native-driven: collapsing has to animate `height` to
 * actually reclaim layout space, and height is a JS-thread-only property. The
 * alternative — absolutely positioning the header and padding the list to
 * match — is native-driver friendly but silently breaks every screen whose
 * content offset assumptions change. One interpolated height on a header is a
 * cheap trade for that safety.
 */
export function useCollapsingHeader() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const onScroll = Animated.event<NativeSyntheticEvent<NativeScrollEvent>>(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const progress = scrollY.interpolate({
    inputRange: [0, COLLAPSE_PX],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return { onScroll, progress };
}

interface SectionProps {
  progress: Animated.AnimatedInterpolation<number>;
  children: React.ReactNode;
}

/**
 * Retracts its children to zero height as `progress` goes 0 → 1.
 *
 * Self-measuring: it renders at natural height until the first layout pass
 * reports how tall that is, and only then starts interpolating. Without that
 * it would need every call site to hardcode a pixel height that drifts the
 * moment the font or copy changes.
 */
export function CollapsingHeaderSection({ progress, children }: SectionProps) {
  const [height, setHeight] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    // Only latch the first non-zero measurement — re-measuring mid-collapse
    // would feed the shrunken height back in and collapse it to nothing.
    if (h > 0 && height === null) setHeight(h);
  };

  return (
    <Animated.View
      onLayout={onLayout}
      style={
        height === null
          ? undefined
          : {
              height: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
              opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              overflow: 'hidden',
            }
      }
    >
      {children}
    </Animated.View>
  );
}
