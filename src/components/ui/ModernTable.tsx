import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { SortState, SortDir } from '../../hooks/useSortable'

// ---------------------------------------------------------------------------
// Container principal
// ---------------------------------------------------------------------------
interface ModernTableProps {
  title?:    string
  subtitle?: string
  children:  React.ReactNode
  footer?:   React.ReactNode
  actions?:  React.ReactNode
}

export function ModernTable({ title, subtitle, children, footer, actions }: ModernTableProps) {
  const hasHeader = !!(title || subtitle || actions)
  return (
    <div className="bg-bg-card border border-border-dark rounded-2xl overflow-hidden">
      {/* Cabeçalho opcional */}
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-dark/50">
          <div>
            <h3 className="text-sm font-semibold text-text-muted/80 leading-tight">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-text-muted/50 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          {children}
        </table>
      </div>

      {/* Rodapé opcional */}
      {footer && (
        <div className="border-t border-border-dark bg-bg-surface/50">
          {footer}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Thead — fundo teal escuro, texto cyan
// ---------------------------------------------------------------------------
export function ModernThead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr style={{
        background: 'linear-gradient(90deg, #0d0d0d 0%, #1a1a1a 40%, #222222 60%, #0d0d0d 100%)',
        boxShadow: 'inset 0 -1px 0 rgba(212,160,23,0.50), inset 0 1px 0 rgba(212,160,23,0.08)',
      }}>
        {children}
      </tr>
    </thead>
  )
}

// ---------------------------------------------------------------------------
// Th — sempre cyan por padrão, com ícone de sort
// ---------------------------------------------------------------------------
interface ModernThProps<K extends string> {
  label:      string
  colKey?:    K
  sort?:      SortState<K>
  onSort?:    (key: K) => void
  align?:     'left' | 'right' | 'center'
  className?: string
  accent?:    boolean   // mantido por compatibilidade (não altera cor — já é sempre cyan)
}

export function ModernTh<K extends string>({
  label, colKey, sort, onSort,
  align = 'left', className = '',
}: ModernThProps<K>) {
  const isActive  = !!sort && !!colKey && sort.key === colKey
  const clickable = !!onSort && !!colKey
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'

  return (
    <th
      className={[
        'px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap select-none border-r border-accent-cyan/20 last:border-r-0',
        isActive ? 'text-white' : 'text-accent-cyan',
        clickable ? 'cursor-pointer hover:text-white transition-all' : '',
        alignClass,
        className,
      ].join(' ')}
      onClick={() => clickable && onSort!(colKey!)}
    >
      <span className={['inline-flex items-center gap-1', align === 'right' ? 'flex-row-reverse' : ''].join(' ')}>
        {label}
        {clickable && <SortIcon active={isActive} dir={sort!.dir} />}
      </span>
    </th>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
  return dir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-white" />
    : <ChevronDown className="w-3 h-3 text-white" />
}

// ---------------------------------------------------------------------------
// Tbody com divisória sutil entre linhas
// ---------------------------------------------------------------------------
export function ModernTbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border-dark/50">{children}</tbody>
}

// ---------------------------------------------------------------------------
// Tr de linha
// ---------------------------------------------------------------------------
export function ModernTr({ children, highlight = false }: {
  children: React.ReactNode; highlight?: boolean
}) {
  return (
    <tr className={[
      'group transition-colors duration-100',
      highlight ? 'bg-accent-cyan/5 hover:bg-accent-cyan/10' : 'hover:bg-bg-surface/60',
    ].join(' ')}>
      {children}
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Td genérico
// ---------------------------------------------------------------------------
export function ModernTd({ children, align = 'left', className = '', muted = false }: {
  children: React.ReactNode; align?: 'left' | 'right' | 'center'
  className?: string; muted?: boolean
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <td className={['px-4 py-3 text-sm', muted ? 'text-text-muted' : 'text-white', alignClass, className].join(' ')}>
      {children}
    </td>
  )
}

// ---------------------------------------------------------------------------
// Tfoot (linha de totais)
// ---------------------------------------------------------------------------
export function ModernTfoot({ children }: { children: React.ReactNode }) {
  return (
    <tfoot>
      <tr style={{ background: '#1a1a1a', borderTop: '2px solid #2d2d2d' }}>{children}</tr>
    </tfoot>
  )
}

export function ModernTfootTd({ children, align = 'left', className = '' }: {
  children?: React.ReactNode; align?: 'left' | 'right' | 'center'; className?: string
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <td className={['px-4 py-3 text-sm font-semibold text-white', alignClass, className].join(' ')}>
      {children}
    </td>
  )
}

// ---------------------------------------------------------------------------
// Estado vazio
// ---------------------------------------------------------------------------
export function ModernEmpty({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="py-14 text-center text-text-muted text-sm">
        Nenhum dado encontrado
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Badge de rank
// ---------------------------------------------------------------------------
export function RankBadge({ rank, highlight }: { rank: number; highlight?: boolean }) {
  if (highlight) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan text-xs font-bold">
        {rank}
      </span>
    )
  }
  return <span className="text-text-muted text-xs font-medium">{rank}</span>
}

// ---------------------------------------------------------------------------
// Badge de margem colorido
// ---------------------------------------------------------------------------
export function MargemBadge({ value }: { value: number }) {
  const color  = value >= 0.5 ? 'text-accent-emerald' : value >= 0.3 ? 'text-white' : 'text-accent-red'
  const bg     = value >= 0.5 ? 'bg-accent-emerald/10' : value >= 0.3 ? 'bg-white/5' : 'bg-accent-red/10'
  const border = value >= 0.5 ? 'border-accent-emerald/20' : value >= 0.3 ? 'border-white/10' : 'border-accent-red/20'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${color} ${bg} ${border}`}>
      {(value * 100).toFixed(1)}%
    </span>
  )
}

// ---------------------------------------------------------------------------
// Select compacto para usar no slot actions do ModernTable
// ---------------------------------------------------------------------------
export function TableSelect({ label, value, onChange, children }: {
  label?: string; value: string | number
  onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-1 text-[11px] text-text-muted cursor-pointer">
      {label && <span>{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg-surface border border-border-dark rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-accent-cyan transition-colors cursor-pointer"
      >
        {children}
      </select>
    </label>
  )
}
