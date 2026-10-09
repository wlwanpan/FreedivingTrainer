export type ColorHex = string

export const Colors: Record<string, ColorHex> = {
  Black: '#000000',
  White: '#ffffff',
  TealPrimary: '#0B6E7A',
  TealFaded: '#0B6E7Aa6',
  TealBackground: '#0B6E7A14',
  DeepPrimary: '#06343C',
  SandPrimary: '#C4A574',
  CoralPrimary: '#D4654A',
  CoralBackground: '#D4654A1f',
  BluePrimary: '#1A8CBA',
  BlueBackground: '#1A8CBA14',
  GreyPrimary: '#8C8987',
  GreyLight: '#A1A1A1',
  GreyFaded: '#8C89876d',
  GreyBackground: '#d8d1d11e',
  GreyDivider: '#e5e5e5',
  RedPrimary: '#DB0B0E',
  RedBackground: '#db0b0e82',
} as const

export const FontSizes = {
  Timer: '64px',
  XXLarge: '36px',
  XLarge: '26px',
  Large: '20px',
  Medium: '16px',
  Small: '14px',
  XSmall: '10px',
  XXSmall: '6px',
} as const

export const Layout = {
  MinControl: 44,
  /** Bottom edge to the top of the iOS 26 floating tab bar. */
  TabBarHeight: 86,
  /** Gap a control keeps from the tab bar, home indicator, or header. */
  ChromeGap: 12,
} as const
