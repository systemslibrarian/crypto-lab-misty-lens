import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { auditContrast, formatContrastFailures } from './contrast.ts'
import { auditNonText, formatNonTextFailures } from './nontext.ts'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
export const NARROW = { width: 380, height: 800 }

export function watchPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
  return errors
}

async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() => document.getAnimations().every((animation) => {
    const timing = animation.effect?.getComputedTiming()
    return timing?.iterations === Infinity || animation.playState !== 'running'
  }), undefined, { polling: 'raf' })
}

async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement
    if (documentElement.scrollWidth <= documentElement.clientWidth) return null
    const escaped = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.right > documentElement.clientWidth + 1)
      .map(({ element, rect }) => `${element.tagName.toLowerCase()}.${element.className} right=${Math.round(rect.right)}`)
      .slice(0, 8)
    return { scrollWidth: documentElement.scrollWidth, clientWidth: documentElement.clientWidth, escaped }
  })
  expect(overflow, `horizontal overflow in state: ${label}`).toBeNull()
}

async function expectScrollersReachable(page: Page, label: string): Promise<void> {
  const unreachable = await page.evaluate(() => {
    const focusable = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])'
    return Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .filter((element) => element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
      .filter((element) => {
        const style = getComputedStyle(element)
        return ['auto', 'scroll'].includes(style.overflowX) || ['auto', 'scroll'].includes(style.overflowY)
      })
      .filter((element) => element.tabIndex < 0 && !element.querySelector(focusable))
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`)
  })
  expect(unreachable, `scrolling regions without a keyboard route in state: ${label}`).toEqual([])
}

async function expectNoInvisibleFocusTargets(page: Page, label: string): Promise<void> {
  const invisible = await page.evaluate(() => {
    const selector = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])'
    return Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter((element) => element.tabIndex >= 0 && element.checkVisibility({ checkVisibilityCSS: true }))
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        let opacity = 1
        for (let node: Element | null = element; node; node = node.parentElement) {
          opacity *= Number.parseFloat(getComputedStyle(node).opacity)
        }
        return opacity === 0 || rect.width === 0 || rect.height === 0
      })
      .map((element) => `${element.tagName.toLowerCase()}#${element.id}.${element.className}`)
  })
  expect(invisible, `focusable elements that paint nothing in state: ${label}`).toEqual([])
}

export async function boot(page: Page): Promise<void> {
  page.setDefaultTimeout(20_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('.')

  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('[role="banner"]')).toHaveCount(1)
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.getByRole('tab')).toHaveCount(3)
  await expect(page.locator('a.cl-skip-link')).toHaveAttribute('href', '#app')
  await expect(page.locator('#app')).toHaveCount(1)
  await expect(page.locator('[data-theme-toggle], #theme-toggle, #themeToggle')).toHaveCount(0)

  await expect(page.getByRole('tab', { name: '1. The Two Ciphers' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-kat="misty1"]')).toContainText('2/2 KATs match')
  await expect(page.locator('[data-kat="kasumi"]')).toContainText('4/4 KATs match')
  await expect(page.locator('[data-testid="misty-output"]')).toHaveText('8b1da5f56ab3d07c')
  await expect(page.locator('[data-testid="kasumi-output"]')).toHaveText('17ff0f37f134045d')
  await expect(page.locator('#panel-diff')).toBeHidden()
  await expect(page.locator('#panel-attack')).toBeHidden()
}

export async function scan(page: Page, label: string): Promise<void> {
  await settle(page)

  const wcag = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const landmarks = await new AxeBuilder({ page })
    .withRules([
      'landmark-no-duplicate-banner',
      'landmark-unique',
      'landmark-one-main',
      'landmark-complementary-is-top-level',
    ])
    .analyze()

  const violations = [...wcag.violations, ...landmarks.violations].map((violation) => ({
    state: label,
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target.join(' ')).slice(0, 8),
  }))
  expect(violations, `axe violations in state: ${label}`).toEqual([])

  const incomplete = [...wcag.incomplete, ...landmarks.incomplete]
    .filter((result) => result.id !== 'color-contrast')
    .map((result) => ({ id: result.id, nodes: result.nodes.map((node) => node.target.join(' ')).slice(0, 8) }))
  expect(incomplete, `axe incomplete results in state: ${label}`).toEqual([])

  const contrast = Array.from(new Set(formatContrastFailures(await auditContrast(page))))
  expect(contrast, `measured text contrast failures in state: ${label}`).toEqual([])

  const hiddenContrast = Array.from(new Set(formatContrastFailures(
    await auditContrast(page, '[aria-hidden="true"], [aria-hidden="true"] *', true),
  )))
  expect(hiddenContrast, `measured aria-hidden contrast failures in state: ${label}`).toEqual([])

  const nonText = Array.from(new Set(formatNonTextFailures(await auditNonText(page))))
  expect(nonText, `non-text contrast failures in state: ${label}`).toEqual([])

  await expectNoHorizontalOverflow(page, label)
  await expectScrollersReachable(page, label)
  await expectNoInvisibleFocusTargets(page, label)
}

async function openTab(page: Page, name: string, panelId: string): Promise<void> {
  await page.getByRole('tab', { name }).click()
  await expect(page.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator(panelId)).toBeVisible()
}

export async function driveAllStates(page: Page, viewportLabel: string): Promise<void> {
  const scanAt = (state: string): Promise<void> => scan(page, `${viewportLabel} / ${state}`)

  await scanAt('arrival with both KAT badges and live cipher outputs')

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('Tab')
  await expect(page.locator('a.cl-skip-link')).toBeFocused()
  await scanAt('skip link focused')

  await page.fill('#cipher-key', 'zz')
  await expect(page.locator('#cipher-key')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#cipher-error')).toContainText('exactly 32 hex characters')
  await scanAt('malformed key rejected')

  await page.getByRole('button', { name: 'Load RFC 2994 block' }).click()
  await page.getByRole('radio', { name: 'Decrypt' }).check()
  await page.fill('#cipher-block', '8b1da5f56ab3d07c')
  await expect(page.locator('[data-testid="misty-output"]')).toHaveText('0123456789abcdef')
  await scanAt('decrypt mode with RFC ciphertext')

  await openTab(page, '2. The Diff', '#panel-diff')
  await expect(page.locator('.component-block[aria-pressed="true"]')).toHaveCount(2)
  await scanAt('diff key schedule selected')

  await page.getByRole('button', { name: /FI S9/ }).first().click()
  await expect(page.locator('#diff-inspector-title')).toHaveText('FI is not the same nonlinear function')
  await scanAt('diff FI selected')

  await page.getByRole('button', { name: /FL AND/ }).first().click()
  await expect(page.locator('#diff-inspector-title')).toHaveText('FL moved and gained one-bit rotations')
  await scanAt('diff FL selected')

  await openTab(page, '3. The Attack', '#panel-attack')
  await expect(page.locator('#kasumi-attack-verdict')).toHaveAttribute('data-matches', 'true')
  await expect(page.locator('#misty-attack-verdict')).toHaveAttribute('data-matches', 'false')
  await expect(page.locator('#negative-claim')).toBeVisible()
  await scanAt('right quartet computed with limitation visible')

  for (let step = 2; step <= 5; step += 1) {
    await page.getByRole('button', { name: /Advance stage|Review from stage 1/ }).click()
    await expect(page.locator('#stage-count')).toHaveText(`Stage ${step} of 5`)
  }
  await scanAt('final comparison stage selected')

  await page.selectOption('#attack-fixture', RIGHT_QUARTET_OPTION_TWO)
  await expect(page.locator('#kasumi-attack-verdict')).toHaveAttribute('data-matches', 'true')
  await scanAt('second right quartet recomputed')

  await page.getByRole('radio', { name: 'Break one bit' }).check()
  await expect(page.locator('#relation-error')).toContainText('Rejected')
  await expect(page.locator('#attack-results')).toBeHidden()
  await expect(page.locator('#quartet-flow')).toBeHidden()
  await scanAt('invalid key relation rejected without verdict')

  await page.getByRole('radio', { name: 'Paper relation' }).check()
  await expect(page.locator('#attack-results')).toBeVisible()
  await expect(page.locator('#negative-claim')).toContainText('NOT a live GSM-call break')
  await scanAt('valid relation restored with negative claim')

  await page.getByText('Primary sources and scope', { exact: true }).click()
  await expect(page.locator('.attack-sources[open]')).toHaveCount(1)
  await scanAt('primary source disclosure open')

  await page.getByRole('button', { name: 'Run seven rounds' }).hover()
  await scanAt('primary action hovered')
  await page.getByRole('tab', { name: '3. The Attack' }).focus()
  await scanAt('active tab focused')
}

const RIGHT_QUARTET_OPTION_TWO = 'a5a5e978f14c091f'