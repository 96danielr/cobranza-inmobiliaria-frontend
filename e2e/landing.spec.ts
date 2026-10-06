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
  for (const t of ['Ellos construyen su sueño', 'Cada cuota, cobrada y registrada', 'Menos planillas', 'Menos tiempo persiguiendo pagos',
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

test('open graph image is served and linked', async ({ request }) => {
  const html = await (await request.get('/')).text()
  expect(html).toMatch(/<meta property="og:image" content="[^"]*opengraph-image/)
  const img = await request.get('/opengraph-image')
  expect(img.status()).toBe(200)
  expect(img.headers()['content-type']).toContain('image/png')
})

test('leaving the landing does not restyle the app', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1000)
  await page.goto('/login')
  await page.waitForTimeout(1500)
  // landing classes are scoped under .landing, so nothing on /login may pick up their rules
  expect(await page.locator('.landing').count()).toBe(0)
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(bodyBg).not.toBe('rgb(242, 240, 233)')
})

// ---- final review fixes ----
test('reduced motion shows the finished hero', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/')
  await page.waitForTimeout(1500)
  await expect(page.locator('.landing #n2')).toHaveText(/RECAUDO 100/)
  await ctx.close()
})

// Next always uses localhost for metadata URLs in dev, so this checks the production build (run `npm run build` first).
test('og:image is an absolute operix.com.co URL in the production build', () => {
  const built = '.next/server/app/index.html'
  test.skip(!fs.existsSync(built), 'needs npm run build')
  const html = fs.readFileSync(built, 'utf8')
  expect(html).toMatch(/<meta property="og:image" content="https:\/\/operix\.com\.co\/opengraph-image/)
})

test('hero copy is visible before JavaScript runs', async ({ page }) => {
  await page.route(/\/_next\/static\/chunks\/.*\.js/, r => r.abort())
  await page.goto('/')
  await page.waitForTimeout(500)
  expect(await page.locator('.landing .hero h1').evaluate(el => getComputedStyle(el).opacity)).toBe('1')
  expect(await page.locator('.landing .hero .ctas').evaluate(el => getComputedStyle(el).opacity)).toBe('1')
})

test('login menu is keyboard friendly', async ({ page }) => {
  await page.goto('/')
  const button = page.locator('.landing .menu > button')
  await button.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
  expect(await button.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none')
  expect(await page.locator('.landing .menu .pop a').first().evaluate(el => getComputedStyle(el).visibility)).toBe('hidden')
  await page.keyboard.press('Enter')
  await expect(page.locator('.landing .menu')).toHaveClass(/open/)
  await page.keyboard.press('Escape')
  await expect(page.locator('.landing .menu')).not.toHaveClass(/open/)
  await expect(button).toBeFocused()
})

test('hero stage keeps a single set of pointer listeners after remounts', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __ox: Record<string, number> }
    w.__ox = {}
    const add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener
    EventTarget.prototype.addEventListener = function (this: Element, t: string, ...a: unknown[]) {
      if (this.id === 'ox') w.__ox[t] = (w.__ox[t] || 0) + 1
      return add.call(this, t, ...(a as [EventListener]))
    }
    EventTarget.prototype.removeEventListener = function (this: Element, t: string, ...a: unknown[]) {
      if (this.id === 'ox') w.__ox[t] = (w.__ox[t] || 0) - 1
      return rem.call(this, t, ...(a as [EventListener]))
    }
  })
  await page.goto('/')
  await page.waitForTimeout(2000)
  const counts = await page.evaluate(() => (window as unknown as { __ox: Record<string, number> }).__ox)
  expect(counts.pointerdown).toBe(1)
})

test('header WhatsApp link has an accessible name on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.landing header').getByRole('link', { name: 'Hablar por WhatsApp' })).toBeVisible()
})

test('login menu opens on click and closes on an outside click', async ({ page }) => {
  await page.goto('/')
  await page.locator('.landing .menu > button').click()
  await expect(page.locator('.landing .menu')).toHaveClass(/open/)
  await page.mouse.click(40, 400)
  await expect(page.locator('.landing .menu')).not.toHaveClass(/open/)
})

test('unapproved testimonial is never in the production build', () => {
  const built = '.next/server/app/index.html'
  test.skip(!fs.existsSync(built), 'needs npm run build')
  const html = fs.readFileSync(built, 'utf8')
  expect(html).not.toContain('Antes cuadrábamos la cartera')
})

test('legal pages are server-rendered and linked from the footer', async ({ page, request }) => {
  for (const [path, title] of [['/terminos', 'Términos y condiciones de uso de Operix'], ['/privacidad', 'Política de tratamiento de datos personales']]) {
    const html = await (await request.get(path)).text()
    expect(html).toContain(title)
    expect(html).toContain('Ley 1581')
  }
  await page.goto('/')
  await expect(page.locator('.landing footer a[href="/terminos"]')).toHaveCount(1)
  await expect(page.locator('.landing footer a[href="/privacidad"]')).toHaveCount(1)
  await expect(page.locator('.landing #contacto a[href="/privacidad"]')).toHaveCount(1)
})
