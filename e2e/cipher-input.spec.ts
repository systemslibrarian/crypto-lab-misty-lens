import { expect, test } from '@playwright/test'

test('invalid block-cipher inputs retire all seven results and keep the operation labels current', async ({ page }) => {
  await page.goto('.')
  const key = page.locator('#cipher-key')
  const block = page.locator('#cipher-block')
  const outputs = page.locator('#misty-result, #kasumi-result, #misty-roundtrip, #kasumi-roundtrip, #misty-verdict, #kasumi-verdict, #comparison-verdict')
  const originalKey = await key.inputValue()
  const originalBlock = await block.inputValue()

  await expect(page.locator('#misty-result')).toHaveText('8b1da5f56ab3d07c')
  await expect(page.locator('#kasumi-result')).toHaveText('17ff0f37f134045d')
  await expect(outputs).toHaveCount(7)
  for (const field of [key, block]) {
    await field.fill('z')
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#cipher-error')).toBeVisible()
    await expect(outputs).toHaveText(Array(7).fill(''))
    await expect(outputs.and(page.locator('.verdict-pass, .verdict-fail, .verdict-note'))).toHaveCount(0)
    await page.locator('input[value="decrypt"]').check()
    await expect(page.locator('#block-label')).toHaveText('Ciphertext block')
    await expect(page.locator('#misty-result-label')).toHaveText('Plaintext')
    await expect(page.locator('#kasumi-result-label')).toHaveText('Plaintext')
    await expect(outputs).toHaveText(Array(7).fill(''))
    await field.fill(field === key ? originalKey : originalBlock)
    await expect(page.locator('#misty-roundtrip')).toHaveText(originalBlock)
    await expect(page.locator('#kasumi-roundtrip')).toHaveText(originalBlock)
    await page.locator('input[value="encrypt"]').check()
    await expect(page.locator('#misty-result')).toHaveText('8b1da5f56ab3d07c')
  }
})
