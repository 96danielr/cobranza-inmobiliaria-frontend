'use client'

import { useEffect, useState } from 'react'
import { landing, whatsappHref } from '../content'
import { Chevron, Logo, WhatsApp } from '../Icons'

/** Fixed header: compacts after scrolling and opens the "Ingresar" menu. */
export default function HeaderBar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    const close = () => setOpen(false)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', close)
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('click', close) }
  }, [])

  return (
    <header className={'top' + (scrolled ? ' scrolled' : '')} id="top">
      <div className="wrap bar">
        <a className="logo" href="#"><Logo gradient />OPERIX</a>
        <nav className="nav">{landing.nav.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}</nav>
        <div className="right">
          <div className={'menu' + (open ? ' open' : '')}>
            <button type="button" aria-haspopup="true" aria-expanded={open} onClick={e => { e.stopPropagation(); setOpen(o => !o) }}>
              Ingresar <Chevron />
            </button>
            <div className="pop">
              {landing.login.map(l => <a key={l.href} href={l.href}>{l.label}<small>{l.hint}</small></a>)}
            </div>
          </div>
          <a className="btn primary sm" href={whatsappHref}><WhatsApp /><span>{landing.cta.whatsapp}</span></a>
        </div>
      </div>
    </header>
  )
}
