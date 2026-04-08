import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, type TooltipProps,
} from 'recharts'
import type { DadosCliente } from '../../types'
import { formatCurrencyShort, formatCurrency, formatPercent, formatNumber } from '../../utils/formatters'

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DadosCliente
  return (
    <div className="bg-bg-surface border border-border-dark rounded-xl p-3 shadow-2xl text-xs min-w-[200px]">
      <p className="text-white font-semibold mb-2 truncate max-w-[180px]">{d.nomecliente}</p>
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

const COR_BARRA = '#D4A017'

export function BarChartClientes({ topClientes }: { topClientes: DadosCliente[] }) {
  const data = topClientes.slice(0, 10)

  return (
    <div className="bg-bg-card border border-border-dark rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Top 10 Clientes · Receita Bruta
      </h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px]">
          <p className="text-text-muted text-sm">Sem dados para o período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 100, left: 8, bottom: 4 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" tickFormatter={formatCurrencyShort} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category" dataKey="nomecliente" width={130}
              tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#273548' }} />
            <Bar dataKey="receita" radius={[0, 4, 4, 0]} maxBarSize={20} label={<BarLabel />}>
              {data.map((d) => (
                <Cell key={d.nomecliente} fill={COR_BARRA} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
