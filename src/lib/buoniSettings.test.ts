import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_BUONO_VALUE_KEY,
  getDefaultBuonoValueCents,
  setDefaultBuonoValueCents,
} from './buoniSettings'
import { DEFAULT_BUONO_VALUE_CENTS } from '../db/types'

const store: Record<string, string> = {}

vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => {
    store[key] = val
  },
})

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k]
})

describe('getDefaultBuonoValueCents', () => {
  it('ritorna il default quando non impostato', () => {
    expect(getDefaultBuonoValueCents()).toBe(DEFAULT_BUONO_VALUE_CENTS)
  })

  it('ritorna il valore salvato', () => {
    store[DEFAULT_BUONO_VALUE_KEY] = '1050'
    expect(getDefaultBuonoValueCents()).toBe(1050)
  })

  it('ritorna il default per valori non numerici', () => {
    store[DEFAULT_BUONO_VALUE_KEY] = 'abc'
    expect(getDefaultBuonoValueCents()).toBe(DEFAULT_BUONO_VALUE_CENTS)
  })

  it('ritorna il default per valori sotto il minimo', () => {
    store[DEFAULT_BUONO_VALUE_KEY] = '0'
    expect(getDefaultBuonoValueCents()).toBe(DEFAULT_BUONO_VALUE_CENTS)
  })
})

describe('setDefaultBuonoValueCents', () => {
  it('salva il valore in centesimi', () => {
    setDefaultBuonoValueCents(700)
    expect(store[DEFAULT_BUONO_VALUE_KEY]).toBe('700')
    expect(getDefaultBuonoValueCents()).toBe(700)
  })

  it('arrotonda per difetto e applica il minimo', () => {
    setDefaultBuonoValueCents(650.9)
    expect(store[DEFAULT_BUONO_VALUE_KEY]).toBe('650')
    setDefaultBuonoValueCents(10)
    expect(store[DEFAULT_BUONO_VALUE_KEY]).toBe('50')
  })
})
