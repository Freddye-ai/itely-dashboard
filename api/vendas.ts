import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'

const SHAREPOINT_URL =
  'https://financebrazil-my.sharepoint.com/personal/freddye_pontes_financebrazil_com_br/_layouts/15/download.aspx?share=ESTcqHKRuYlAtY8DXtxqms8BSoS27C0ML1CxsoUCf24pyg'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  https.get(SHAREPOINT_URL, (upstream) => {
    // Segue redirecionamentos do SharePoint
    if (upstream.statusCode && upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
      https.get(upstream.headers.location, (redirected) => {
        res.setHeader('Content-Type', 'application/octet-stream')
        redirected.pipe(res)
      }).on('error', (err) => {
        res.status(502).json({ error: 'Erro ao seguir redirect: ' + err.message })
      })
      return
    }

    res.setHeader('Content-Type', 'application/octet-stream')
    upstream.pipe(res)
  }).on('error', (err) => {
    res.status(502).json({ error: 'Erro ao buscar arquivo: ' + err.message })
  })
}
