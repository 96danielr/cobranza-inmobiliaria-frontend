// Pure logic behind the live lot in "how it works": the event script and price helpers.

export const LOT_PRICE_COP = 10000
export const VAT_RATE = 0.19

export const money = (n: number): string => '$ ' + Math.round(n).toLocaleString('es-CO')

export const monthlyPrice = (lots: number): number => Math.round(lots * LOT_PRICE_COP * (1 + VAT_RATE))

export type FeedEvent = { kind: 'due' | 'ok' | 'all'; title: string; paid: number }

/** Event for a given step of a lot with `n` instalments: report k, approve k, ..., then "collected". */
export function feedEvent(step: number, lot: string, n = 6): FeedEvent | null {
  if (step < 0 || step > 2 * n) return null
  if (step === 2 * n) return { kind: 'all', title: `${lot} recaudado`, paid: n }
  const k = Math.floor(step / 2) + 1
  return step % 2 === 0
    ? { kind: 'due', title: `Cuota ${k} reportada`, paid: k - 1 }
    : { kind: 'ok', title: `Cuota ${k} aprobada`, paid: k }
}
