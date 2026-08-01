// Floating tab bar geometry. Lives here rather than in TabNavigator because
// screens need it too, and importing it back out of the navigator would make
// a module cycle (the navigator imports every screen).

export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_TOP_GAP = 8;

/**
 * Bottom padding a scrollable screen — or a screen's own fixed bottom bar —
 * needs so its last row clears the floating tab bar. The bar is absolutely
 * positioned and reserves no layout space, so content runs under the frosted
 * pill; that's what makes it read as floating rather than as a solid footer.
 */
export const TAB_BAR_SPACE = TAB_BAR_HEIGHT + TAB_BAR_TOP_GAP + 34 + 16;
