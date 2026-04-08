import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  onRetry?: () => void
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorCard message={this.state.message} onRetry={this.handleRetry} />
      )
    }
    return this.props.children
  }
}

// Componente funcional para uso direto (sem captura de erro JS)
interface ErrorCardProps {
  message: string
  onRetry?: () => void
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[200px] p-8">
      <div className="flex items-center gap-3 text-accent-red">
        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-surface border border-border-dark text-sm text-text-muted hover:text-white hover:border-accent-cyan transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      )}
    </div>
  )
}
