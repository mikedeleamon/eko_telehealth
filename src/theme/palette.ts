/**
 * Light and dark colour palettes. Both share the exact same set of keys so a
 * component can read `Colors.x` and get the right value for the active theme
 * without knowing which one is live.
 *
 * Two rules keep the two palettes swappable:
 *  - `white`, `black`, `google`, `apple`, `facebook` are LITERAL colours (button
 *    text/icons on coloured fills) and stay identical in both modes.
 *  - `surface` (card background) and `field` (input background) are the semantic
 *    tokens that used to be hard-coded to `white`/`#F5F6FA`; they flip per theme.
 */
export const lightColors = {
  // Auth orange
  accent: '#F97653',
  accentDark: '#E8622A',
  accentFaded: '#FFF0EB',

  // Primary purple (main app)
  primary: '#6C5CE7',
  primaryLight: '#8E7CF6',
  primaryDark: '#5A4BD1',
  primaryFaded: '#F0EEFF',

  // Gradient
  gradientStart: '#6A5AE0',
  gradientEnd: '#8E7CF6',

  // Status
  success: '#3FBE6E',
  error: '#F44336',
  warning: '#FF9800',
  green: '#3FBE6E',
  red: '#F0392B',
  blue: '#3B82F6',
  orange: '#F5A623',

  // Text
  textDark: '#272A3A',
  textMedium: '#4A4F62',
  textGray: '#9AA0AB',
  textLight: '#C5CAD3',
  white: '#FFFFFF',
  black: '#000000',

  // Backgrounds
  bgLight: '#F8F9FB',
  bgGray: '#F0F0F5',
  bgWhite: '#FFFFFF',
  surface: '#FFFFFF',
  field: '#F5F6FA',

  // Card pastel fills (cream, lavender, soft gray, soft pink)
  cardColors: ['#FCEFD9', '#ECE9FB', '#F4F5F7', '#FBE9EC'],

  // Category chip colors
  chipColors: ['#F97653', '#6C5CE7', '#00CAAE'],

  // Forms
  borderGray: '#E8EAED',
  borderFocus: '#F97653',

  // Shadows
  shadow: 'rgba(108, 92, 231, 0.10)',
  shadowCard: 'rgba(39, 42, 58, 0.08)',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarActive: '#6C5CE7',
  tabBarInactive: '#9AA0AB',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Tutorial backgrounds
  tutorialBg01: '#E8F4FD',
  tutorialBg02: '#FDE8EC',
  tutorialBg03: '#FFFDE7',

  // Social
  facebook: '#3B5998',
  google: '#FFFFFF',
  apple: '#000000',
};

export type ThemeColors = typeof lightColors;

/**
 * Doctor role palette. Doctors get the warm orange as their leading brand
 * colour — header gradients, the tab bar and primary buttons — while the app's
 * purple steps back to become the secondary accent. Everything else (surfaces,
 * text ramp, status colours) is inherited from the active light/dark base, so a
 * doctor still gets correct dark-mode surfaces; only the brand hues swap.
 *
 * Derived from the base rather than hand-authored so the two roles can never
 * drift out of sync as tokens are added.
 */
export function makeDoctorColors(base: ThemeColors, isDark: boolean): ThemeColors {
  return {
    ...base,
    // Orange leads: chrome, icons, primary buttons, focus.
    primary: base.accent,
    primaryLight: isDark ? '#FF9E80' : '#FF9576',
    primaryDark: base.accentDark,
    primaryFaded: base.accentFaded,
    // Purple becomes the secondary accent (badges, secondary highlights).
    accent: base.primary,
    accentDark: base.primaryDark,
    accentFaded: base.primaryFaded,
    // Header gradient goes orange.
    gradientStart: isDark ? '#E8622A' : '#F9764F',
    gradientEnd: isDark ? '#F97653' : '#FBA07E',
    // Footer (tab bar) active state goes orange.
    tabBarActive: base.accent,
    // Tinted shadow follows the new brand colour in light mode.
    shadow: isDark ? base.shadow : 'rgba(249, 118, 83, 0.12)',
  };
}

export const darkColors: ThemeColors = {
  // Auth orange — the warm accent reads well on dark, so it barely shifts.
  accent: '#F97653',
  accentDark: '#FF8A66',
  accentFaded: '#2A211C',

  // Primary purple — lightened so it stays vivid against dark surfaces.
  primary: '#8E7CF6',
  primaryLight: '#A99BFB',
  primaryDark: '#6C5CE7',
  primaryFaded: '#2A2540',

  // Gradient
  gradientStart: '#7A6BEA',
  gradientEnd: '#9D8DF8',

  // Status — brightened a touch for contrast on dark.
  success: '#4FD07E',
  error: '#FF6B5E',
  warning: '#FFB74D',
  green: '#4FD07E',
  red: '#FF6B5E',
  blue: '#5B9BFF',
  orange: '#FFB74D',

  // Text — inverted ramp.
  textDark: '#EDEEF2',
  textMedium: '#C3C7D1',
  textGray: '#8A909C',
  textLight: '#5A606C',
  white: '#FFFFFF',
  black: '#000000',

  // Backgrounds
  bgLight: '#101218',
  bgGray: '#191B22',
  bgWhite: '#1B1D25',
  surface: '#1B1D25',
  field: '#22242D',

  // Card pastel fills — muted, deep-toned versions of the light pastels.
  cardColors: ['#2A2620', '#232134', '#20222A', '#2A2024'],

  // Category chip colors
  chipColors: ['#F97653', '#8E7CF6', '#00CAAE'],

  // Forms
  borderGray: '#2C2F38',
  borderFocus: '#F97653',

  // Shadows — plain black; the tinted light shadows disappear on dark anyway.
  shadow: 'rgba(0, 0, 0, 0.40)',
  shadowCard: 'rgba(0, 0, 0, 0.50)',

  // Tab bar
  tabBar: '#15171E',
  tabBarActive: '#8E7CF6',
  tabBarInactive: '#8A909C',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.60)',

  // Tutorial backgrounds — deep tints matching the light hues.
  tutorialBg01: '#12212E',
  tutorialBg02: '#2A1820',
  tutorialBg03: '#26240F',

  // Social
  facebook: '#3B5998',
  google: '#FFFFFF',
  apple: '#000000',
};
