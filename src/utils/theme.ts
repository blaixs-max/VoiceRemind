// src/utils/theme.ts
// Merkezi tasarım sistemi — renkler, tipografi, spacing, gölgeler

export const colors = {
  // Ana renkler
  primary: '#4F46E5',       // indigo-600
  primaryLight: '#818CF8',  // indigo-400
  primaryDark: '#3730A3',   // indigo-800
  primaryBg: '#EEF2FF',     // indigo-50

  // Vurgu renkleri
  accent: '#F59E0B',        // amber-500
  accentLight: '#FEF3C7',   // amber-100

  // Durum renkleri
  success: '#10B981',       // emerald-500
  successBg: '#D1FAE5',     // emerald-100
  warning: '#F59E0B',       // amber-500
  warningBg: '#FEF3C7',     // amber-100
  danger: '#EF4444',        // red-500
  dangerBg: '#FEE2E2',      // red-100

  // Nötr renkler
  white: '#FFFFFF',
  bg: '#EAEFF8',            // soft indigo-gray
  bgCard: '#FFFFFF',
  border: '#D6DCEA',        // cool gray border
  borderLight: '#E3E8F4',   // soft gray

  // Metin renkleri
  text: '#0F172A',          // slate-900
  textSecondary: '#64748B', // slate-500
  textMuted: '#94A3B8',     // slate-400
  textInverse: '#FFFFFF',

  // Mikrofon özel
  micIdle: '#4F46E5',
  micRecording: '#EF4444',
  micProcessing: '#64748B',
  micGlow: 'rgba(79, 70, 229, 0.2)',
  micRecordingGlow: 'rgba(239, 68, 68, 0.25)',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
}

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 40,
}

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
}

export const shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  }),
}

// İsme göre deterministik avatar rengi
const AVATAR_COLORS = [
  '#4F46E5', '#7C3AED', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  '#8B5CF6', '#F97316', '#14B8A6', '#6366F1',
]

export function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
