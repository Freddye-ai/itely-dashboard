import { useFilterStore } from '../../store/filterStore'

export type TabId = 'geral' | 'clientes' | 'geografica' | 'analitica'

const TABS: { id: TabId; label: string }[] = [
  { id: 'geral',      label: 'Dashboard Geral' },
  { id: 'clientes',   label: 'Análise de Clientes' },
  { id: 'geografica', label: 'Análise Geográfica' },
  { id: 'analitica',  label: 'Tabela Analítica' },
]

interface TabNavProps {
  activeTab: TabId
  onChange:  (tab: TabId) => void
}

export function TabNav({ activeTab, onChange }: TabNavProps) {
  const resetFiltrosLocais = useFilterStore((s) => s.resetFiltrosLocais)

  function handleChange(tab: TabId) {
    if (tab === activeTab) return
    resetFiltrosLocais()   // única chamada — nunca duplicar em outros componentes
    onChange(tab)
  }

  return (
    <nav className="flex border-b border-border-dark bg-bg-card px-6 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={[
              'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              active
                ? 'border-accent-cyan text-accent-cyan'
                : 'border-transparent text-text-muted hover:text-white hover:border-border-dark',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
