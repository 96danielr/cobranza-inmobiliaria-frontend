/** A pause between cards: one short statement, second line in green. */
export default function Interlude({ lines }: { lines: string[] }) {
  return (
    <section className="interlude">
      <div className="wrap"><p className="il-t rv">{lines[0]}<br /><span>{lines[1]}</span></p></div>
    </section>
  )
}
