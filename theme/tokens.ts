export const colors = {
  background: '#F7F4EF',
  surface: '#EEE9E1',
  surfaceRaised: '#FFFFFF',

  ink: '#111008',
  inkSecondary: '#6B6558',
  inkTertiary: '#A89F93',

  gridEmpty: '#DDD8D0',
  grid1: '#A8D5B5',
  grid2: '#3CCF6E',
  grid3: '#1E8A3E',
  grid4: '#0D4A21',

  accent: '#E8472A',
  accentSoft: '#FDE8E4',

  border: '#E0D9CF',
  shadow: 'rgba(17, 16, 8, 0.08)',
} as const

export const typography = {
  fontFamily: {
    black: 'Inter_900Black',
    bold: 'Inter_700Bold',
    semibold: 'Inter_600SemiBold',
    medium: 'Inter_500Medium',
    regular: 'Inter_400Regular',
    mono: 'SpaceMono_400Regular',
  },
  size: {
    display: 72,
    displaySm: 48,
    h1: 48,
    h1Sm: 36,
    h2: 28,
    h2Sm: 24,
    body: 15,
    bodyLg: 16,
    label: 13,
    labelSm: 12,
    caption: 11,
    wordmark: 28,
  },
  letterSpacing: {
    display: -1.5,
    h1: -1,
    h2: -0.5,
    label: 0.5,
    caption: 0.2,
    wordmark: -1,
  },
  lineHeight: {
    display: 76,
    displaySm: 52,
    h1: 52,
    h1Sm: 40,
    h2: 32,
    h2Sm: 28,
    body: 22,
    bodyLg: 24,
    label: 18,
    labelSm: 16,
    caption: 15,
    wordmark: 32,
  },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const grid = {
  cellSize: 10,
  cellGap: 2,
  weeks: 52,
} as const
