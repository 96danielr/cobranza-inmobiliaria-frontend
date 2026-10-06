import { landing } from '../content'
import { Icon } from '../Icons'
import MiniScene from '../client/MiniScene'

export default function Security() {
  const s = landing.security
  return (
    <section className="sec" id="seguridad">
      <div className="wrap">
        <div className="howcard seccard rv">
          <div className="sc-vis"><MiniScene kind="secure" className="vig" /></div>
          <div className="sc-tx">
            <div className="eyebrow"><b>03</b> {s.eyebrow}</div>
            <h2 className="h2">{s.title}</h2>
            <p className="lead">{s.lead}</p>
            <ul className="seclist">{s.items.map(it => <li key={it.label}><Icon name={it.icon} />{it.label}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  )
}
