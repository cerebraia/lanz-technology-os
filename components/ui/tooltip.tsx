'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

const sideClasses: Record<TooltipSide, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
}

type TooltipProps = {
  content: string
  children: ReactNode
  side?: TooltipSide
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={[
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-lz-border',
            'bg-lz-sidebar px-2.5 py-1.5 text-xs text-lz-text shadow-lg',
            sideClasses[side],
          ].join(' ')}
        >
          {content}
        </div>
      )}
    </div>
  )
}
