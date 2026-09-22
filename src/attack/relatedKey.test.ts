import { describe, expect, it } from 'vitest'
import { hexToBytes } from '../shared/bytes.ts'
import {
  assertPaperKeyRelation,
  createPaperKeyQuartet,
  RIGHT_QUARTET_FIXTURE_HEX,
  runRelatedKeyDistinguisher,
} from './relatedKey.ts'

const BASE_KEY = hexToBytes('00112233445566778899aabbccddeeff')

describe('CRYPTO 2010 related-key quartet', () => {
  it('derives and accepts the exact four-key relation', () => {
    const keys = createPaperKeyQuartet(BASE_KEY)
    expect(keys.b).toEqual(hexToBytes('00112233c45566778899aabbccddeeff'))
    expect(keys.c).toEqual(hexToBytes('00112233445566778899aabb4cddeeff'))
    expect(keys.d).toEqual(hexToBytes('00112233c45566778899aabb4cddeeff'))
    expect(() => assertPaperKeyRelation(keys)).not.toThrow()
  })

  it('rejects a perturbed relation before showing a verdict', () => {
    const valid = createPaperKeyQuartet(BASE_KEY)
    const invalid = { ...valid, d: valid.d.slice() }
    invalid.d[15] ^= 1
    expect(() => runRelatedKeyDistinguisher('kasumi', new Uint8Array(8), invalid))
      .toThrow(/paper relation/)
  })

  it('computes all four paths with each seven-round cipher', () => {
    const plaintext = hexToBytes('0123456789abcdef')
    for (const cipher of ['kasumi', 'misty1'] as const) {
      const result = runRelatedKeyDistinguisher(cipher, plaintext, createPaperKeyQuartet(BASE_KEY))
      expect(result.rounds).toBe(7)
      expect(result.observedDifference).toHaveLength(8)
      expect(result.expectedDifference).toEqual(hexToBytes('0000000000100000'))
    }
  })

  it('exhibits the distinguisher in KASUMI but not MISTY1', () => {
    const keys = createPaperKeyQuartet(BASE_KEY)
    for (const fixture of RIGHT_QUARTET_FIXTURE_HEX) {
      const plaintext = hexToBytes(fixture)
      expect(runRelatedKeyDistinguisher('kasumi', plaintext, keys).matches).toBe(true)
      expect(runRelatedKeyDistinguisher('misty1', plaintext, keys).matches).toBe(false)
    }
  })
})