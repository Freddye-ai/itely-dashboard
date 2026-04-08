export interface VendaRow {
  dtsaida:     Date
  codfilial:   string
  vlvenda:     number
  vlcustoreal: number
  qtvenda:     number
  descricao:   string
  nomecliente: string
  uf:          string
  municipio:   string
  filial:      'BIALITA' | 'GRIT' | 'DESCONHECIDA'
  grupo:       string
  mesAno:      string
}

export interface FilterState {
  // Todos os filtros suportam múltipla seleção (array vazio = todos)
  mes:    number[]
  ano:    number[]
  filial: string[]
  uf:     string[]
  grupo:  string[]
  cliente: string[]
}

export interface KpiData {
  receitaBialita:      number
  receitaGrit:         number
  receitaTotal:        number
  receitaMesAnterior:  number | null
  momPercent:          number | null
  momBialita:          number | null
  totalUnidades:       number
  margemBruta:         number
}

export interface DadosMes {
  mesAno:       string
  label:        string
  bialita:      number
  grit:         number
  total:        number
  unidades:     number
  lucroTotal:   number
  lucroBialita: number
  lucroGrit:    number
  margem:       number
}

export interface DadosRegiao {
  regiao:       string
  receita:      number
  lucro:        number
  unidades:     number
  margem:       number
  participacao: number
  ufs:          string[]
}

export interface DadosGrupo {
  grupo:        string
  receita:      number
  unidades:     number
  lucro:        number
  margem:       number
  participacao: number
}

export interface DadosCliente {
  nomecliente:  string
  receita:      number
  unidades:     number
  lucro:        number
  margem:       number
  participacao: number
}

export interface DadosUF {
  uf:           string
  receita:      number
  unidades:     number
  lucro:        number
  margem:       number
  participacao: number
}

export interface DadosMunicipio {
  municipio:    string
  uf:           string
  receita:      number
  unidades:     number
  lucro:        number
  margem:       number
  participacao: number
}
