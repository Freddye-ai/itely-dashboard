/**
 * Serviço de dados — fetch do SharePoint + parse do Excel + normalização.
 * Executa na ordem definida no CLAUDE.md §2.3.
 */

import axios from 'axios'
import * as XLSX from 'xlsx'
import type { VendaRow } from '../types'
import { parseDateBR, parseExcelSerial, toMesAno } from '../utils/dateHelpers'

// Em desenvolvimento: Vite proxy redireciona /sharepoint → SharePoint
// Em produção (Vercel): chama a serverless function /api/vendas que faz o proxy server-side
const SHAREPOINT_PATH = import.meta.env.DEV
  ? '/sharepoint/personal/freddye_pontes_financebrazil_com_br/_layouts/15/download.aspx?share=ESTcqHKRuYlAtY8DXtxqms8BSoS27C0ML1CxsoUCf24pyg'
  : '/api/vendas'
// NOTA: a URL real do SharePoint está armazenada como variável de ambiente SHAREPOINT_URL
// na Vercel — nunca é exposta no código público

// Colunas obrigatórias — se ausentes, lança erro descritivo
const COLUNAS_OBRIGATORIAS = ['DTSAIDA', 'VLVENDA']

/**
 * Resolve o valor de uma coluna tentando múltiplos aliases possíveis.
 * Retorna o primeiro que existir e não for vazio.
 */
function resolveCol(raw: Record<string, unknown>, ...aliases: string[]): unknown {
  for (const alias of aliases) {
    const val = raw[alias]
    if (val !== undefined && val !== null && val !== '') return val
  }
  return ''
}

// Timeout da requisição em ms (30s para arquivos grandes)
const REQUEST_TIMEOUT_MS = 30_000

// ---------------------------------------------------------------------------
// Mapeamento de filial
// ---------------------------------------------------------------------------

function getFilialName(codFilial: string): 'BIALITA' | 'GRIT' | 'DESCONHECIDA' {
  if (codFilial.includes('1')) return 'BIALITA'
  if (codFilial.includes('2')) return 'GRIT'
  return 'DESCONHECIDA'
}

// ---------------------------------------------------------------------------
// Mapeamento de grupos de produto
// ---------------------------------------------------------------------------

// Itens mais específicos primeiro para evitar falso-positivo
const GRUPO_MAP: [string, string][] = [
  ['COLORITA',      'Colorita (Kit Coloração)'],
  ['ONDA SOFT',     'Onda Soft'],
  ['PROSHAPE',      'ProShape'],
  ['SHAMPOO',       'Shampoo'],
  ['MASCARA',       'Máscara'],
  ['MAGIC WATER',   'Máscara'],
  ['CONDICIONADOR', 'Condicionador'],
  ['FINALIZADOR',   'Finalizador'],
  ['CREME',         'Creme'],
  ['OLEO',          'Óleo'],
  ['SERUM',         'Óleo'],
]

function getGrupo(descricao: string): string {
  if (!descricao) return 'Outros'
  const upper = descricao.toUpperCase()
  for (const [key, label] of GRUPO_MAP) {
    if (upper.includes(key)) return label
  }
  return 'Outros'
}

// ---------------------------------------------------------------------------
// Fetch com retry manual
// ---------------------------------------------------------------------------

async function fetchWithRetry<T>(
  url: string,
  options: object,
  retries = 1,
): Promise<T> {
  try {
    const res = await axios.get<T>(url, options)
    return res.data
  } catch (err) {
    if (retries > 0) {
      console.warn('[dataService] Falha na requisição, tentando novamente...')
      return fetchWithRetry<T>(url, options, retries - 1)
    }
    throw err
  }
}

// Tipo serializado recebido da API (dtsaida como string ISO)
interface VendaRowJSON {
  dtsaida:     string
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

// ---------------------------------------------------------------------------
// Normalização de uma linha bruta
// ---------------------------------------------------------------------------

function normalizarLinha(raw: Record<string, unknown>, index: number): VendaRow | null {
  // --- DTSAIDA ---
  let dtsaida: Date
  const rawDate = raw['DTSAIDA']

  if (rawDate === undefined || rawDate === null || rawDate === '') {
    console.warn(`[dataService] DTSAIDA ausente na linha ${index} — linha descartada`)
    return null
  }

  if (typeof rawDate === 'number') {
    dtsaida = parseExcelSerial(rawDate)
  } else {
    const str = String(rawDate).trim()
    dtsaida = parseDateBR(str)
  }

  if (isNaN(dtsaida.getTime())) {
    console.warn(`[dataService] Data inválida na linha ${index}: "${rawDate}" — linha descartada`)
    return null
  }

  // --- Campos numéricos ---
  const parseNum = (val: unknown, col: string): number => {
    if (val === undefined || val === null || val === '') return 0
    const num = parseFloat(String(val))
    if (isNaN(num)) {
      console.warn(`[dataService] NaN na linha ${index}, coluna ${col}: "${val}"`)
      return 0
    }
    return num
  }

  const vlvenda     = parseNum(raw['VLVENDA'],     'VLVENDA')
  const vlcustoreal = parseNum(raw['VLCUSTOREAL'], 'VLCUSTOREAL')
  const qtvenda     = parseNum(raw['QTVENDA'],     'QTVENDA')

  // --- Campos de texto ---
  const strUp = (val: unknown): string => String(val ?? '').trim().toUpperCase()
  const descricao   = strUp(resolveCol(raw, 'DESCRICAO', 'DESC', 'PRODUTO', 'NMPRODUTO'))
  const nomecliente = strUp(resolveCol(raw, 'NOMECLIENTE', 'CLIENTE', 'NMCLIENTE', 'NOME_CLIENTE', 'NOME CLIENTE'))
  const uf          = strUp(resolveCol(raw, 'UF', 'ESTADO', 'SIGLAESTADO'))
  const municipio   = strUp(resolveCol(raw, 'MUNICIPIO', 'MUNICÍPIO', 'MUNICENT', 'CIDADE', 'NMMUNICIPIO', 'MUNICIPENT'))
  const codfilial   = String(resolveCol(raw, 'CODFILIAL', 'COD_FILIAL', 'FILIAL') ?? '').trim()

  // --- Campos derivados ---
  const filial = getFilialName(codfilial)
  const grupo  = getGrupo(descricao)
  const mesAno = toMesAno(dtsaida)

  return {
    dtsaida,
    codfilial,
    vlvenda,
    vlcustoreal,
    qtvenda,
    descricao,
    nomecliente,
    uf,
    municipio,
    filial,
    grupo,
    mesAno,
  }
}

// ---------------------------------------------------------------------------
// Função pública principal
// ---------------------------------------------------------------------------

/**
 * Faz o fetch do arquivo Excel no SharePoint, faz o parse e normaliza os dados.
 * Executa com retry automático (1 tentativa extra em caso de falha de rede).
 */
export async function fetchVendas(): Promise<VendaRow[]> {
  console.info('[dataService] Iniciando fetch...')

  // Em produção a API já retorna JSON parseado; em DEV ainda usa o proxy Excel
  if (!import.meta.env.DEV) {
    const rows = await fetchWithRetry<VendaRowJSON[]>(SHAREPOINT_PATH, {
      responseType: 'json',
      timeout: REQUEST_TIMEOUT_MS,
    })

    // Converte dtsaida string ISO → Date
    const vendas: VendaRow[] = rows.map((r) => ({
      ...r,
      dtsaida: new Date(r.dtsaida),
    }))

    console.info(`[dataService] ${vendas.length} linhas recebidas da API`)
    return vendas
  }

  // --- Modo DEV: parse local do Excel via proxy Vite ---
  console.info('[dataService] Modo DEV — parse local do Excel')
  const buffer = await fetchWithRetry<ArrayBuffer>(SHAREPOINT_PATH, {
    responseType: 'arraybuffer',
    timeout: REQUEST_TIMEOUT_MS,
  })

  console.info('[dataService] Dados recebidos, iniciando parse...')

  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('[dataService] Arquivo Excel sem sheets.')

  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (rawRows.length === 0) {
    console.warn('[dataService] Sheet vazia — nenhum dado retornado.')
    return []
  }

  const colunasPrimeira = Object.keys(rawRows[0])
  console.info('[dataService] Colunas encontradas no Excel:', colunasPrimeira)
  const faltando = COLUNAS_OBRIGATORIAS.filter((c) => !colunasPrimeira.includes(c))
  if (faltando.length > 0) {
    throw new Error(`Colunas obrigatórias ausentes: ${faltando.join(', ')}`)
  }

  const vendas: VendaRow[] = []
  for (let i = 0; i < rawRows.length; i++) {
    const row = normalizarLinha(rawRows[i], i + 2)
    if (row !== null) vendas.push(row)
  }

  console.info(`[dataService] Parse concluído: ${vendas.length} linhas válidas de ${rawRows.length} totais.`)
  return vendas
}
