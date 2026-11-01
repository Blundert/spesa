export const THEME_IDS = ['chiaro', 'scuro', 'salvia', 'oceano', 'notte', 'contrasto'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const DEFAULT_THEME: ThemeId = 'chiaro'
/** Con "Segui il sistema" l'app usa questi due, secondo il tema chiaro/scuro del dispositivo. */
export const AUTO_LIGHT_THEME: ThemeId = 'chiaro'
export const AUTO_DARK_THEME: ThemeId = 'scuro'

export const THEME_STORAGE_KEY = 'app-theme'

export interface ThemePref {
  theme: ThemeId
  /** Segue il tema del dispositivo (ignora `theme` finché è attivo). */
  auto: boolean
}

/**
 * Colori di anteprima di ogni tema (campioni nelle Impostazioni e colore della barra del browser).
 * Devono coincidere con i token di src/theme/themes.css e con la mappa in index.html: lo controlla un test.
 */
export const THEME_PREVIEW: Record<ThemeId, { bg: string; surface: string; accent: string; c1: string; c2: string; c3: string }> = {
  chiaro: { bg: '#F2F2F0', surface: '#FFFFFF', accent: '#2A2A2C', c1: '#4C6EF5', c2: '#12B886', c3: '#F76707' },
  scuro: { bg: '#141416', surface: '#1E1E21', accent: '#EDEDEF', c1: '#7C93FF', c2: '#3DD6A5', c3: '#FF9142' },
  salvia: { bg: '#EDF0EA', surface: '#FAFBF9', accent: '#2F5D46', c1: '#2F5D46', c2: '#7FB069', c3: '#D98E3F' },
  oceano: { bg: '#ECF1F6', surface: '#FFFFFF', accent: '#1F5FBF', c1: '#1F5FBF', c2: '#1BA39C', c3: '#F08A24' },
  notte: { bg: '#0E1626', surface: '#16213A', accent: '#5B8CFF', c1: '#5B8CFF', c2: '#35D0B0', c3: '#FFA24C' },
  contrasto: { bg: '#FFFFFF', surface: '#F0F0F0', accent: '#000000', c1: '#0033CC', c2: '#006B3C', c3: '#C23B00' },
}

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

/** Legge la preferenza salvata; qualunque valore mancante o rovinato dà il tema di sempre. */
export function parseThemePref(raw: string | null): ThemePref {
  if (raw === null) return { theme: DEFAULT_THEME, auto: false }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { theme: DEFAULT_THEME, auto: false }
    const { theme, auto } = parsed as { theme?: unknown; auto?: unknown }
    return { theme: isThemeId(theme) ? theme : DEFAULT_THEME, auto: auto === true }
  } catch {
    return { theme: DEFAULT_THEME, auto: false }
  }
}

export function serializeThemePref(pref: ThemePref): string {
  return JSON.stringify(pref)
}

/** Tema da applicare adesso. */
export function resolveTheme(pref: ThemePref, systemDark: boolean): ThemeId {
  if (!pref.auto) return pref.theme
  return systemDark ? AUTO_DARK_THEME : AUTO_LIGHT_THEME
}
