import { useEffect, useState } from 'react'
import { Drawer } from 'vaul'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  showHandle?: boolean
}

export function BottomSheet({ open, onClose, children, showHandle = true }: BottomSheetProps) {
  const [offsetBottom, setOffsetBottom] = useState(0)
  const [maxHeight, setMaxHeight] = useState('85dvh')

  useEffect(() => {
    if (!open) return

    const update = () => {
      const vv = window.visualViewport
      if (!vv) return
      const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      if (keyboardHeight > 50) {
        setOffsetBottom(keyboardHeight)
        setMaxHeight(`${vv.height - 16}px`)
      } else {
        setOffsetBottom(0)
        setMaxHeight('85dvh')
      }
    }

    update()
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.visualViewport?.removeEventListener('resize', update)
      setOffsetBottom(0)
      setMaxHeight('85dvh')
    }
  }, [open])

  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/32 z-[80]" />
        <Drawer.Content
          style={{ bottom: offsetBottom, maxHeight }}
          className="fixed z-[90] bg-white rounded-t-[30px] pt-[10px] shadow-[0_-12px_44px_rgba(0,0,0,.16)] outline-none w-full max-w-[430px] left-1/2 -translate-x-1/2 flex flex-col"
        >
          {showHandle && (
            <Drawer.Handle className="w-[38px] h-[5px] rounded-full bg-[#D8D8D6] mx-auto mb-4 shrink-0" />
          )}
          <div className="overflow-y-auto px-[22px] pb-[calc(22px+env(safe-area-inset-bottom))] flex-1">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
