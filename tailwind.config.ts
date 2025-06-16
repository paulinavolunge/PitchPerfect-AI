
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
        sans: ['Inter', 'Poppins', 'sans-serif'],
        rounded: ['Nunito', 'Inter', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
          50: '#EAF6FB',
          100: '#DCEEFF',
          200: '#A2D2FF',
          300: '#7CB9E8',
          400: '#56A0D3',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1F3B73',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          DEFAULT: '#F8FAFC',
          foreground: '#1E293B',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: '#A2D2FF',
          foreground: '#1F3B73',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1E293B',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1E293B',
        },
        // New modern color palette
        "soft-blue": {
          50: '#EAF6FB',
          100: '#DCEEFF', 
          200: '#A2D2FF',
          300: '#7CB9E8',
          400: '#56A0D3',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1F3B73',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        "sky-blue": {
          DEFAULT: '#A2D2FF',
          light: '#C7E2FF',
          dark: '#7CB9E8',
        },
        "navy": {
          DEFAULT: '#1F3B73',
          light: '#2563EB',
          dark: '#1E2A5E',
        },
        "clean-white": '#FFFFFF',
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      keyframes: {
        'gentle-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        'smooth-scale': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'slide-up-soft': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
      },
      animation: {
        'gentle-float': 'gentle-float 3s ease-in-out infinite',
        'soft-pulse': 'soft-pulse 2s ease-in-out infinite',
        'smooth-scale': 'smooth-scale 0.3s ease-out',
        'slide-up-soft': 'slide-up-soft 0.5s ease-out',
      },
      boxShadow: {
        'soft': '0 2px 4px 0 rgb(59 130 246 / 0.08)',
        'soft-lg': '0 8px 25px -5px rgb(59 130 246 / 0.1)',
        'soft-xl': '0 20px 40px -12px rgb(59 130 246 / 0.15)',
      },
      backgroundImage: {
        'soft-gradient': 'linear-gradient(135deg, #EAF6FB 0%, #DCEEFF 100%)',
        'hero-gradient': 'linear-gradient(135deg, #EAF6FB 0%, #A2D2FF 50%, #DCEEFF 100%)',
        'card-gradient': 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
