import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { AutomationForm } from '@/features/automations/components/automation-form'
import { PageHeader }     from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { TRIGGER_LABELS, ACTION_LABELS } from '@/features/automations/data/constants'

export const metadata: Metadata = { title: 'Nueva automatización' }

export default async function NewAutomationPage() {
  await verifySession()
  const canCreate = await checkPermission('automations.create')
  if (!canCreate) redirect('/admin/automations')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva automatización"
        breadcrumbs={[
          { label: 'Dashboard',        href: '/admin' },
          { label: 'Automatizaciones', href: '/admin/automations' },
          { label: 'Nueva' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Configurar automatización</p></CardHeader>
            <CardBody><AutomationForm /></CardBody>
          </Card>
        </div>

        {/* Reference card */}
        <div className="space-y-4">
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Triggers disponibles</p></CardHeader>
            <CardBody>
              <ul className="space-y-1.5">
                {Object.entries(TRIGGER_LABELS).map(([key, { label, icon, description }]) => (
                  <li key={key}>
                    <p className="text-xs font-medium text-lz-text">{icon} {label}</p>
                    <p className="text-[11px] text-lz-muted">{description}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Acciones disponibles</p></CardHeader>
            <CardBody>
              <ul className="space-y-1.5">
                {Object.entries(ACTION_LABELS).map(([key, { label, icon, description }]) => (
                  <li key={key}>
                    <p className="text-xs font-medium text-lz-text">{icon} {label}</p>
                    <p className="text-[11px] text-lz-muted">{description}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
