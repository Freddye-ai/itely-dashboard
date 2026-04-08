/**
 * Utilitários de data — todas as funções são puras e sem side-effects.
 * Nunca usar new Date(string) diretamente por ambiguidade de timezone.
 */

/**
 * Converte o número serial do Excel (dias desde 1900-01-01) para um objeto Date.
 * O Excel tem um bug histórico: considera 1900 como ano bissexto, então
 * seriais >= 60 precisam ser decrementados de 1.
 */
export function parseExcelSerial(serial: number): Date {
  // Ajuste pelo bug de 1900-02-29 no Excel
  const adjusted = serial > 59 ? serial - 1 : serial
  // Epoch do Excel: 1899-12-31 = dia 0
  const epoch = new Date(1899, 11, 31)
  epoch.setDate(epoch.getDate() + adjusted)
  return epoch
}

/**
 * Converte string 'dd/mm/yyyy' para Date.
 * Nunca usa new Date(string) para evitar ambiguidade de timezone.
 */
export function parseDateBR(dateStr: string): Date {
  const parts = dateStr.split('/')
  if (parts.length !== 3) {
    console.warn(`[dateHelpers] Formato inesperado de data: "${dateStr}"`)
    return new Date(0)
  }
  const [day, month, year] = parts.map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Retorna o mês anterior como { mes: number, ano: number }.
 * Trata a virada de ano: janeiro → dezembro do ano anterior.
 */
export function getPreviousMonth(mes: number, ano: number): { mes: number; ano: number } {
  if (mes === 1) {
    return { mes: 12, ano: ano - 1 }
  }
  return { mes: mes - 1, ano }
}

/**
 * Formata Date para chave 'YYYY-MM' usada nos agrupamentos.
 */
export function toMesAno(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * Formata Date para label legível 'Jan/24'.
 */
export function toMesAnoLabel(mesAno: string): string {
  const [year, month] = mesAno.split('-').map(Number)
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[month - 1]}/${String(year).slice(2)}`
}
