
export const theme = {
  colors: {
    primary: {
      50: '#EBF4FF',
      100: '#DBEAFE', 
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#71AFFF',
      500: '#63A4FF',
      600: '#3B82F6',
      700: '#2563EB',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    secondary: {
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
    accent: {
      50: '#EBF4FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#71AFFF',
      500: '#63A4FF',
      600: '#3B82F6',
      700: '#2563EB',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    neutral: {
      50: '#FFFFFF',
      100: '#F4F6F8',
      200: '#E9EEF4',
      300: '#E2E8F0',
      400: '#CBD5E1',
      500: '#94A3B8',
      600: '#64748B',
      700: '#475569',
      800: '#334155',
      900: '#1E293B',
    },
    navy: {
      50: '#F0F4FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#263159',
      800: '#1A2B50',
      900: '#1E1B4B',
    }
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui'],
      rounded: ['Nunito', 'Inter', 'ui-sans-serif', 'system-ui'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  shadows: {
    soft: '0 2px 4px 0 rgb(99 164 255 / 0.08)',
    md: '0 4px 6px -1px rgb(99 164 255 / 0.1)',
    lg: '0 10px 15px -3px rgb(99 164 255 / 0.1)',
    xl: '0 20px 25px -5px rgb(99 164 255 / 0.1)',
  }
};

export type Theme = typeof theme;
