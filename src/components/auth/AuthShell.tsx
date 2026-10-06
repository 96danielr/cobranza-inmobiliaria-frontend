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
  /** company: ink panel with the collection grid · client: light mint panel with a country house */
  variant?: 'company' | 'client'
  children: ReactNode
}

/** Two-column sign-in layout in the landing's language: form on paper (left), Operix statement on ink (right). */
export default function AuthShell({ eyebrow, title, subtitle, quote, quoteNote, switchTo, variant = 'company', children }: Props) {
  return (
    <main className={'auth ' + variant}>
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
        {variant === 'company' ? (
          <div className="auth-lots">
            {['ok', 'ok', 'due', 'ok', 'due', 'free'].map((s, i) => <i key={i} className={'lot ' + s}>{s === 'ok' ? '✓' : s === 'due' ? '$' : ''}</i>)}
          </div>
        ) : (
          <svg className="auth-house" viewBox="0 0 220 150" aria-hidden="true">
            <ellipse cx="110" cy="138" rx="96" ry="9" fill="rgba(15,163,127,.18)" />
            <path d="M44 132V76h132v56z" fill="#FFFAF0" stroke="#CBBB9C" strokeWidth="1.5" />
            <path d="M30 80 110 30l80 50z" fill="#C9693D" />
            <path d="M30 80 110 30l80 50" fill="none" stroke="#93441F" strokeWidth="3" strokeLinejoin="round" />
            {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`M${48 + i * 18} ${70 - Math.abs(3 - i) * 6} v10`} stroke="#E08A5C" strokeWidth="2" />)}
            <rect x="146" y="38" width="12" height="24" fill="#B45A34" />
            <rect x="99" y="98" width="22" height="34" rx="2" fill="#8A5A3B" />
            <rect x="58" y="92" width="28" height="22" rx="2" fill="#F6D68A" stroke="#8A5A3B" strokeWidth="2" /><path d="M72 92v22" stroke="#8A5A3B" strokeWidth="1.5" />
            <rect x="134" y="92" width="28" height="22" rx="2" fill="#F6D68A" stroke="#8A5A3B" strokeWidth="2" /><path d="M148 92v22" stroke="#8A5A3B" strokeWidth="1.5" />
            <circle cx="192" cy="110" r="16" fill="#6FAF8E" /><path d="M192 126v10" stroke="#7A6A57" strokeWidth="3" />
            <circle cx="18" cy="16" r="10" fill="#0FA37F" /><path d="M13 16l3.5 3.5L23 12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
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
