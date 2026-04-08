# CLAUDE.md — Dashboard Comercial VIP · Italy Hair Fashion

> Arquivo de contexto para o agente de IA (Claude Code). Leia este arquivo inteiro antes de escrever qualquer código.

---

## 1. Visão Geral do Projeto

| Campo | Valor |
|---|---|
| **Nome** | Dashboard Comercial VIP – Italy Hair Fashion |
| **Tipo** | SPA (Single Page Application) |
| **Stack** | React 18 + Vite 5 + Tailwind CSS 3 |
| **Idioma do código** | TypeScript (preferência) ou JavaScript |
| **Tema visual** | Dark Mode – estética "dashboard financeiro neon" |
| **Fonte de dados** | Excel (.xlsx) via link de download direto do SharePoint |
| **Tabela principal** | `fVendas` |

---

## 2. Fonte de Dados

### 2.1 Link e Formato

```
SHAREPOINT_URL = "https://financebrazil-my.sharepoint.com/personal/freddye_pontes_financebrazil_com_br/_layouts/15/download.aspx?share=ESTcqHKRuYlAtY8DXtxqms8BSoS27C0ML1CxsoUCf24pyg"
```

- Formato do arquivo: **Excel (.xlsx)**
- Libraries para parsing: `xlsx` (SheetJS) + `axios`
- O fetch deve ocorrer **no mount da aplicação** e a cada **2 horas** via `setInterval`

> ⚠️ **CORS em desenvolvimento:** configurar proxy no `vite.config.ts`:
> ```ts
> server: {
>   proxy: {
>     '/sharepoint': {
>       target: 'https://financebrazil-my.sharepoint.com',
>       changeOrigin: true,
>       rewrite: (path) => path.replace(/^\/sharepoint/, '')
>     }
>   }
> }
> ```
> Em produção, se CORS persistir, usar Azure Function ou proxy reverso como intermediário.

### 2.2 Colunas Esperadas na Tabela `fVendas`

| Coluna | Tipo | Descrição |
|---|---|---|
| `DTSAIDA` | Date (string `dd/mm/yyyy` ou serial numérico Excel) | Data da venda |
| `CODFILIAL` | string | Código da filial (`"1"` ou `"2"`) |
| `VLVENDA` | number | Valor bruto da venda |
| `VLCUSTOREAL` | number | Custo real da venda |
| `QTVENDA` | number | Quantidade vendida |
| `DESCRICAO` | string | Descrição do produto |
| `NOMECLIENTE` | string | Nome do cliente |
| `UF` | string | Estado (sigla) |
| `MUNICIPIO` | string | Município |

> **Atenção:** Tratar valores nulos/undefined como `0` em todos os cálculos numéricos. Nunca deixar `NaN` vazar para a UI.

### 2.3 Serviço de Dados (`src/services/dataService.ts`)

```ts
// Estrutura esperada do módulo
export async function fetchVendas(): Promise<VendaRow[]>

// Responsabilidades (executar nesta ordem):
// 1. axios.get(SHAREPOINT_URL, {
//      responseType: 'arraybuffer',
//      timeout: 15000,          // abortar após 15s
//    })
//    → em caso de falha de rede, tentar 1 retry automático antes de lançar erro
//
// 2. Validar colunas obrigatórias: se 'DTSAIDA' ou 'VLVENDA' não existirem
//    na sheet, lançar: new Error('Colunas obrigatórias ausentes: DTSAIDA, VLVENDA')
//
// 3. XLSX.read(buffer, { type: 'array', cellDates: false })
//    → parse da primeira sheet
//
// 4. XLSX.utils.sheet_to_json() → array de objetos brutos
//
// 5. Normalizar cada linha:
//    - DTSAIDA: pode chegar como string 'dd/mm/yyyy' OU número serial Excel
//      → se typeof === 'number': usar XLSX.SSF.parse_date_code(serial)
//      → se string: split('/') e new Date(y, m-1, d)
//      → nunca usar new Date(string) diretamente (ambíguo entre timezones)
//    - VLVENDA, VLCUSTOREAL, QTVENDA: parseFloat(val) || 0
//      → logar aviso no console para cada NaN encontrado:
//        console.warn(`[dataService] NaN na linha ${i}, coluna ${col}: "${val}"`)
//    - DESCRICAO, NOMECLIENTE, UF, MUNICIPIO: String(val ?? '').trim().toUpperCase()
//    - CODFILIAL: String(val ?? '').trim()
//
// 6. Adicionar campos derivados:
//    - filial:  getFilialName(codfilial)
//    - grupo:   getGrupo(descricao)
//    - mesAno:  `${dtsaida.getFullYear()}-${String(dtsaida.getMonth()+1).padStart(2,'0')}`
//
// 7. Retornar VendaRow[]
```

**Retry manual (sem biblioteca):**
```ts
async function fetchWithRetry(url: string, options: object, retries = 1): Promise<ArrayBuffer> {
  try {
    const res = await axios.get(url, options)
    return res.data
  } catch (err) {
    if (retries > 0) return fetchWithRetry(url, options, retries - 1)
    throw err
  }
}
```

---

## 3. Regras de Negócio (Equivalente DAX → JavaScript)

### 3.1 Métricas Base

```
Receita Bruta    = Σ VLVENDA
Unidades         = Σ QTVENDA
Lucro Bruto      = Σ (VLVENDA - VLCUSTOREAL)   [linha a linha]
Margem Bruta (%) = Lucro Bruto / Receita Bruta
```

**Casos de borda obrigatórios:**

| Situação | Tratamento |
|---|---|
| `VLVENDA` negativo (devolução) | Incluir no cálculo — margem pode ser negativa, isso é informação válida |
| `VLCUSTOREAL = 0` | Margem = 100% — exibir badge amarelo de aviso `"Custo não informado"` no card |
| `VLVENDA = 0` e `QTVENDA > 0` | Incluir na contagem de unidades; excluir do cálculo de margem (divisão por zero) |
| Linha com todos os campos numéricos zerados | Incluir na contagem total, ignorar na margem |
| `Receita Bruta = 0` no denominador da margem | Retornar `0` — nunca `Infinity` ou `NaN` |

### 3.2 Time Intelligence — Variação Mês a Mês (MoM)

```
período atual    = max(DTSAIDA).getMonth() + max(DTSAIDA).getFullYear()
período anterior = período atual - 1 mês (respeitar virada de ano: jan → dez do ano anterior)

MoM (%) = (Receita Atual - Receita Anterior) / Receita Anterior
```

**Casos de borda:**
```ts
// Sem dados no mês anterior:
if (!receitaAnterior || receitaAnterior === 0) {
  return { valor: null, exibir: '—' }
  // tooltip: "Sem dados no período anterior para comparação"
}

// Exibir com ícone de tendência:
// ▲ accent-cyan  se MoM > 0
// ▼ accent-red   se MoM < 0
// —              se MoM === null (sem período anterior)
```

### 3.3 Lógica de Filial (Switch)

```ts
function getFilialName(codFilial: string): 'BIALITA' | 'GRIT' | 'DESCONHECIDA' {
  if (codFilial.includes('1')) return 'BIALITA'
  if (codFilial.includes('2')) return 'GRIT'
  return 'DESCONHECIDA'
}
```

### 3.4 Lógica de Grupos (Busca por String em `DESCRICAO`)

> **Regra de ordem:** itens mais específicos (múltiplas palavras) devem vir **antes** dos genéricos para evitar falso-positivo. A busca é por `includes` parcial — `"SHAMPOO TRATAMENTO"` corretamente cai em `Shampoo`.

```ts
const GRUPO_MAP: [string, string][] = [
  // específicos primeiro
  ['COLORITA',      'Colorita (Kit Coloração)'],
  ['ONDA SOFT',     'Onda Soft'],
  ['PROSHAPE',      'ProShape'],
  // genéricos depois
  ['SHAMPOO',       'Shampoo'],
  ['MASCARA',       'Máscara'],
  ['CONDICIONADOR', 'Condicionador'],
  ['FINALIZADOR',   'Finalizador'],
  ['CREME',         'Creme'],
  ['OLEO',          'Óleo'],
]

function getGrupo(descricao: string): string {
  if (!descricao) return 'Outros'
  const upper = descricao.toUpperCase()
  for (const [key, label] of GRUPO_MAP) {
    if (upper.includes(key)) return label
  }
  return 'Outros'   // nunca retorna undefined
}
```

---

## 4. Arquitetura de Pastas

```
src/
├── assets/
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Filtros globais + botão Atualizar
│   │   └── TabNav.tsx          # Navegação por abas (reseta filtros locais)
│   ├── kpi/
│   │   ├── KpiCard.tsx         # Card genérico de KPI
│   │   └── KpiRow.tsx          # Linha de KPIs
│   ├── charts/
│   │   ├── BarChartMensal.tsx  # Receita por mês (2024 vs 2025)
│   │   └── BarChartGrupos.tsx  # Top grupos por receita
│   ├── tabs/
│   │   ├── DashboardGeral.tsx
│   │   ├── AnaliseClientes.tsx
│   │   ├── AnaliseGeografica.tsx
│   │   └── TabelaAnalitica.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   └── useVendas.ts            # fetch + intervalo 2h + estado + loading/error
├── services/
│   └── dataService.ts          # Fetch + parse do SharePoint
├── store/
│   └── filterStore.ts          # Zustand — filtros globais e locais
├── types/
│   └── index.ts                # VendaRow, KpiData, FilterState, etc.
├── utils/
│   ├── metrics.ts              # Todas as funções de agregação (useMemo-friendly)
│   ├── formatters.ts           # formatCurrency, formatPercent, formatNumber
│   └── dateHelpers.ts          # parseDateBR, parseExcelSerial, getPreviousMonth
├── App.tsx
├── main.tsx
└── index.css
```

---

## 5. Paleta de Cores e Tema

```css
/* Cores base — adicionar ao tailwind.config.js (extend > colors) */
--bg-page:    #0f172a   /* fundo da página */
--bg-card:    #1e293b   /* fundo dos cards */
--bg-surface: #273548   /* superfícies elevadas */
--accent-cyan:    #22d3ee   /* ciano neon (positivos, destaques) */
--accent-emerald: #10b981   /* esmeralda (receita total, gráficos) */
--accent-red:     #f87171   /* negativo / alerta */
--text-primary:   #f1f5f9
--text-muted:     #94a3b8
--border:         #334155
```

> Configurar no `tailwind.config.js` em `theme.extend.colors` para uso como classes utilitárias (`bg-bg-card`, `text-accent-cyan`, etc.).

---

## 6. Estrutura da Interface

### 6.1 Header — Filtros Globais e Atualização

```
[ Período: Mês ▾ ]  [ Ano: 2025 ▾ ]  [ Filial: Todas ▾ ]  [ Estado: Todos ▾ ]  [ Grupo: Todos ▾ ]
                                                          [ ↻ Atualizar ]  Atualizado às 14:32
```

**Comportamento dos filtros:**
- `Período`, `Ano` e `Filial` são **filtros globais** — persistem ao trocar de aba
- `Estado` e `Grupo` são **filtros locais** — resetam para `"Todos"` ao trocar de aba
- `Estado` e `Município` são independentes — filtrar por UF não limpa o município automaticamente
- Alterar qualquer filtro **re-calcula todos os `useMemo`** imediatamente
- Ordem de aplicação dos filtros: `Ano → Mês → Filial → UF → Grupo`

**Botão Atualizar:**
- Chama `fetchData()` diretamente (mesmo que o intervalo automático não tenha chegado)
- Exibe `LoadingSpinner` inline durante o fetch
- Após conclusão, atualiza o texto `"Atualizado às HH:MM"`

### 6.2 Linha de KPIs (7 Cards)

| # | Card | Detalhe |
|---|---|---|
| 1 | Faturamento BIALITA | Receita filtrada por `CODFILIAL = '1'` |
| 2 | Faturamento GRIT | Receita filtrada por `CODFILIAL = '2'` |
| 3 | Faturamento Total | Soma das duas filiais |
| 4 | Variação MoM | `%` vs mês anterior com ícone ▲/▼ — exibe `"—"` se sem período anterior |
| 5 | Variação MoM BIALITA | Variação por filial (mesmo tratamento do card 4) |
| 6 | Total Unidades Vendidas | `Σ QTVENDA` |
| 7 | Margem Bruta Média | `Lucro Bruto / Receita Bruta` em `%` |

### 6.3 Abas de Conteúdo

#### Aba 1 — Dashboard Geral

**Gráfico de Barras Agrupadas — Receita por Mês:**
- Série 2024: cor `#22d3ee` (ciano) | Série 2025: cor `#10b981` (esmeralda) — cores fixas, nunca inverter
- Eixo Y formatado como `R$ 10k` / `R$ 100k` (abreviado) — nunca valor bruto longo
- Tooltip ao hover: `R$ 1.234,56 · 42 un.`
- Estado vazio: placeholder centralizado `"Sem dados para o período"` dentro da área do gráfico — não sumir o componente
- `<ResponsiveContainer width="100%" height={300}>` — altura fixa, largura fluida

**Gráfico de Barras Horizontais — Top Grupos por Receita:**
- Barras na cor `#10b981` (esmeralda), ordenadas decrescente
- Mesmas regras de tooltip e estado vazio do gráfico acima

#### Aba 2 — Análise de Clientes

- Tabela: **Top 10 Clientes** por faturamento
- Colunas: `Rank | Cliente | Receita Bruta | Unidades | MB%`
- Destacar o 1º colocado com badge neon `accent-cyan`
- **Ordenação clicável** por coluna — ícone `ChevronUp/ChevronDown` ao lado do header ativo; clicar coluna já ordenada inverte a direção
- Estado vazio: linha única centralizada `"Nenhum dado encontrado"` com `text-text-muted`
- Sem paginação (dataset esperado: máx ~500 linhas)

#### Aba 3 — Análise Geográfica

- **Tabela por UF:** Estado | Receita | Unidades | MB%
- **Tabela por Município:** Município | UF | Receita | Participação %
- Mesmas regras de ordenação e estado vazio da Aba 2

#### Aba 4 — Tabela Analítica (Coleção)

- Colunas: `Grupo | Receita Bruta | Unidades | Lucro Bruto | MB%`
- Ordenação clicável por coluna (ícones `lucide-react`: `ChevronUp / ChevronDown`)
- Linha de totais fixada no rodapé: `bg-bg-surface font-semibold border-t border-border-dark`

**Larguras sugeridas para todas as tabelas:**

| Coluna | Largura |
|---|---|
| Rank / índice | `w-12` |
| Valores numéricos | `w-32` |
| Nome / Descrição | `flex-1` |

---

## 7. Contrato de Tipos (`src/types/index.ts`)

```ts
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
  // campos derivados (adicionados no parse)
  filial:      'BIALITA' | 'GRIT' | 'DESCONHECIDA'
  grupo:       string
  mesAno:      string   // 'YYYY-MM' para facilitar agrupamento
}

export interface FilterState {
  // Globais — persistem entre abas
  mes:    number | null   // 1-12 | null = todos
  ano:    number | null
  filial: string | null   // 'BIALITA' | 'GRIT' | null
  // Locais — resetam ao trocar de aba
  uf:     string | null
  grupo:  string | null
}

export interface KpiData {
  receitaBialita: number
  receitaGrit:    number
  receitaTotal:   number
  momPercent:     number | null   // null = sem período anterior
  totalUnidades:  number
  margemBruta:    number
}
```

---

## 8. Store de Filtros e Atualização de Dados

### 8.1 Zustand Store (`src/store/filterStore.ts`)

```ts
import { create } from 'zustand'

interface FilterStore {
  // Filtros globais (persistem entre abas)
  ano:    number        // default: new Date().getFullYear()
  mes:    number | null // null = todos os meses
  filial: string | null // null = todas as filiais

  // Filtros locais (resetam ao trocar de aba)
  uf:     string | null
  grupo:  string | null

  // Ações
  setFiltroGlobal: (key: 'ano' | 'mes' | 'filial', value: number | string | null) => void
  setFiltroLocal:  (key: 'uf' | 'grupo', value: string | null) => void
  resetFiltrosLocais: () => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  ano:    new Date().getFullYear(),
  mes:    null,
  filial: null,
  uf:     null,
  grupo:  null,

  setFiltroGlobal: (key, value) => set((s) => ({ ...s, [key]: value })),
  setFiltroLocal:  (key, value) => set((s) => ({ ...s, [key]: value })),
  resetFiltrosLocais: () => set((s) => ({ ...s, uf: null, grupo: null })),
}))
```

> **Regra:** `resetFiltrosLocais()` deve ser chamado **apenas** no `onChange` do `TabNav` — nunca dentro de componentes de aba.

### 8.2 Atualização Automática (`src/hooks/useVendas.ts`)

```ts
const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000 // 2 horas

export function useVendas() {
  const [dados, setDados] = useState<VendaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchVendas()
      setDados(rows)
      setUltimaAtualizacao(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [fetchData])

  return { dados, loading, error, ultimaAtualizacao, refetch: fetchData }
}
```

---

## 9. Performance — Estratégia de `useMemo`

```ts
// src/hooks/useVendas.ts (continuação)

const dadosFiltrados = useMemo(
  () => aplicarFiltros(dados, filtros),
  [dados, filtros]
)

const kpis = useMemo(
  () => calcularKpis(dadosFiltrados, dados),   // 'dados' raw para MoM
  [dadosFiltrados, dados]
)

const dadosPorMes = useMemo(
  () => agruparPorMes(dadosFiltrados),
  [dadosFiltrados]
)

const dadosPorGrupo = useMemo(
  () => agruparPorGrupo(dadosFiltrados),
  [dadosFiltrados]
)

const topClientes = useMemo(
  () => calcularTopClientes(dadosFiltrados, 10),
  [dadosFiltrados]
)

const dadosPorUF = useMemo(
  () => agruparPorUF(dadosFiltrados),
  [dadosFiltrados]
)
```

> **Regra:** nenhum cálculo de agregação deve ocorrer dentro de componentes de renderização. Toda lógica fica em `utils/metrics.ts` e é chamada via `useMemo`.

---

## 10. Dependências (`package.json`)

```json
{
  "dependencies": {
    "react":          "^18.3.0",
    "react-dom":      "^18.3.0",
    "axios":          "^1.7.0",
    "xlsx":           "^0.18.5",
    "recharts":       "^2.12.0",
    "lucide-react":   "^0.383.0",
    "zustand":        "^4.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite":                 "^5.3.0",
    "tailwindcss":          "^3.4.0",
    "postcss":              "^8.4.0",
    "autoprefixer":         "^10.4.0",
    "typescript":           "^5.5.0",
    "@types/react":         "^18.3.0",
    "@types/react-dom":     "^18.3.0"
  }
}
```

---

## 11. Configuração Inicial (`tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-page':        '#0f172a',
        'bg-card':        '#1e293b',
        'bg-surface':     '#273548',
        'accent-cyan':    '#22d3ee',
        'accent-emerald': '#10b981',
        'accent-red':     '#f87171',
        'text-muted':     '#94a3b8',
        'border-dark':    '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
```

---

## 12. Ordem de Implementação Recomendada

```
Fase 1 — Fundação
  [ ] Scaffold Vite + React + Tailwind
  [ ] Configurar tailwind.config.js com paleta custom
  [ ] Configurar proxy CORS no vite.config.ts
  [ ] Definir tipos em src/types/index.ts
  [ ] Implementar dataService.ts (fetch + retry + parse + normalização)
  [ ] Implementar utils/metrics.ts (todas as funções puras)
  [ ] Implementar utils/formatters.ts e utils/dateHelpers.ts

Fase 2 — Estado e Filtros
  [ ] Criar filterStore.ts (Zustand) com filtros globais e locais
  [ ] Implementar hook useVendas.ts (fetch + intervalo 2h + useMemo)
  [ ] Testar filtros isoladamente com console.log

Fase 3 — Layout Base
  [ ] App.tsx com estrutura de página (header + conteúdo + abas)
  [ ] Header.tsx com dropdowns de filtro + botão Atualizar + timestamp
  [ ] TabNav.tsx com navegação entre as 4 abas (resetar filtros locais no onChange)
  [ ] LoadingSpinner.tsx e ErrorBoundary.tsx

Fase 4 — KPIs
  [ ] KpiCard.tsx (genérico: título, valor, variação, ícone, badge de aviso)
  [ ] KpiRow.tsx montando os 7 cards

Fase 5 — Gráficos
  [ ] BarChartMensal.tsx (Recharts BarChart agrupado, estado vazio, tooltip)
  [ ] BarChartGrupos.tsx (Recharts BarChart horizontal, estado vazio, tooltip)

Fase 6 — Tabelas
  [ ] TabelaAnalitica.tsx (com ordenação por coluna + linha de totais no rodapé)
  [ ] AnaliseClientes.tsx (Top 10 + badge neon no 1º lugar)
  [ ] AnaliseGeografica.tsx (por UF e Município)

Fase 7 — Polimento
  [ ] Responsividade (grid cols ajustados em sm/md/lg)
  [ ] Animações de entrada nos cards (Tailwind transition)
  [ ] Tratamento de edge cases (dataset vazio, erro de fetch, NaN nos KPIs)
  [ ] Teste de performance com dataset grande (>10k linhas)
```

---

## 13. Convenções de Código

- **Funções de utilidade:** sempre puras, sem side-effects, testáveis isoladamente
- **Componentes:** um arquivo por componente, nomeados em PascalCase
- **Formatação de moeda:** sempre usar `formatCurrency(value)` de `utils/formatters.ts`
- **Datas:** normalizar tudo para objetos `Date` no parse via `dateHelpers.ts`; nunca comparar strings de data; nunca usar `new Date(string)` diretamente
- **Comentários:** em português; código em inglês (nomes de variáveis e funções)
- **`useMemo` é obrigatório** para qualquer cálculo que dependa de `dados` ou `filtros`

---

## 14. Tratamento de Erros

| Cenário | Comportamento esperado |
|---|---|
| URL do SharePoint inválida ou expirada | Exibir `ErrorBoundary` com mensagem amigável e botão "Tentar novamente" |
| Timeout na requisição (>15s) | Mesmo comportamento do erro acima; logar no console |
| Colunas obrigatórias faltando no Excel | Lançar erro descritivo; exibir `ErrorBoundary` |
| Colunas opcionais faltando | Log de aviso no console; assumir valor padrão (`0` ou `''`) |
| Dataset vazio após filtros | Exibir estado vazio em cada seção ("Nenhum dado para o período selecionado") |
| Erro de parsing numérico | `parseFloat(val) || 0` — nunca deixar `NaN` vazar para os cálculos |
| MoM sem período anterior | Exibir `"—"` com tooltip explicativo — nunca `Infinity` ou `NaN` |
| `VLCUSTOREAL = 0` | Exibir badge de aviso amarelo — não bloquear o cálculo |

---

## 15. Checklist Antes de Qualquer Commit

- [ ] Nenhum `NaN` aparece nos KPIs
- [ ] Filtros combinados funcionam corretamente (filial + estado + grupo + período)
- [ ] Filtros locais resetam ao trocar de aba; filtros globais persistem
- [ ] Botão Atualizar funciona e exibe o timestamp correto
- [ ] Intervalo automático de 2h está ativo (verificar com DevTools > Network)
- [ ] Responsivo em 375px (mobile), 768px (tablet) e 1440px (desktop)
- [ ] Sem erros no console do navegador
- [ ] Performance: filtros respondem em < 100ms mesmo com 50k linhas

---

## 16. Notas para o Agente

1. **Sempre começar pelo serviço de dados** — sem dados reais, nenhum componente pode ser validado.
2. **A URL do SharePoint já está configurada na Seção 2.1** — não substituir por placeholder.
3. **CORS em desenvolvimento:** configurar o proxy no `vite.config.ts` conforme Seção 2.1. Se ainda bloquear em produção, orientar o usuário a usar Azure Function como intermediário.
4. **Datas do Excel:** o SheetJS pode retornar datas como número serial (ex: `45678`) — tratar com `XLSX.SSF.parse_date_code()` conforme Seção 2.3.
5. As funções em `utils/metrics.ts` são o coração do sistema — comentar bem cada uma.
6. Recharts requer que os dados estejam no formato `[{ name: 'Jan', bialita: 1000, grit: 800 }]` — transformar nesse formato nos hooks.
7. **`resetFiltrosLocais()`** só deve ser chamado no `TabNav` — nunca duplicar essa chamada em outros lugares.
