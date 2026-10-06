import { landing, whatsappHref } from '../content'
import { WhatsApp } from '../Icons'
import HeroScene from '../client/HeroScene'

export default function Hero() {
  const h = landing.hero
  return (
    <section className="hero">
      <div className="wrap grid">
        <div className="copy">
          <div className="eyebrow rv"><b>{h.eyebrow[0]}</b> {h.eyebrow[1]}</div>
          <h1 className="h1 rv d1">{h.title}</h1>
          <p className="lead rv d2">{h.lead}</p>
          <div className="ctas rv d3">
            <a className="btn primary" href={whatsappHref}><WhatsApp />{landing.cta.whatsapp}</a>
            <a className="btn ghost" href="#como">{h.secondary}</a>
          </div>
          <p className="already rv d4">¿Ya usas Operix? Ingresa como <a href="/admin/login">empresa</a> o como <a href="/login">cliente</a>.</p>
        </div>
        <div className="art rv d2"><HeroScene /></div>
      </div>
    </section>
  )
}
