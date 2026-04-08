import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipProps,
} from 'recharts'
import type { DadosGrupo } from '../../types'
import { formatCurrency, formatPercent } from '../../utils/formatters'

const CORES = [
  '#D4A017', '#22d3ee', '#a78bfa', '#f59e0b',
  '#f87171', '#34d399', '#60a5fa', '#fb923c',
  '#f472b6', '#888888',
]

interface PieData {
  name:       string
  receita:    number
  percentual: number
}

function buildPieData(dadosPorGrupo: DadosGrupo[], topN = 8): PieData[] {
  const total = dadosPorGrupo.reduce((s, g) => s + g.receita, 0)
  if (total === 0) return []

  const top = dadosPorGrupo.slice(0, topN)
  const outrosReceita = dadosPorGrupo.slice(topN).reduce((s, g) => s + g.receita, 0)

  const result: PieData[] = top.map((g) => ({
    name:       g.grupo,
    receita:    g.receita,
    percentual: g.receita / total,
  }))

  if (outrosReceita > 0) {
    result.push({ name: 'Outros', receita: outrosReceita, percentual: outrosReceita / total })
  }

  return result
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as PieData
  return (
    <div className="bg-bg-surface border border-border-dark rounded-lg p-3 shadow-xl text-xs">
      <p className="text-white font-semibold mb-1">{d.name}</p>
      <p className="text-text-muted">Receita: <span className="text-accent-emerald font-medium">{formatCurrency(d.receita)}</span></p>
      <p className="text-text-muted">Participação: <span className="text-accent-cyan font-medium">{formatPercent(d.percentual)}</span></p>
    </div>
  )
}

// Label customizado dentro das fatias
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percentual }: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percentual: number
}) {
  if (percentual < 0.05) return null // Não renderiza labels muito pequenos
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percentual * 100).toFixed(0)}%`}
    </text>
  )
}

interface PieChartGruposProps {
  dadosPorGrupo: DadosGrupo[]
}

export function PieChartGrupos({ dadosPorGrupo }: PieChartGruposProps) {
  const data = buildPieData(dadosPorGrupo)

  return (
    <div className="bg-bg-card border border-border-dark rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">
        Mix de Produtos
      </h3>
      <p className="text-[11px] text-text-muted/60 mb-4">Participação % por grupo</p>

      {data.length === 0 ? (
        <div className="flex items-center justify-center flex-1 min-h-[260px]">
          <p className="text-text-muted text-sm">Sem dados para o período</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                dataKey="receita"
                labelLine={false}
                label={(props) => <CustomLabel {...props} percentual={props.payload.percentual} />}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legenda manual */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: CORES[i % CORES.length] }}
                />
                <span className="text-[10px] text-text-muted truncate">{d.name}</span>
                <span className="text-[10px] text-white font-medium ml-auto flex-shrink-0">
                  {formatPercent(d.percentual, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
