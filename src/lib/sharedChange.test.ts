import { describe, expect, it, vi } from 'vitest'
import { emitSharedChange, onSharedChange } from './sharedChange'

describe('sharedChange', () => {
  it('avvisa tutti gli iscritti con la lista cambiata', () => {
    const a = vi.fn()
    const b = vi.fn()
    const offA = onSharedChange(a)
    const offB = onSharedChange(b)
    emitSharedChange(3)
    expect(a).toHaveBeenCalledWith(3)
    expect(b).toHaveBeenCalledWith(3)
    offA()
    offB()
  })

  it('dopo la disiscrizione non avvisa più, e senza iscritti non fa niente', () => {
    const a = vi.fn()
    const off = onSharedChange(a)
    off()
    emitSharedChange(1)
    expect(a).not.toHaveBeenCalled()
  })
})
