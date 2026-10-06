import type { ReactNode } from 'react'
import './auth.css'

type Props = {
  /** Small label above the title, e.g. "Portal empresa". */
  eyebrow: string
  title: string
  subtitle: string
  /** Statement on the right panel; the second line is shown in green. */
  quote: [string, string]
  quoteNote: string
  /** Link under the form to the other portal. */
  switchTo: { text: string; label: string; href: string }
  children: ReactNode
}

/** Two-column sign-in layout in the landing's language: form on paper (left), Operix statement on ink (right). */
export default function AuthShell({ eyebrow, title, subtitle, quote, quoteNote, switchTo, children }: Props) {
  return (
    <main className="auth">
      <section className="auth-form">
        <div className="auth-form-in">
          <a className="auth-mlogo" href="/" aria-label="Operix">
            <img src="/brand/operix-mark.png" alt="" width={325} height={315} /><img src="/brand/operix-wordmark.png" alt="Operix" width={805} height={106} />
          </a>
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-sub">{subtitle}</p>
          {children}
          <p className="auth-switch">{switchTo.text} <a href={switchTo.href}>{switchTo.label}</a></p>
          <a className="auth-back" href="/">← Volver a operix.com.co</a>
        </div>
      </section>
      <aside className="auth-side" aria-hidden="true">
        <a className="auth-logo" href="/" tabIndex={-1}>
          <img src="/brand/operix-mark.png" alt="" width={325} height={315} /><img className="auth-word" src="/brand/operix-wordmark.png" alt="" width={805} height={106} />
        </a>
        <div className="auth-lots">
          {['ok', 'ok', 'due', 'ok', 'due', 'free'].map((s, i) => <i key={i} className={'lot ' + s}>{s === 'ok' ? '✓' : s === 'due' ? '$' : ''}</i>)}
        </div>
        <div className="auth-quote">
          <p className="auth-q">{quote[0]}<br /><span>{quote[1]}</span></p>
          <p className="auth-qn">{quoteNote}</p>
        </div>
        <p className="auth-foot">© {new Date().getFullYear()} Operix · Cobranza de lotes a plazos</p>
      </aside>
    </main>
  )
}

/** Labelled text field in the landing style; `end` renders inside the field (e.g. a show-password button). */
export function AuthField({ label, error, end, ...input }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; end?: ReactNode }) {
  return (
    <label className={'auth-field' + (error ? ' has-error' : '')}>
      <span className="auth-label">{label}</span>
      <span className="auth-input-wrap"><input className="auth-input" {...input} />{end}</span>
      {error && <span className="auth-error">{error}</span>}
    </label>
  )
}
