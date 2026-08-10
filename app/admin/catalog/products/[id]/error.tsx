'use client'

import { useEffect } from 'react'
import { Alert }  from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProductEditError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[ProductEdit] Error al renderizar la página:', error.message)
  }, [error])

  const msg = error.message ?? ''

  const title = msg.includes('permiso') || msg.includes('Sin permiso')
    ? 'Sin acceso'
    : msg.includes('not found') || msg.includes('no encontrado') || msg.includes('PGRST116')
    ? 'Producto no encontrado'
    : 'No se pudo cargar el producto'

  const description = msg.includes('permiso') || msg.includes('Sin permiso')
    ? 'No tienes permiso para editar este producto.'
    : msg.includes('not found') || msg.includes('no encontrado') || msg.includes('PGRST116')
    ? 'El producto no existe o fue eliminado del catálogo.'
    : 'Ocurrió un error al cargar el producto. Revisa la consola del servidor para más detalles.'

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
      <Alert variant="danger" title={title}>
        {description}
      </Alert>
      <div className="flex gap-3">
        <Button variant="secondary" size="sm" onClick={reset}>
          Reintentar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { window.location.href = '/admin/catalog/products' }}
        >
          Volver al catálogo
        </Button>
      </div>
    </div>
  )
}
