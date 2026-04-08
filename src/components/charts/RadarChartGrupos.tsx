import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, type TooltipProps,
} from 'recharts'
import type { DadosGrupo } from '../../types'
import { formatPercent } from '../../utils/formatters'

/** Normaliza um valor para 0-100 dado o máximo do conjunto */
function norm(value: number, max: number): number {
  return max === 0 ? 0 : Math.round((value / max) * 100)
}

function buildRadarData(grupos: DadosGrupo[]) {
  const top = grupos.slice(0, 7)
  const maxReceita  = Math.max(...top.map((g) => g.receita), 1)
  const maxUnidades = Math.max(...top.map((g) => g.unidades), 1)
  const maxLucro    = Math.max(...top.map((g) => g.lucro), 1)
  const maxMargem   = Math.max(...top.map((g) => g.margem), 1)

  return top.map((g) => ({
    grupo:    g.grupo.length > 14 ? g.grupo.slice(0, 14) + '…' : g.grupo,
    receita:  norm(g.receita, maxReceita),
    unidades: norm(g.unidades, maxUnidades),
    lucro:    norm(g.lucro, maxLucro),
    margem:   norm(g.margem, maxMargem),
    // raw para tooltip
    _margem:  g.margem,
  }))
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ReturnType<typeof buildRadarData>[number]
  return (
    <div className="bg-bg-surface border border-border-dark rounded-xl p-2.5 shadow-2xl text-xs">
      <p className="text-white font-semibold mb-1.5">{d.grupo}</p>
      <div className="space-y-1 text-text-muted">
        <p>Receita <span className="text-accent-cyan">{d.receita}%</span></p>
        <p>Lucro <span className="text-accent-emerald">{d.lucro}%</span></p>
        <p>Unidades <span className="text-white">{d.unidades}%</span></p>
        <p>Margem <span className="text-amber-400">{formatPercent(d._margem)}</span></p>
      </div>
    </div>
  )
}

export function RadarChartGrupos({ dadosPorGrupo }: { dadosPorGrupo: DadosGrupo[] }) {
  const data = buildRadarData(dadosPorGrupo)

  return (
    <div className="bg-bg-card border border-border-dark rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Radar · Top Grupos
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{background:'#D4A017'}} />Receita</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{background:'#22d3ee'}} />Lucro</span>
        </div>
      </div>
      <p className="text-[10px] text-text-muted/50 mb-3">Score relativo (0-100) · normalizado pelo máximo do período</p>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[260px]">
          <p className="text-text-muted text-sm">Sem dados</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="grupo" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#334155', fontSize: 9 }} />
            <Radar name="Receita"  dataKey="receita"  stroke="#D4A017" fill="#D4A017" fillOpacity={0.15} strokeWidth={2} />
            <Radar name="Lucro"    dataKey="lucro"    stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.12} strokeWidth={1.5} />
            <Radar name="Unidades" dataKey="unidades" stroke="#a78bfa" fill="none"   strokeWidth={1} strokeDasharray="4 2" />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
