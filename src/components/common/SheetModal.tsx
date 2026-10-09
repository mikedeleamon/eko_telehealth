import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  StyleSheet,
  type ModalProps,
} from 'react-native';
import { useTheme } from '../../theme';

interface Props {
  visible: boolean;
  /** Android back button / iOS swipe-dismiss hook, same as Modal's. */
  onRequestClose?: () => void;
  /**
   * `sheet` slides up from the bottom (default), `fade` scales in from the
   * centre — pick whichever matches the content's own layout.
   */
  variant?: 'sheet' | 'fade';
  children: React.ReactNode;
  /** Escape hatch for the rare Modal prop a call site still needs. */
  modalProps?: Partial<ModalProps>;
}

const ENTER_MS = 260;
const EXIT_MS = 200;
/** Drag past this (px) — or flick faster than FLING_VY — and the sheet closes. */
const DISMISS_PX = 120;
const FLING_VY = 0.5;

/**
 * Drop-in replacement for `<Modal transparent animationType="slide">`.
 *
 * RN's native `animationType` presents the modal host first and only then
 * lays the JS content out, so the dimmed backdrop lands a frame or two ahead
 * of the sheet — the "grey screen, then the popup" flash. Presenting with no
 * native animation and driving the backdrop opacity and the content transform
 * ourselves keeps the two locked together.
 *
 * Call sites keep their own overlay/sheet markup; the overlay must NOT paint
 * its own background — the backdrop below is the only dimming layer.
 */
export default function SheetModal({
  visible, onRequestClose, variant = 'sheet', children, modalProps,
}: Props) {
  const Colors = useTheme();
  // Held open across the exit animation so the sheet can slide back out.
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  // Call sites usually derive the sheet's contents from the same state that
  // drives `visible` (`visible={!!editing}`), so those contents blank out the
  // moment it closes. Render the last open frame until the exit finishes.
  const lastChildren = useRef(children);
  if (visible) lastChildren.current = children;

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? ENTER_MS : EXIT_MS,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, mounted, progress]);

  // Drag offset, layered on top of the enter/exit transform so a swipe can be
  // released mid-flight without fighting the timing animation.
  const drag = useRef(new Animated.Value(0)).current;

  // Only the bottom sheet is draggable — the centred `fade` variant has no
  // edge to pull from, so a downward drag there would read as arbitrary.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Claim the gesture only once it is clearly a downward drag, so taps
        // and any scrolling inside the sheet still reach the content.
        onMoveShouldSetPanResponder: (_e, g) => variant === 'sheet' && g.dy > 8 && g.dy > Math.abs(g.dx) * 2,
        onPanResponderMove: (_e, g) => {
          // Resist upward pull instead of letting the sheet fly off the top.
          drag.setValue(g.dy > 0 ? g.dy : g.dy / 4);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > DISMISS_PX || g.vy > FLING_VY) {
            // Hand off to the normal exit: carry the drag back to 0 so the
            // shared `progress` animation resumes from where the finger left
            // the sheet rather than snapping it back first.
            Animated.timing(drag, { toValue: 0, duration: EXIT_MS, useNativeDriver: true }).start();
            onRequestClose?.();
          } else {
            Animated.spring(drag, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(drag, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
        },
      }),
    [variant, drag, onRequestClose],
  );

  // Reset any leftover drag when the sheet reopens, otherwise it would mount
  // already pushed down by however far the last dismissal dragged it.
  useEffect(() => {
    if (visible) drag.setValue(0);
  }, [visible, drag]);

  if (!mounted) return null;

  const windowHeight = Dimensions.get('window').height;

  const contentStyle = variant === 'sheet'
    ? {
        transform: [{
          // The enter/exit slide and the live drag offset sum into one
          // translateY, so releasing mid-gesture blends instead of snapping.
          translateY: Animated.add(
            progress.interpolate({
              inputRange: [0, 1],
              outputRange: [windowHeight, 0],
            }),
            drag,
          ),
        }],
      }
    : {
        opacity: progress,
        transform: [{
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.94, 1],
          }),
        }],
      };

  // Backdrop lightens as the sheet is pulled down, so the dimming tracks the
  // finger rather than holding full strength until release.
  const backdropOpacity = variant === 'sheet'
    ? Animated.multiply(
        progress,
        drag.interpolate({ inputRange: [0, windowHeight], outputRange: [1, 0], extrapolate: 'clamp' }),
      )
    : progress;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      // Android otherwise leaves the status bar undimmed above the backdrop.
      statusBarTranslucent
      onRequestClose={onRequestClose}
      {...modalProps}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: Colors.overlay, opacity: backdropOpacity },
        ]}
        pointerEvents="none"
      />
      <Animated.View style={[styles.content, contentStyle]} {...panResponder.panHandlers}>
        {visible ? children : lastChildren.current}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
});
