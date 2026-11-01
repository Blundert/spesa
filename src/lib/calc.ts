// Calcolatrice del tastierino prezzi: l'espressione è la stringa mostrata a schermo
// (cifre, "," e i simboli dei tasti), il risultato è in centesimi.

export type CalcOp = '+' | '−' | '×' | '÷'
export type CalcKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | CalcOp | '(' | ')' | '%'

/** Limite come nel tastierino normale: 99.999,99 €. */
export const MAX_CENTS = 9_999_999
/** Lunghezza massima dell'espressione (sta su una riga del display). */
export const MAX_EXPR_LENGTH = 32

const OPS = new Set<string>(['+', '−', '×', '÷'])
const isDigit = (c: string) => c >= '0' && c <= '9'
const isOp = (c: string) => OPS.has(c)

/** Numero in fondo all'espressione (cifre e virgola), '' se non finisce con un numero. */
function trailingNumber(expr: string): string {
  return /[\d,]*$/.exec(expr)![0]
}

function openParens(expr: string): number {
  let n = 0
  for (const c of expr) {
    if (c === '(') n++
    else if (c === ')') n--
  }
  return n
}

/** Applica un tasto all'espressione; i tasti che non hanno senso in quel punto non fanno nulla. */
export function pressKey(expr: string, key: CalcKey): string {
  const next = applyKey(expr, key)
  return next.length > MAX_EXPR_LENGTH ? expr : next
}

function applyKey(expr: string, key: CalcKey): string {
  const last = expr.slice(-1)
  // Dopo ")" o "%" un numero o una parentesi aperta sottintendono il ×.
  const afterValue = last === ')' || last === '%'

  if (isDigit(key)) {
    if (afterValue) return `${expr}×${key}`
    const num = trailingNumber(expr)
    if (/,\d\d$/.test(num)) return expr // massimo due decimali
    if (num === '0') return expr.slice(0, -1) + key // niente zeri iniziali
    return expr + key
  }
  if (key === ',') {
    if (afterValue) return `${expr}×0,`
    const num = trailingNumber(expr)
    if (num.includes(',')) return expr
    return expr + (num === '' ? '0,' : ',')
  }
  if (isOp(key)) {
    if (expr === '' || last === '(') return expr
    if (isOp(last)) return expr.slice(0, -1) + key
    return (last === ',' ? expr.slice(0, -1) : expr) + key
  }
  if (key === '(') {
    return expr + (isDigit(last) || last === ',' || afterValue ? '×(' : '(')
  }
  if (key === ')') {
    if (openParens(expr) === 0 || isOp(last) || last === '(') return expr
    return expr + ')'
  }
  // '%'
  if (isDigit(last) || last === ',' || last === ')') return expr + '%'
  return expr
}

export function backspace(expr: string): string {
  return expr.slice(0, -1)
}

/** Espressione di partenza per un importo: '' per 0, "1,20", "42" per le cifre tonde. */
export function centsToExpr(cents: number): string {
  if (cents === 0) return ''
  const euros = Math.floor(cents / 100)
  const rest = cents % 100
  return rest === 0 ? String(euros) : `${euros},${String(rest).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Valutazione: discesa ricorsiva, niente eval.
//   expr   := term (('+' | '−') term)*
//   term   := factor (('×' | '÷') factor)*
//   factor := (numero | '(' expr ')') '%'?
// La percentuale dopo + o − è relativa a quanto c'è prima (4,50 − 30% = 3,15);
// altrove vale ÷100.
// ---------------------------------------------------------------------------

class Parser {
  private pos = 0
  private readonly src: string
  constructor(src: string) {
    this.src = src
  }

  done(): boolean {
    return this.pos >= this.src.length
  }

  private peek(): string {
    return this.src[this.pos] ?? ''
  }

  expr(): number {
    const first = this.term()
    let acc = first.pct ? first.value / 100 : first.value
    while (this.peek() === '+' || this.peek() === '−') {
      const op = this.src[this.pos++]
      const t = this.term()
      const rhs = t.pct ? (acc * t.value) / 100 : t.value
      acc = op === '+' ? acc + rhs : acc - rhs
    }
    return acc
  }

  /** Valore, e se il termine è una percentuale "nuda" (da applicare al valore a sinistra). */
  private term(): { value: number; pct: boolean } {
    const first = this.factor()
    if (this.peek() !== '×' && this.peek() !== '÷') return first
    let acc = first.pct ? first.value / 100 : first.value
    while (this.peek() === '×' || this.peek() === '÷') {
      const op = this.src[this.pos++]
      const f = this.factor()
      const v = f.pct ? f.value / 100 : f.value
      if (op === '÷' && v === 0) throw new Error('division by zero')
      acc = op === '×' ? acc * v : acc / v
    }
    return { value: acc, pct: false }
  }

  private factor(): { value: number; pct: boolean } {
    let value: number
    if (this.peek() === '(') {
      this.pos++
      value = this.expr()
      if (this.peek() !== ')') throw new Error('expected )')
      this.pos++
    } else {
      const num = /^\d*,?\d*/.exec(this.src.slice(this.pos))![0]
      if (num === '' || num === ',') throw new Error('expected number')
      this.pos += num.length
      value = Number(num.replace(',', '.'))
    }
    if (this.peek() === '%') {
      this.pos++
      return { value, pct: true }
    }
    return { value, pct: false }
  }
}

/**
 * Risultato in centesimi (arrotondato), o null se l'espressione non è valida:
 * incompleta, divisione per zero, negativa o oltre il limite. Le parentesi rimaste
 * aperte si chiudono da sole; l'espressione vuota vale 0.
 */
export function evaluate(expr: string): number | null {
  if (expr === '') return 0
  const parser = new Parser(expr + ')'.repeat(Math.max(0, openParens(expr))))
  let value: number
  try {
    value = parser.expr()
  } catch {
    return null
  }
  if (!parser.done()) return null
  // toPrecision assorbe gli errori di virgola mobile (3,1499999… → 3,15).
  const cents = Math.round(Number((value * 100).toPrecision(12)))
  if (cents < 0 || cents > MAX_CENTS) return null
  return cents
}
