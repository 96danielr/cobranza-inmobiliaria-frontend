import { test, expect } from '@playwright/test'
import { feedEvent, money, monthlyPrice } from '../src/components/landing/lotFeed'
import { landing } from '../src/components/landing/content'

test('money formats Colombian pesos', () => {
  expect(money(1428000)).toBe('$ 1.428.000')
})

test('monthly price for 120 lots matches the example on the page', () => {
  expect(monthlyPrice(120)).toBe(1428000)
  expect(landing.plans.example).toContain(money(monthlyPrice(120)))
})

test('feed script: report, approve, then collected', () => {
  expect(feedEvent(0, 'Lote 12')).toEqual({ kind: 'due', title: 'Cuota 1 reportada', paid: 0 })
  expect(feedEvent(1, 'Lote 12')).toEqual({ kind: 'ok', title: 'Cuota 1 aprobada', paid: 1 })
  expect(feedEvent(11, 'Lote 12')).toEqual({ kind: 'ok', title: 'Cuota 6 aprobada', paid: 6 })
  expect(feedEvent(12, 'Lote 12')).toEqual({ kind: 'all', title: 'Lote 12 recaudado', paid: 6 })
  expect(feedEvent(13, 'Lote 12')).toBeNull()
})
