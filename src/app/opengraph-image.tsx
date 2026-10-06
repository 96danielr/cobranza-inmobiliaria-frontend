import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Operix · Cobranza inmobiliaria para venta de lotes a plazos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Share image for operix.com.co: paper background, the official logo and the how-it-works headline. */
const asDataUrl = async (file: string) =>
  'data:image/png;base64,' + (await readFile(path.join(process.cwd(), 'public/brand', file))).toString('base64')

export default async function OpengraphImage() {
  const [mark, word] = await Promise.all([asDataUrl('operix-mark.png'), asDataUrl('operix-wordmark.png')])
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: '#F2F0E9', color: '#0B1B33', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* official logo (mark + wordmark) */}
          <img src={mark} width={66} height={64} alt="" />
          <img src={word} width={244} height={32} alt="Operix" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>Cada cuota, cobrada y registrada</div>
          <div style={{ fontSize: 30, color: '#566070' }}>Cobranza para inmobiliarias que venden lotes a plazos</div>
        </div>
        <div style={{ display: 'flex', height: 10, borderRadius: 5, background: '#E7E2D6' }}>
          <div style={{ width: '72%', borderRadius: 5, background: '#0FA37F' }} />
        </div>
      </div>
    ),
    size,
  )
}
