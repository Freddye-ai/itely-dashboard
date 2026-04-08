import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import type { DadosMes } from '../../types'
import { formatCurrencyShort, formatCurrency, formatNumber } from '../../utils/formatters'

// Cores fixas — nunca inverter
const COR_2024 = '#22d3ee'  // teal
const COR_2025 = '#D4A017'  // dourado

const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                     'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface ChartPoint {
  mes:     string
  mesNum:  number
  [ano: string]: number | string
}

/** Transforma DadosMes[] no formato {mes, 2024, 2025, un2024, un2025} para o Recharts */
function buildChartData(dadosPorMes: DadosMes[]): { data: ChartPoint[]; anos: number[] } {
  // Descobre quais anos existem nos dados
  const anosSet = new Set<number>()
  for (const d of dadosPorMes) {
    anosSet.add(Number(d.mesAno.split('-')[0]))
  }
  const anos = Array.from(anosSet).sort()

  // Monta mapa mês (1-12) → receitas e unidades por ano
  const map = new Map<number, Record<string, number>>()
  for (let m = 1; m <= 12; m++) {
    const entry: Record<string, number> = {}
    for (const ano of anos) {
      entry[`${ano}`]    = 0
      entry[`un${ano}`]  = 0
    }
    map.set(m, entry)
  }

  for (const d of dadosPorMes) {
    const [ano, mes] = d.mesAno.split('-').map(Number)
    const entry = map.get(mes)
    if (!entry) continue
    entry[`${ano}`]   += d.total
    entry[`un${ano}`] += d.unidades
  }

  // Só retorna meses que têm ao menos um valor não-zero (evita barras fantasmas)
  const data: ChartPoint[] = []
  for (const [mesNum, vals] of map.entries()) {
    const temDados = anos.some((a) => vals[`${a}`] > 0)
    if (temDados) {
      data.push({ mes: MESES_LABEL[mesNum - 1], mesNum, ...vals })
    }
  }

  return { data, anos }
}

// Tooltip personalizado
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-bg-surface border border-border-dark rounded-lg p-3 shadow-xl text-xs">
      <p className="text-text-muted font-medium mb-2">{label}</p>
      {payload.map((entry) => {
        const ano = entry.name
        const unKey = `un${ano}`
        const un = (entry.payload as Record<string, number>)[unKey] ?? 0
        return (
          <div key={ano} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-muted">{ano}:</span>
            <span className="text-white font-medium">{formatCurrency(entry.value ?? 0)}</span>
            <span className="text-text-muted">· {formatNumber(un)} un.</span>
          </div>
        )
      })}
    </div>
  )
}

// Legenda personalizada
function CustomLegend({ anos }: { anos: number[] }) {
  const cores: Record<number, string> = { 2024: COR_2024, 2025: COR_2025, 2026: '#a78bfa' }
  return (
    <div className="flex justify-center gap-4 mt-2">
      {anos.map((ano) => (
        <div key={ano} className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: cores[ano] ?? '#94a3b8' }} />
          {ano}
        </div>
      ))}
    </div>
  )
}

interface BarChartMensalProps {
  dadosPorMes: DadosMes[]
}

export function BarChartMensal({ dadosPorMes }: BarChartMensalProps) {
  const { data, anos } = buildChartData(dadosPorMes)

  const cores: Record<number, string> = { 2024: COR_2024, 2025: COR_2025, 2026: '#a78bfa' }

  return (
    <div className="bg-bg-card border border-border-dark rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Receita por Mês
      </h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-text-muted text-sm">Sem dados para o período</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCurrencyShort}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#273548' }} />
              {anos.map((ano) => (
                <Bar
                  key={ano}
                  dataKey={`${ano}`}
                  name={`${ano}`}
                  fill={cores[ano] ?? '#94a3b8'}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <CustomLegend anos={anos} />
        </>
      )}
    </div>
  )
}
