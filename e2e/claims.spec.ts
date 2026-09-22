import { expect, test } from '@playwright/test'

function xorHex(left: string, right: string): string {
  return (BigInt(`0x${left}`) ^ BigInt(`0x${right}`)).toString(16).padStart(16, '0')
}

test.beforeEach(async ({ page }) => {
  await page.goto('.')
})

test('both cipher claims are backed by their rendered known answers', async ({ page }) => {
  await expect(page.locator('[data-kat="misty1"]')).toHaveText(/2\/2 KATs match/)
  await expect(page.locator('[data-kat="kasumi"]')).toHaveText(/4\/4 KATs match/)

  const misty = await page.locator('[data-testid="misty-output"]').textContent()
  const kasumi = await page.locator('[data-testid="kasumi-output"]').textContent()
  expect(misty).toBe('8b1da5f56ab3d07c')
  expect(kasumi).toBe('17ff0f37f134045d')
  expect(misty).not.toBe(kasumi)

  await page.fill('#cipher-block', 'fedcba9876543210')
  await expect(page.locator('[data-testid="misty-output"]')).not.toHaveText(misty ?? '')
})

test('the displayed quartet difference is independently recomputed', async ({ page }) => {
  await page.getByRole('tab', { name: '3. The Attack' }).click()

  const plaintextC = (await page.locator('#flow-pc').textContent())!.split(' ')[1]!
  const plaintextD = (await page.locator('#flow-pd').textContent())!.split(' ')[1]!
  const displayedDifference = await page.locator('#flow-difference').textContent()

  expect(displayedDifference).toBe(xorHex(plaintextC, plaintextD))
  expect(displayedDifference).toBe('0000000000100000')
  await expect(page.locator('#kasumi-attack-verdict')).toHaveAttribute('data-matches', 'true')
  await expect(page.locator('#misty-attack-verdict')).toHaveAttribute('data-matches', 'false')

  const before = await page.locator('#kasumi-observed').textContent()
  await page.selectOption('#attack-fixture', 'a5a5e978f14c091f')
  await expect(page.locator('#kasumi-observed')).toHaveText('Pc xor Pd = 0000000000100000')
  expect(await page.locator('#flow-pa').textContent()).toContain('a5a5e978f14c091f')
  expect(await page.locator('#kasumi-observed').textContent()).toBe(before)
})

test('an invalid key relation fails closed and retires the result', async ({ page }) => {
  await page.getByRole('tab', { name: '3. The Attack' }).click()
  await expect(page.locator('#attack-results')).toBeVisible()

  await page.getByRole('radio', { name: 'Break one bit' }).check()
  await expect(page.locator('#relation-error')).toContainText('No distinguisher verdict was produced')
  await expect(page.locator('#attack-results')).toBeHidden()
  await expect(page.locator('#quartet-flow')).toBeHidden()

  await page.getByRole('radio', { name: 'Paper relation' }).check()
  await expect(page.locator('#relation-error')).toBeEmpty()
  await expect(page.locator('#attack-results')).toBeVisible()
})

test('the related-key limitation stays visible with the successful fixture', async ({ page }) => {
  await page.getByRole('tab', { name: '3. The Attack' }).click()
  await expect(page.locator('#kasumi-attack-verdict')).toContainText('MATCH: distinguisher present')
  await expect(page.locator('#negative-claim')).toBeVisible()
  await expect(page.locator('#negative-claim')).toContainText('Deployed A5/3 does not expose that related-key oracle')
  await expect(page.locator('#negative-claim')).toContainText('NOT a live GSM-call break')
})

test('hidden tabpanels stay hidden until their real tabs are selected', async ({ page }) => {
  await expect(page.locator('#panel-diff')).toBeHidden()
  await expect(page.locator('#panel-attack')).toBeHidden()
  await page.getByRole('tab', { name: '2. The Diff' }).click()
  await expect(page.locator('#panel-ciphers')).toBeHidden()
  await expect(page.locator('#panel-diff')).toBeVisible()
})