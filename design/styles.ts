export type ColorHex = string

export const Colors = {
  Canvas: '#F4F9F9',
  Card: '#FFFFFF',
  CardAlt: '#E6F6F4',
  Hover: '#E6F6F4',
  Telemetry: '#F4F9F9',
  Chrome: '#FFFFFF',
  SegmentTrack: '#F4F9F9',
  SegmentSelected: '#FFFFFF',
  BreathTrack: '#E1EDF1',
  Seafoam: '#0D9488',
  SeafoamPressed: 'rgba(13, 148, 136, 0.82)',
  SeafoamMuted: '#E6F6F4',
  SeafoamGlow: 'rgba(20, 184, 166, 0.32)',
  Aquamarine: '#06B6D4',
  AquamarineMuted: 'rgba(6, 182, 212, 0.16)',
  Lagoon: '#14B8A6',
  Text: '#0D2B38',
  TextMuted: '#52798A',
  TextDisabled: '#94A3B8',
  Alert: '#F43F5E',
  AlertPressed: 'rgba(244, 63, 94, 0.72)',
  AlertMuted: 'rgba(244, 63, 94, 0.16)',
  OnSeafoam: '#FFFFFF',
  Hairline: '#E1EDF1',
  HairlineStrong: 'rgba(13, 148, 136, 0.20)',
  Overlay: 'rgba(13, 43, 56, 0.45)',
  Shadow: '#0D4E66',
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
  Button: 16,
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
  PrimaryButton: 48,
} as const
