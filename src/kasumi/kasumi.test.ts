import { describe, expect, it } from 'vitest'
import { bytesToHex, hexToBytes } from '../shared/bytes.ts'
import {
  decryptKasumiBlock,
  decryptKasumiBlockRounds,
  encryptKasumiBlock,
  encryptKasumiBlockRounds,
} from './kasumi.ts'
import { KASUMI_VECTORS } from './vectors.ts'

describe('KASUMI', () => {
  for (const vector of KASUMI_VECTORS) {
    it(`matches ${vector.name}`, () => {
      let actual = vector.plaintext
      for (let iteration = 0; iteration < vector.iterations; iteration += 1) {
        actual = encryptKasumiBlock(actual, vector.key)
      }
      expect(bytesToHex(actual)).toBe(bytesToHex(vector.ciphertext))

      for (let iteration = 0; iteration < vector.iterations; iteration += 1) {
        actual = decryptKasumiBlock(actual, vector.key)
      }
      expect(bytesToHex(actual)).toBe(bytesToHex(vector.plaintext))
    })
  }

  it('round-trips a non-vector block', () => {
    const key = hexToBytes('00112233445566778899aabbccddeeff')
    const plaintext = hexToBytes('0123456789abcdef')
    expect(decryptKasumiBlock(encryptKasumiBlock(plaintext, key), key)).toEqual(plaintext)
    expect(decryptKasumiBlockRounds(encryptKasumiBlockRounds(plaintext, key, 7), key, 7))
      .toEqual(plaintext)
  })

  it('rejects invalid sizes and reduced-round counts', () => {
    expect(() => encryptKasumiBlock(new Uint8Array(7), new Uint8Array(16))).toThrow(/8 bytes/)
    expect(() => encryptKasumiBlock(new Uint8Array(8), new Uint8Array(15))).toThrow(/16 bytes/)
    expect(() => encryptKasumiBlockRounds(new Uint8Array(8), new Uint8Array(16), 0)).toThrow(/1 through 8/)
  })
})