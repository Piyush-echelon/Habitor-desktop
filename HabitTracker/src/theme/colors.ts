export const ThemeColors = {
  dark: {
    background: '#0B0F19',
    cardBg: '#151C2C',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    hover: 'rgba(255, 255, 255, 0.06)',
    divider: 'rgba(255, 255, 255, 0.07)',
    boxShadow: '0 2px 16px rgba(0, 0, 0, 0.35)',
    cardShadow: '0 1px 6px rgba(0, 0, 0, 0.28)',

    categories: {
      health: '#00F2FE',
      mind: '#A855F7',
      productivity: '#3B82F6',
      fitness: '#10B981',
      routine: '#F59E0B',
    },

    accent: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    xpBar: '#3B82F6',
    gold: '#FBBF24',
  },
  light: {
    background: '#ECEEF4',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0, 0, 0, 0.09)',
    textPrimary: '#1C1E22',
    textSecondary: '#374151', // Darkened for accessibility & high readability over light backgrounds (from #6B7280)
    textMuted: '#5E6A7E',     // Darkened for high readability of metadata (from #9CA3AF)
    hover: 'rgba(0, 0, 0, 0.045)',
    divider: 'rgba(0, 0, 0, 0.08)',
    boxShadow: '0 2px 14px rgba(0, 0, 0, 0.07)',
    cardShadow: '0 1px 5px rgba(0, 0, 0, 0.06)',

    categories: {
      health: '#4CA882',
      mind: '#8B5CF6',
      productivity: '#FF9F43',
      fitness: '#EE5253',
      routine: '#3B82F6',
    },

    accent: '#E26D5C',
    success: '#4CA882',
    warning: '#FF9F43',
    danger: '#EE5253',
    xpBar: '#E26D5C',
    gold: '#FF9F43',
  }
};

export type ThemeType = 'dark' | 'light';
