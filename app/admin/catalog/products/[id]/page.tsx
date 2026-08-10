import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getProductById, getProductImages } from '@/features/catalog/data/products'
import { getCategories } from '@/features/catalog/data/categories'
import { updateProductAction } from '@/features/catalog/actions/product-actions'
import { ProductForm }          from '@/features/catalog/components/product-form'
import { ProductImages }        from '@/features/catalog/components/product-images'
import { ProductStatusActions } from '@/features/catalog/components/product-status-actions'
import { PageHeader }           from '@/components/ui/page-header'
import { Badge }                from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params
    const product = await getProductById(id)
    return { title: product ? `Editar: ${product.name}` : 'Editar producto' }
  } catch {
    return { title: 'Editar producto' }
  }
}

function computedStatusBadge(status: string, isPublished: boolean) {
  if (status === 'archived') return { label: 'Archivado', variant: 'muted'   } as const
  if (isPublished)           return { label: 'Publicado', variant: 'success' } as const
  if (status === 'active')   return { label: 'Oculto',    variant: 'warning' } as const
  return                            { label: 'Borrador',  variant: 'neutral' } as const
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canUpdate = await checkPermission('catalog.products.update')
  if (!canUpdate) redirect('/admin/catalog/products')

  const product = await getProductById(id)
  if (!product) notFound()

  const [categories, images] = await Promise.all([
    getCategories(),
    getProductImages(id),
  ])

  const canPublish      = await checkPermission('catalog.products.publish')
  const canManageImages = await checkPermission('catalog.images.manage')
  const canDelete       = await checkPermission('catalog.products.delete')
  const boundUpdate     = updateProductAction.bind(null, id)
  const st              = computedStatusBadge(product.status, product.is_published)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={product.name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Catálogo',  href: '/admin/catalog' },
          { label: 'Productos', href: '/admin/catalog/products' },
          { label: product.name },
        ]}
        secondaryActions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={st.variant}>{st.label}</Badge>
            {product.is_featured && <Badge variant="default">Destacado</Badge>}
            {product.promotional_price != null && (
              <Badge variant="warning">Oferta</Badge>
            )}
            <span className="font-mono text-xs text-lz-muted">{product.sku}</span>
          </div>
        }
        actions={
          <ProductStatusActions
            productId={id}
            status={product.status}
            isPublished={product.is_published}
            canPublish={canPublish}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        }
      />

      {canManageImages && (
        <Card padding={false}>
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-lz-text">Multimedia</p>
              <p className="mt-0.5 text-xs text-lz-muted">
                JPEG, PNG o WebP — máx. 5 MB — hasta 10 imágenes
              </p>
            </div>
            <Badge variant={images.length >= 10 ? 'warning' : 'neutral'}>
              {images.length} / 10
            </Badge>
          </CardHeader>
          <CardBody>
            <ProductImages productId={id} images={images} />
          </CardBody>
        </Card>
      )}

      <div className="max-w-2xl">
        <ProductForm
          action={boundUpdate}
          initialData={product}
          categories={categories}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  )
}
