import { describe, expect, it } from 'vitest'
import { verifyKasumiKnownAnswers, verifyMisty1KnownAnswers } from './verification.ts'

describe('runtime KAT summaries', () => {
  it('reports every MISTY1 fixture passing', () => {
    expect(verifyMisty1KnownAnswers()).toEqual({ passed: 2, total: 2, allPassed: true })
  })

  it('reports every KASUMI fixture passing', () => {
    expect(verifyKasumiKnownAnswers()).toEqual({ passed: 4, total: 4, allPassed: true })
  })
})