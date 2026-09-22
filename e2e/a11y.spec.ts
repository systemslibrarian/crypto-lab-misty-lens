import { expect, test } from '@playwright/test'
import { boot, driveAllStates, NARROW, watchPageErrors } from './gate.ts'

test('no WCAG 2.1 A/AA violations in every desktop state', async ({ page }) => {
  const errors = watchPageErrors(page)
  await boot(page)
  await driveAllStates(page, 'desktop')
  expect(errors, errors.join('\n')).toEqual([])
})

test('no WCAG 2.1 A/AA violations in every 380px state', async ({ page }) => {
  const errors = watchPageErrors(page)
  await page.setViewportSize(NARROW)
  await boot(page)
  await driveAllStates(page, '380px')
  expect(errors, errors.join('\n')).toEqual([])
})