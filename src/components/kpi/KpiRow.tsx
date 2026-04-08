import { DollarSign, TrendingUp, Package, Percent } from 'lucide-react'
import { KpiCard } from './KpiCard'
import { GlobalFilters } from '../ui/FilterDropdowns'
import type { KpiData } from '../../types'
import { formatCurrency, formatCurrencyShort, formatPercent, formatNumber } from '../../utils/formatters'

interface FilterProps { anosDisponiveis: number[]; ufsDisponiveis: string[]; gruposDisponiveis: string[]; clientesDisponiveis: string[] }
interface KpiRowProps { kpis: KpiData; filterProps: FilterProps }

export function KpiRow({ kpis, filterProps }: KpiRowProps) {
  const { receitaBialita, receitaGrit, receitaTotal, receitaMesAnterior, momPercent, totalUnidades, margemBruta } = kpis
  const warnMargem = margemBruta === 1

  return (
    <div className="space-y-3">
      {/* Filtros globais alinhados à direita */}
      <div className="flex justify-end px-1">
        <GlobalFilters
          anosDisponiveis={filterProps.anosDisponiveis}
          gruposDisponiveis={filterProps.gruposDisponiveis}
          ufsDisponiveis={filterProps.ufsDisponiveis}
          clientesDisponiveis={filterProps.clientesDisponiveis}
        />
      </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 stagger">
      <KpiCard
        title="Fat. BIALITA"
        value={formatCurrencyShort(receitaBialita)}
        variant="cyan"
        subtitle={formatCurrency(receitaBialita)}
        icon={<DollarSign className="w-4 h-4" />}
      />
      <KpiCard
        title="Fat. GRIT"
        value={formatCurrencyShort(receitaGrit)}
        variant="emerald"
        subtitle={formatCurrency(receitaGrit)}
        icon={<DollarSign className="w-4 h-4" />}
      />
      <KpiCard
        title="Faturamento Total"
        value={formatCurrencyShort(receitaTotal)}
        variant="blue"
        subtitle={formatCurrency(receitaTotal)}
        icon={<DollarSign className="w-4 h-4" />}
      />
      <KpiCard
        title="Fat. Mês Anterior"
        value={receitaMesAnterior === null ? '—' : formatCurrencyShort(receitaMesAnterior)}
        variant="purple"
        subtitle={receitaMesAnterior === null ? 'Sem dados' : formatCurrency(receitaMesAnterior)}
        icon={<DollarSign className="w-4 h-4" />}
      />
      <KpiCard
        title="Variação MoM"
        value={momPercent === null ? '—' : `${momPercent >= 0 ? '+' : ''}${(momPercent * 100).toFixed(1)}%`}
        variant={momPercent === null ? 'slate' : momPercent >= 0 ? 'cyan' : 'red'}
        subtitle="vs. mês anterior (total)"
        icon={<TrendingUp className="w-4 h-4" />}
      />
      <KpiCard
        title="Unidades Vendidas"
        value={formatNumber(totalUnidades)}
        variant="amber"
        subtitle="Σ QTVENDA"
        icon={<Package className="w-4 h-4" />}
      />
      <KpiCard
        title="Margem Bruta"
        value={formatPercent(margemBruta)}
        variant={margemBruta >= 0.5 ? 'emerald' : margemBruta >= 0.3 ? 'slate' : 'red'}
        subtitle="Lucro / Receita"
        warnCusto={warnMargem}
        icon={<Percent className="w-4 h-4" />}
      />
    </div>
    </div>
  )
}
