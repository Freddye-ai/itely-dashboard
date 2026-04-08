import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  MapPin,
  Table2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { useFilterStore } from '../../store/filterStore'

export type TabId = 'geral' | 'clientes' | 'geografica' | 'analitica'

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode; sub?: string }[] = [
  { id: 'geral',      label: 'Dashboard Geral',      icon: <LayoutDashboard className="w-5 h-5" />, sub: 'Visão executiva' },
  { id: 'clientes',   label: 'Análise de Clientes',  icon: <Users           className="w-5 h-5" />, sub: 'Top 10 clientes' },
  { id: 'geografica', label: 'Análise Geográfica',   icon: <MapPin          className="w-5 h-5" />, sub: 'UF e município' },
  { id: 'analitica',  label: 'Tabela Analítica',     icon: <Table2          className="w-5 h-5" />, sub: 'Por coleção' },
]

interface SidebarProps {
  activeTab: TabId
  onChange:  (tab: TabId) => void
}

export function Sidebar({ activeTab, onChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const resetFiltrosLocais = useFilterStore((s) => s.resetFiltrosLocais)

  function handleChange(tab: TabId) {
    if (tab === activeTab) return
    resetFiltrosLocais()
    onChange(tab)
  }

  return (
    <aside
      className={[
        'flex flex-col bg-bg-card border-r border-border-dark transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-5 border-b border-border-dark">
        <div className="flex items-center justify-center w-full overflow-hidden">
          {collapsed ? (
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-bg-surface border border-border-dark flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent-cyan" />
            </div>
          ) : (
            <img
              src="/itely_logo_lg.png"
              alt="Itely Hair Fashion"
              className="w-full max-w-[180px] object-contain"
              onError={(e) => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
              }}
            />
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-text-muted hover:text-white transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expandir quando colapsado */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="flex justify-center py-2 text-text-muted hover:text-white transition-colors border-b border-border-dark"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navegação */}
      {!collapsed && (
        <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted/50">
          Módulos
        </p>
      )}

      <nav className="flex-1 px-2 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = item.id === activeTab
          return (
            <button
              key={item.id}
              onClick={() => handleChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={[
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 group',
                active
                  ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25'
                  : 'text-text-muted hover:bg-bg-surface hover:text-white border border-transparent',
                collapsed ? 'justify-center' : '',
              ].join(' ')}
            >
              <span className={['flex-shrink-0 transition-colors', active ? 'text-accent-cyan' : 'text-text-muted group-hover:text-white'].join(' ')}>
                {item.icon}
              </span>
              {!collapsed && (
                <div className="overflow-hidden text-left">
                  <p className="font-medium truncate leading-tight">{item.label}</p>
                  {item.sub && (
                    <p className="text-[10px] text-text-muted/60 truncate leading-tight">{item.sub}</p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Rodapé — logo do desenvolvedor */}
      <div className="px-3 py-3 border-t border-border-dark">
        {!collapsed ? (
          <div className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-70 transition-opacity cursor-default">
            <span className="text-[9px] text-text-muted uppercase tracking-widest">Desenvolvido por</span>
            <img
              src="/finance-brazil-logo-white-DMrqfvyl.png"
              alt="Desenvolvedor"
              className="h-5 object-contain brightness-0 invert"
              onError={(e) => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
                const fb = el.nextElementSibling as HTMLElement | null
                if (fb) fb.style.display = 'block'
              }}
            />
            <span className="hidden text-[9px] text-text-muted/50">© 2025</span>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-accent-cyan mx-auto opacity-40" title="Online" />
        )}
      </div>
    </aside>
  )
}
