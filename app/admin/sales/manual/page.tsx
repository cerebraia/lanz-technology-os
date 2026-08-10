import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getProductsWithStock } from '@/features/sales/data/products'
import { ManualSaleForm } from '@/features/sales/components/manual-sale-form'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Nueva venta manual' }

export default async function ManualSalePage() {
  await verifySession()
  const canSell = await checkPermission('sales.manual')
  if (!canSell) redirect('/admin/orders')

  const products = await getProductsWithStock()

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva venta manual"
        description="Registra una venta realizada fuera de la tienda online."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Pedidos',   href: '/admin/orders' },
          { label: 'Nueva venta manual' },
        ]}
      />

      <div className="mx-auto max-w-3xl">
        <ManualSaleForm products={products} />
      </div>
    </div>
  )
}
