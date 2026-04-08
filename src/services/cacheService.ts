/**
 * Cache local dos dados de vendas.
 * Persiste o VendaRow[] no localStorage com timestamp.
 * TTL = 2 horas (mesmo intervalo de atualização automática).
 */

import type { VendaRow } from '../types'

const CACHE_KEY     = 'itely_vendas_v1'
const CACHE_TTL_MS  = 2 * 60 * 60 * 1000  // 2 horas

// VendaRow serializado: dtsaida como string ISO
interface SerializedRow extends Omit<VendaRow, 'dtsaida'> {
  dtsaida: string
}

interface CacheEntry {
  timestamp: string
  rows:      SerializedRow[]
}

/** Salva os dados no localStorage. Falha silenciosamente se quota exceder. */
export function saveCache(rows: VendaRow[]): void {
  try {
    const entry: CacheEntry = {
      timestamp: new Date().toISOString(),
      rows: rows.map((r) => ({ ...r, dtsaida: r.dtsaida.toISOString() })),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch (e) {
    console.warn('[cache] Falha ao salvar (quota?):', e)
  }
}

/** Lê o cache. Retorna null se ausente, corrompido ou expirado (> 2h). */
export function loadCache(): { rows: VendaRow[]; timestamp: Date } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const entry: CacheEntry = JSON.parse(raw)
    const timestamp = new Date(entry.timestamp)
    const age = Date.now() - timestamp.getTime()

    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    const rows: VendaRow[] = entry.rows.map((r) => ({
      ...r,
      dtsaida: new Date(r.dtsaida),
    }))

    return { rows, timestamp }
  } catch (e) {
    console.warn('[cache] Falha ao ler:', e)
    localStorage.removeItem(CACHE_KEY)
    return null
  }
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY)
}
