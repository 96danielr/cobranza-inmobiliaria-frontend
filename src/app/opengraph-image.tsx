import { ImageResponse } from 'next/og'

export const alt = 'Operix · Cobranza inmobiliaria para venta de lotes a plazos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Share image for operix.com.co: paper background, logo and the hero headline. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: '#F2F0E9', color: '#0B1B33', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 40 40">
            <path d="M29 7.5A15 15 0 1 0 34 24" fill="none" stroke="#1C56C4" strokeWidth="5" strokeLinecap="round" />
            <path d="M14.5 24.5l7.5 7 13-18" fill="none" stroke="#0FB98C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 8 }}>OPERIX</div>
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
