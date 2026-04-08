import { useState } from 'react'
import { ComposedChartMensal } from '../charts/ComposedChartMensal'
import { BarChartGrupos } from '../charts/BarChartGrupos'
import { BarChartRegioes } from '../charts/BarChartRegioes'
import { BarChartEstados } from '../charts/BarChartEstados'
import { PieChartGrupos } from '../charts/PieChartGrupos'
import { PieChartFilial } from '../charts/PieChartFilial'
import type { DadosMes, DadosGrupo, DadosRegiao, DadosUF, KpiData } from '../../types'

type Metrica = 'receita' | 'lucro'

interface FilterProps { anosDisponiveis: number[]; ufsDisponiveis: string[]; gruposDisponiveis: string[] }
interface DashboardGeralProps {
  dadosPorMes:    DadosMes[]
  dadosPorGrupo:  DadosGrupo[]
  dadosPorRegiao: DadosRegiao[]
  dadosPorUF:     DadosUF[]
  kpis:           KpiData
  filterProps:    FilterProps
}

export function DashboardGeral({ dadosPorMes, dadosPorGrupo, dadosPorRegiao, dadosPorUF, kpis }: DashboardGeralProps) {
  const [metrica, setMetrica] = useState<Metrica>('receita')

  return (
    <div className="space-y-4">
      {/* Toggle Receita / Lucro Bruto */}
      <div className="flex items-center gap-1 p-1 bg-bg-card border border-border-dark rounded-xl w-fit">
        {(['receita', 'lucro'] as Metrica[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetrica(m)}
            className={[
              'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
              metrica === m
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                : 'text-text-muted hover:text-white',
            ].join(' ')}
          >
            {m === 'receita' ? 'Receita Bruta' : 'Lucro Bruto'}
          </button>
        ))}
      </div>

      {/* Grid 2x2 — altura uniforme por linha via grid-rows */}
      <div className="grid grid-cols-1 xl:grid-cols-2 xl:grid-rows-2 gap-4" style={{ gridAutoRows: '420px' }}>
        <div className="h-full"><ComposedChartMensal dadosPorMes={dadosPorMes} metrica={metrica} /></div>
        <div className="h-full"><PieChartFilial receitaBialita={kpis.receitaBialita} receitaGrit={kpis.receitaGrit} /></div>
        <div className="h-full"><BarChartEstados dadosPorUF={dadosPorUF} metrica={metrica} /></div>
        <div className="h-full"><PieChartGrupos dadosPorGrupo={dadosPorGrupo} /></div>
      </div>

      {/* Linha inferior: Regiões + Top Grupos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ gridAutoRows: '360px' }}>
        <div className="h-full"><BarChartRegioes dadosPorRegiao={dadosPorRegiao} metrica={metrica} /></div>
        <div className="h-full"><BarChartGrupos  dadosPorGrupo={dadosPorGrupo} /></div>
      </div>
    </div>
  )
}
