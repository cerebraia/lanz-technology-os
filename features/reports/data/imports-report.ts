import { createClient } from '@/lib/supabase/server'

export async function getImportsReport() {
  const supabase = await createClient()

  const [impsRes, expsRes] = await Promise.all([
    supabase.from('imports').select('id, reference, status, origin_country, created_at'),
    supabase.from('import_expenses').select('import_id, concept, amount, currency'),
  ])

  const imports  = impsRes.data ?? []
  const expenses = expsRes.data ?? []

  const active    = imports.filter((i) => !['received','cancelled'].includes(i.status))
  const inTransit = imports.filter((i) => i.status === 'in_transit')
  const completed = imports.filter((i) => i.status === 'received')

  const totalLogCost = expenses.reduce((a, e) => a + e.amount, 0)
  const avgCost = completed.length > 0
    ? completed.reduce((a, imp) => {
        const cost = expenses.filter((e) => e.import_id === imp.id).reduce((s, e) => s + e.amount, 0)
        return a + cost
      }, 0) / completed.length
    : 0

  // Expense by concept
  const byConceptMap: Record<string, number> = {}
  for (const e of expenses) {
    byConceptMap[e.concept] = (byConceptMap[e.concept] ?? 0) + e.amount
  }
  const byConcept = Object.entries(byConceptMap)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)

  // Origin countries
  const byCountry: Record<string, number> = {}
  for (const i of imports) {
    byCountry[i.origin_country] = (byCountry[i.origin_country] ?? 0) + 1
  }
  const topOrigins = Object.entries(byCountry).sort(([,a],[,b]) => b - a).slice(0, 5)

  return {
    totalImports:   imports.length,
    activeCount:    active.length,
    inTransitCount: inTransit.length,
    completedCount: completed.length,
    totalLogCost,
    avgCost,
    byConcept,
    topOrigins,
    recentImports:  imports.slice(0, 10),
  }
}
