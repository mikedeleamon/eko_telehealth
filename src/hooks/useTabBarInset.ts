import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { TAB_BAR_SPACE } from '../constants/layout';

/**
 * Bottom inset for a screen's own pinned bar (a chat composer, a save bar) so
 * it clears the floating tab bar — collapsing to 0 while the keyboard is up,
 * because the keyboard already covers the tab bar and the reserved space would
 * otherwise leave the bar hovering above the keyboard.
 */
export function useTabBarInset(): number {
  const [keyboardUp, setKeyboardUp] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardUp(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardUp(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return keyboardUp ? 0 : TAB_BAR_SPACE;
}
