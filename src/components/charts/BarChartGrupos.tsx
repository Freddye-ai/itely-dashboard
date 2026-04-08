import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from 'recharts'
import type { DadosGrupo } from '../../types'
import { formatCurrencyShort, formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'

const COR_BARRA = '#D4A017'  // dourado

// Tooltip personalizado
function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DadosGrupo

  return (
    <div className="bg-bg-surface border border-border-dark rounded-lg p-3 shadow-xl text-xs">
      <p className="text-white font-semibold mb-2">{d.grupo}</p>
      <div className="space-y-1 text-text-muted">
        <p>Receita: <span className="text-accent-emerald font-medium">{formatCurrency(d.receita)}</span></p>
        <p>Unidades: <span className="text-white">{formatNumber(d.unidades)}</span></p>
        <p>Lucro: <span className="text-white">{formatCurrency(d.lucro)}</span></p>
        <p>Margem: <span className="text-white">{formatPercent(d.margem)}</span></p>
      </div>
    </div>
  )
}

interface BarChartGruposProps {
  dadosPorGrupo: DadosGrupo[]
  topN?:         number
}

export function BarChartGrupos({ dadosPorGrupo, topN = 10 }: BarChartGruposProps) {
  // Top N ordenados por receita decrescente (já vem ordenado do metrics.ts)
  const data = dadosPorGrupo.slice(0, topN)

  return (
    <div className="bg-bg-card border border-border-dark rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Top Grupos por Receita
      </h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-text-muted text-sm">Sem dados para o período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatCurrencyShort}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="grupo"
              width={110}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#273548' }} />
            <Bar dataKey="receita" radius={[0, 3, 3, 0]} maxBarSize={20} label={<BarLabel />}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={COR_BARRA}
                  opacity={1 - i * 0.06}  // gradiente suave: mais brilhante no topo
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// Label de valor ao lado da barra
function BarLabel(props: {
  x?: number; y?: number; width?: number; height?: number; value?: number
}) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props
  if (!value) return null
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      dy={4}
      fill="#94a3b8"
      fontSize={10}
      textAnchor="start"
    >
      {formatCurrencyShort(value)}
    </text>
  )
}
