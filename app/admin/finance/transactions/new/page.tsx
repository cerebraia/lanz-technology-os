import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getAccounts, getAccountOptions } from '@/features/finance/data/accounts'
import { TransactionForm } from '@/features/finance/components/transaction-form'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nuevo movimiento' }

export default async function NewTransactionPage() {
  await verifySession()
  const canCreate = await checkPermission('finance.create')
  if (!canCreate) redirect('/admin/finance/transactions')

  const accounts       = await getAccounts(true)
  const accountOptions = getAccountOptions(accounts)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nuevo movimiento financiero"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Finanzas', href: '/admin/finance' }, { label: 'Transacciones', href: '/admin/finance/transactions' }, { label: 'Nuevo' }]}
      />
      <div className="mx-auto max-w-xl">
        <Card padding={false}><CardBody><TransactionForm accountOptions={accountOptions} /></CardBody></Card>
      </div>
    </div>
  )
}
