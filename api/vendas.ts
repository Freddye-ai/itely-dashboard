import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const SHAREPOINT_URL = process.env.SHAREPOINT_URL ?? ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  console.log('[api/vendas] SHAREPOINT_URL length:', SHAREPOINT_URL.length)
  console.log('[api/vendas] SHAREPOINT_URL starts with:', SHAREPOINT_URL.substring(0, 30))

  if (!SHAREPOINT_URL) {
    return res.status(500).json({ error: 'SHAREPOINT_URL não configurada' })
  }

  try {
    const response = await axios.get(SHAREPOINT_URL, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    res.setHeader('Content-Type', 'application/octet-stream')
    res.send(Buffer.from(response.data))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/vendas] Erro:', message)
    res.status(500).json({ error: message })
  }
}
