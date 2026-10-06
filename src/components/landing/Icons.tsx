// Line icons used across the landing (same drawings as the approved prototype).
import type { ReactElement } from 'react'

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** Official Operix logo from main (public/logo fondo transparente.png), split into mark and wordmark to sit on one line. */
export function Logo() {
  return (
    <>
      <img className="logo-mark" src="/brand/operix-mark.png" alt="" width={325} height={315} />
      <img className="logo-word" src="/brand/operix-wordmark.png" alt="Operix" width={805} height={106} />
    </>
  )
}

export function WhatsApp() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...line}>
      <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
      <path d="M9.2 9.5c.3 1.6 1.7 3.5 3.6 4.4l1.2-1.1 1.8.8-.3 1.4c-2.9.6-7-3-7.6-6l1.4-.4.8 1.7z" />
    </svg>
  )
}

export function Chevron() {
  return <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5L6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
}

export function QuoteMark() {
  return (
    <svg className="mark draw rv" viewBox="0 0 56 44" fill="none" stroke="#0B1B33" strokeWidth="1.4" aria-hidden="true">
      <path d="M4 40V24C4 12 10 5 22 4M30 40V24C30 12 36 5 48 4" strokeLinecap="round" /><path d="M4 24h16v16H4zM30 24h16v16H30z" />
    </svg>
  )
}

const paths: Record<string, ReactElement> = {
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M8.5 14.5l2 2 4-4" /></>,
  receipt: <><path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21z" /><path d="M9 8h6M9 11.5h6M9 15h3.5" /></>,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  chart: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 15l3-3 2.5 2.5L17 9" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  card: <><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 10h19M6 15h4" /></>,
  swap: <path d="M4 7h11l-3-3M20 17H9l3 3" />,
  shield: <><path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  database: <><ellipse cx="12" cy="6" rx="7.5" ry="2.5" /><path d="M4.5 6v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V6M4.5 12v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-6" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
}

/** Line icon by name; stroke styling comes from the surrounding CSS, as in the prototype. */
export function Icon({ name }: { name: keyof typeof paths | string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}
