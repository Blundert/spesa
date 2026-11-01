import { useEffect, useRef, useState } from 'react'
import { Drawer } from 'vaul'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  showHandle?: boolean
  /** Sheet contenente un input/select che apre la tastiera: si apre quasi a schermo intero. */
  hasInput?: boolean
}

// 12px = stacco dalla barra di stato, uguale a quanto il velo sporge ai lati (vedi Drawer.Overlay):
// le curve di velo (42px) e sheet (30px) restano concentriche.
const EXPANDED_HEIGHT = 'calc(100dvh - env(safe-area-inset-top) - 12px)'
const DEFAULT_MAX_HEIGHT = '85dvh'
/** Durata dell'animazione di apertura di Vaul (style.css: 0.5s). */
const OPEN_ANIMATION_MS = 500

export function BottomSheet({
  open,
  onClose,
  children,
  showHandle = true,
  hasInput = false,
}: BottomSheetProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Focus sul campo marcato `data-autofocus` solo a sheet arrivato in posizione.
  // Con `autoFocus` il campo riceve il focus mentre lo sheet è ancora sotto il bordo
  // dello schermo (inizio animazione): iOS apre la tastiera, sposta la vista per
  // mostrare il campo e, a fine animazione, la vista resta spostata (schermata bianca).
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      scrollRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })
    }, OPEN_ANIMATION_MS)
    return () => window.clearTimeout(timer)
  }, [open])

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
        {/* La barra di stato resta sempre chiara: il velo scuro sotto di essa è una scheda con
            angoli superiori da 42px (30 dello sheet + 12 di stacco), allargata di 12px per lato
            così le curve di velo e sheet sono concentriche e ai lati non resta grigio.
            Il contenitore resta largo quanto lo schermo (overflow-hidden) per non creare scroll
            orizzontale su iOS. */}
        <Drawer.Overlay className="fixed inset-0 z-[80] overflow-hidden">
          <div className="absolute inset-y-0 -inset-x-3 bg-black/32 rounded-t-[42px]" />
        </Drawer.Overlay>
        <Drawer.Content
          style={contentStyle}
          className="fixed bottom-0 z-[90] bg-white rounded-t-[30px] pt-[10px] shadow-[0_-12px_44px_rgba(0,0,0,.16)] outline-none w-full max-w-[430px] left-1/2 -translate-x-1/2 flex flex-col"
        >
          {showHandle && (
            <Drawer.Handle className="w-[38px] h-[5px] rounded-full bg-[#D8D8D6] mx-auto mb-4 shrink-0" />
          )}
          <div
            ref={scrollRef}
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
