import { landing, whatsappHref } from '../content'
import { Logo } from '../Icons'

export default function Footer() {
  const f = landing.footer
  return (
    <footer>
      <div className="wrap">
        <div className="grid">
          <div><a className="logo" href="/" aria-label="Operix"><Logo /></a><p className="about">{f.about}</p></div>
          <div className="col"><b>Producto</b>{landing.nav.slice(0, 3).map(l => <a key={l.href} href={l.href}>{l.label}</a>)}</div>
          <div className="col"><b>Ingresar</b><a href="/admin/login">Portal empresa</a><a href="/login">Portal cliente</a></div>
          <div className="col"><b>Contacto</b><a href={whatsappHref}>WhatsApp</a>
            {landing.contact.email ? <a href={`mailto:${landing.contact.email}`}>{landing.contact.email}</a> : <span className="pend">{landing.contact.emailPending}</span>}</div>
          <div className="col"><b>Legal</b>{f.legal.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}</div>
        </div>
        <div className="legal"><span>{f.rights}</span><span>{f.madeIn}</span></div>
      </div>
    </footer>
  )
}
