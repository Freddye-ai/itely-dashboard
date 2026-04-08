interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  inline?: boolean
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

export function LoadingSpinner({ size = 'md', inline = false }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`${sizeMap[size]} rounded-full border-border-dark border-t-accent-cyan animate-spin`}
    />
  )

  if (inline) return spinner

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[120px]">
      {spinner}
    </div>
  )
}
