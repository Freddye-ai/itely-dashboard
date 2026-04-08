/**
 * Funções de formatação para exibição na UI.
 * Todas puras e sem side-effects.
 */

/**
 * Formata número como moeda BRL.
 * Ex: 1234567.89 → 'R$ 1.234.567,89'
 */
export function formatCurrency(value: number): string {
  if (!isFinite(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formata número como moeda abreviada para eixos de gráfico.
 * Ex: 1500000 → 'R$ 1,5M' | 150000 → 'R$ 150k' | 1500 → 'R$ 1,5k'
 */
export function formatCurrencyShort(value: number): string {
  if (!isFinite(value)) return 'R$ 0'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000) {
    return `${sign}R$ ${(abs / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${(abs / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`
  }
  return `${sign}R$ ${abs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

/**
 * Formata número como percentual.
 * Ex: 0.1234 → '12,34%'
 */
export function formatPercent(value: number, decimals = 1): string {
  if (!isFinite(value)) return '0,0%'
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formata número inteiro com separador de milhar.
 * Ex: 12345 → '12.345'
 */
export function formatNumber(value: number): string {
  if (!isFinite(value)) return '0'
  return new Intl.NumberFormat('pt-BR').format(Math.round(value))
}

/**
 * Formata variação MoM com sinal.
 * Ex: 0.15 → '+15,0%' | -0.05 → '-5,0%' | null → '—'
 */
export function formatMoM(value: number | null): string {
  if (value === null) return '—'
  if (!isFinite(value)) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${formatPercent(value)}`
}

/**
 * Formata hora para exibição do timestamp de atualização.
 * Ex: new Date() → '14:32'
 */
export function formatHora(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
