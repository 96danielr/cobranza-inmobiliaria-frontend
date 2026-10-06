'use client'

import { useEffect, useRef, useState } from 'react'
import { landing, whatsappHref } from '../content'
import { Chevron, Logo, WhatsApp } from '../Icons'

/** Fixed header: compacts after scrolling and opens the "Ingresar" menu. */
export default function HeaderBar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    // React's event root is the document in the app router, so close only on clicks outside the menu
    const close = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(o => { if (o) button.current?.focus(); return false }) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', close)
    document.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('click', close); document.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <header className={'top' + (scrolled ? ' scrolled' : '')} id="top">
      <div className="wrap bar">
        <a className="logo" href="#"><Logo gradient />OPERIX</a>
        <nav className="nav">{landing.nav.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}</nav>
        <div className="right">
          <div className={'menu' + (open ? ' open' : '')} ref={menu}>
            <button ref={button} type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(o => !o)}>
              Ingresar <Chevron />
            </button>
            <div className="pop">
              {landing.login.map(l => <a key={l.href} href={l.href}>{l.label}<small>{l.hint}</small></a>)}
            </div>
          </div>
          <a className="btn primary sm" href={whatsappHref} aria-label={landing.cta.whatsapp}><WhatsApp /><span>{landing.cta.whatsapp}</span></a>
        </div>
      </div>
    </header>
  )
}
