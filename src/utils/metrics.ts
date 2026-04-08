/**
 * Funções de agregação — coração do sistema.
 * Todas puras, sem side-effects, compatíveis com useMemo.
 * Equivalente às medidas DAX do Power BI.
 */

import type {
  VendaRow,
  FilterState,
  KpiData,
  DadosMes,
  DadosGrupo,
  DadosCliente,
  DadosUF,
  DadosMunicipio,
  DadosRegiao,
} from '../types'
import { getPreviousMonth, toMesAnoLabel } from './dateHelpers'

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

/**
 * Aplica o conjunto de filtros sobre os dados brutos.
 * Ordem: Ano → Mês → Filial → UF → Grupo
 */
export function aplicarFiltros(dados: VendaRow[], filtros: FilterState): VendaRow[] {
  return dados.filter((row) => {
    const ano = row.dtsaida.getFullYear()
    const mes = row.dtsaida.getMonth() + 1

    if (filtros.ano.length > 0 && !filtros.ano.includes(ano)) return false
    if (filtros.mes.length > 0 && !filtros.mes.includes(mes)) return false
    if (filtros.filial.length > 0 && !filtros.filial.includes(row.filial)) return false
    if (filtros.uf.length > 0 && !filtros.uf.includes(row.uf)) return false
    if (filtros.grupo.length > 0 && !filtros.grupo.includes(row.grupo)) return false
    if (filtros.cliente.length > 0 && !filtros.cliente.includes(row.nomecliente)) return false

    return true
  })
}

// ---------------------------------------------------------------------------
// Métricas base
// ---------------------------------------------------------------------------

/** Soma de VLVENDA sobre um conjunto de linhas. */
export function calcularReceita(rows: VendaRow[]): number {
  return rows.reduce((acc, r) => acc + r.vlvenda, 0)
}

/** Soma de QTVENDA sobre um conjunto de linhas. */
export function calcularUnidades(rows: VendaRow[]): number {
  return rows.reduce((acc, r) => acc + r.qtvenda, 0)
}

/** Lucro Bruto = Σ (VLVENDA - VLCUSTOREAL) linha a linha. */
export function calcularLucroBruto(rows: VendaRow[]): number {
  return rows.reduce((acc, r) => acc + (r.vlvenda - r.vlcustoreal), 0)
}

/**
 * Margem Bruta = Lucro Bruto / Receita Bruta.
 * Retorna 0 se Receita = 0 para evitar Infinity/NaN.
 */
export function calcularMargem(rows: VendaRow[]): number {
  const receita = calcularReceita(rows)
  if (receita === 0) return 0
  const lucro = calcularLucroBruto(rows)
  return lucro / receita
}

// ---------------------------------------------------------------------------
// Time Intelligence — Variação MoM
// ---------------------------------------------------------------------------

/**
 * Calcula a variação Mês a Mês (MoM) em %.
 * Usa os dados brutos (não filtrados) para buscar o período anterior.
 *
 * @param dadosFiltrados - Linhas já filtradas (período atual)
 * @param dadosBrutos    - Todas as linhas (para achar o período anterior)
 * @param filtros        - Filtros ativos (para aplicar ao período anterior)
 * @returns number | null — null quando não há dados no período anterior
 */
export function calcularMoM(
  dadosFiltrados: VendaRow[],
  dadosBrutos: VendaRow[],
  filtros: FilterState,
): number | null {
  if (dadosFiltrados.length === 0) return null
  // MoM só faz sentido com exatamente 1 mês e 1 ano selecionado
  if (filtros.mes.length !== 1 || filtros.ano.length !== 1) return null

  const { mes: mesAnterior, ano: anoAnterior } = getPreviousMonth(filtros.mes[0], filtros.ano[0])

  const filtroAnterior: FilterState = {
    ...filtros,
    mes:  [mesAnterior],
    ano:  [anoAnterior],
  }
  const dadosAnteriores = aplicarFiltros(dadosBrutos, filtroAnterior)

  const receitaAtual    = calcularReceita(dadosFiltrados)
  const receitaAnterior = calcularReceita(dadosAnteriores)

  if (!receitaAnterior || receitaAnterior === 0) return null

  return (receitaAtual - receitaAnterior) / receitaAnterior
}

// ---------------------------------------------------------------------------
// KPIs consolidados
// ---------------------------------------------------------------------------

/**
 * Calcula todos os KPIs para a linha de cards.
 * Recebe dados já filtrados e dados brutos para MoM.
 */
export function calcularKpis(
  dadosFiltrados: VendaRow[],
  dadosBrutos: VendaRow[],
  filtros: FilterState,
): KpiData {
  const rowsBialita = dadosFiltrados.filter((r) => r.filial === 'BIALITA')
  const rowsGrit = dadosFiltrados.filter((r) => r.filial === 'GRIT')

  const receitaBialita = calcularReceita(rowsBialita)
  const receitaGrit = calcularReceita(rowsGrit)
  const receitaTotal = receitaBialita + receitaGrit

  const momPercent = calcularMoM(dadosFiltrados, dadosBrutos, filtros)

  // MoM por filial BIALITA
  const momBialita = calcularMoM(
    rowsBialita,
    dadosBrutos,
    { ...filtros, filial: ['BIALITA'] },
  )

  // Receita do mês anterior — só calculável com 1 mês e 1 ano selecionado
  let receitaMesAnterior: number | null = null
  if (filtros.mes.length === 1 && filtros.ano.length === 1) {
    const { mes: mesAnt, ano: anoAnt } = getPreviousMonth(filtros.mes[0], filtros.ano[0])
    const filtroAnt: FilterState = { ...filtros, mes: [mesAnt], ano: [anoAnt] }
    const rowsAnt = aplicarFiltros(dadosBrutos, filtroAnt)
    if (rowsAnt.length > 0) receitaMesAnterior = calcularReceita(rowsAnt)
  }

  const totalUnidades = calcularUnidades(dadosFiltrados)
  const margemBruta = calcularMargem(dadosFiltrados)

  return {
    receitaBialita,
    receitaGrit,
    receitaTotal,
    receitaMesAnterior,
    momPercent,
    momBialita,
    totalUnidades,
    margemBruta,
  }
}

// ---------------------------------------------------------------------------
// Agrupamentos para gráficos e tabelas
// ---------------------------------------------------------------------------

/**
 * Agrupa dados por mês e ano para o gráfico de barras comparativo.
 * Retorna array ordenado por mesAno crescente.
 */
export function agruparPorMes(rows: VendaRow[]): DadosMes[] {
  const map = new Map<string, DadosMes>()

  for (const row of rows) {
    const key = row.mesAno
    if (!map.has(key)) {
      map.set(key, {
        mesAno: key, label: toMesAnoLabel(key),
        bialita: 0, grit: 0, total: 0, unidades: 0,
        lucroTotal: 0, lucroBialita: 0, lucroGrit: 0, margem: 0,
      })
    }
    const entry = map.get(key)!
    const lucro = row.vlvenda - row.vlcustoreal
    if (row.filial === 'BIALITA') { entry.bialita += row.vlvenda; entry.lucroBialita += lucro }
    else if (row.filial === 'GRIT') { entry.grit += row.vlvenda; entry.lucroGrit += lucro }
    entry.total += row.vlvenda
    entry.lucroTotal += lucro
    entry.unidades += row.qtvenda
  }

  return Array.from(map.values())
    .map((d) => ({ ...d, margem: d.total === 0 ? 0 : d.lucroTotal / d.total }))
    .sort((a, b) => a.mesAno.localeCompare(b.mesAno))
}

/**
 * Agrupa dados por grupo de produto, ordenado por receita decrescente.
 * Inclui participação % sobre o total filtrado.
 */
export function agruparPorGrupo(rows: VendaRow[]): DadosGrupo[] {
  const receitaTotal = calcularReceita(rows)
  const map = new Map<string, { receita: number; unidades: number; lucro: number }>()

  for (const row of rows) {
    const key = row.grupo
    if (!map.has(key)) map.set(key, { receita: 0, unidades: 0, lucro: 0 })
    const entry = map.get(key)!
    entry.receita  += row.vlvenda
    entry.unidades += row.qtvenda
    entry.lucro    += row.vlvenda - row.vlcustoreal
  }

  return Array.from(map.entries())
    .map(([grupo, d]) => ({
      grupo,
      receita:      d.receita,
      unidades:     d.unidades,
      lucro:        d.lucro,
      margem:       d.receita === 0 ? 0 : d.lucro / d.receita,
      participacao: receitaTotal === 0 ? 0 : d.receita / receitaTotal,
    }))
    .sort((a, b) => b.receita - a.receita)
}

/**
 * Retorna Top N clientes por receita bruta.
 * Inclui lucro, margem e participação %.
 */
export function calcularTopClientes(rows: VendaRow[], topN = 10): DadosCliente[] {
  const receitaTotal = calcularReceita(rows)
  const map = new Map<string, { receita: number; unidades: number; lucro: number }>()

  for (const row of rows) {
    const key = row.nomecliente || 'SEM NOME'
    if (!map.has(key)) map.set(key, { receita: 0, unidades: 0, lucro: 0 })
    const entry = map.get(key)!
    entry.receita  += row.vlvenda
    entry.unidades += row.qtvenda
    entry.lucro    += row.vlvenda - row.vlcustoreal
  }

  return Array.from(map.entries())
    .map(([nomecliente, d]) => ({
      nomecliente,
      receita:      d.receita,
      unidades:     d.unidades,
      lucro:        d.lucro,
      margem:       d.receita === 0 ? 0 : d.lucro / d.receita,
      participacao: receitaTotal === 0 ? 0 : d.receita / receitaTotal,
    }))
    .sort((a, b) => b.receita - a.receita)
    .slice(0, topN)
}

/**
 * Agrupa dados por UF, com lucro, margem e participação %.
 */
export function agruparPorUF(rows: VendaRow[]): DadosUF[] {
  const receitaTotal = calcularReceita(rows)
  const map = new Map<string, { receita: number; unidades: number; lucro: number }>()

  for (const row of rows) {
    const key = row.uf || 'N/D'
    if (!map.has(key)) map.set(key, { receita: 0, unidades: 0, lucro: 0 })
    const entry = map.get(key)!
    entry.receita  += row.vlvenda
    entry.unidades += row.qtvenda
    entry.lucro    += row.vlvenda - row.vlcustoreal
  }

  return Array.from(map.entries())
    .map(([uf, d]) => ({
      uf,
      receita:      d.receita,
      unidades:     d.unidades,
      lucro:        d.lucro,
      margem:       d.receita === 0 ? 0 : d.lucro / d.receita,
      participacao: receitaTotal === 0 ? 0 : d.receita / receitaTotal,
    }))
    .sort((a, b) => b.receita - a.receita)
}

/**
 * Agrupa dados por município com todos os campos analíticos.
 */
export function agruparPorMunicipio(rows: VendaRow[]): DadosMunicipio[] {
  const receitaTotal = calcularReceita(rows)
  const map = new Map<string, { uf: string; receita: number; unidades: number; lucro: number }>()

  for (const row of rows) {
    const key = `${row.municipio}||${row.uf}`
    if (!map.has(key)) map.set(key, { uf: row.uf || 'N/D', receita: 0, unidades: 0, lucro: 0 })
    const entry = map.get(key)!
    entry.receita  += row.vlvenda
    entry.unidades += row.qtvenda
    entry.lucro    += row.vlvenda - row.vlcustoreal
  }

  return Array.from(map.entries())
    .map(([key, d]) => {
      const [municipio] = key.split('||')
      return {
        municipio:    municipio || 'N/D',
        uf:           d.uf,
        receita:      d.receita,
        unidades:     d.unidades,
        lucro:        d.lucro,
        margem:       d.receita === 0 ? 0 : d.lucro / d.receita,
        participacao: receitaTotal === 0 ? 0 : d.receita / receitaTotal,
      }
    })
    .sort((a, b) => b.receita - a.receita)
}

// ---------------------------------------------------------------------------
// Agrupamento por Região Geográfica do Brasil
// ---------------------------------------------------------------------------

const UF_REGIAO: Record<string, string> = {
  AC:'Norte', AM:'Norte', AP:'Norte', PA:'Norte', RO:'Norte', RR:'Norte', TO:'Norte',
  AL:'Nordeste', BA:'Nordeste', CE:'Nordeste', MA:'Nordeste', PB:'Nordeste',
  PE:'Nordeste', PI:'Nordeste', RN:'Nordeste', SE:'Nordeste',
  DF:'Centro-Oeste', GO:'Centro-Oeste', MS:'Centro-Oeste', MT:'Centro-Oeste',
  ES:'Sudeste', MG:'Sudeste', RJ:'Sudeste', SP:'Sudeste',
  PR:'Sul', RS:'Sul', SC:'Sul',
}

export function agruparPorRegiao(rows: VendaRow[]): DadosRegiao[] {
  const receitaTotal = calcularReceita(rows)
  const map = new Map<string, { receita: number; lucro: number; unidades: number; ufs: Set<string> }>()

  for (const row of rows) {
    const regiao = UF_REGIAO[row.uf] ?? 'Outras'
    if (!map.has(regiao)) map.set(regiao, { receita: 0, lucro: 0, unidades: 0, ufs: new Set() })
    const entry = map.get(regiao)!
    entry.receita  += row.vlvenda
    entry.lucro    += row.vlvenda - row.vlcustoreal
    entry.unidades += row.qtvenda
    if (row.uf) entry.ufs.add(row.uf)
  }

  return Array.from(map.entries())
    .map(([regiao, d]) => ({
      regiao,
      receita:      d.receita,
      lucro:        d.lucro,
      unidades:     d.unidades,
      margem:       d.receita === 0 ? 0 : d.lucro / d.receita,
      participacao: receitaTotal === 0 ? 0 : d.receita / receitaTotal,
      ufs:          Array.from(d.ufs).sort(),
    }))
    .sort((a, b) => b.receita - a.receita)
}

// ---------------------------------------------------------------------------
// Helpers de opções de filtro
// ---------------------------------------------------------------------------

/** Retorna lista de anos únicos presentes nos dados, ordenada decrescente. */
export function getAnosDisponiveis(rows: VendaRow[]): number[] {
  const anos = new Set(rows.map((r) => r.dtsaida.getFullYear()))
  return Array.from(anos).sort((a, b) => b - a)
}

/** Retorna lista de UFs únicas presentes nos dados filtrados, ordenada. */
export function getUFsDisponiveis(rows: VendaRow[]): string[] {
  const ufs = new Set(rows.map((r) => r.uf).filter(Boolean))
  return Array.from(ufs).sort()
}

/** Retorna lista de grupos únicos presentes nos dados filtrados, ordenada. */
export function getGruposDisponiveis(rows: VendaRow[]): string[] {
  const grupos = new Set(rows.map((r) => r.grupo))
  return Array.from(grupos).sort()
}

/** Retorna top N clientes únicos por receita (para o dropdown de filtro). */
export function getClientesDisponiveis(rows: VendaRow[], topN = 100): string[] {
  const map = new Map<string, number>()
  for (const row of rows) {
    if (!row.nomecliente) continue
    map.set(row.nomecliente, (map.get(row.nomecliente) ?? 0) + row.vlvenda)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([nome]) => nome)
    .sort()
}
