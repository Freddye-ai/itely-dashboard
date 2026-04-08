import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'

export type KpiVariant = 'cyan' | 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'slate'

interface KpiCardProps {
  title:     string
  value:     string
  subtitle?: string
  mom?:      number | null
  variant?:  KpiVariant
  warnCusto?: boolean
  icon?:     React.ReactNode
}

const variantStyles: Record<KpiVariant, { bg: string; border: string; text: string; badge: string }> = {
  cyan:    { bg: 'bg-gradient-to-br from-cyan-900/60 to-bg-card',     border: 'border-cyan-700/40',    text: 'text-accent-cyan',    badge: 'bg-accent-cyan/20' },
  emerald: { bg: 'bg-gradient-to-br from-emerald-900/60 to-bg-card',  border: 'border-emerald-700/40', text: 'text-accent-emerald', badge: 'bg-accent-emerald/20' },
  blue:    { bg: 'bg-gradient-to-br from-blue-900/60 to-bg-card',     border: 'border-blue-700/40',    text: 'text-blue-400',       badge: 'bg-blue-400/20' },
  amber:   { bg: 'bg-gradient-to-br from-amber-900/60 to-bg-card',    border: 'border-amber-700/40',   text: 'text-amber-400',      badge: 'bg-amber-400/20' },
  red:     { bg: 'bg-gradient-to-br from-red-900/60 to-bg-card',      border: 'border-red-700/40',     text: 'text-accent-red',     badge: 'bg-accent-red/20' },
  purple:  { bg: 'bg-gradient-to-br from-purple-900/60 to-bg-card',   border: 'border-purple-700/40',  text: 'text-purple-400',     badge: 'bg-purple-400/20' },
  slate:   { bg: 'bg-bg-card',                                         border: 'border-border-dark',    text: 'text-white',          badge: 'bg-white/10' },
}

export function KpiCard({ title, value, subtitle, mom, variant = 'slate', warnCusto = false, icon }: KpiCardProps) {
  const s = variantStyles[variant]

  return (
    <div className={`relative ${s.bg} border ${s.border} rounded-xl p-4 flex flex-col gap-3 min-w-0 overflow-hidden fade-in-up hover:brightness-110 transition-all duration-200`}>
      {/* Glow decorativo */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 blur-2xl ${s.badge}`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <p className="text-[11px] text-text-muted uppercase tracking-wider font-medium leading-tight">{title}</p>
        {icon && (
          <span className={`p-1.5 rounded-lg ${s.badge} ${s.text} flex-shrink-0`}>{icon}</span>
        )}
        {warnCusto && (
          <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-1.5 py-0.5 flex-shrink-0">
            <AlertTriangle className="w-2.5 h-2.5" />
            Custo N/I
          </span>
        )}
      </div>

      {/* Valor principal — tamanho adaptativo conforme comprimento */}
      <p
        className={`font-bold leading-none ${s.text} relative z-10`}
        style={{ fontSize: value.length > 12 ? '1rem' : value.length > 9 ? '1.2rem' : '1.4rem' }}
      >
        {value}
      </p>

      {/* Rodapé: subtítulo + MoM */}
      <div className="flex items-center justify-between gap-2 mt-auto relative z-10">
        {subtitle && <span className="text-[11px] text-text-muted truncate">{subtitle}</span>}
        {mom !== undefined && <MomBadge value={mom} />}
      </div>
    </div>
  )
}

function MomBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-text-muted" title="Sem dados no período anterior">
        <Minus className="w-3 h-3" /> —
      </span>
    )
  }
  const up = value > 0
  const Icon = up ? TrendingUp : TrendingDown
  const color = up ? 'text-accent-cyan' : 'text-accent-red'
  return (
    <span className={`flex items-center gap-1 text-[11px] font-semibold ${color}`} title="vs. mês anterior">
      <Icon className="w-3 h-3" />
      {`${up ? '+' : ''}${(value * 100).toFixed(1)}%`}
    </span>
  )
}
