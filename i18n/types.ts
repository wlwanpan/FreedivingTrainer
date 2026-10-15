export type TranslateVars = Record<string, string | number>

export type Translate = (key: string, vars?: TranslateVars) => string
