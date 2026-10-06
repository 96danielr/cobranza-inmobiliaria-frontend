import { landing, whatsappHref } from '../content'
import { Icon, WhatsApp } from '../Icons'

export default function Plans() {
  const p = landing.plans
  return (
    <section className="sec" id="planes">
      <div className="wrap">
        <div className="howcard plancard rv">
          <div className="pc-main">
            <div className="eyebrow"><b>04</b> {p.eyebrow}</div>
            <h2 className="h2">{p.title}</h2>
            <p className="lead">{p.lead}</p>
            <div className="plan2">
              <div className="amt"><b>{p.price}</b><span>{p.unit}</span></div>
              <p className="pc-ex">{p.example}</p>
              <a className="btn primary" href={whatsappHref}><WhatsApp />{landing.cta.whatsapp}</a>
            </div>
          </div>
          <div className="pc-incl">
            <b className="pc-t">{p.includedTitle}</b>
            <ul className="incl">{p.included.map(t => <li key={t}><Icon name="check" />{t}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  )
}
