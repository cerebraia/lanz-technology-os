'use client'

type MobileMenuBackdropProps = {
  open: boolean
  onClose: () => void
}

export function MobileMenuBackdrop({ open, onClose }: MobileMenuBackdropProps) {
  if (!open) return null
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
      onClick={onClose}
    />
  )
}
