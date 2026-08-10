import type { ReactNode } from 'react'

type Column<T extends object> = {
  key: keyof T | (string & {})
  header: string
  render?: (row: T, index: number) => ReactNode
  className?: string
}

type TableProps<T extends object> = {
  columns: Column<T>[]
  rows: T[]
  keyExtractor: (row: T, index: number) => string
  emptyMessage?: string
  className?: string
}

export function Table<T extends object>({
  columns,
  rows,
  keyExtractor,
  emptyMessage = 'Sin datos',
  className = '',
}: TableProps<T>) {
  return (
    <div className={['w-full overflow-x-auto rounded-xl border border-lz-border', className].join(' ')}>
      <table className="w-full text-sm">
        <thead className="border-b border-lz-border bg-lz-surface">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={[
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted',
                  col.className ?? '',
                ].join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-lz-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={keyExtractor(row, i)}
                className="border-b border-lz-border/50 transition-colors last:border-0 hover:bg-lz-surface/60"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={['px-4 py-3 text-lz-text', col.className ?? ''].join(' ')}
                  >
                    {col.render
                      ? col.render(row, i)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
