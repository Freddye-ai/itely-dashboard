import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

interface MultiSelectProps {
  label:         string
  options:       string[]
  selected:      string[]
  onChange:      (values: string[]) => void
  optionLabels?: Record<string, string>   // exibe label customizado por value
}

export function MultiSelect({ label, options, selected, onChange, optionLabels }: MultiSelectProps) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getLabel = (val: string) => optionLabels?.[val] ?? val

  const filtered    = options.filter((o) => getLabel(o).toLowerCase().includes(search.toLowerCase()))
  const allSelected = selected.length === options.length && options.length > 0
  const hasSelected = selected.length > 0

  // Label resumido quando há seleção: mostra os labels separados por ", " se couber
  const selectedLabel = hasSelected
    ? selected.length <= 3
      ? selected.map(getLabel).join(', ')
      : `${selected.length} selecionados`
    : label

  function toggle(val: string) {
    if (selected.includes(val)) onChange(selected.filter((s) => s !== val))
    else onChange([...selected, val])
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange([])
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={[
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all whitespace-nowrap max-w-[200px]',
          hasSelected
            ? 'bg-accent-cyan/10 border-accent-cyan/50 text-accent-cyan'
            : 'bg-bg-surface border-border-dark text-text-muted hover:text-white hover:border-accent-cyan/30',
        ].join(' ')}
      >
        <span className="truncate">{selectedLabel}</span>
        {hasSelected && (
          <X className="w-3 h-3 hover:opacity-70 flex-shrink-0" onClick={clear} />
        )}
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 z-50 bg-bg-card border border-border-dark rounded-xl shadow-2xl w-56 overflow-hidden">
          {options.length > 6 && (
            <div className="p-2 border-b border-border-dark">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-bg-surface border border-border-dark rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-text-muted/40 focus:outline-none focus:border-accent-cyan transition-colors"
              />
            </div>
          )}

          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-surface border-b border-border-dark/50 group"
            onClick={() => onChange(allSelected ? [] : [...options])}
          >
            <Checkbox checked={allSelected} />
            <span className="text-xs text-text-muted group-hover:text-white transition-colors">
              {allSelected ? 'Limpar todos' : 'Selecionar todos'}
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-text-muted/50 text-center">Nenhum resultado</p>
            ) : (
              filtered.map((opt) => {
                const checked = selected.includes(opt)
                return (
                  <div
                    key={opt}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-bg-surface group"
                    onClick={() => toggle(opt)}
                  >
                    <Checkbox checked={checked} />
                    <span className={`text-xs truncate transition-colors ${checked ? 'text-white font-medium' : 'text-text-muted group-hover:text-white'}`}>
                      {getLabel(opt)}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {hasSelected && (
            <div className="px-3 py-1.5 border-t border-border-dark/50 flex justify-between items-center">
              <span className="text-[10px] text-text-muted/50">{selected.length} selecionado(s)</span>
              <button onClick={() => onChange([])} className="text-[10px] text-accent-cyan hover:underline">
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={[
      'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all',
      checked ? 'bg-accent-cyan border-accent-cyan' : 'border-border-dark',
    ].join(' ')}>
      {checked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
    </div>
  )
}
