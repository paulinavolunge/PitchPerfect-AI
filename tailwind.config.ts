
import type { Config } from "tailwindcss";

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
  		fontFamily: {
  			sans: [
  				'Inter',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			rounded: [
  				'Nunito',
  				'Inter',
  				'sans-serif'
  			],
  			serif: [
  				'Lora',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Space Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				'50': '#EBF4FF',
  				'100': '#DBEAFE',
  				'200': '#BFDBFE',
  				'300': '#93C5FD',
  				'400': '#71AFFF',
  				'500': '#63A4FF',
  				'600': '#3B82F6',
  				'700': '#2563EB',
  				'800': '#1E40AF',
  				'900': '#1E3A8A',
  				DEFAULT: '#63A4FF',
  				foreground: '#FFFFFF'
  			},
  			secondary: {
  				'50': '#F8FAFC',
  				'100': '#F1F5F9',
  				'200': '#E2E8F0',
  				'300': '#CBD5E1',
  				'400': '#94A3B8',
  				'500': '#64748B',
  				'600': '#475569',
  				'700': '#334155',
  				'800': '#1E293B',
  				'900': '#0F172A',
  				DEFAULT: '#F4F6F8',
  				foreground: '#1E293B'
  			},
  			destructive: {
  				DEFAULT: '#EF4444',
  				foreground: '#FFFFFF'
  			},
  			muted: {
  				DEFAULT: '#E9EEF4',
  				foreground: '#64748B'
  			},
  			accent: {
  				DEFAULT: '#71AFFF',
  				foreground: '#263159'
  			},
  			popover: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#1E293B'
  			},
  			card: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#1E293B'
  			},
  			'vibrant-blue': {
  				'50': '#EBF4FF',
  				'100': '#DBEAFE',
  				'200': '#BFDBFE',
  				'300': '#93C5FD',
  				'400': '#71AFFF',
  				'500': '#63A4FF',
  				'600': '#3B82F6',
  				'700': '#2563EB',
  				'800': '#1E40AF',
  				'900': '#1E3A8A'
  			},
  			'deep-navy': {
  				DEFAULT: '#1A2B50',
  				light: '#263159',
  				dark: '#15213D'
  			},
  			'neutral-base': {
  				DEFAULT: '#F4F6F8',
  				light: '#FFFFFF',
  				medium: '#E9EEF4'
  			}
  		},
  		borderRadius: {
  			lg: '1rem',
  			md: '0.75rem',
  			sm: '0.5rem',
  			xl: '1.5rem',
  			'2xl': '2rem'
  		},
  		keyframes: {
  			'vibrant-float': {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-8px)'
  				}
  			},
  			'strong-pulse': {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.7'
  				}
  			},
  			'engaging-scale': {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'slide-up-vibrant': {
  				'0%': {
  					transform: 'translateY(20px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			'pulse-slow': {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.6'
  				}
  			}
  		},
  		animation: {
  			'vibrant-float': 'vibrant-float 3s ease-in-out infinite',
  			'strong-pulse': 'strong-pulse 2s ease-in-out infinite',
  			'engaging-scale': 'engaging-scale 0.3s ease-out',
  			'slide-up-vibrant': 'slide-up-vibrant 0.5s ease-out',
  			'pulse-slow': 'pulse-slow 3s ease-in-out infinite'
  		},
  		boxShadow: {
  			vibrant: '0 4px 6px -1px rgb(99 164 255 / 0.15)',
  			'vibrant-lg': '0 10px 25px -3px rgb(99 164 255 / 0.2)',
  			'vibrant-xl': '0 25px 50px -12px rgb(99 164 255 / 0.25)',
  			deep: '0 8px 30px -8px rgb(26 43 80 / 0.3)'
  		},
  		backgroundImage: {
  			'vibrant-gradient': 'linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%)',
  			'hero-gradient': 'linear-gradient(135deg, #EBF4FF 0%, #71AFFF 50%, #DBEAFE 100%)',
  			'card-gradient': 'linear-gradient(145deg, #FFFFFF 0%, #F4F6F8 100%)',
  			'cta-gradient': 'linear-gradient(135deg, #63A4FF 0%, #3B82F6 50%, #6366F1 100%)',
  			'cta-gradient-hover': 'linear-gradient(135deg, #71AFFF 0%, #2563EB 50%, #4F46E5 100%)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
