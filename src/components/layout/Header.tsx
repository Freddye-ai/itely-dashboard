import { RefreshCw } from 'lucide-react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { formatHora } from '../../utils/formatters'

interface HeaderProps {
  loading:           boolean
  ultimaAtualizacao: Date | null
  onRefetch:         () => void
}

export function Header({ loading, ultimaAtualizacao, onRefetch }: HeaderProps) {
  return (
    <header className="bg-bg-card border-b border-border-dark px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-accent-cyan tracking-tight">
          Dashboard Comercial VIP
          <span className="text-text-muted font-normal ml-2 text-sm">Italy Hair Fashion</span>
        </h1>

        <div className="flex items-center gap-3">
          {ultimaAtualizacao && !loading && (
            <span className="text-xs text-text-muted">
              Atualizado às{' '}
              <span className="text-white font-medium">{formatHora(ultimaAtualizacao)}</span>
            </span>
          )}
          <button
            onClick={onRefetch}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-dark text-sm text-text-muted hover:text-white hover:border-accent-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner size="sm" inline /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </button>
        </div>
      </div>
    </header>
  )
}
