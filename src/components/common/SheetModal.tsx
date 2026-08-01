import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
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

  if (!mounted) return null;

  const contentStyle = variant === 'sheet'
    ? {
        transform: [{
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [Dimensions.get('window').height, 0],
          }),
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
          { backgroundColor: Colors.overlay, opacity: progress },
        ]}
        pointerEvents="none"
      />
      <Animated.View style={[styles.content, contentStyle]}>
        {visible ? children : lastChildren.current}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
});
