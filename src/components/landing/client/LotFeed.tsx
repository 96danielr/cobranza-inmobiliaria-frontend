'use client'

import { landing } from '../content'
import { money } from '../lotFeed'

/** Live lot in "how it works" (behaviour added in Task 4). */
export default function LotFeed() {
  return (
    <div className="lf-deck" data-feed aria-hidden="true">
      {[0, 1, 2].map(i => (
        <div className="lf" data-pos={i} key={i}>
          <div className="lf-hd"><b className="lf-lot">{landing.lots[i].lot}</b><span>6 cuotas</span></div>
          <div className="lf-feed"><div className="lf-track" /></div>
          <div className="lf-ft"><div className="lf-amt"><b className="lf-got">{money(0)}</b><span className="lf-n">0 de 6</span></div><div className="lf-bar"><i /></div></div>
        </div>
      ))}
    </div>
  )
}
