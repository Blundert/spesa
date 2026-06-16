import { Drawer } from 'vaul'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  showHandle?: boolean
}

export function BottomSheet({ open, onClose, children, showHandle = true }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} dismissible shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/32 z-[80]" />
        <Drawer.Content className="fixed left-0 right-0 bottom-0 z-[90] bg-white rounded-t-[30px] px-[22px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[10px] shadow-[0_-12px_44px_rgba(0,0,0,.16)] outline-none">
          {showHandle && (
            <Drawer.Handle className="w-[38px] h-[5px] rounded-full bg-[#D8D8D6] mx-auto mb-4" />
          )}
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
