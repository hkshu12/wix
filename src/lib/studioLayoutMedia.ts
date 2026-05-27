/** Short landscape viewports: studio dock uses a right-side rail (see StudioPage.css). */
export const STUDIO_LANDSCAPE_COMPACT_MQ = '(orientation: landscape) and (max-height: 520px)';

/** Wide landscape viewports: denser ambience sound grid. */
export const STUDIO_LANDSCAPE_WIDE_MQ = '(orientation: landscape) and (min-width: 641px)';

/** PWA manifest orientation — allows rotation on installed home-screen apps. */
export const PWA_DISPLAY_ORIENTATION = 'any' as const;
