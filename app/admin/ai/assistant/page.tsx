import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { verifySession, checkPermission } from '@/lib/dal'
import { answerQuestion } from '@/features/ai/data/assistant'
import { ASSISTANT_QUESTIONS } from '@/features/ai/data/constants'
import { AssistantForm } from '@/features/ai/components/assistant-form'
import { PageHeader }    from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Asistente IA' }

type Props = { searchParams: Promise<{ q?: string }> }

async function Answer({ questionId }: { questionId: string }) {
  const result = await answerQuestion(questionId)

  const question = ASSISTANT_QUESTIONS.find((q) => q.id === questionId)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lz-primary/20 text-sm">🤖</span>
          <div className="space-y-3">
            <p className="text-xs text-lz-muted italic">{question?.label ?? result.question}</p>
            <p className="text-sm text-lz-text whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: result.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
            />
            {result.hint && (
              <p className="text-xs text-lz-accent">💡 {result.hint}</p>
            )}
          </div>
        </div>
      </Card>

      {result.data && result.data.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-lz-border">
          <table className="w-full text-sm">
            <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
              <tr>
                {Object.keys(result.data[0]).map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-lz-border/50">
              {result.data.map((row, i) => (
                <tr key={i} className="hover:bg-lz-surface/60">
                  {Object.values(row).map((v, j) => (
                    <td key={j} className="px-4 py-2.5 text-xs text-lz-text">{String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default async function AssistantPage({ searchParams }: Props) {
  await verifySession()
  const canUse = await checkPermission('ai.assistant')
  if (!canUse) redirect('/admin/ai')

  const sp = await searchParams
  const questionId = sp.q

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Asistente de IA"
        description="Consultas empresariales respondidas con datos reales del sistema."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'IA',        href: '/admin/ai' },
          { label: 'Asistente' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Questions panel */}
        <div className="space-y-3 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-lz-muted">Preguntas disponibles</p>
          <Suspense fallback={null}>
            <AssistantForm />
          </Suspense>
        </div>

        {/* Answer panel */}
        <div className="lg:col-span-3">
          {!questionId ? (
            <Card>
              <CardBody>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-4xl">🤖</span>
                  <p className="mt-3 text-sm font-medium text-lz-text">Selecciona una pregunta</p>
                  <p className="mt-1 text-xs text-lz-muted">
                    El asistente analiza los datos reales del negocio y responde en lenguaje natural.
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Suspense fallback={
              <Card>
                <CardBody>
                  <div className="flex items-center gap-3 py-4">
                    <span className="animate-pulse text-2xl">🤖</span>
                    <p className="text-sm text-lz-muted">Analizando datos…</p>
                  </div>
                </CardBody>
              </Card>
            }>
              <Answer questionId={questionId} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
