import { createClient } from '@/lib/supabase/server'

export type AssistantAnswer = {
  question: string
  answer:   string
  data?:    Record<string, unknown>[]
  hint?:    string
}

export async function answerQuestion(questionId: string): Promise<AssistantAnswer> {
  const supabase = await createClient()
  const d30   = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const d90   = new Date(Date.now() - 90 * 86_400_000).toISOString()
  const month1 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  switch (questionId) {
    case 'top_product': {
      const { data } = await supabase
        .from('order_items')
        .select('product_name, product_sku, quantity, line_total')
        .gte('created_at', d30)
      const map: Record<string, { name: string; qty: number; rev: number }> = {}
      for (const i of (data ?? [])) {
        if (!map[i.product_sku]) map[i.product_sku] = { name: i.product_name, qty: 0, rev: 0 }
        map[i.product_sku].qty += i.quantity
        map[i.product_sku].rev += i.line_total
      }
      const top = Object.values(map).sort((a, b) => b.rev - a.rev)[0]
      if (!top) return { question: '¿Cuál fue el producto más vendido este mes?', answer: 'Sin ventas registradas en los últimos 30 días.' }
      return {
        question: '¿Cuál fue el producto más vendido este mes?',
        answer:   `**${top.name}** con ${top.qty} unidades vendidas y USD ${top.rev.toFixed(2)} en ingresos.`,
        data:     Object.values(map).sort((a, b) => b.rev - a.rev).slice(0, 5).map((p) => ({ Producto: p.name, Unidades: p.qty, Ingresos: `USD ${p.rev.toFixed(2)}` })),
      }
    }

    case 'import_needed': {
      const { data: bal } = await supabase.from('inventory_balances').select('product_id, on_hand')
      const { data: prod } = await supabase.from('products').select('id, name, sku, reorder_point').is('archived_at', null)
      const balMap: Record<string, number> = {}
      for (const b of (bal ?? [])) balMap[b.product_id] = b.on_hand
      const needImport = (prod ?? []).filter((p) => (balMap[p.id] ?? 0) <= (p.reorder_point ?? 0))
      if (needImport.length === 0) return { question: '¿Qué productos debo importar?', answer: 'Todos los productos están sobre su punto de reorden. No se requieren importaciones urgentes.' }
      return {
        question: '¿Qué productos debo importar?',
        answer:   `Hay **${needImport.length} productos** por debajo de su punto de reorden.`,
        data:     needImport.slice(0, 10).map((p) => ({ Producto: p.name, SKU: p.sku, Stock: balMap[p.id] ?? 0, 'Punto reorden': p.reorder_point })),
        hint:     'Ve a Recomendaciones para ver cantidades sugeridas.',
      }
    }

    case 'cash_invested': {
      const { data: bal } = await supabase.from('inventory_balances').select('product_id, on_hand')
      const { data: prod } = await supabase.from('products').select('id, reference_cost').is('archived_at', null)
      const costMap: Record<string, number> = {}
      for (const p of (prod ?? [])) if (p.reference_cost) costMap[p.id] = p.reference_cost
      const total = (bal ?? []).reduce((a, b) => a + b.on_hand * (costMap[b.product_id] ?? 0), 0)
      return {
        question: '¿Cuánto dinero tengo invertido en inventario?',
        answer:   `El valor del inventario a costo es aproximadamente **USD ${total.toFixed(2)}**. Basado en costos de referencia registrados.`,
        hint:     'Los productos sin costo de referencia no se incluyen en el cálculo.',
      }
    }

    case 'current_margin': {
      const { data: items } = await supabase.from('order_items').select('quantity, unit_price, unit_cost, line_total').gte('created_at', d30)
      const rows = items ?? []
      const revenue = rows.reduce((a, i) => a + i.line_total, 0)
      const cost    = rows.reduce((a, i) => a + (i.unit_cost ?? 0) * i.quantity, 0)
      const margin  = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0
      return {
        question: '¿Cuál es mi margen actual?',
        answer:   revenue === 0
          ? 'Sin ventas registradas en los últimos 30 días para calcular el margen.'
          : `Tu margen promedio en los últimos 30 días es **${margin.toFixed(1)}%**. Ingresos: USD ${revenue.toFixed(2)} · Costo: USD ${cost.toFixed(2)}.`,
      }
    }

    case 'top_customers': {
      const { data: orders } = await supabase
        .from('orders')
        .select('customer_id, total_amount')
        .gte('created_at', d30)
        .neq('status', 'cancelled')
        .not('customer_id', 'is', null)
      const { data: customers } = await supabase.from('customers').select('id, first_name, last_name')
      const nameMap: Record<string, string> = {}
      for (const c of (customers ?? [])) nameMap[c.id] = `${c.first_name} ${c.last_name ?? ''}`.trim()
      const map: Record<string, number> = {}
      for (const o of (orders ?? [])) if (o.customer_id) map[o.customer_id] = (map[o.customer_id] ?? 0) + o.total_amount
      const top = Object.entries(map).sort(([,a],[,b]) => b - a).slice(0, 5)
      if (top.length === 0) return { question: '¿Qué clientes generan más ingresos?', answer: 'Sin pedidos con cliente asignado en los últimos 30 días.' }
      return {
        question: '¿Qué clientes generan más ingresos?',
        answer:   `**${nameMap[top[0][0]] ?? 'Desconocido'}** es el cliente con mayor ingresos este mes.`,
        data:     top.map(([id, rev]) => ({ Cliente: nameMap[id] ?? id, Ingresos: `USD ${rev.toFixed(2)}` })),
      }
    }

    case 'low_stock': {
      const { data: bal } = await supabase.from('inventory_balances').select('product_id, on_hand')
      const { data: prod } = await supabase.from('products').select('id, name, sku, min_stock').is('archived_at', null)
      const balMap: Record<string, number> = {}
      for (const b of (bal ?? [])) balMap[b.product_id] = b.on_hand
      const low = (prod ?? []).filter((p) => (balMap[p.id] ?? 0) <= (p.min_stock ?? 0))
      if (low.length === 0) return { question: '¿Qué productos tienen bajo stock?', answer: 'Todos los productos tienen stock suficiente.' }
      return {
        question: '¿Qué productos tienen bajo stock?',
        answer:   `**${low.length} productos** están en o por debajo del stock mínimo.`,
        data:     low.slice(0, 10).map((p) => ({ Producto: p.name, SKU: p.sku, Stock: balMap[p.id] ?? 0, Mínimo: p.min_stock })),
      }
    }

    case 'monthly_revenue': {
      const { data } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', `${month1}T00:00:00`)
        .neq('status', 'cancelled')
      const total = (data ?? []).reduce((a, o) => a + o.total_amount, 0)
      const count = (data ?? []).length
      return {
        question: '¿Cuánto vendí este mes?',
        answer:   `**USD ${total.toFixed(2)}** en ${count} pedido${count !== 1 ? 's' : ''} este mes.`,
      }
    }

    case 'pending_payables': {
      const { data } = await supabase.from('accounts_payable').select('amount, currency').in('status', ['pending','overdue'])
      const total = (data ?? []).reduce((a, p) => a + p.amount, 0)
      const count = (data ?? []).length
      if (count === 0) return { question: '¿Cuánto debo a proveedores?', answer: 'Sin cuentas por pagar pendientes.' }
      return {
        question: '¿Cuánto debo a proveedores?',
        answer:   `Tienes **${count} cuentas por pagar** pendientes por un total de **USD ${total.toFixed(2)}**.`,
      }
    }

    case 'active_imports': {
      const { data } = await supabase.from('imports').select('reference, status, estimated_arrival').neq('status', 'received').neq('status', 'cancelled')
      if (!data?.length) return { question: '¿Qué importaciones están en tránsito?', answer: 'Sin importaciones activas en este momento.' }
      return {
        question: '¿Qué importaciones están en tránsito?',
        answer:   `Hay **${data.length} importaciones activas**.`,
        data:     data.map((i) => ({ Referencia: i.reference, Estado: i.status, 'Llegada estimada': i.estimated_arrival ?? '—' })),
      }
    }

    case 'inactive_customers': {
      const { data: custs } = await supabase.from('customers').select('id, first_name, last_name').is('archived_at', null)
      const { data: orders } = await supabase.from('orders').select('customer_id, created_at').gte('created_at', d90).neq('status', 'cancelled')
      const activeIds = new Set((orders ?? []).map((o) => o.customer_id).filter(Boolean))
      const inactive  = (custs ?? []).filter((c) => !activeIds.has(c.id))
      return {
        question: '¿Qué clientes no han comprado en 90 días?',
        answer:   inactive.length === 0
          ? 'Todos tus clientes activos compraron en los últimos 90 días.'
          : `**${inactive.length} clientes** sin compras en los últimos 90 días.`,
        data: inactive.slice(0, 10).map((c) => ({ Cliente: `${c.first_name} ${c.last_name ?? ''}`.trim() })),
        hint: inactive.length > 0 ? 'Considera una campaña de reactivación desde el módulo de Marketing.' : undefined,
      }
    }

    default:
      return { question: 'Pregunta no reconocida', answer: 'Selecciona una pregunta de la lista.' }
  }
}
