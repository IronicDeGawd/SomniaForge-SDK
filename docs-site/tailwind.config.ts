import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// SomniaForge Brand Colors - Use sparingly for accents only
				brand: {
					primary: '#fe54ff',
					secondary: '#a064ff',
					accent: '#61f1fd',
					deep: '#3e2974',
					purple: '#af1acc'
				},
				// Professional Interface Colors - 90% of design
				'background-secondary': 'var(--background-secondary)',
				'background-tertiary': 'var(--background-tertiary)',
				'background-hover': 'var(--background-hover)',
				'surface-secondary': 'var(--surface-secondary)',
				'surface-tertiary': 'var(--surface-tertiary)',
				'foreground-secondary': 'var(--foreground-secondary)',
				'foreground-tertiary': 'var(--foreground-tertiary)',
				'foreground-quaternary': 'var(--foreground-quaternary)',
				'border-secondary': 'var(--border-secondary)',
				'border-hover': 'var(--border-hover)',

				// Semantic Colors mapped to professional palette
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: '#00d084',
				warning: '#f5a623',
				error: '#e60026',
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-glass': 'var(--gradient-glass)'
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'glow': 'var(--shadow-glow)',
				'window': 'var(--shadow-window)'
			},
			fontFamily: {
				'geist': ['var(--font-geist)'],
				'sans': ['var(--font-inter)'],
				'mono': ['var(--font-mono)']
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [
		tailwindcssAnimate,
		function({ addUtilities }) {
			addUtilities({
				// Typography System - Design System Compliant
				'.text-display-xl': {
					'font-size': '3rem', // 48px (was 4.5rem/72px)
					'font-weight': '700',
					'font-family': 'var(--font-geist)',
					'line-height': '1.1',
					'letter-spacing': '-0.02em'
				},
				'.text-display-lg': {
					'font-size': '2rem', // 32px (was 3rem/48px)
					'font-weight': '700',
					'font-family': 'var(--font-geist)',
					'line-height': '1.1',
					'letter-spacing': '-0.01em'
				},
				'.text-display-md': {
					'font-size': '1.5rem', // 24px (was 2.25rem/36px)
					'font-weight': '700',
					'font-family': 'var(--font-geist)',
					'line-height': '1.2',
					'letter-spacing': '-0.01em'
				},
				'.text-display-sm': {
					'font-size': '1.125rem', // 18px (was 1.875rem/30px)
					'font-weight': '600',
					'font-family': 'var(--font-geist)',
					'line-height': '1.2',
					'letter-spacing': '0'
				},
				'.text-heading-xl': {
					'font-size': '1.5rem',
					'font-weight': '600',
					'font-family': 'var(--font-geist)',
					'line-height': '1.25'
				},
				'.text-heading-lg': {
					'font-size': '1.25rem',
					'font-weight': '600',
					'font-family': 'var(--font-geist)',
					'line-height': '1.25'
				},
				'.text-heading-md': {
					'font-size': '1.125rem',
					'font-weight': '600',
					'font-family': 'var(--font-geist)',
					'line-height': '1.25'
				},
				'.text-heading-sm': {
					'font-size': '1rem',
					'font-weight': '600',
					'font-family': 'var(--font-geist)',
					'line-height': '1.25'
				},
				'.text-body-lg': {
					'font-size': '1rem', // 16px (design system lg)
					'font-family': 'var(--font-inter)',
					'line-height': '1.5'
				},
				'.text-body-md': {
					'font-size': '0.875rem', // 14px (design system base)
					'font-family': 'var(--font-inter)',
					'line-height': '1.5'
				},
				'.text-body-sm': {
					'font-size': '0.8125rem', // 13px (design system sm)
					'font-family': 'var(--font-inter)',
					'line-height': '1.5'
				},
				'.text-body-xs': {
					'font-size': '0.75rem', // 12px (design system xs)
					'font-family': 'var(--font-inter)',
					'line-height': '1.4'
				},
				'.text-label-lg': {
					'font-size': '0.875rem',
					'font-weight': '500',
					'font-family': 'var(--font-geist)'
				},
				'.text-label-md': {
					'font-size': '0.75rem',
					'font-weight': '500',
					'font-family': 'var(--font-geist)',
					'text-transform': 'uppercase',
					'letter-spacing': '0.05em'
				},
				'.text-label-sm': {
					'font-size': '0.75rem',
					'font-weight': '500',
					'font-family': 'var(--font-geist)',
					'text-transform': 'uppercase',
					'letter-spacing': '0.1em'
				},
				'.text-code-lg': {
					'font-size': '1rem',
					'font-family': 'var(--font-mono)',
					'line-height': '1.6'
				},
				'.text-code-md': {
					'font-size': '0.875rem',
					'font-family': 'var(--font-mono)',
					'line-height': '1.6'
				},
				'.text-code-sm': {
					'font-size': '0.75rem',
					'font-family': 'var(--font-mono)',
					'line-height': '1.6'
				},
				// Professional Button System
				'.btn-brand-primary': {
					'background-color': '#fe54ff',
					'color': 'white',
					'padding': '0.75rem 1.5rem',
					'border-radius': '0.5rem',
					'font-weight': '500',
					'transition': 'all 0.2s ease',
					'box-shadow': '0 4px 20px rgba(254, 84, 255, 0.3)',
					'&:hover': {
						'transform': 'translateY(-2px)',
						'box-shadow': '0 8px 25px rgba(254, 84, 255, 0.4)'
					}
				},
				'.btn-brand-secondary': {
					'background-color': '#a064ff',
					'color': 'white',
					'padding': '0.75rem 1.5rem',
					'border-radius': '0.5rem',
					'font-weight': '500',
					'transition': 'all 0.2s ease',
					'box-shadow': '0 4px 20px rgba(160, 100, 255, 0.3)',
					'&:hover': {
						'transform': 'translateY(-2px)',
						'box-shadow': '0 8px 25px rgba(160, 100, 255, 0.4)'
					}
				},
				'.btn-brand-accent': {
					'background-color': '#61f1fd',
					'color': 'black',
					'padding': '0.75rem 1.5rem',
					'border-radius': '0.5rem',
					'font-weight': '500',
					'transition': 'all 0.2s ease',
					'box-shadow': '0 4px 20px rgba(97, 241, 253, 0.3)',
					'&:hover': {
						'transform': 'translateY(-2px)',
						'box-shadow': '0 8px 25px rgba(97, 241, 253, 0.4)'
					}
				},
				'.btn-brand-deep': {
					'background-color': '#3e2974',
					'color': 'white',
					'padding': '0.75rem 1.5rem',
					'border-radius': '0.5rem',
					'font-weight': '500',
					'transition': 'all 0.2s ease',
					'box-shadow': '0 4px 20px rgba(62, 41, 116, 0.3)',
					'&:hover': {
						'transform': 'translateY(-2px)',
						'box-shadow': '0 8px 25px rgba(62, 41, 116, 0.4)'
					}
				},
				// Outline Button Variants
				'.btn-outline-brand-primary': {
					'background-color': 'transparent',
					'color': '#fe54ff',
					'border': '1px solid #fe54ff',
					'padding': '0.75rem 1.5rem',
					'border-radius': '0.5rem',
					'font-weight': '500',
					'transition': 'all 0.2s ease',
					'&:hover': {
						'background-color': 'rgba(254, 84, 255, 0.1)'
					}
				},
				'.btn-outline-brand-secondary': {
					'background-color': 'transparent',
					'color': '#a064ff',
					'border': '1px solid #a064ff',
					'padding': '0.75rem 1.5rem',
					'border-radius': '0.5rem',
					'font-weight': '500',
					'transition': 'all 0.2s ease',
					'&:hover': {
						'background-color': 'rgba(160, 100, 255, 0.1)'
					}
				},
				'.btn-outline-brand-accent': {
					'background-color': 'transparent',
					'color': '#61f1fd',
					'border': '1px solid #61f1fd',
					'padding': '0.75rem 1.5rem',
					'border-radius': '0.5rem',
					'font-weight': '500',
					'transition': 'all 0.2s ease',
					'&:hover': {
						'background-color': 'rgba(97, 241, 253, 0.1)'
					}
				},
				'.btn-outline-brand-deep': {
					'background-color': 'transparent',
					'color': '#3e2974',
					'border': '1px solid #3e2974',
					'padding': '0.75rem 1.5rem',
					'border-radius': '0.5rem',
					'font-weight': '500',
					'transition': 'all 0.2s ease',
					'&:hover': {
						'background-color': 'rgba(62, 41, 116, 0.1)'
					}
				},
				// Professional Card System
				'.professional-card': {
					'background-color': 'hsl(var(--card))',
					'border': '1px solid hsl(var(--border))',
					'border-radius': '0.75rem',
					'transition': 'all 0.2s ease',
					'&:hover': {
						'border-color': 'hsl(var(--border) / 0.8)',
						'box-shadow': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
					}
				},
				'.professional-grid': {
					'display': 'grid',
					'grid-template-columns': 'repeat(auto-fit, minmax(300px, 1fr))',
					'gap': '1.5rem'
				},
				'.hover-lift': {
					'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
					'&:hover': {
						'transform': 'translateY(-2px)',
						'box-shadow': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
					}
				}
			});
		}
	],
} satisfies Config;
