// src/utils/theme.ts
// Merkezi tasarım sistemi — Dark Navy Executive Dashboard teması
// Referans: Premium CRM stil → koyu navy arka plan + beyaz kart + gradient mic

export const colors = {
  // --- Ana renkler (brand) ---
  primary: '#6366F1',       // indigo-500 (daha canlı, dark bg üzerinde okunur)
  primaryLight: '#818CF8',  // indigo-400
  primaryDark: '#4338CA',   // indigo-700
  primaryBg: '#EEF2FF',     // indigo-50 — açık kartlar içinde chip için

  // Vurgu (gradient mic button, highlight'lar)
  accent: '#F59E0B',        // amber-500
  accentLight: '#FEF3C7',   // amber-100

  // --- Durum renkleri ---
  success: '#10B981',       // emerald-500
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',

  // --- Nötr renkler ---
  white: '#FFFFFF',
  // Ana arka plan artık dark navy (referans: Premium Executive Dashboard)
  bg: '#0B1020',            // deep navy #0B1020
  bgSecondary: '#151A35',   // tab bar / header için bir ton açık navy
  bgElevated: '#1D2341',    // bottom sheet, modal header
  bgCard: '#FFFFFF',        // kartlar beyaz kalır (hybrid dark)
  bgCardAlt: '#F7F8FB',     // ikinci seviye kart

  border: '#242A47',        // dark border (dark bg üzerindeki ince çizgiler)
  borderLight: '#E3E8F4',   // kart içinde açık border
  borderOnCard: '#EEF1F7',  // beyaz kart içinde divider

  // --- Metin renkleri ---
  // Kartlar beyaz olduğu için kart içinde koyu text kullanılır
  text: '#0F172A',          // slate-900 (white card üstünde)
  textSecondary: '#475569', // slate-600 (kart altyazı)
  textMuted: '#94A3B8',     // slate-400
  textInverse: '#FFFFFF',

  // Dark bg üzerinde kullanılan text (ana ekran başlıkları, tab bar label)
  textOnDark: '#FFFFFF',
  textOnDarkSecondary: '#C7CCE0',  // başlık altı soft beyaz
  textOnDarkMuted: '#8892B8',      // en soluk — "son 30 gün" gibi notlar

  // --- Mikrofon gradient (referans imaj: mor → turuncu sunset) ---
  micGradientStart: '#7B61FF',  // mor
  micGradientMid:   '#FF6A88',  // pembe ara ton
  micGradientEnd:   '#FFA940',  // turuncu
  micRecordingStart: '#FF4D6D', // kırmızı-pembe
  micRecordingEnd:   '#FF8A4C',
  micGlow: 'rgba(123, 97, 255, 0.35)',
  micRecordingGlow: 'rgba(255, 77, 109, 0.35)',

  // Ekran overlay'i (dark bg üstünde ince parlatma)
  glassFill: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',

  // Eski token'larla backward compat
  micIdle: '#7B61FF',
  micRecording: '#FF4D6D',
  micProcessing: '#8892B8',
}

// Gradient kombinasyonları (LinearGradient'a doğrudan geçirilebilir)
export const gradients = {
  mic: [colors.micGradientStart, colors.micGradientMid, colors.micGradientEnd] as const,
  micRecording: [colors.micRecordingStart, colors.micRecordingEnd] as const,
  heroHeader: ['#151A35', '#0B1020'] as const,
  primaryButton: [colors.primaryLight, colors.primary] as const,
  accentCard: ['#7B61FF', '#6366F1'] as const,
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
  xxl: 24,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  // Dark bg üstünde kartın "yüzmesi" için
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  }),
}

// İsme göre deterministik avatar rengi
const AVATAR_COLORS = [
  '#7B61FF', '#6366F1', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  '#8B5CF6', '#F97316', '#14B8A6', '#4F46E5',
]

export function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
