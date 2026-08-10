'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import type { StoreProductDetail } from '@/features/store/data/products'

type Props = { images: StoreProductDetail['images']; name: string }

export function ProductGallery({ images, name }: Props) {
  const [active,  setActive]  = useState(0)
  const [visible, setVisible] = useState(true)

  const changeImage = useCallback((i: number) => {
    if (i === active) return
    setVisible(false)
    setTimeout(() => {
      setActive(i)
      setVisible(true)
    }, 140)
  }, [active])

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-lz-surface">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-lz-border" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="m21 15-5-5L5 21"/>
        </svg>
      </div>
    )
  }

  const current = images[active]

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#0c0a18]">
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt_text ?? name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className={[
            'object-contain p-6 transition-opacity duration-150',
            visible ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => changeImage(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={i === active}
              className={[
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200',
                i === active
                  ? 'border-lz-primary shadow-[0_0_14px_rgba(123,47,255,0.35)] scale-[1.04]'
                  : 'border-lz-border/60 opacity-70 hover:border-lz-primary/50 hover:opacity-100',
              ].join(' ')}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? `${name} ${i + 1}`}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
