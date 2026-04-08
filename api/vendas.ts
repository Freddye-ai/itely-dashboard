import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import * as XLSX from 'xlsx'

const SHAREPOINT_URL = process.env.SHAREPOINT_URL ?? ''

// ---------------------------------------------------------------------------
// Helpers (duplicados aqui para rodar em Node.js sem depender de src/)
// ---------------------------------------------------------------------------

function parseDateBR(str: string): Date {
  const parts = str.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(NaN)
}

function parseExcelSerial(serial: number): Date {
  const info = XLSX.SSF.parse_date_code(serial)
  if (!info) return new Date(NaN)
  return new Date(info.y, info.m - 1, info.d)
}

function toMesAno(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getFilialName(cod: string): 'BIALITA' | 'GRIT' | 'DESCONHECIDA' {
  if (cod.includes('1')) return 'BIALITA'
  if (cod.includes('2')) return 'GRIT'
  return 'DESCONHECIDA'
}

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

function resolveCol(raw: Record<string, unknown>, ...aliases: string[]): unknown {
  for (const alias of aliases) {
    const val = raw[alias]
    if (val !== undefined && val !== null && val !== '') return val
  }
  return ''
}

function parseNum(val: unknown, col: string, idx: number): number {
  if (val === undefined || val === null || val === '') return 0
  const num = parseFloat(String(val))
  if (isNaN(num)) {
    console.warn(`[api/vendas] NaN linha ${idx}, coluna ${col}: "${val}"`)
    return 0
  }
  return num
}

// Tipo serializado — dtsaida como string ISO para JSON
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
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (!SHAREPOINT_URL) {
    return res.status(500).json({ error: 'SHAREPOINT_URL não configurada' })
  }

  try {
    // 1. Busca o Excel no SharePoint
    const response = await axios.get<ArrayBuffer>(SHAREPOINT_URL, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 10,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    // 2. Parse do Excel no servidor
    const workbook = XLSX.read(response.data, { type: 'array', cellDates: false })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('Arquivo Excel sem sheets.')

    const sheet = workbook.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

    if (rawRows.length === 0) {
      // Cache de 5 min para sheet vazia — evita hammer no SharePoint
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
      return res.json([])
    }

    // Valida colunas obrigatórias
    const cols = Object.keys(rawRows[0])
    const faltando = ['DTSAIDA', 'VLVENDA'].filter(c => !cols.includes(c))
    if (faltando.length > 0) {
      throw new Error(`Colunas obrigatórias ausentes: ${faltando.join(', ')}`)
    }

    // 3. Normaliza e retorna JSON
    const vendas: VendaRowJSON[] = []
    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i]
      const rawDate = raw['DTSAIDA']
      if (rawDate === undefined || rawDate === null || rawDate === '') continue

      let dtsaida: Date
      if (typeof rawDate === 'number') {
        dtsaida = parseExcelSerial(rawDate)
      } else {
        dtsaida = parseDateBR(String(rawDate).trim())
      }
      if (isNaN(dtsaida.getTime())) continue

      const strUp = (val: unknown) => String(val ?? '').trim().toUpperCase()
      const codfilial = String(resolveCol(raw, 'CODFILIAL', 'COD_FILIAL', 'FILIAL') ?? '').trim()
      const descricao = strUp(resolveCol(raw, 'DESCRICAO', 'DESC', 'PRODUTO', 'NMPRODUTO'))
      const nomecliente = strUp(resolveCol(raw, 'NOMECLIENTE', 'CLIENTE', 'NMCLIENTE', 'NOME_CLIENTE', 'NOME CLIENTE'))
      const uf = strUp(resolveCol(raw, 'UF', 'ESTADO', 'SIGLAESTADO'))
      const municipio = strUp(resolveCol(raw, 'MUNICIPIO', 'MUNICÍPIO', 'MUNICENT', 'CIDADE', 'NMMUNICIPIO', 'MUNICIPENT'))
      const idx = i + 2

      vendas.push({
        dtsaida:     dtsaida.toISOString(),
        codfilial,
        vlvenda:     parseNum(raw['VLVENDA'],     'VLVENDA',     idx),
        vlcustoreal: parseNum(raw['VLCUSTOREAL'], 'VLCUSTOREAL', idx),
        qtvenda:     parseNum(raw['QTVENDA'],     'QTVENDA',     idx),
        descricao,
        nomecliente,
        uf,
        municipio,
        filial:  getFilialName(codfilial),
        grupo:   getGrupo(descricao),
        mesAno:  toMesAno(dtsaida),
      })
    }

    console.info(`[api/vendas] ${vendas.length} linhas retornadas`)

    // 4. Cache CDN por 2 horas; serve dado stale por mais 1h enquanto revalida em background
    res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=3600')
    res.setHeader('Content-Type', 'application/json')
    return res.json(vendas)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/vendas] Erro:', message)
    return res.status(500).json({ error: message })
  }
}
