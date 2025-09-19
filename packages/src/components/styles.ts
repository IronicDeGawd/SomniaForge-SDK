/**
 * SomniaForge SDK Design System
 *
 * Provides consistent colors, typography, spacing, and styling utilities
 * that match the main SomniaForge website design system.
 */

/**
 * Brand colors and design tokens matching the SomniaForge website
 */
export const SomniaColors = {
  // Primary Brand Colors (matching website)
  brandPrimary: '#fe54ff',
  brandSecondary: '#a064ff',
  brandAccent: '#61f1fd',
  brandDeep: '#3e2974',
  brandPurple: '#af1acc',

  // Brand Gradients (matching website)
  primaryGradient: 'linear-gradient(135deg, #fe54ff 0%, #a064ff 100%)',
  secondaryGradient: 'linear-gradient(135deg, #a064ff 0%, #61f1fd 100%)',
  accentGradient: 'linear-gradient(135deg, #61f1fd 0%, #fe54ff 100%)',
  heroGradient: 'linear-gradient(135deg, #fe54ff 0%, #a064ff 50%, #61f1fd 100%)',

  // Interface Colors (matching website semantic colors)
  background: '#ffffff',
  backgroundSecondary: '#fafafa',
  backgroundTertiary: '#f4f4f5',
  backgroundHover: '#f9f9f9',

  surface: '#ffffff',
  surfaceSecondary: '#f8f9fa',
  surfaceTertiary: '#f1f3f4',

  foreground: '#0c0c0c',
  foregroundSecondary: '#525252',
  foregroundTertiary: '#737373',
  foregroundQuaternary: '#a3a3a3',

  border: '#e4e4e7',
  borderSecondary: '#d4d4d8',
  borderHover: '#a1a1aa',

  // Status Colors (matching website)
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Legacy compatibility
  white: '#ffffff',
  black: '#0c0c0c',

  // Extended Gray Palette for compatibility
  gray: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
} as const

/**
 * Design system theme tokens matching the SomniaForge website
 */
export const SomniaTheme = {
  // Typography (matching website font system)
  fonts: {
    geist: "'Geist', system-ui, -apple-system, sans-serif",
    inter: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
  },

  // Font Sizes (matching website tailwind config)
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px - matching website's text-3xl
    '4xl': '2.25rem',   // 36px - matching website's text-4xl
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line Heights (matching website)
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },

  // Border Radius (matching website --radius: 0.75rem)
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',    // matches website default
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  // Spacing System
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
    '4xl': '4rem',   // 64px
  },

  // Shadows (matching website with brand colors)
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

    // Brand-colored shadows (matching website)
    soft: '0 4px 20px -2px rgba(254, 84, 255, 0.15)',
    glow: '0 0 30px rgba(254, 84, 255, 0.4)',
    window: '0 8px 32px -4px rgba(254, 84, 255, 0.2)',
  },
} as const

/**
 * Utility function for CSS-in-JS styling
 * @param styles - Style object to apply
 * @returns The same style object for type safety
 */
export const css = (styles: Record<string, any>) => styles