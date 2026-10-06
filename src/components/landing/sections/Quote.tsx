import { landing } from '../content'
import { QuoteMark } from '../Icons'

export default function Quote() {
  const q = landing.quote
  const showDraft = !q.approved && process.env.NODE_ENV !== 'production'
  const text = q.approved ? q.draft : null
  return (
    <section className="sec quote3">
      <div className="wrap q2">
        <QuoteMark />
        <blockquote className="rv d1">
          {text ?? (showDraft ? <>{q.draft}<span className="draft-tag">Borrador · pendiente de aprobación de Alfasur</span></> : <span className="pend">{q.text}</span>)}
        </blockquote>
        <div className="who rv d2"><div className="av">{q.initials}</div><div>{q.name}<small>{q.role}</small></div></div>
      </div>
    </section>
  )
}
