import { landing, whatsappHref } from '../content'
import { WhatsApp } from '../Icons'
import LotFeed from '../client/LotFeed'

export default function HowItWorks() {
  const h = landing.how
  return (
    <section className="sec" id="como">
      <div className="wrap">
        <div className="feedgrid howcard rv">
          <div className="feedstage rv d1"><LotFeed /></div>
          <div className="feedtx">
            <div className="eyebrow rv"><b>01</b> {h.eyebrow}</div>
            <h2 className="h2 rv d1">{h.title}</h2>
            <p className="lead rv d2">{h.lead}</p>
            <div className="ctas rv d3">
              <a className="btn primary" href={whatsappHref}><WhatsApp />{landing.cta.demo}</a>
              <a className="more" href="#planes">{h.more} <span>→</span></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
