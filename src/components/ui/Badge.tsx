interface BadgeProps {
  children: React.ReactNode
  variant?: 'cyan' | 'emerald' | 'red' | 'yellow' | 'muted'
}

const variantMap = {
  cyan:    'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30',
  emerald: 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30',
  red:     'bg-accent-red/15 text-accent-red border border-accent-red/30',
  yellow:  'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30',
  muted:   'bg-text-muted/15 text-text-muted border border-text-muted/30',
}

export function Badge({ children, variant = 'muted' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantMap[variant]}`}>
      {children}
    </span>
  )
}
