import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, type TooltipProps,
} from 'recharts'
import type { DadosMes } from '../../types'
import { formatCurrencyShort, formatCurrency, formatNumber } from '../../utils/formatters'

type Metrica = 'receita' | 'lucro'

const COR_BIALITA = '#D4A017'
const COR_GRIT    = '#22d3ee'
const COR_MARGEM  = '#f59e0b'

function buildData(dadosPorMes: DadosMes[], metrica: Metrica) {
  return dadosPorMes.map((d) => ({
    label:   d.label,
    bialita: metrica === 'receita' ? d.bialita : d.lucroBialita,
    grit:    metrica === 'receita' ? d.grit    : d.lucroGrit,
    margem:  +(d.margem * 100).toFixed(1),
    unidades: d.unidades,
    total:   metrica === 'receita' ? d.total   : d.lucroTotal,
  }))
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const bialita = payload.find((p) => p.dataKey === 'bialita')
  const grit    = payload.find((p) => p.dataKey === 'grit')
  const margem  = payload.find((p) => p.dataKey === 'margem')
  const total   = (bialita?.value ?? 0) + (grit?.value ?? 0)
  const row     = payload[0]?.payload as { unidades: number }

  return (
    <div className="bg-bg-surface border border-border-dark rounded-xl p-3 shadow-2xl text-xs min-w-[180px]">
      <p className="text-white font-semibold mb-2">{label}</p>
      <div className="space-y-1.5">
        {bialita && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-muted">
              <span className="w-2 h-2 rounded-full bg-accent-cyan flex-shrink-0" />BIALITA
            </span>
            <span className="text-white font-medium">{formatCurrency(bialita.value ?? 0)}</span>
          </div>
        )}
        {grit && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-muted">
              <span className="w-2 h-2 rounded-full bg-accent-emerald flex-shrink-0" />GRIT
            </span>
            <span className="text-white font-medium">{formatCurrency(grit.value ?? 0)}</span>
          </div>
        )}
        <div className="border-t border-border-dark/50 pt-1.5 mt-1.5 flex justify-between gap-4">
          <span className="text-text-muted">Total</span>
          <span className="text-accent-emerald font-bold">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-text-muted">Unidades</span>
          <span className="text-white">{formatNumber(row.unidades)}</span>
        </div>
        {margem && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-muted">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COR_MARGEM }} />Margem
            </span>
            <span className="text-amber-400 font-medium">{margem.value}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  dadosPorMes: DadosMes[]
  metrica:     Metrica
}

export function ComposedChartMensal({ dadosPorMes, metrica }: Props) {
  const data = buildData(dadosPorMes, metrica)

  return (
    <div className="bg-bg-card border border-border-dark rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {metrica === 'receita' ? 'Receita' : 'Lucro Bruto'} Mensal · Filial + Margem
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COR_BIALITA }} /> BIALITA</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: COR_GRIT }} /> GRIT</span>
          <span className="flex items-center gap-1"><span className="w-5 h-0.5 inline-block" style={{ background: COR_MARGEM }} /> Margem</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px]">
          <p className="text-text-muted text-sm">Sem dados para o período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 4, right: 48, left: 8, bottom: 4 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
            <YAxis yAxisId="valor" tickFormatter={formatCurrencyShort} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
            <YAxis yAxisId="margem" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fill: '#f59e0b', fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#273548' }} />
            <Bar yAxisId="valor" dataKey="bialita" name="BIALITA" stackId="s" fill={COR_BIALITA} radius={[0,0,0,0]} maxBarSize={36} />
            <Bar yAxisId="valor" dataKey="grit"    name="GRIT"    stackId="s" fill={COR_GRIT}    radius={[3,3,0,0]} maxBarSize={36} />
            <Line yAxisId="margem" type="monotone" dataKey="margem" stroke={COR_MARGEM} strokeWidth={2} dot={{ fill: COR_MARGEM, r: 3 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
