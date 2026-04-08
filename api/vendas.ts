import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const SHAREPOINT_URL = process.env.SHAREPOINT_URL ?? ''

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (!SHAREPOINT_URL) {
    return res.status(500).json({ error: 'SHAREPOINT_URL não configurada' })
  }

  try {
    const response = await axios.get<ArrayBuffer>(SHAREPOINT_URL, {
      responseType: 'arraybuffer',
      timeout: 55000,
      maxRedirects: 10,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    // Cache CDN por 2 horas
    res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=3600')
    res.setHeader('Content-Type', 'application/octet-stream')
    res.send(Buffer.from(response.data))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/vendas] Erro:', message)
    res.status(500).json({ error: message })
  }
}
