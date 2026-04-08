import { useState, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useSortable } from '../../hooks/useSortable'
import {
  ModernTable, ModernThead, ModernTh, ModernTbody, ModernTfoot, ModernTfootTd,
  ModernEmpty, MargemBadge,
} from '../ui/ModernTable'
import type { DadosGrupo, VendaRow } from '../../types'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'

type ColKey = 'grupo' | 'receita' | 'unidades' | 'lucro' | 'margem' | 'participacao'

// ---------------------------------------------------------------------------
// Agrupa descrições por grupo a partir dos dados brutos filtrados
// ---------------------------------------------------------------------------
interface DescricaoAgg {
  descricao: string
  receita:   number
  unidades:  number
  lucro:     number
  margem:    number
}

function buildDescricoesPorGrupo(rows: VendaRow[]): Map<string, DescricaoAgg[]> {
  const map = new Map<string, Map<string, { receita: number; unidades: number; lucro: number }>>()

  for (const row of rows) {
    if (!map.has(row.grupo)) map.set(row.grupo, new Map())
    const inner = map.get(row.grupo)!
    if (!inner.has(row.descricao)) inner.set(row.descricao, { receita: 0, unidades: 0, lucro: 0 })
    const entry = inner.get(row.descricao)!
    entry.receita  += row.vlvenda
    entry.unidades += row.qtvenda
    entry.lucro    += row.vlvenda - row.vlcustoreal
  }

  const result = new Map<string, DescricaoAgg[]>()
  for (const [grupo, inner] of map.entries()) {
    const aggs: DescricaoAgg[] = Array.from(inner.entries())
      .map(([descricao, d]) => ({
        descricao,
        receita:  d.receita,
        unidades: d.unidades,
        lucro:    d.lucro,
        margem:   d.receita === 0 ? 0 : d.lucro / d.receita,
      }))
      .sort((a, b) => b.receita - a.receita)
    result.set(grupo, aggs)
  }
  return result
}

// ---------------------------------------------------------------------------
// Linha de descrição (sub-linha indentada)
// ---------------------------------------------------------------------------
function DescricaoRow({ d, index }: { d: DescricaoAgg; index: number }) {
  return (
    <tr className="border-t border-border-dark/40 hover:bg-bg-surface/40 transition-colors">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3 pl-6">
          <span className="text-[11px] text-text-muted/40 w-4 text-right flex-shrink-0">{index + 1}</span>
          <span className="text-sm text-white/85">{d.descricao}</span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className="text-accent-emerald/80 text-sm font-medium">{formatCurrency(d.receita)}</span>
      </td>
      <td className="px-4 py-2.5 text-right text-text-muted text-sm">{formatNumber(d.unidades)}</td>
      <td className="px-4 py-2.5 text-right text-text-muted text-sm">{formatCurrency(d.lucro)}</td>
      <td className="px-4 py-2.5 text-right"><MargemBadge value={d.margem} /></td>
      <td className="px-4 py-2.5" />
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
interface TabelaAnaliticaProps {
  dadosPorGrupo:  DadosGrupo[]
  dadosFiltrados: VendaRow[]
}

export function TabelaAnalitica({ dadosPorGrupo, dadosFiltrados }: TabelaAnaliticaProps) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  function toggle(grupo: string) {
    setExpandidos((prev) => {
      const next = new Set(prev)
      next.has(grupo) ? next.delete(grupo) : next.add(grupo)
      return next
    })
  }

  const descricoesPorGrupo = useMemo(
    () => buildDescricoesPorGrupo(dadosFiltrados),
    [dadosFiltrados],
  )

  const getValue = useCallback((row: DadosGrupo, key: ColKey): number | string => {
    switch (key) {
      case 'grupo':        return row.grupo
      case 'receita':      return row.receita
      case 'unidades':     return row.unidades
      case 'lucro':        return row.lucro
      case 'margem':       return row.margem
      case 'participacao': return row.participacao
    }
  }, [])

  const { sorted, sort, handleSort } = useSortable<DadosGrupo, ColKey>(
    dadosPorGrupo, 'receita', 'desc', getValue,
  )

  const totais = dadosPorGrupo.reduce(
    (acc, r) => ({ receita: acc.receita + r.receita, unidades: acc.unidades + r.unidades, lucro: acc.lucro + r.lucro }),
    { receita: 0, unidades: 0, lucro: 0 },
  )
  const margemTotal = totais.receita === 0 ? 0 : totais.lucro / totais.receita

  return (
    <ModernTable>
      <ModernThead>
        <ModernTh label="Grupo"        colKey="grupo"        sort={sort} onSort={handleSort} accent />
        <ModernTh label="Receita"      colKey="receita"      sort={sort} onSort={handleSort} align="right" className="w-36" />
        <ModernTh label="Unidades"     colKey="unidades"     sort={sort} onSort={handleSort} align="right" className="w-24" />
        <ModernTh label="Lucro Bruto"  colKey="lucro"        sort={sort} onSort={handleSort} align="right" className="w-36" />
        <ModernTh label="Margem"       colKey="margem"       sort={sort} onSort={handleSort} align="right" className="w-28" />
        <ModernTh label="Participação" colKey="participacao" sort={sort} onSort={handleSort} align="right" className="w-32" />
      </ModernThead>

      <ModernTbody>
        {sorted.length === 0 ? (
          <ModernEmpty cols={6} />
        ) : (
          sorted.map((row, i) => {
            const descricoes = descricoesPorGrupo.get(row.grupo) ?? []
            const expanded   = expandidos.has(row.grupo)
            return (
              <>
                <tr
                  key={row.grupo}
                  className="cursor-pointer bg-bg-surface/60 hover:bg-bg-surface border-t border-border-dark transition-colors"
                  onClick={() => toggle(row.grupo)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted/60 flex-shrink-0">
                        {expanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-accent-cyan" />
                          : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                      <span className="text-[11px] text-text-muted/50 w-4 text-right flex-shrink-0">{i + 1}</span>
                      <span className="font-bold text-accent-cyan text-sm">{row.grupo}</span>
                      <span className="text-[10px] text-text-muted/50 ml-1">{descricoes.length} prod.</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-accent-emerald font-bold text-sm">{formatCurrency(row.receita)}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted text-sm">{formatNumber(row.unidades)}</td>
                  <td className="px-4 py-3 text-right text-text-muted text-sm">{formatCurrency(row.lucro)}</td>
                  <td className="px-4 py-3 text-right"><MargemBadge value={row.margem} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-bg-surface overflow-hidden flex-shrink-0">
                        <div className="h-full rounded-full bg-accent-cyan" style={{ width: `${Math.min(row.participacao * 100, 100)}%` }} />
                      </div>
                      <span className="text-[11px] text-text-muted w-9 text-right">{formatPercent(row.participacao, 1)}</span>
                    </div>
                  </td>
                </tr>

                {expanded && descricoes.map((d, idx) => (
                  <DescricaoRow key={`${row.grupo}-${d.descricao}`} d={d} index={idx} />
                ))}
              </>
            )
          })
        )}
      </ModernTbody>

      {sorted.length > 0 && (
        <ModernTfoot>
          <ModernTfootTd className="text-text-muted uppercase text-[11px] tracking-widest">Total Geral</ModernTfootTd>
          <ModernTfootTd align="right" className="text-accent-emerald">{formatCurrency(totais.receita)}</ModernTfootTd>
          <ModernTfootTd align="right">{formatNumber(totais.unidades)}</ModernTfootTd>
          <ModernTfootTd align="right">{formatCurrency(totais.lucro)}</ModernTfootTd>
          <ModernTfootTd align="right"><MargemBadge value={margemTotal} /></ModernTfootTd>
          <ModernTfootTd />
        </ModernTfoot>
      )}
    </ModernTable>
  )
}
