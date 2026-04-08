import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, type TooltipProps,
} from 'recharts'
import type { DadosUF } from '../../types'
import { formatCurrencyShort, formatCurrency, formatPercent, formatNumber } from '../../utils/formatters'

type Metrica = 'receita' | 'lucro'

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DadosUF
  return (
    <div className="bg-bg-surface border border-border-dark rounded-xl p-3 shadow-2xl text-xs min-w-[180px]">
      <p className="text-white font-bold text-sm mb-2">{d.uf}</p>
      <div className="space-y-1.5 text-text-muted">
        <div className="flex justify-between gap-4">
          <span>Receita Bruta</span>
          <span className="text-accent-emerald font-medium">{formatCurrency(d.receita)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Lucro Bruto</span>
          <span className="text-white">{formatCurrency(d.lucro)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Margem</span>
          <span className="text-amber-400">{formatPercent(d.margem)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Unidades</span>
          <span className="text-white">{formatNumber(d.unidades)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Participação</span>
          <span className="text-accent-cyan">{formatPercent(d.participacao)}</span>
        </div>
      </div>
    </div>
  )
}

function BarLabel(props: { x?: number; y?: number; width?: number; height?: number; value?: number }) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props
  if (!value) return null
  return (
    <text x={x + width + 6} y={y + height / 2} dy={4} fill="#94a3b8" fontSize={10} textAnchor="start">
      {formatCurrencyShort(value)}
    </text>
  )
}

interface Props { dadosPorUF: DadosUF[]; topN?: number; metrica?: Metrica }

export function BarChartEstados({ dadosPorUF, topN = 10, metrica = 'receita' }: Props) {
  const data = [...dadosPorUF]
    .sort((a, b) => b[metrica] - a[metrica])
    .slice(0, topN)

  const label = metrica === 'receita' ? 'Receita Bruta' : 'Lucro Bruto'

  return (
    <div className="bg-bg-card border border-border-dark rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Top Estados · {label}
      </h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px]">
          <p className="text-text-muted text-sm">Sem dados para o período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 90, left: 8, bottom: 4 }} barCategoryGap="18%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" tickFormatter={formatCurrencyShort} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="uf" width={32} tick={{ fill: '#22d3ee', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#273548' }} />
            <Bar dataKey={metrica} radius={[0, 4, 4, 0]} maxBarSize={20} label={<BarLabel />}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={`rgba(212,160,23,${1 - i * 0.07})`}
                  opacity={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
