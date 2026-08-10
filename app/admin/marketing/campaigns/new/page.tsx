import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSegments, getSegmentOptions } from '@/features/marketing/data/segments'
import { CampaignForm }   from '@/features/marketing/components/campaign-form'
import { PageHeader }     from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nueva campaña' }

export default async function NewCampaignPage() {
  await verifySession()
  const canCreate = await checkPermission('marketing.create')
  if (!canCreate) redirect('/admin/marketing/campaigns')

  const segments       = await getSegments()
  const segmentOptions = await getSegmentOptions(segments)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva campaña"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Marketing', href: '/admin/marketing' },
          { label: 'Campañas',  href: '/admin/marketing/campaigns' },
          { label: 'Nueva' },
        ]}
      />
      <div className="mx-auto max-w-2xl">
        <Card padding={false}>
          <CardBody>
            <CampaignForm segmentOptions={segmentOptions} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
