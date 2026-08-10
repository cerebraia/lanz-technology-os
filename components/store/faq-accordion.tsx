'use client'

import { useState } from 'react'

interface FaqItem {
  q: string
  a: string
}

interface Props {
  items: FaqItem[]
}

export function FaqAccordion({ items }: Props) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-lz-border overflow-hidden rounded-2xl border border-lz-border">
      {items.map((item, i) => (
        <div key={i} className="bg-lz-surface">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
          >
            <span className="text-sm font-semibold text-lz-text">{item.q}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className={`mt-0.5 shrink-0 text-lz-muted transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-sm leading-relaxed text-lz-muted">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
