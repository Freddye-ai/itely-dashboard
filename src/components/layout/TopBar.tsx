import { RefreshCw } from 'lucide-react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { formatHora } from '../../utils/formatters'

interface TopBarProps {
  loading:           boolean
  ultimaAtualizacao: Date | null
  onRefetch:         () => void
  pageTitle:         string
  pageSubtitle?:     string
}

export function TopBar({ loading, ultimaAtualizacao, onRefetch, pageTitle, pageSubtitle }: TopBarProps) {
  return (
    <header className="px-6 py-4 flex items-center justify-between">
      {/* Título + breadcrumb */}
      <div>
        <h2 className="text-base font-bold text-white leading-tight">{pageTitle}</h2>
        {pageSubtitle && (
          <p className="text-[11px] text-text-muted mt-0.5">{pageSubtitle}</p>
        )}
      </div>

      {/* Refresh + timestamp */}
      <div className="flex items-center gap-3">
        {ultimaAtualizacao && !loading && (
          <span className="text-[11px] text-text-muted hidden sm:block">
            Atualizado às <span className="text-white font-medium">{formatHora(ultimaAtualizacao)}</span>
          </span>
        )}
        <button
          onClick={onRefetch}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-dark text-xs text-text-muted hover:text-white hover:border-accent-cyan transition-colors disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="sm" inline /> : <RefreshCw className="w-3.5 h-3.5" />}
          Atualizar
        </button>
      </div>
    </header>
  )
}
