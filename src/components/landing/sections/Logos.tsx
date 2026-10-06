import { landing } from '../content'

export default function Logos() {
  const names = [...landing.logos.names, ...landing.logos.names]   // doubled so the marquee loops seamlessly
  return (
    <section className="logos2">
      <div className="wrap"><div className="eyebrow rv">{landing.logos.title}</div></div>
      <div className="marquee rv d1">
        <div className="track">{names.map((n, i) => <span key={i} aria-hidden={i >= landing.logos.names.length}>{n}</span>)}</div>
      </div>
    </section>
  )
}
