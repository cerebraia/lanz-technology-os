'use client'

import { useInView } from '@/lib/hooks/use-in-view'

interface Props {
  children:  React.ReactNode
  className?: string
  delay?:     number   // ms de retraso para stagger
  y?:         number   // píxeles de desplazamiento inicial
}

/**
 * Wrapper de scroll reveal.
 * Usa opacity + translateY para no afectar layout (sin CLS).
 * Respeta prefers-reduced-motion via useInView.
 * Solo usar para contenido below-fold — el Hero tiene su propia animación.
 */
export function Reveal({ children, className = '', delay = 0, y = 16 }: Props) {
  const { ref, inView } = useInView()

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:         inView ? 1 : 0,
        transform:       inView ? 'translateY(0px)' : `translateY(${y}px)`,
        transition:      `opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)`,
        transitionDelay: `${delay}ms`,
        willChange:      'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
