/**
 * SomniaForge SDK Design System
 * 
 * Provides consistent colors, typography, spacing, and styling utilities
 * for building games on the Somnia Network.
 */

/**
 * Brand colors and design tokens for SomniaForge SDK components
 */
export const SomniaColors = {
  primaryGradient: 'linear-gradient(to bottom, #AD00FF, #333BFF)',
  primaryGradientReverse: 'linear-gradient(to top, #AD00FF, #333BFF)',
  primaryGradientHorizontal: 'linear-gradient(to right, #AD00FF, #333BFF)',
  primaryGradientDiagonal: 'linear-gradient(135deg, #AD00FF, #333BFF)',
  
  somniaViolet: '#AD00FF',
  somniaBlue: '#333BFF',
  
  hover: 'linear-gradient(to bottom, #BD10FF, #434FFF)',
  active: 'linear-gradient(to bottom, #9D00EF, #232FFF)',
  disabled: 'linear-gradient(to bottom, #AD00FF66, #333BFF66)',
  
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const

/**
 * Design system theme tokens for consistent styling
 */
export const SomniaTheme = {
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    somnia: '0 8px 25px rgba(173, 0, 255, 0.25), 0 4px 10px rgba(51, 59, 255, 0.15)',
  },
} as const

/**
 * Utility function for CSS-in-JS styling
 * @param styles - Style object to apply
 * @returns The same style object for type safety
 */
export const css = (styles: Record<string, any>) => styles