'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ASSISTANT_QUESTIONS } from '@/features/ai/data/constants'

export function AssistantForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const current = params.get('q') ?? ''

  function handleSelect(id: string) {
    router.push(`?q=${id}`)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ASSISTANT_QUESTIONS.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => handleSelect(q.id)}
            className={[
              'rounded-xl border px-4 py-3 text-left text-sm transition-all',
              current === q.id
                ? 'border-lz-primary bg-lz-primary/10 text-lz-accent'
                : 'border-lz-border bg-lz-surface text-lz-text hover:border-lz-primary/40 hover:text-lz-accent',
            ].join(' ')}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  )
}
