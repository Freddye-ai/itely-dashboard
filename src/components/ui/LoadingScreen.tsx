import { useEffect, useState } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

export function LoadingScreen() {
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const mensagem =
    segundos < 5  ? 'Carregando dados...' :
    segundos < 10 ? 'Buscando informações...' :
    segundos < 20 ? 'Processando...' :
                    'Quase lá, aguarde...'

  return (
    <div className="flex flex-col items-center justify-center gap-6 min-h-[400px]">
      {/* Logo cliente */}
      <img
        src="/itely_logo_lg.png"
        alt="Itely Hair Fashion"
        className="h-52 object-contain drop-shadow-lg"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />

      <LoadingSpinner size="lg" />

      <div className="text-center space-y-1">
        <p className="text-text-muted text-sm">{mensagem}</p>
        <p className="text-text-muted/40 text-xs">{segundos}s</p>
      </div>

      {/* Skeleton dos KPI cards */}
      <div className="w-full max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 mt-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="bg-bg-card border border-border-dark rounded-xl p-4 space-y-3 animate-pulse"
          >
            <div className="h-2 bg-bg-surface rounded w-3/4" />
            <div className="h-6 bg-bg-surface rounded w-1/2" />
            <div className="h-2 bg-bg-surface rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Powered by — logo do desenvolvedor */}
      <div className="flex items-center gap-2 mt-2 opacity-40 hover:opacity-70 transition-opacity">
        <span className="text-[10px] text-text-muted uppercase tracking-widest">Desenvolvido por</span>
        <img
          src="/finance-brazil-logo-white-DMrqfvyl.png"
          alt="Desenvolvedor"
          className="h-5 object-contain brightness-0 invert"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>
    </div>
  )
}
