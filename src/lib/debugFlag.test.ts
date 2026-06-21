import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getDebugViewport, setDebugViewport, onDebugViewportChange } from './debugFlag'

const store: Record<string, string> = {}
const listeners = new Map<string, Set<() => void>>()

const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => {
    store[key] = val
  },
}

const windowMock = {
  addEventListener: (type: string, fn: () => void) => {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type)!.add(fn)
  },
  removeEventListener: (type: string, fn: () => void) => {
    listeners.get(type)?.delete(fn)
  },
  dispatchEvent: (e: { type: string }) => {
    listeners.get(e.type)?.forEach(fn => fn())
    return true
  },
}

class MockEvent {
  readonly type: string
  constructor(type: string) {
    this.type = type
  }
}

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k]
  listeners.clear()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('window', windowMock)
  vi.stubGlobal('Event', MockEvent)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getDebugViewport', () => {
  it('restituisce false quando non impostato', () => {
    expect(getDebugViewport()).toBe(false)
  })
  it('restituisce false con valore "0"', () => {
    store['debug-viewport'] = '0'
    expect(getDebugViewport()).toBe(false)
  })
  it('restituisce true quando il valore è "1"', () => {
    store['debug-viewport'] = '1'
    expect(getDebugViewport()).toBe(true)
  })
})

describe('setDebugViewport', () => {
  it('scrive "1" per true e "0" per false', () => {
    setDebugViewport(true)
    expect(store['debug-viewport']).toBe('1')
    setDebugViewport(false)
    expect(store['debug-viewport']).toBe('0')
  })
  it('dispatcha un evento al cambio', () => {
    const cb = vi.fn()
    listeners.set('debug-viewport-change', new Set([cb]))
    setDebugViewport(true)
    expect(cb).toHaveBeenCalledOnce()
  })
})

describe('onDebugViewportChange', () => {
  it('registra il callback e la funzione di cleanup lo rimuove', () => {
    const cb = vi.fn()
    const cleanup = onDebugViewportChange(cb)
    setDebugViewport(true)
    expect(cb).toHaveBeenCalledOnce()
    cleanup()
    setDebugViewport(false)
    expect(cb).toHaveBeenCalledOnce()
  })
})
