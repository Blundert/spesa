import { DEFAULT_BUONO_VALUE_CENTS } from '../db/types'

export const DEFAULT_BUONO_VALUE_KEY = 'default-buono-value-cents'

/** Valore minimo di un buono (stesso minimo degli stepper). */
export const MIN_BUONO_VALUE_CENTS = 50

/**
 * Valore predefinito di un buono pasto, in centesimi, proposto all'avvio di una nuova spesa.
 * Se non impostato o non valido: DEFAULT_BUONO_VALUE_CENTS.
 */
export function getDefaultBuonoValueCents(): number {
  const raw = localStorage.getItem(DEFAULT_BUONO_VALUE_KEY)
  const parsed = raw !== null ? parseInt(raw, 10) : NaN
  return isNaN(parsed) || parsed < MIN_BUONO_VALUE_CENTS ? DEFAULT_BUONO_VALUE_CENTS : parsed
}

export function setDefaultBuonoValueCents(cents: number): void {
  localStorage.setItem(DEFAULT_BUONO_VALUE_KEY, String(Math.max(MIN_BUONO_VALUE_CENTS, Math.floor(cents))))
}
