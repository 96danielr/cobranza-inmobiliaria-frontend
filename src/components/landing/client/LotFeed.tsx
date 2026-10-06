'use client'

import { useEffect, useRef } from 'react'
import { landing } from '../content'
import { feedEvent, money } from '../lotFeed'

const N = 6
const TICK_MS = 750
const ICON = { due: '$', ok: '✓', all: '✓' } as const

/**
 * Live lot in "how it works": on the front card the instalments get reported and approved one by one
 * (the last three events stay visible), the total grows until the lot is collected, jumps, holds,
 * and the card slides away so the next lot comes forward. Pauses off screen; reduced motion shows the final state.
 */
export default function LotFeed() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const deck = ref.current
    if (!deck) return
    const cards = Array.from(deck.querySelectorAll<HTMLElement>('.lf'))
    const lots = landing.lots
    const q = <T extends HTMLElement>(c: HTMLElement, s: string) => c.querySelector(s) as T
    const front = () => cards.find(c => c.dataset.pos === '0')!
    const timeouts = new Set<number>()
    const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timeouts.delete(id); fn() }, ms); timeouts.add(id) }
    let li = 0, step = 0, timer = 0

    const addEvent = (kind: keyof typeof ICON, title: string) => {
      const track = q(front(), '.lf-track')
      const row = document.createElement('div'); row.className = 'lf-ev ' + kind
      const icon = document.createElement('i'); icon.textContent = ICON[kind]
      const text = document.createElement('b'); text.textContent = title
      row.append(icon, text); track.appendChild(row)
      while (track.children.length > 4) track.firstChild!.remove()
      // slide the list up by one row
      track.style.transition = 'none'; track.style.transform = `translateY(${row.offsetHeight}px)`; void track.offsetWidth
      track.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; track.style.transform = 'translateY(0)'
    }
    const setTotals = (c: HTMLElement, paid: number, fee: number) => {
      q(c, '.lf-n').textContent = `${paid} de ${N}`
      q(c, '.lf-got').textContent = money(paid * fee)
      q(c, '.lf-bar i').style.width = (paid / N) * 100 + '%'
      q(c, '.lf-bar').classList.toggle('done', paid === N)
    }
    const load = (c: HTMLElement, i: number) => {
      const L = lots[i % lots.length]
      q(c, '.lf-lot').textContent = L.lot; q(c, '.lf-track').replaceChildren(); q(c, '.lf-got').classList.remove('pop')
      setTotals(c, 0, L.fee)
    }
    const swap = () => {
      const f = front(); f.classList.add('leave')
      cards.forEach(c => { if (c !== f) c.dataset.pos = String(+c.dataset.pos! - 1) })
      later(() => {
        f.classList.add('snap'); f.classList.remove('leave'); f.dataset.pos = '2'; li++; load(f, li + 2)
        void f.offsetWidth; f.classList.remove('snap'); step = 0
      }, 650)
    }
    const tick = () => {
      const L = lots[li % lots.length], c = front()
      const e = feedEvent(step, L.lot, N)
      if (e) {
        addEvent(e.kind, e.title)
        if (e.kind === 'ok') setTotals(c, e.paid, L.fee)
        if (e.kind === 'all') { const got = q(c, '.lf-got'); got.classList.remove('pop'); void got.offsetWidth; got.classList.add('pop') }   // the total jumps once the lot is collected
      } else if (step === 2 * N + 3) later(swap, 500)   // hold the collected total ~2.75 s
      else if (step > 2 * N + 3) return
      step++
    }

    cards.forEach((c, i) => { c.dataset.pos = String(i); load(c, i) })
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { for (let i = 0; i <= 2 * N; i++) tick(); return }
    const run = (on: boolean) => {
      if (on && !timer) { tick(); timer = window.setInterval(tick, TICK_MS) }
      else if (!on && timer) { clearInterval(timer); timer = 0 }
    }
    const io = new IntersectionObserver(es => es.forEach(e => run(e.isIntersecting)), { threshold: 0.25 })
    io.observe(deck)
    return () => { io.disconnect(); clearInterval(timer); timeouts.forEach(clearTimeout) }
  }, [])

  return (
    <div className="lf-deck" data-feed ref={ref} aria-hidden="true">
      {[0, 1, 2].map(i => (
        <div className="lf" data-pos={i} key={i}>
          <div className="lf-hd"><b className="lf-lot">{landing.lots[i].lot}</b><span>{N} cuotas</span></div>
          <div className="lf-feed"><div className="lf-track" /></div>
          <div className="lf-ft"><div className="lf-amt"><b className="lf-got">{money(0)}</b><span className="lf-n">0 de {N}</span></div><div className="lf-bar"><i /></div></div>
        </div>
      ))}
    </div>
  )
}
