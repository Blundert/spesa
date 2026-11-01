import { MAX_EXPR_LENGTH } from './calc'

const REPLACEMENTS: Record<string, string> = {
  '*': '×',
  x: '×',
  X: '×',
  '/': '÷',
  '-': '−',
  '.': ',',
}

/**
 * Normalizza il testo digitato da tastiera in un'espressione per `evaluate`:
 * `*`/`x` → ×, `/` → ÷, `-` → −, `.` → `,`; scarta ogni altro carattere
 * e tronca alla lunghezza massima.
 */
export function normalizeAmountInput(raw: string): string {
  let out = ''
  for (const ch of raw) {
    const c = REPLACEMENTS[ch] ?? ch
    if (/[0-9,+−×÷()%]/.test(c)) out += c
  }
  return out.slice(0, MAX_EXPR_LENGTH)
}
