import { describe, it, expect } from 'vitest'
import { backspace, centsToExpr, evaluate, MAX_EXPR_LENGTH, pressKey, type CalcKey } from './calc'

/** Digita una sequenza di tasti partendo da un'espressione. */
function type(keys: CalcKey[], from = ''): string {
  return keys.reduce(pressKey, from)
}
const chars = (s: string) => [...s] as CalcKey[]

describe('pressKey — cifre e virgola', () => {
  it('scrive numeri con la virgola', () => {
    expect(type(chars('1,20'))).toBe('1,20')
  })
  it('accetta al massimo due decimali', () => {
    expect(type(chars('1,205'))).toBe('1,20')
  })
  it('una sola virgola per numero, ma una per ogni numero', () => {
    expect(type(chars('1,2,'))).toBe('1,2')
    expect(type(chars('1,2+3,'))).toBe('1,2+3,')
  })
  it('la virgola all’inizio di un numero diventa "0,"', () => {
    expect(type(chars(','))).toBe('0,')
    expect(type(chars('2×,5'))).toBe('2×0,5')
    expect(type(chars('(,'))).toBe('(0,')
  })
  it('niente zeri iniziali', () => {
    expect(type(chars('05'))).toBe('5')
    expect(type(chars('0,05'))).toBe('0,05')
    expect(type(chars('100'))).toBe('100')
  })
  it('dopo ")" o "%" un numero sottintende il ×', () => {
    expect(type(chars('(2)3'))).toBe('(2)×3')
    expect(type(chars('5%2'))).toBe('5%×2')
    expect(type(chars('(2),'))).toBe('(2)×0,')
  })
})

describe('pressKey — operazioni', () => {
  it('non si comincia con un’operazione', () => {
    expect(type(chars('+'))).toBe('')
    expect(type(chars('(×'))).toBe('(')
  })
  it('un’operazione dopo un’altra la sostituisce', () => {
    expect(type(chars('4+−'))).toBe('4−')
  })
  it('una virgola finale si toglie prima dell’operazione', () => {
    expect(type(chars('4,+'))).toBe('4+')
  })
  it('dopo ")" e "%" si può continuare con un’operazione', () => {
    expect(type(chars('(1)+5%÷'))).toBe('(1)+5%÷')
  })
})

describe('pressKey — parentesi e percentuale', () => {
  it('"(" dopo un valore sottintende il ×', () => {
    expect(type(chars('2('))).toBe('2×(')
    expect(type(chars('2,('))).toBe('2,×(')
    expect(type(chars('(1)('))).toBe('(1)×(')
    expect(type(chars('5%('))).toBe('5%×(')
    expect(type(chars('2+('))).toBe('2+(')
  })
  it('")" solo con una parentesi aperta e dopo un valore', () => {
    expect(type(chars(')'))).toBe('')
    expect(type(chars('()'))).toBe('(')
    expect(type(chars('(2+)'))).toBe('(2+')
    expect(type(chars('(2))'))).toBe('(2)')
    expect(type(chars('(2,)'))).toBe('(2,)')
    expect(type(chars('(5%)'))).toBe('(5%)')
  })
  it('"%" solo dopo un numero o una parentesi chiusa', () => {
    expect(type(chars('%'))).toBe('')
    expect(type(chars('5%%'))).toBe('5%')
    expect(type(chars('5+%'))).toBe('5+')
    expect(type(chars('5,%'))).toBe('5,%')
    expect(type(chars('(5)%'))).toBe('(5)%')
  })
  it('ignora i tasti oltre la lunghezza massima', () => {
    const full = '1+'.repeat(MAX_EXPR_LENGTH / 2)
    expect(pressKey(full, '1')).toBe(full)
  })
})

describe('backspace', () => {
  it('toglie l’ultimo carattere', () => {
    expect(backspace('1,20')).toBe('1,2')
    expect(backspace('')).toBe('')
  })
})

describe('centsToExpr', () => {
  it('converte gli importi in espressioni di partenza', () => {
    expect(centsToExpr(0)).toBe('')
    expect(centsToExpr(120)).toBe('1,20')
    expect(centsToExpr(105)).toBe('1,05')
    expect(centsToExpr(4200)).toBe('42')
  })
  it('l’espressione vale di nuovo lo stesso importo', () => {
    for (const c of [1, 99, 120, 4280, 9_999_999]) expect(evaluate(centsToExpr(c))).toBe(c)
  })
})

describe('evaluate', () => {
  it('l’espressione vuota vale 0', () => {
    expect(evaluate('')).toBe(0)
  })
  it('numeri semplici', () => {
    expect(evaluate('1,20')).toBe(120)
    expect(evaluate('1,')).toBe(100)
    expect(evaluate('0,5')).toBe(50)
  })
  it('precedenza di × e ÷ su + e −', () => {
    expect(evaluate('2+3×4')).toBe(1400)
    expect(evaluate('10−6÷2')).toBe(700)
    expect(evaluate('2×3÷4')).toBe(150)
  })
  it('parentesi, anche lasciate aperte', () => {
    expect(evaluate('(2+3)×4')).toBe(2000)
    expect(evaluate('(2,99+0,50)÷2')).toBe(175)
    expect(evaluate('2×(3+1')).toBe(800)
    expect(evaluate('((1+1)×(2')).toBe(400)
  })
  it('percentuale dopo + o − relativa a quanto c’è prima', () => {
    expect(evaluate('4,50−30%')).toBe(315)
    expect(evaluate('10+10%')).toBe(1100)
    expect(evaluate('(4,50−30%)×2')).toBe(630)
    expect(evaluate('2+3−50%')).toBe(250)
  })
  it('percentuale altrove vale ÷100', () => {
    expect(evaluate('20%')).toBe(20)
    expect(evaluate('50×20%')).toBe(1000)
    expect(evaluate('20%×50')).toBe(1000)
    expect(evaluate('(50)%')).toBe(50)
    expect(evaluate('10−(30%)')).toBe(970)
  })
  it('arrotonda al centesimo', () => {
    expect(evaluate('10÷3')).toBe(333)
    expect(evaluate('0,01÷2')).toBe(1)
    expect(evaluate('1,15×3')).toBe(345)
  })
  it('null se incompleta o malformata', () => {
    expect(evaluate('4+')).toBeNull()
    expect(evaluate('(')).toBeNull()
    expect(evaluate('1)')).toBeNull()
    expect(evaluate('(1(')).toBeNull()
    expect(evaluate(',')).toBeNull()
  })
  it('null con divisione per zero', () => {
    expect(evaluate('5÷0')).toBeNull()
    expect(evaluate('5÷(1−1)')).toBeNull()
  })
  it('null se negativa o oltre il limite', () => {
    expect(evaluate('1−2')).toBeNull()
    expect(evaluate('99999,99')).toBe(9_999_999)
    expect(evaluate('99999,99+0,01')).toBeNull()
  })
})
