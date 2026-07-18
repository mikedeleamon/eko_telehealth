/**
 * Backwards-compatible static export of the LIGHT palette.
 *
 * The live, theme-aware colours come from `useTheme()` in `src/theme`. This
 * `Colors` object is the light palette and is only used at module scope (e.g.
 * navigation option defaults) where a hook can't run — component styles and
 * inline colours read the active theme instead.
 */
export { lightColors as Colors } from '../theme/palette';
export type { ThemeColors } from '../theme/palette';
