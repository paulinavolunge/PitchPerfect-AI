
export const theme = {
  colors: {
    primary: {
      50: '#EAF6FB',
      100: '#DCEEFF', 
      200: '#A2D2FF',
      300: '#7CB9E8',
      400: '#56A0D3',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1F3B73',
      800: '#1E3A8A',
      900: '#1E2A5E',
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
    neutral: {
      50: '#FFFFFF',
      100: '#F8FAFC',
      200: '#F1F5F9',
      300: '#E2E8F0',
      400: '#CBD5E1',
      500: '#94A3B8',
      600: '#64748B',
      700: '#475569',
      800: '#334155',
      900: '#1E293B',
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
    soft: '0 2px 4px 0 rgb(59 130 246 / 0.08)',
    md: '0 4px 6px -1px rgb(59 130 246 / 0.1)',
    lg: '0 10px 15px -3px rgb(59 130 246 / 0.1)',
    xl: '0 20px 25px -5px rgb(59 130 246 / 0.1)',
  }
};

export type Theme = typeof theme;
