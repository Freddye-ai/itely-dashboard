import { useFilterStore } from '../../store/filterStore'
import { MultiSelect } from './MultiSelect'

const MESES_OPTIONS = ['1','2','3','4','5','6','7','8','9','10','11','12']
const MESES_LABELS: Record<string, string> = {
  '1':'Janeiro','2':'Fevereiro','3':'Março','4':'Abril',
  '5':'Maio','6':'Junho','7':'Julho','8':'Agosto',
  '9':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro',
}
const FILIAIS_OPTIONS = ['BIALITA', 'GRIT']

export interface GlobalFiltersProps {
  anosDisponiveis:     number[]
  gruposDisponiveis:   string[]
  ufsDisponiveis:      string[]
  clientesDisponiveis: string[]
}

export function GlobalFilters({ anosDisponiveis, gruposDisponiveis, ufsDisponiveis, clientesDisponiveis }: GlobalFiltersProps) {
  const { ano, mes, filial, grupo, uf, cliente, setFiltro } = useFilterStore()

  const anosOptions = anosDisponiveis.map(String)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Mês — multi */}
      <MultiSelect
        label="Mês"
        options={MESES_OPTIONS}
        selected={mes.map(String)}
        onChange={(v) => setFiltro('mes', v.map(Number))}
        optionLabels={MESES_LABELS}
      />

      {/* Ano — multi */}
      <MultiSelect
        label="Ano"
        options={anosOptions}
        selected={ano.map(String)}
        onChange={(v) => setFiltro('ano', v.map(Number))}
      />

      {/* Filial — multi */}
      <MultiSelect
        label="Filial"
        options={FILIAIS_OPTIONS}
        selected={filial}
        onChange={(v) => setFiltro('filial', v)}
      />

      {/* Grupo — multi */}
      <MultiSelect
        label="Grupo"
        options={gruposDisponiveis}
        selected={grupo}
        onChange={(v) => setFiltro('grupo', v)}
      />

      {/* UF — multi */}
      <MultiSelect
        label="UF"
        options={ufsDisponiveis}
        selected={uf}
        onChange={(v) => setFiltro('uf', v)}
      />

      {/* Cliente — multi */}
      <MultiSelect
        label="Cliente"
        options={clientesDisponiveis}
        selected={cliente}
        onChange={(v) => setFiltro('cliente', v)}
      />
    </div>
  )
}

// Filtros locais (mantido para compatibilidade)
export interface LocalFiltersProps {
  ufsDisponiveis:    string[]
  gruposDisponiveis: string[]
}

export function LocalFilters({ ufsDisponiveis, gruposDisponiveis }: LocalFiltersProps) {
  const { uf, grupo, setFiltro } = useFilterStore()
  return (
    <div className="flex items-center gap-2">
      <MultiSelect label="UF"    options={ufsDisponiveis}    selected={uf}    onChange={(v) => setFiltro('uf', v)} />
      <MultiSelect label="Grupo" options={gruposDisponiveis} selected={grupo} onChange={(v) => setFiltro('grupo', v)} />
    </div>
  )
}

export function AllFilters(props: GlobalFiltersProps) {
  return <GlobalFilters {...props} />
}
