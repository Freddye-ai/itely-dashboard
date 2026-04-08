import { useCallback } from 'react'
import { useSortable } from '../../hooks/useSortable'
import {
  ModernTable, ModernThead, ModernTh, ModernTbody, ModernTfoot, ModernTfootTd,
  ModernTr, ModernTd, ModernEmpty, MargemBadge,
} from '../ui/ModernTable'
import { BarChartClientes } from '../charts/BarChartClientes'
import { PieChartClientes } from '../charts/PieChartClientes'
import type { DadosCliente } from '../../types'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'

type ColKey = 'nomecliente' | 'receita' | 'unidades' | 'lucro' | 'margem' | 'participacao'

interface AnaliseClientesProps {
  todosClientes: DadosCliente[]
}

export function AnaliseClientes({ todosClientes }: AnaliseClientesProps) {
  const getValue = useCallback((row: DadosCliente, key: ColKey): number | string => {
    switch (key) {
      case 'nomecliente':  return row.nomecliente
      case 'receita':      return row.receita
      case 'unidades':     return row.unidades
      case 'lucro':        return row.lucro
      case 'margem':       return row.margem
      case 'participacao': return row.participacao
    }
  }, [])

  const { sorted, sort, handleSort } = useSortable<DadosCliente, ColKey>(
    todosClientes, 'receita', 'desc', getValue,
  )

  const isRankMode = sort.key === 'receita' && sort.dir === 'desc'

  const totais = sorted.reduce(
    (acc, r) => ({ receita: acc.receita + r.receita, unidades: acc.unidades + r.unidades, lucro: acc.lucro + r.lucro }),
    { receita: 0, unidades: 0, lucro: 0 },
  )
  const margemTotal = totais.receita === 0 ? 0 : totais.lucro / totais.receita

  return (
    <div className="space-y-4">
      {/* Gráficos de clientes — top 10 por receita */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <BarChartClientes topClientes={todosClientes.slice(0, 10)} />
        <PieChartClientes topClientes={todosClientes.slice(0, 10)} />
      </div>

    <ModernTable>
      <ModernThead>
        <ModernTh label="Nome"          colKey="nomecliente"  sort={sort} onSort={handleSort} />
        <ModernTh label="Receita"       colKey="receita"      sort={sort} onSort={handleSort} align="right" className="w-36" />
        <ModernTh label="Unidades"      colKey="unidades"     sort={sort} onSort={handleSort} align="right" className="w-24" />
        <ModernTh label="Lucro Bruto"   colKey="lucro"        sort={sort} onSort={handleSort} align="right" className="w-36" />
        <ModernTh label="Margem"        colKey="margem"       sort={sort} onSort={handleSort} align="right" className="w-28" />
        <ModernTh label="Participação"  colKey="participacao" sort={sort} onSort={handleSort} align="right" className="w-32" />
      </ModernThead>

      <ModernTbody>
        {sorted.length === 0 ? (
          <ModernEmpty cols={6} />
        ) : (
          sorted.map((row, i) => {
            const isTop = isRankMode && i === 0
            return (
              <ModernTr key={row.nomecliente} highlight={isTop}>
                {/* Nome */}
                <ModernTd>
                  <div className="flex items-center gap-2">
                    <span className={isTop ? 'text-accent-cyan font-semibold' : 'text-white font-medium'}>
                      {row.nomecliente || '—'}
                    </span>
                    {isTop && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan font-bold tracking-wider">
                        TOP 1
                      </span>
                    )}
                  </div>
                </ModernTd>

                {/* Receita */}
                <ModernTd align="right">
                  <span className="text-accent-emerald font-semibold">{formatCurrency(row.receita)}</span>
                </ModernTd>

                {/* Unidades */}
                <ModernTd align="right" muted>{formatNumber(row.unidades)}</ModernTd>

                {/* Lucro */}
                <ModernTd align="right" muted>{formatCurrency(row.lucro)}</ModernTd>

                {/* Margem */}
                <ModernTd align="right">
                  <MargemBadge value={row.margem} />
                </ModernTd>

                {/* Participação */}
                <ModernTd align="right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-14 h-1.5 rounded-full bg-bg-surface overflow-hidden flex-shrink-0">
                      <div className="h-full rounded-full bg-accent-cyan" style={{ width: `${Math.min(row.participacao * 100, 100)}%` }} />
                    </div>
                    <span className="text-[11px] text-text-muted w-9 text-right">{formatPercent(row.participacao, 1)}</span>
                  </div>
                </ModernTd>
              </ModernTr>
            )
          })
        )}
      </ModernTbody>

      {sorted.length > 0 && (
        <ModernTfoot>
          <ModernTfootTd className="text-text-muted uppercase text-[11px] tracking-widest">Total (Top {sorted.length})</ModernTfootTd>
          <ModernTfootTd align="right" className="text-accent-emerald">{formatCurrency(totais.receita)}</ModernTfootTd>
          <ModernTfootTd align="right">{formatNumber(totais.unidades)}</ModernTfootTd>
          <ModernTfootTd align="right">{formatCurrency(totais.lucro)}</ModernTfootTd>
          <ModernTfootTd align="right"><MargemBadge value={margemTotal} /></ModernTfootTd>
          <ModernTfootTd />
        </ModernTfoot>
      )}
    </ModernTable>
    </div>
  )
}
