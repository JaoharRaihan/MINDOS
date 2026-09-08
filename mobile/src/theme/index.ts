export const theme = {
  colors: {
    // Warm, calm, human palette (no sterile hospital blue)
    background: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceSubtle: '#F3EFEA',
    surfaceHighlight: '#EAE4DC',
    
    text: '#24211D',
    textSecondary: '#6E6A63',
    textMuted: '#9B968E',
    
    // Accents
    primary: '#3F6152', // Soft forest sage
    primaryLight: '#EAF1EE',
    primaryDark: '#2C4439',
    
    secondary: '#D07A58', // Warm terracotta
    secondaryLight: '#FBEFEA',
    
    accentGold: '#D89B37', // Warm muted amber
    accentGoldLight: '#FDF7EB',
    
    border: '#E8E3DC',
    borderStrong: '#D6CFC4',

    // Wellbeing status colors (gentle, not clinical)
    moodGreat: '#548773',
    moodNeutral: '#9A8E7C',
    moodDown: '#687B94',
    moodOverwhelmed: '#C26D5A',
    moodTired: '#786F8A',

    // Dark mode ready tokens
    dark: {
      background: '#161614',
      surface: '#20201D',
      surfaceSubtle: '#2A2A26',
      text: '#F2EFE9',
      textSecondary: '#A8A49C',
      border: '#35342F',
    },
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
      xxl: 28,
      display: 34,
    },
    lineHeights: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 26,
      xl: 30,
      xxl: 36,
      display: 42,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  shadows: {
    soft: {
      shadowColor: '#24211D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#24211D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  // ─── High-Contrast Overrides (WCAG AAA: contrast ratio >= 7:1) ─────────────
  // Applied when user enables high-contrast mode in Accessibility Settings.
  highContrast: {
    background: '#FFFFFF',
    surface: '#F5F2EB',
    surfaceSubtle: '#EAE6DC',
    text: '#0F0E0D',
    textSecondary: '#33302B',
    textMuted: '#4A4640',
    primary: '#1E3A2F',
    primaryLight: '#C8DDD5',
    secondary: '#8B3A1F',
    secondaryLight: '#F5D5C8',
    border: '#3D3831',
    borderStrong: '#2B2824',
  },
} as const;

export type Theme = typeof theme;
