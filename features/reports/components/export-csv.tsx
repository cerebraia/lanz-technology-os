'use client'

type Props = {
  filename: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[]
  label?: string
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape  = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')
}

export function ExportCSV({ filename, rows, label = 'Exportar CSV' }: Props) {
  function handleExport() {
    const csv  = toCSV(rows)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lz-border px-3 text-xs font-medium text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  )
}
