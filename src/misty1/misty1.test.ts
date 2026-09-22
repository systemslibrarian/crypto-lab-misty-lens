import { describe, expect, it } from 'vitest'
import { bytesToHex, hexToBytes } from '../shared/bytes.ts'
import {
  decryptMisty1Block,
  decryptMisty1CoreRounds,
  encryptMisty1Block,
  encryptMisty1CoreRounds,
} from './misty1.ts'
import { MISTY1_VECTORS } from './vectors.ts'

describe('MISTY1', () => {
  for (const vector of MISTY1_VECTORS) {
    it(`matches ${vector.name}`, () => {
      expect(bytesToHex(encryptMisty1Block(vector.plaintext, vector.key)))
        .toBe(bytesToHex(vector.ciphertext))
      expect(bytesToHex(decryptMisty1Block(vector.ciphertext, vector.key)))
        .toBe(bytesToHex(vector.plaintext))
    })
  }

  it('round-trips a non-vector block', () => {
    const key = hexToBytes('ffeeddccbbaa99887766554433221100')
    const plaintext = hexToBytes('0010203040506070')
    expect(decryptMisty1Block(encryptMisty1Block(plaintext, key), key)).toEqual(plaintext)
    expect(decryptMisty1CoreRounds(encryptMisty1CoreRounds(plaintext, key, 7), key, 7))
      .toEqual(plaintext)
  })

  it('rejects wrong key and block sizes', () => {
    expect(() => encryptMisty1Block(new Uint8Array(7), new Uint8Array(16))).toThrow(/8 bytes/)
    expect(() => encryptMisty1Block(new Uint8Array(8), new Uint8Array(15))).toThrow(/16 bytes/)
  })
})