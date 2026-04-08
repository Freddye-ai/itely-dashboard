import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipProps,
} from 'recharts'
import { formatCurrency, formatPercent } from '../../utils/formatters'

const CORES = ['#D4A017', '#22d3ee']

interface PieData { name: string; receita: number; percentual: number }

function buildData(receitaBialita: number, receitaGrit: number): PieData[] {
  const total = receitaBialita + receitaGrit
  if (total === 0) return []
  return [
    { name: 'BIALITA', receita: receitaBialita, percentual: receitaBialita / total },
    { name: 'GRIT',    receita: receitaGrit,    percentual: receitaGrit / total },
  ]
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

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percentual }: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percentual: number
}) {
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percentual * 100).toFixed(0)}%`}
    </text>
  )
}

interface Props { receitaBialita: number; receitaGrit: number }

export function PieChartFilial({ receitaBialita, receitaGrit }: Props) {
  const data = buildData(receitaBialita, receitaGrit)

  return (
    <div className="bg-bg-card border border-border-dark rounded-xl p-4 flex flex-col">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">
        Participação por Empresa
      </h3>
      <p className="text-[11px] text-text-muted/60 mb-4">Participação % por filial</p>

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
                paddingAngle={3}
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

          <div className="flex flex-col gap-2">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: CORES[i] }} />
                <span className="text-sm text-text-muted flex-1">{d.name}</span>
                <span className="text-sm text-white font-semibold">{formatPercent(d.percentual, 1)}</span>
                <span className="text-xs text-text-muted/60 w-28 text-right">{formatCurrency(d.receita)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
