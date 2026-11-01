/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

// Vitest svuota i file .css importati: qui si leggono dal disco.
const srcDir = new URL('../', import.meta.url)
const css = readFileSync(new URL('theme/themes.css', srcDir), 'utf-8')
const html = readFileSync(new URL('../index.html', srcDir), 'utf-8')
import {
  THEME_IDS,
  THEME_PREVIEW,
  DEFAULT_THEME,
  AUTO_LIGHT_THEME,
  AUTO_DARK_THEME,
  isThemeId,
  parseThemePref,
  serializeThemePref,
  resolveTheme,
} from './theme'

describe('isThemeId', () => {
  it('accetta solo i temi noti', () => {
    for (const id of THEME_IDS) expect(isThemeId(id)).toBe(true)
    expect(isThemeId('rosa')).toBe(false)
    expect(isThemeId(3)).toBe(false)
    expect(isThemeId(null)).toBe(false)
  })
})

describe('parseThemePref / serializeThemePref', () => {
  it('senza preferenza salvata: tema di sempre, non automatico', () => {
    expect(parseThemePref(null)).toEqual({ theme: DEFAULT_THEME, auto: false })
  })

  it('rilegge quello che ha scritto', () => {
    for (const id of THEME_IDS) {
      for (const auto of [true, false]) {
        expect(parseThemePref(serializeThemePref({ theme: id, auto }))).toEqual({ theme: id, auto })
      }
    }
  })

  it('un tema sconosciuto ricade sul tema di sempre, mantenendo "automatico"', () => {
    expect(parseThemePref('{"theme":"rosa","auto":true}')).toEqual({ theme: DEFAULT_THEME, auto: true })
  })

  it('"automatico" è vero solo se è proprio true', () => {
    expect(parseThemePref('{"theme":"scuro","auto":"yes"}')).toEqual({ theme: 'scuro', auto: false })
    expect(parseThemePref('{"theme":"scuro"}')).toEqual({ theme: 'scuro', auto: false })
  })

  it('un valore rovinato o non oggetto ricade sul tema di sempre', () => {
    for (const raw of ['', '{boh', 'null', '42', '"scuro"']) {
      expect(parseThemePref(raw)).toEqual({ theme: DEFAULT_THEME, auto: false })
    }
  })
})

describe('resolveTheme', () => {
  it('senza "automatico" vale la scelta, qualunque sia il dispositivo', () => {
    expect(resolveTheme({ theme: 'salvia', auto: false }, true)).toBe('salvia')
    expect(resolveTheme({ theme: 'salvia', auto: false }, false)).toBe('salvia')
  })

  it('con "automatico" segue il dispositivo e ignora la scelta', () => {
    expect(resolveTheme({ theme: 'salvia', auto: true }, true)).toBe(AUTO_DARK_THEME)
    expect(resolveTheme({ theme: 'salvia', auto: true }, false)).toBe(AUTO_LIGHT_THEME)
  })
})

// ---------------------------------------------------------------------------
// Coerenza fra i tre posti dove vivono i colori dei temi
// ---------------------------------------------------------------------------

function parseBlocks(css: string): Record<string, Record<string, string>> {
  const blocks: Record<string, Record<string, string>> = {}
  for (const m of css.matchAll(/(:root|\[data-app-theme="([a-z]+)"\])\s*\{([^}]*)\}/g)) {
    const name = m[2] ?? 'chiaro'
    const tokens: Record<string, string> = {}
    for (const t of m[3].matchAll(/--t-([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});/g)) tokens[t[1]] = t[2].toUpperCase()
    blocks[name] = tokens
  }
  return blocks
}

const blocks = parseBlocks(css)

describe('themes.css', () => {
  it('definisce ogni tema', () => {
    expect(Object.keys(blocks).sort()).toEqual([...THEME_IDS].sort())
  })

  it('ogni tema ridefinisce esattamente gli stessi token del tema di sempre', () => {
    const base = Object.keys(blocks.chiaro).sort()
    expect(base.length).toBeGreaterThan(40)
    for (const id of THEME_IDS) expect(Object.keys(blocks[id]).sort(), id).toEqual(base)
  })

  it('il tema di sempre ha i colori storici dell\'app (non vanno cambiati)', () => {
    expect(blocks.chiaro).toMatchObject({
      bg: '#F2F2F0', surface: '#FFFFFF', surface2: '#F6F6F4', fg: '#2A2A2C', accent: '#2A2A2C',
      muted: '#9B9B9F', faint: '#B5B5BA', line: '#ECECEC', danger: '#D14343',
    })
  })

  it('i colori di anteprima coincidono con i token', () => {
    for (const id of THEME_IDS) {
      const t = blocks[id]
      const p = THEME_PREVIEW[id]
      expect(
        { bg: t.bg, surface: t.surface, accent: t.accent, c1: t['c-total'], c2: t['c-buoni'], c3: t['c-pocket'] },
        id,
      ).toEqual(p)
    }
  })
})

describe('index.html', () => {
  it('la mappa dei colori della barra coincide con i temi', () => {
    const map = /var bg = \{([^}]*)\}/.exec(html)
    expect(map).not.toBeNull()
    const found: Record<string, string> = {}
    for (const m of (map?.[1] ?? '').matchAll(/([a-z]+):\s*'(#[0-9A-Fa-f]{6})'/g)) found[m[1]] = m[2].toUpperCase()
    expect(found).toEqual(Object.fromEntries(THEME_IDS.map((id) => [id, THEME_PREVIEW[id].bg])))
  })
})

describe('colori nel codice', () => {
  const sources = (readdirSync(srcDir, { recursive: true }) as string[])
    .filter((f) => /\.(ts|tsx|css)$/.test(f))
    .map((f) => ({ file: f, text: readFileSync(new URL(f, srcDir), 'utf-8') }))

  it('niente colori esadecimali scritti a mano: si usano i token del tema (var(--t-*) o classi t-*)', () => {
    const allowed = ['theme/themes.css', 'lib/theme.ts', '.test.']
    const offenders: string[] = []
    for (const { file, text } of sources) {
      if (allowed.some((a) => file.includes(a))) continue
      text.split('\n').forEach((line, i) => {
        if (/#[0-9A-Fa-f]{6}\b/.test(line)) offenders.push(`${file}:${i + 1}`)
      })
    }
    expect(sources.length).toBeGreaterThan(50)
    expect(offenders).toEqual([])
  })
})
