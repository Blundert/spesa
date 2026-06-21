import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { compressImage } from './imageUtils'

type MockCtx = { drawImage: ReturnType<typeof vi.fn> }

let mockCtx: MockCtx | null
let mockCanvas: {
  width: number
  height: number
  getContext: ReturnType<typeof vi.fn>
  toDataURL: ReturnType<typeof vi.fn>
}

interface MockImageConfig {
  naturalWidth: number
  naturalHeight: number
  fail: boolean
}

let imgCfg: MockImageConfig

class MockImage {
  naturalWidth = 0
  naturalHeight = 0
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  set src(_: string) {
    this.naturalWidth = imgCfg.naturalWidth
    this.naturalHeight = imgCfg.naturalHeight
    if (imgCfg.fail) {
      setTimeout(() => this.onerror?.(), 0)
    } else {
      setTimeout(() => this.onload?.(), 0)
    }
  }
}

beforeEach(() => {
  imgCfg = { naturalWidth: 800, naturalHeight: 600, fail: false }
  mockCtx = { drawImage: vi.fn() }
  mockCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => mockCtx),
    toDataURL: vi.fn(() => 'data:image/jpeg;base64,mock'),
  }
  vi.stubGlobal('Image', MockImage)
  vi.stubGlobal('document', { createElement: vi.fn(() => mockCanvas) })
  ;(URL as unknown as Record<string, unknown>).createObjectURL = vi.fn(() => 'blob:mock')
  ;(URL as unknown as Record<string, unknown>).revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeFile() {
  return new File(['x'], 'img.jpg', { type: 'image/jpeg' })
}

describe('compressImage', () => {
  it('percorso normale: risolve con data URL', async () => {
    const result = await compressImage(makeFile())
    expect(result).toBe('data:image/jpeg;base64,mock')
    expect(mockCtx!.drawImage).toHaveBeenCalledOnce()
  })

  it('scala down se naturalWidth > maxWidth', async () => {
    imgCfg = { naturalWidth: 2400, naturalHeight: 1800, fail: false }
    await compressImage(makeFile(), 1200)
    // scala = 0.5 → w=1200, h=900
    expect(mockCanvas.width).toBe(1200)
    expect(mockCanvas.height).toBe(900)
  })

  it('nessuna scala se naturalWidth ≤ maxWidth', async () => {
    imgCfg = { naturalWidth: 800, naturalHeight: 600, fail: false }
    await compressImage(makeFile(), 1200)
    expect(mockCanvas.width).toBe(800)
    expect(mockCanvas.height).toBe(600)
  })

  it('rifiuta con "No canvas context" se getContext restituisce null', async () => {
    mockCanvas.getContext.mockReturnValue(null)
    await expect(compressImage(makeFile())).rejects.toThrow('No canvas context')
  })

  it('rifiuta con "Failed to load image" su onerror', async () => {
    imgCfg = { naturalWidth: 0, naturalHeight: 0, fail: true }
    await expect(compressImage(makeFile())).rejects.toThrow('Failed to load image')
  })
})
