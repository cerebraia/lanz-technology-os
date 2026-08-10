type TagBadgeProps = {
  name:  string
  color: string
  size?: 'sm' | 'xs'
}

export function TagBadge({ name, color, size = 'sm' }: TagBadgeProps) {
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
  return (
    <span
      className={['inline-flex items-center gap-1 rounded-full font-medium', padding].join(' ')}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}
