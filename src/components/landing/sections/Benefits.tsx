import { landing } from '../content'
import { Icon } from '../Icons'
import CountUp from '../client/CountUp'

const delay = (i: number) => (i % 4 ? ` d${i % 4}` : '')

export default function Benefits() {
  const b = landing.benefits
  return (
    <section className="sec" id="beneficios">
      <div className="wrap">
        <div className="howcard bencard rv">
          <div className="bc-tx">
            <div className="eyebrow"><b>02</b> {b.eyebrow}</div>
            <h2 className="h2">{b.title}</h2>
            <div className="bc-list">
              {b.items.map(it => (
                <div className="bnf" key={it.title}>
                  <div className="bf-ic draw"><Icon name={it.icon} /></div>
                  <div className="bf-tx"><h3>{it.title}</h3><p>{it.text}</p></div>
                </div>
              ))}
            </div>
            <a className="more" href="#planes">{b.more} <span>→</span></a>
          </div>
          <div className="bc-st">
            <div className="cotas grid4">
              {b.stats.map((s, i) => (
                'value' in s
                  ? <div className={'ct rv' + delay(i)} key={s.label}><CountUp value={s.value} suffix={s.suffix} /><div className="lbl">{s.label}</div></div>
                  : <div className={'ct ct-text rv' + delay(i)} key={s.text}><div className="lbl">{s.lead}</div><div className="num">{s.text}</div></div>
              ))}
            </div>
          </div>
          <div className="specs specs3 featcard in-card">
            {b.features.map(f => (
              // no reveal here: the card around them already fades in
              <div className="sp" key={f.label}><div className="ic"><Icon name={f.icon} /></div><div><h3>{f.label}</h3><p>{f.text}</p></div></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
