import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react'
import { ModernTable, ModernThead, ModernTh, ModernTbody, ModernTfoot, ModernTfootTd, ModernEmpty, MargemBadge } from '../ui/ModernTable'
import { BarChartRegioes } from '../charts/BarChartRegioes'
import { PieChartRegioes } from '../charts/PieChartRegioes'
import type { DadosUF, DadosMunicipio, DadosRegiao } from '../../types'
import { formatCurrency, formatCurrencyShort, formatNumber, formatPercent } from '../../utils/formatters'

// ---------------------------------------------------------------------------
// Agrupa municípios por UF para montar a hierarquia
// ---------------------------------------------------------------------------
interface GeoGroup {
  uf:           DadosUF
  municipios:   DadosMunicipio[]
}

function buildGeoGroups(dadosPorUF: DadosUF[], dadosPorMunicipio: DadosMunicipio[]): GeoGroup[] {
  return dadosPorUF.map((uf) => ({
    uf,
    municipios: dadosPorMunicipio
      .filter((m) => m.uf === uf.uf)
      .sort((a, b) => b.receita - a.receita),
  }))
}

// ---------------------------------------------------------------------------
// Barra de participação
// ---------------------------------------------------------------------------
function ParticipacaoBar({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="w-20 h-1.5 rounded-full bg-bg-surface overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-full bg-accent-cyan transition-all"
          style={{ width: `${Math.min(value * 100, 100)}%` }}
        />
      </div>
      <span className="text-[11px] text-text-muted w-10 text-right">{formatPercent(value, 1)}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Linha de estado (clicável, expande municípios)
// ---------------------------------------------------------------------------
function EstadoRow({
  uf, expanded, onToggle, totalMunicipios,
}: {
  uf: DadosUF; expanded: boolean; onToggle: () => void; totalMunicipios: number
}) {
  return (
    <tr
      className="cursor-pointer bg-bg-surface/60 hover:bg-bg-surface border-t border-border-dark transition-colors"
      onClick={onToggle}
    >
      {/* Toggle + UF */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-text-muted/60 flex-shrink-0">
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-accent-cyan" />
              : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
          <span className="font-bold text-accent-cyan text-sm tracking-wider">{uf.uf}</span>
          <span className="text-[10px] text-text-muted/50 ml-1">{totalMunicipios} mun.</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-accent-emerald font-bold text-sm">{formatCurrency(uf.receita)}</span>
      </td>
      <td className="px-4 py-3 text-right text-text-muted text-sm">{formatNumber(uf.unidades)}</td>
      <td className="px-4 py-3 text-right text-text-muted text-sm">{formatCurrency(uf.lucro)}</td>
      <td className="px-4 py-3 text-right"><MargemBadge value={uf.margem} /></td>
      <td className="px-4 py-3"><ParticipacaoBar value={uf.participacao} /></td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Linha de município (sub-linha indentada)
// ---------------------------------------------------------------------------
function MunicipioRow({ m, index }: { m: DadosMunicipio; index: number }) {
  return (
    <tr className="border-t border-border-dark/40 hover:bg-bg-surface/40 transition-colors">
      {/* Nome indentado */}
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3 pl-6">
          <span className="text-[11px] text-text-muted/40 w-4 text-right flex-shrink-0">{index + 1}</span>
          <span className="text-sm text-white/90">{m.municipio}</span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className="text-accent-emerald/80 text-sm font-medium">{formatCurrency(m.receita)}</span>
      </td>
      <td className="px-4 py-2.5 text-right text-text-muted text-sm">{formatNumber(m.unidades)}</td>
      <td className="px-4 py-2.5 text-right text-text-muted text-sm">{formatCurrency(m.lucro)}</td>
      <td className="px-4 py-2.5 text-right"><MargemBadge value={m.margem} /></td>
      <td className="px-4 py-2.5"><ParticipacaoBar value={m.participacao} /></td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
const COR_REGIAO: Record<string, string> = {
  'Sul': '#D4A017', 'Sudeste': '#22d3ee', 'Nordeste': '#a78bfa',
  'Norte': '#f59e0b', 'Centro-Oeste': '#f87171', 'Outras': '#888888',
}

interface AnaliseGeograficaProps {
  dadosPorUF:        DadosUF[]
  dadosPorMunicipio: DadosMunicipio[]
  dadosPorRegiao:    DadosRegiao[]
}

export function AnaliseGeografica({ dadosPorUF, dadosPorMunicipio, dadosPorRegiao }: AnaliseGeograficaProps) {
  const grupos = useMemo(
    () => buildGeoGroups(dadosPorUF, dadosPorMunicipio),
    [dadosPorUF, dadosPorMunicipio],
  )

  // Quais estados estão expandidos (por padrão todos fechados)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  function toggle(uf: string) {
    setExpandidos((prev) => {
      const next = new Set(prev)
      next.has(uf) ? next.delete(uf) : next.add(uf)
      return next
    })
  }

  const totaisUF = dadosPorUF.reduce(
    (acc, r) => ({ receita: acc.receita + r.receita, unidades: acc.unidades + r.unidades, lucro: acc.lucro + r.lucro }),
    { receita: 0, unidades: 0, lucro: 0 },
  )
  const margemTotalUF = totaisUF.receita === 0 ? 0 : totaisUF.lucro / totaisUF.receita

  return (
    <div className="space-y-4">
      {/* Gráficos de Regiões: barras + rosquinha */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <BarChartRegioes dadosPorRegiao={dadosPorRegiao} />
        <PieChartRegioes dadosPorRegiao={dadosPorRegiao} />
      </div>

      {/* Cards por Região */}
      {dadosPorRegiao.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {dadosPorRegiao.map((r) => {
            const cor = COR_REGIAO[r.regiao] ?? '#94a3b8'
            return (
              <div key={r.regiao} className="bg-bg-card border border-border-dark rounded-xl p-3.5 space-y-2" style={{ borderLeftColor: cor, borderLeftWidth: 3 }}>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: cor }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cor }}>{r.regiao}</span>
                </div>
                <p className="text-white font-bold text-base leading-tight">{formatCurrencyShort(r.receita)}</p>
                <div className="flex items-center justify-between text-[10px] text-text-muted">
                  <span>Margem</span>
                  <span className={r.margem >= 0.4 ? 'text-accent-emerald' : r.margem >= 0.2 ? 'text-amber-400' : 'text-accent-red'}>
                    {formatPercent(r.margem)}
                  </span>
                </div>
                <div className="w-full h-1 rounded-full bg-bg-surface overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.participacao * 100}%`, background: cor }} />
                </div>
                <p className="text-[10px] text-text-muted">{r.ufs.slice(0, 4).join(' · ')}{r.ufs.length > 4 ? ' …' : ''}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabela hierárquica */}
      <div className="grid grid-cols-1 gap-4">
        <div>
    <ModernTable>
      <ModernThead>
        <ModernTh label="Estado / Município" accent />
        <ModernTh label="Receita Bruta"  align="right" className="w-36" />
        <ModernTh label="Unidades"       align="right" className="w-24" />
        <ModernTh label="Lucro Bruto"    align="right" className="w-36" />
        <ModernTh label="Margem"         align="right" className="w-28" />
        <ModernTh label="Participação"   align="right" className="w-36" />
      </ModernThead>

      <ModernTbody>
        {grupos.length === 0 ? (
          <ModernEmpty cols={6} />
        ) : (
          grupos.map(({ uf, municipios }) => (
            <>
              <EstadoRow
                key={`uf-${uf.uf}`}
                uf={uf}
                expanded={expandidos.has(uf.uf)}
                onToggle={() => toggle(uf.uf)}
                totalMunicipios={municipios.length}
              />
              {expandidos.has(uf.uf) && municipios.map((m, i) => (
                <MunicipioRow key={`${m.municipio}-${i}`} m={m} index={i} />
              ))}
            </>
          ))
        )}
      </ModernTbody>

      {grupos.length > 0 && (
        <ModernTfoot>
          <ModernTfootTd className="text-text-muted uppercase text-[11px] tracking-widest">Total Geral</ModernTfootTd>
          <ModernTfootTd align="right" className="text-accent-emerald">{formatCurrency(totaisUF.receita)}</ModernTfootTd>
          <ModernTfootTd align="right">{formatNumber(totaisUF.unidades)}</ModernTfootTd>
          <ModernTfootTd align="right">{formatCurrency(totaisUF.lucro)}</ModernTfootTd>
          <ModernTfootTd align="right"><MargemBadge value={margemTotalUF} /></ModernTfootTd>
          <ModernTfootTd />
        </ModernTfoot>
      )}
    </ModernTable>
        </div>
      </div>
    </div>
  )
}
