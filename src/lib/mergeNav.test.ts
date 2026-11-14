import { describe, it, expect, vi, afterEach } from 'vitest'
import { MERGE_PATH, openMerge, setMergeNavigator } from './mergeNav'

afterEach(() => {
  setMergeNavigator(null)
  vi.unstubAllGlobals()
})

describe('openMerge', () => {
  it('usa il navigatore registrato dalla shell', () => {
    const go = vi.fn()
    setMergeNavigator(go)
    openMerge()
    expect(go).toHaveBeenCalledOnce()
  })

  it('senza navigatore ricarica sul percorso di unione', () => {
    const assign = vi.fn()
    vi.stubGlobal('window', { location: { assign } })
    openMerge()
    expect(assign).toHaveBeenCalledWith(MERGE_PATH)
    expect(MERGE_PATH).toBe('/sincronizzazione/unisci')
  })
})
