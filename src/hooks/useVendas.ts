import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchVendas } from '../services/dataService'
import { loadCache, saveCache } from '../services/cacheService'
import { useFilterStore } from '../store/filterStore'
import {
  aplicarFiltros,
  calcularKpis,
  agruparPorMes,
  agruparPorGrupo,
  calcularTopClientes,
  agruparPorUF,
  agruparPorMunicipio,
  agruparPorRegiao,
  getAnosDisponiveis,
  getUFsDisponiveis,
  getGruposDisponiveis,
  getClientesDisponiveis,
} from '../utils/metrics'
import type { VendaRow } from '../types'

const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000 // 2 horas

export function useVendas() {
  const [dados, setDados] = useState<VendaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)

  const { ano, mes, filial, uf, grupo, cliente } = useFilterStore()
  const filtros = useMemo(
    () => ({ ano, mes, filial, uf, grupo, cliente }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(ano), JSON.stringify(mes), JSON.stringify(filial), JSON.stringify(uf), JSON.stringify(grupo), JSON.stringify(cliente)],
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchVendas()
      saveCache(rows)
      setDados(rows)
      setUltimaAtualizacao(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  // Mount: tenta cache primeiro; só busca rede se expirado ou ausente
  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      // Dados instantâneos do cache
      setDados(cached.rows)
      setUltimaAtualizacao(cached.timestamp)

      // Se o cache tiver mais de 30 min, atualiza em background silenciosamente
      const age = Date.now() - cached.timestamp.getTime()
      if (age > 30 * 60 * 1000) {
        fetchData()
      }
    } else {
      // Sem cache — busca normal com loading
      fetchData()
    }

    const timer = setInterval(fetchData, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [fetchData])

  // ---------------------------------------------------------------------------
  // Dados derivados — todos via useMemo para performance
  // ---------------------------------------------------------------------------

  const dadosFiltrados = useMemo(
    () => aplicarFiltros(dados, filtros),
    [dados, filtros],
  )

  const kpis = useMemo(
    () => calcularKpis(dadosFiltrados, dados, filtros),
    [dadosFiltrados, dados, filtros],
  )

  const dadosPorMes = useMemo(
    () => agruparPorMes(dadosFiltrados),
    [dadosFiltrados],
  )

  const dadosPorGrupo = useMemo(
    () => agruparPorGrupo(dadosFiltrados),
    [dadosFiltrados],
  )

  const topClientes = useMemo(
    () => calcularTopClientes(dadosFiltrados, 10),
    [dadosFiltrados],
  )

  const todosClientes = useMemo(
    () => calcularTopClientes(dadosFiltrados, 9999).filter((c) => c.receita > 0),
    [dadosFiltrados],
  )

  const dadosPorUF = useMemo(
    () => agruparPorUF(dadosFiltrados),
    [dadosFiltrados],
  )

  const dadosPorMunicipio = useMemo(
    () => agruparPorMunicipio(dadosFiltrados),
    [dadosFiltrados],
  )

  const dadosPorRegiao = useMemo(
    () => agruparPorRegiao(dadosFiltrados),
    [dadosFiltrados],
  )

  const topClientes20 = useMemo(
    () => calcularTopClientes(dadosFiltrados, 20),
    [dadosFiltrados],
  )

  // Opções de filtro derivadas dos dados brutos (para dropdowns do Header)
  const anosDisponiveis = useMemo(
    () => getAnosDisponiveis(dados),
    [dados],
  )

  const ufsDisponiveis = useMemo(
    () => getUFsDisponiveis(dados),
    [dados],
  )

  const gruposDisponiveis = useMemo(
    () => getGruposDisponiveis(dados),
    [dados],
  )

  const clientesDisponiveis = useMemo(
    () => getClientesDisponiveis(dados),
    [dados],
  )

  return {
    // Estado bruto
    dados,
    dadosFiltrados,
    loading,
    error,
    ultimaAtualizacao,
    refetch: fetchData,
    // KPIs e agrupamentos
    kpis,
    dadosPorMes,
    dadosPorGrupo,
    topClientes,
    todosClientes,
    dadosPorUF,
    dadosPorMunicipio,
    dadosPorRegiao,
    topClientes20,
    // Opções de filtro
    anosDisponiveis,
    ufsDisponiveis,
    gruposDisponiveis,
    clientesDisponiveis,
  }
}
