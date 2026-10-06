import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'

const collectErrors = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  return errors
}

test('server HTML carries the copy (no JS needed)', async ({ request }) => {
  const html = await (await request.get('/')).text()
  for (const t of ['Construyendo el futuro', 'Cada cuota, cobrada y registrada', 'Menos planillas', 'Menos tiempo persiguiendo pagos',
    'Tus datos y transacciones', 'Un solo plan, sin sorpresas', '$10.000', '¿Listo para transformar tu cobranza?']) expect(html).toContain(t)
  expect(html).not.toContain('images.unsplash.com')
  expect(html).toContain('<title>Operix')
})

test('landing CSS is scoped under .landing', () => {
  for (const file of ['src/components/landing/landing.css', 'src/components/landing/hero/hero-scene.css']) {
    const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*\s*\}/g, '')
    const preludes = Array.from(css.matchAll(/([^{};]+)\{/g)).map(m => m[1].trim()).filter(p => !p.startsWith('@'))
    expect(preludes.length).toBeGreaterThan(50)
    for (const prelude of preludes) for (const sel of prelude.split(',')) {
      const s = sel.trim()
      expect(s.startsWith('.landing') || /^(html|body):has\(\.landing\)/.test(s), `unscoped selector: ${s}`).toBe(true)
    }
  }
})

test('no horizontal scroll at 390 px and no console errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.waitForTimeout(1500)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('hero scene mounts once and runs', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/')
  await page.waitForTimeout(3000)
  expect(await page.locator('.landing .ox .plane').count()).toBe(1)
  expect(await page.locator('.landing .ox .plane > *').count()).toBeGreaterThan(20)
  await expect(page.locator('.landing #n2')).not.toHaveText('RECAUDO 0 %')
  expect(errors).toEqual([])
})

test('live lot reports and approves instalments, then moves to the next lot', async ({ page }) => {
  test.setTimeout(40_000)
  const errors = collectErrors(page)
  await page.goto('/')
  await page.locator('#como').scrollIntoViewIfNeeded()
  const front = page.locator('.landing .lf[data-pos="0"]:not(.leave)')
  await expect(front.locator('.lf-ev').first()).toContainText('Cuota 1 reportada', { timeout: 4000 })
  await expect(front.locator('.lf-n')).toHaveText('1 de 6', { timeout: 4000 })
  await expect(front.locator('.lf-lot')).toHaveText('Lote 7', { timeout: 20_000 })
  await page.waitForTimeout(800); expect(await page.locator('.landing .lf[data-pos="0"]').count()).toBe(1)
  expect(errors).toEqual([])
})

test('reduced motion shows the collected state', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const errors = collectErrors(page)
  await page.goto('/')
  await expect(page.locator('.landing .lf[data-pos="0"] .lf-n')).toHaveText('6 de 6')
  await expect(page.locator('.landing .bc-st .num').first()).toHaveText('120+')
  expect(errors).toEqual([])
  await ctx.close()
})

test('security and closing mini scenes mount once', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/')
  await page.waitForTimeout(1500)
  await expect(page.locator('.landing [data-mini].mx')).toHaveCount(2)
  for (const kind of ['secure', 'close']) expect(await page.locator(`.landing [data-mini="${kind}"] > .pl`).count()).toBe(1)
  expect(errors).toEqual([])
})
