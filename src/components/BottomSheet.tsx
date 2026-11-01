import { useEffect, useState } from 'react'
import { Drawer } from 'vaul'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  showHandle?: boolean
  /** Sheet contenente un input/select che apre la tastiera: si apre quasi a schermo intero. */
  hasInput?: boolean
}

const EXPANDED_HEIGHT = 'calc(100dvh - env(safe-area-inset-top) - 20px)'
const DEFAULT_MAX_HEIGHT = '85dvh'

export function BottomSheet({
  open,
  onClose,
  children,
  showHandle = true,
  hasInput = false,
}: BottomSheetProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    if (!open) return

    const update = () => {
      const vv = window.visualViewport
      if (!vv) return
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardHeight(kb > 50 ? kb : 0)
      setViewportHeight(vv.height)
    }

    update()
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.visualViewport?.removeEventListener('resize', update)
      setKeyboardHeight(0)
    }
  }, [open])

  // Con input: lo sheet resta fermo a tutta altezza anche con la tastiera aperta
  // (la tastiera copre solo la parte bassa) e il contenuto riceve un padding pari
  // alla tastiera, così tutto resta raggiungibile scrollando. Muovere/ridimensionare
  // lo sheet mentre iOS apre la tastiera lo manda fuori schermo (vista bianca).
  // Senza input: lo sheet sale sopra un'eventuale tastiera.
  const contentStyle = hasInput
    ? { height: EXPANDED_HEIGHT }
    : keyboardHeight > 0
      ? { bottom: keyboardHeight, maxHeight: `${viewportHeight - 16}px` }
      : { maxHeight: DEFAULT_MAX_HEIGHT }
  const scrollStyle = hasInput && keyboardHeight > 0 ? { paddingBottom: keyboardHeight + 22 } : undefined

  return (
    // repositionInputs={false}: Vaul altrimenti riscrive height/bottom dello sheet
    // all'apertura della tastiera, in conflitto con la logica qui sopra.
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} dismissible repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/32 z-[80]" />
        <Drawer.Content
          style={contentStyle}
          className="fixed bottom-0 z-[90] bg-white rounded-t-[30px] pt-[10px] shadow-[0_-12px_44px_rgba(0,0,0,.16)] outline-none w-full max-w-[430px] left-1/2 -translate-x-1/2 flex flex-col"
        >
          {showHandle && (
            <Drawer.Handle className="w-[38px] h-[5px] rounded-full bg-[#D8D8D6] mx-auto mb-4 shrink-0" />
          )}
          <div
            style={scrollStyle}
            className="overflow-y-auto overscroll-contain px-[22px] pb-[calc(22px+env(safe-area-inset-bottom))] flex-1"
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
