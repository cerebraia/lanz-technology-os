'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

export type FinanceActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function req(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// ─── ACCOUNTS ─────────────────────────────────────────────────────────────────

export async function createAccountAction(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  try { await req('finance.accounts.manage') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const name     = (formData.get('name')    as string)?.trim()
  const type     = (formData.get('type')    as string)
  const currency = (formData.get('currency') as string) || 'USD'
  const balance  = parseFloat((formData.get('balance') as string) || '0')
  const notes    = (formData.get('notes')   as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ['El nombre es obligatorio.']
  if (!['cash','bank','paypal','zelle','binance','other'].includes(type)) errors.type = ['Tipo no válido.']
  if (!Number.isFinite(balance)) errors.balance = ['Saldo no válido.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { error } = await supabase.from('financial_accounts').insert({ name, type, currency, balance, notes })
  if (error) {
    if (error.code === '23505') return { errors: { name: ['Ya existe una cuenta con ese nombre.'] } }
    return { errors: { _: [error.message] } }
  }

  revalidatePath('/admin/finance/accounts')
  redirect('/admin/finance/accounts')
}

export async function updateAccountAction(
  accountId: string,
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  try { await req('finance.accounts.manage') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const name     = (formData.get('name')    as string)?.trim()
  const type     = (formData.get('type')    as string)
  const currency = (formData.get('currency') as string) || 'USD'
  const balance  = parseFloat((formData.get('balance') as string) || '0')
  const notes    = (formData.get('notes')   as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ['El nombre es obligatorio.']
  if (!Number.isFinite(balance)) errors.balance = ['Saldo no válido.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { error } = await supabase.from('financial_accounts').update({ name, type, currency, balance, notes }).eq('id', accountId)
  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/finance/accounts')
  redirect('/admin/finance/accounts')
}

export async function toggleAccountAction(accountId: string, active: boolean): Promise<{ error?: string }> {
  try { await req('finance.accounts.manage') } catch (e) { return { error: (e as Error).message } }
  const supabase = await createClient()
  const { error } = await supabase.from('financial_accounts').update({ is_active: active }).eq('id', accountId)
  if (error) return { error: error.message }
  revalidatePath('/admin/finance/accounts')
  return {}
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export async function createTransactionAction(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  try { await req('finance.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const type            = (formData.get('type')             as string)
  const category        = (formData.get('category')         as string)
  const amount          = parseFloat(formData.get('amount') as string)
  const currency        = (formData.get('currency')         as string) || 'USD'
  const description     = (formData.get('description')      as string)?.trim()
  const accountId       = (formData.get('account_id')       as string) || null
  const transactionDate = (formData.get('transaction_date') as string) || new Date().toISOString().split('T')[0]
  const notes           = (formData.get('notes')            as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!description)                           errors.description = ['La descripción es obligatoria.']
  if (!Number.isFinite(amount) || amount <= 0) errors.amount     = ['El monto debe ser mayor a cero.']
  if (!['income','expense','adjustment','transfer'].includes(type)) errors.type = ['Tipo no válido.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('financial_transactions').insert({
    type, category, amount, currency, description,
    account_id:       accountId || null,
    transaction_date: transactionDate,
    notes,
    created_by: user?.id,
  })

  if (error) return { errors: { _: [error.message] } }

  // Update account balance if account selected
  if (accountId) {
    const delta = type === 'income' ? amount : type === 'expense' ? -amount : 0
    if (delta !== 0) {
      try {
        await supabase.rpc('adjust_account_balance' as never, { p_account_id: accountId, p_delta: delta } as never)
      } catch {}
    }
  }

  revalidatePath('/admin/finance')
  revalidatePath('/admin/finance/transactions')
  redirect('/admin/finance/transactions')
}

// ─── PAYABLES ─────────────────────────────────────────────────────────────────

export async function createPayableAction(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  try { await req('finance.payables.manage') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const description = (formData.get('description') as string)?.trim()
  const amount      = parseFloat(formData.get('amount') as string)
  const currency    = (formData.get('currency') as string) || 'USD'
  const dueDate     = (formData.get('due_date') as string) || null
  const notes       = (formData.get('notes')    as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!description)                            errors.description = ['La descripción es obligatoria.']
  if (!Number.isFinite(amount) || amount <= 0) errors.amount      = ['El monto debe ser mayor a cero.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('accounts_payable').insert({
    description, amount, currency, due_date: dueDate || null, notes, created_by: user?.id,
  })
  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/finance/payables')
  redirect('/admin/finance/payables')
}

export async function updatePayableStatusAction(
  id: string,
  status: 'paid' | 'overdue' | 'cancelled'
): Promise<{ error?: string }> {
  try { await req('finance.payables.manage') } catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const patch: { status: string; paid_at?: string; cancelled_at?: string } = { status }
  if (status === 'paid')      patch.paid_at      = new Date().toISOString()
  if (status === 'cancelled') patch.cancelled_at = new Date().toISOString()

  const { error } = await supabase.from('accounts_payable').update(patch).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/finance/payables')
  return {}
}

// ─── RECEIVABLES ──────────────────────────────────────────────────────────────

export async function createReceivableAction(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  try { await req('finance.receivables.manage') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const description = (formData.get('description') as string)?.trim()
  const amount      = parseFloat(formData.get('amount') as string)
  const currency    = (formData.get('currency') as string) || 'USD'
  const dueDate     = (formData.get('due_date') as string) || null
  const notes       = (formData.get('notes')    as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!description)                            errors.description = ['La descripción es obligatoria.']
  if (!Number.isFinite(amount) || amount <= 0) errors.amount      = ['El monto debe ser mayor a cero.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('accounts_receivable').insert({
    description, amount, currency, due_date: dueDate || null, notes, created_by: user?.id,
  })
  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/finance/receivables')
  redirect('/admin/finance/receivables')
}

export async function updateReceivableStatusAction(
  id: string,
  status: 'paid' | 'overdue' | 'cancelled'
): Promise<{ error?: string }> {
  try { await req('finance.receivables.manage') } catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const patch: { status: string; paid_at?: string; cancelled_at?: string } = { status }
  if (status === 'paid')      patch.paid_at      = new Date().toISOString()
  if (status === 'cancelled') patch.cancelled_at = new Date().toISOString()

  const { error } = await supabase.from('accounts_receivable').update(patch).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/finance/receivables')
  return {}
}
