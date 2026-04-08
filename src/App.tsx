import { useState } from 'react'
import { useVendas } from './hooks/useVendas'
import { Sidebar, type TabId } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { KpiRow } from './components/kpi/KpiRow'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { ErrorCard } from './components/ui/ErrorBoundary'
import { DashboardGeral } from './components/tabs/DashboardGeral'
import { AnaliseClientes } from './components/tabs/AnaliseClientes'
import { AnaliseGeografica } from './components/tabs/AnaliseGeografica'
import { TabelaAnalitica } from './components/tabs/TabelaAnalitica'

const PAGE_META: Record<TabId, { title: string; subtitle: string }> = {
  geral:      { title: 'Dashboard Geral',     subtitle: 'Visão executiva · Faturamento e margem' },
  clientes:   { title: 'Análise de Clientes', subtitle: 'Ranking · Top clientes por faturamento' },
  geografica: { title: 'Análise Geográfica',  subtitle: 'Distribuição · Por estado e município' },
  analitica:  { title: 'Tabela Analítica',    subtitle: 'Coleção · Performance por grupo de produto' },
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('geral')

  const {
    dados, dadosFiltrados, loading, error,
    ultimaAtualizacao, refetch, kpis,
    dadosPorMes, dadosPorGrupo, topClientes, todosClientes,
    dadosPorUF, dadosPorMunicipio, dadosPorRegiao,
    anosDisponiveis, ufsDisponiveis, gruposDisponiveis, clientesDisponiveis,
  } = useVendas()

  const { title, subtitle } = PAGE_META[activeTab]

  // Props de filtro passadas para os componentes que precisam exibir os dropdowns
  const filterProps = { anosDisponiveis, ufsDisponiveis, gruposDisponiveis, clientesDisponiveis }

  return (
    <div className="flex h-screen bg-bg-page overflow-hidden">
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar: só título + refresh */}
        <TopBar
          loading={loading}
          ultimaAtualizacao={ultimaAtualizacao}
          onRefetch={refetch}
          pageTitle={title}
          pageSubtitle={subtitle}
        />

        <main className="flex-1 overflow-auto scrollbar-thin p-4 space-y-4">
          {loading && dados.length === 0 && <LoadingScreen />}
          {error && !loading && <ErrorCard message={error} onRetry={refetch} />}

          {!error && dados.length > 0 && dadosFiltrados.length > 0 && (
            <>
              <KpiRow kpis={kpis} filterProps={filterProps} />

              {activeTab === 'geral' && (
                <DashboardGeral
                  dadosPorMes={dadosPorMes}
                  dadosPorGrupo={dadosPorGrupo}
                  dadosPorRegiao={dadosPorRegiao}
                  dadosPorUF={dadosPorUF}
                  kpis={kpis}
                  filterProps={filterProps}
                />
              )}
              {activeTab === 'clientes' && (
                <AnaliseClientes
                  topClientes={topClientes}
                  todosClientes={todosClientes}
                />
              )}
              {activeTab === 'geografica' && (
                <AnaliseGeografica
                  dadosPorUF={dadosPorUF}
                  dadosPorMunicipio={dadosPorMunicipio}
                  dadosPorRegiao={dadosPorRegiao}
                />
              )}
              {activeTab === 'analitica' && (
                <TabelaAnalitica
                  dadosPorGrupo={dadosPorGrupo}
                  dadosFiltrados={dadosFiltrados}
                />
              )}
            </>
          )}

          {!error && !loading && dados.length > 0 && dadosFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-20">
              <p className="text-text-muted text-sm">Nenhum dado para o período selecionado.</p>
              <p className="text-text-muted/40 text-xs">Ajuste os filtros nos cards.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
