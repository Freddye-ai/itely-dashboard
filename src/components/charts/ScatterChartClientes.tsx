import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis, type TooltipProps,
} from 'recharts'
import type { DadosCliente } from '../../types'
import { formatCurrency, formatNumber } from '../../utils/formatters'

interface ScatterPoint {
  x:    number   // receita
  y:    number   // margem %
  z:    number   // unidades (tamanho do ponto)
  nome: string
  lucro: number
}

function buildData(clientes: DadosCliente[]): ScatterPoint[] {
  return clientes.map((c) => ({
    x:    c.receita,
    y:    +(c.margem * 100).toFixed(2),
    z:    Math.max(c.unidades, 1),
    nome: c.nomecliente,
    lucro: c.lucro,
  }))
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as ScatterPoint
  return (
    <div className="bg-bg-surface border border-border-dark rounded-xl p-3 shadow-2xl text-xs min-w-[200px]">
      <p className="text-white font-semibold mb-2 truncate max-w-[190px]">{d.nome}</p>
      <div className="space-y-1.5 text-text-muted">
        <div className="flex justify-between gap-4">
          <span>Receita Bruta</span>
          <span className="text-accent-emerald font-medium">{formatCurrency(d.x)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Lucro Bruto</span>
          <span className="text-white">{formatCurrency(d.lucro)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Margem Bruta</span>
          <span className={d.y >= 40 ? 'text-accent-emerald' : d.y >= 20 ? 'text-amber-400' : 'text-accent-red'}>
            {d.y.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Unidades</span>
          <span className="text-white">{formatNumber(d.z)}</span>
        </div>
      </div>
    </div>
  )
}

function CustomDot(props: { cx?: number; cy?: number; payload?: ScatterPoint }) {
  const { cx = 0, cy = 0, payload } = props
  if (!payload) return null
  const m = payload.y
  const color = m >= 40 ? '#10b981' : m >= 20 ? '#f59e0b' : '#f87171'
  return (
    <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.8} stroke={color} strokeWidth={1} strokeOpacity={0.5} />
  )
}

export function ScatterChartClientes({ topClientes }: { topClientes: DadosCliente[] }) {
  const data = buildData(topClientes)
  const maxReceita = Math.max(...data.map((d) => d.x), 1)

  return (
    <div className="bg-bg-card border border-border-dark rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Receita × Margem · Clientes
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent-emerald" />≥ 40%</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />20-40%</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent-red" />{'< 20%'}</span>
        </div>
      </div>
      <p className="text-[10px] text-text-muted/50 mb-3">Cada ponto = 1 cliente · cor = faixa de margem</p>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-text-muted text-sm">Sem dados</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              type="number" dataKey="x" name="Receita"
              tickFormatter={(v) => formatCurrency(v).replace('R$\u00a0', 'R$ ')}
              tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={false}
              domain={[0, maxReceita * 1.1]}
            />
            <YAxis
              type="number" dataKey="y" name="Margem"
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={42}
              domain={[-10, 100]}
            />
            <ZAxis type="number" dataKey="z" range={[40, 400]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
