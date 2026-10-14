export type ColorHex = string

export const Colors = {
  Canvas: '#E0F2FE',
  Card: '#FFFFFF',
  CardAlt: '#F0FDF4',
  Hover: '#BAE6FD',
  Telemetry: '#FFFFFF',
  Chrome: '#FFFFFF',
  SegmentTrack: '#E0F2FE',
  SegmentSelected: '#FFFFFF',
  BreathTrack: '#E0F2FE',
  Seafoam: '#0D9488',
  SeafoamPressed: 'rgba(13, 148, 136, 0.80)',
  SeafoamMuted: '#CCFBF1',
  SeafoamGlow: 'rgba(45, 212, 191, 0.45)',
  Aquamarine: '#38BDF8',
  AquamarineMuted: 'rgba(56, 189, 248, 0.22)',
  Lagoon: '#0891B2',
  Text: '#082F49',
  TextMuted: '#0369A1',
  TextDisabled: '#0284C7',
  Alert: '#F43F5E',
  AlertPressed: 'rgba(244, 63, 94, 0.72)',
  AlertMuted: 'rgba(244, 63, 94, 0.16)',
  OnSeafoam: '#FFFFFF',
  Hairline: 'rgba(7, 89, 133, 0.12)',
  HairlineStrong: 'rgba(7, 89, 133, 0.18)',
  Overlay: 'rgba(8, 47, 73, 0.45)',
  Black: '#000000',
} as const

export const Fonts = {
  Headline: 'Manrope_700Bold',
  HeadlineSemi: 'Manrope_600SemiBold',
  HeadlineMedium: 'Manrope_500Medium',
  Body: 'Geist_400Regular',
  BodyMedium: 'Geist_500Medium',
  BodySemi: 'Geist_600SemiBold',
} as const

export const FontSizes = {
  Timer: '48px',
  XXLarge: '32px',
  Stat: '28px',
  XLarge: '24px',
  Large: '20px',
  Medium: '16px',
  Small: '14px',
  XSmall: '12px',
  XXSmall: '10px',
} as const

export const Radii = {
  Control: 8,
  Card: 16,
  Button: 24,
  Pill: 999,
} as const

export const Space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  screen: 16,
} as const

export const Layout = {
  MinControl: 44,
  PrimaryButton: 52,
} as const
