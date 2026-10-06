import { landing } from '../content'
import { QuoteMark } from '../Icons'

export default function Quote() {
  const q = landing.quote
  return (
    <section className="sec quote3">
      <div className="wrap q2">
        <QuoteMark />
        <blockquote className="rv d1">{q.pending ? <span className="pend">{q.text}</span> : q.text}</blockquote>
        <div className="who rv d2"><div className="av">{q.initials}</div><div>{q.name}<small>{q.role}</small></div></div>
      </div>
    </section>
  )
}
