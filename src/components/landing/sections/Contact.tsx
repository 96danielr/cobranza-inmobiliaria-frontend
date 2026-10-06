import { landing, whatsappHref } from '../content'
import { WhatsApp } from '../Icons'
import MiniScene from '../client/MiniScene'

export default function Contact() {
  const c = landing.contact
  return (
    <section className="sec close2" id="contacto">
      <div className="wrap">
        <div className="box rv">
          <div className="tx">
            <div className="eyebrow"><b>05</b> {c.eyebrow}</div>
            <h2 className="h2">{c.title}</h2>
            <p className="lead">{c.lead}</p>
            <div className="acts">
              <a className="btn primary" href={whatsappHref}><WhatsApp />{landing.cta.whatsapp}</a>
              <span className="mail">o escríbenos a {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <a>{c.emailPending}</a>}</span>
            </div>
            <p className="consent">{c.consent} <a href="/privacidad">{c.consentLink}</a>.</p>
          </div>
          <div className="vig"><MiniScene kind="close" className="mxw" /></div>
        </div>
      </div>
    </section>
  )
}
