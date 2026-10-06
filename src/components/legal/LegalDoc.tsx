import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LEGAL_REVIEWED } from './company'

/** Legal document page body: markdown text on a white card, with the landing look. */
export default function LegalDoc({ markdown }: { markdown: string }) {
  const showDraft = !LEGAL_REVIEWED && process.env.NODE_ENV !== 'production'
  return (
    <section className="sec legal-sec">
      <div className="wrap">
        <article className="howcard legal-doc">
          {showDraft && <p className="legal-draft">Borrador legal</p>}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
      </div>
    </section>
  )
}
