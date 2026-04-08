import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { SortState, SortDir } from '../../hooks/useSortable'

interface SortHeaderProps<K extends string> {
  label:    string
  colKey:   K
  sort:     SortState<K>
  onSort:   (key: K) => void
  align?:   'left' | 'right'
  className?: string
}

export function SortHeader<K extends string>({
  label,
  colKey,
  sort,
  onSort,
  align = 'left',
  className = '',
}: SortHeaderProps<K>) {
  const active = sort.key === colKey

  return (
    <th
      className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted cursor-pointer select-none whitespace-nowrap ${className}`}
      onClick={() => onSort(colKey)}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {label}
        <SortIcon active={active} dir={sort.dir} />
      </span>
    </th>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
  return dir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-accent-cyan" />
    : <ChevronDown className="w-3 h-3 text-accent-cyan" />
}
