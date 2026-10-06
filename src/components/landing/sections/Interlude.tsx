/** A pause between cards: one short statement (second line in green) and an optional link. */
export default function Interlude({ lines, link }: { lines: string[]; link?: { label: string; href: string | null } }) {
  return (
    <section className="interlude">
      <div className="wrap">
        <p className="il-t rv">{lines[0]}{lines[1] && <><br /><span>{lines[1]}</span></>}</p>
        {link && (link.href
          ? <a className="il-link rv d1" href={link.href}>{link.label} <span>→</span></a>
          : <a className="il-link rv d1 is-pending" aria-disabled="true" title="Disponible pronto">{link.label} <span>→</span></a>)}
      </div>
    </section>
  )
}
