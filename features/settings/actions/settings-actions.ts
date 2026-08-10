'use server'

import { revalidatePath } from 'next/cache'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { SETTING_KEYS, type SettingKey } from '@/features/settings/data/settings'

export type SettingsState = { success?: true; error?: string } | undefined

// Upserts a subset of settings given a list of keys to read from formData
export async function saveSettingsAction(
  keys: SettingKey[],
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await verifySession()
  const canManage = await checkPermission('settings.manage')
  if (!canManage) return { error: 'Sin permisos para modificar la configuración.' }

  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const rows = keys.map(key => ({
    key,
    value:       ((formData.get(key) as string | null) ?? '').trim(),
    description: SETTING_KEYS[key]?.label ?? null,
    updated_by:  user?.id ?? null,
  }))

  const { error } = await supabase
    .from('business_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) return { error: `Error al guardar: ${error.message}` }

  revalidatePath('/admin/settings')
  return { success: true }
}
