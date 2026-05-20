import { RefreshCw, Sun, Moon } from 'lucide-react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { formatHora } from '../../utils/formatters'
import { useThemeStore } from '../../store/themeStore'

interface TopBarProps {
  loading:           boolean
  ultimaAtualizacao: Date | null
  onRefetch:         () => void
  pageTitle:         string
  pageSubtitle?:     string
}

export function TopBar({ loading, ultimaAtualizacao, onRefetch, pageTitle, pageSubtitle }: TopBarProps) {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <header className="px-6 py-4 flex items-center justify-between border-b border-border-dark">
      {/* Título + breadcrumb */}
      <div>
        <h2 className="text-base font-bold text-text-primary leading-tight">{pageTitle}</h2>
        {pageSubtitle && (
          <p className="text-[11px] text-text-muted mt-0.5">{pageSubtitle}</p>
        )}
      </div>

      {/* Controles direita */}
      <div className="flex items-center gap-3">
        {ultimaAtualizacao && !loading && (
          <span className="text-[11px] text-text-muted hidden sm:block">
            Atualizado às{' '}
            <span className="text-text-primary font-medium">{formatHora(ultimaAtualizacao)}</span>
          </span>
        )}

        {/* Toggle de tema */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-surface border border-border-dark text-text-muted hover:text-accent-cyan hover:border-accent-cyan transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onRefetch}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-dark text-xs text-text-muted hover:text-text-primary hover:border-accent-cyan transition-colors disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="sm" inline /> : <RefreshCw className="w-3.5 h-3.5" />}
          Atualizar
        </button>
      </div>
    </header>
  )
}
