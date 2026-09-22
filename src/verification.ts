import { decryptKasumiBlock, encryptKasumiBlock } from './kasumi/kasumi.ts'
import { KASUMI_VECTORS } from './kasumi/vectors.ts'
import { decryptMisty1Block, encryptMisty1Block } from './misty1/misty1.ts'
import { MISTY1_VECTORS } from './misty1/vectors.ts'
import { bytesToHex } from './shared/bytes.ts'

export interface KatSummary {
  readonly passed: number
  readonly total: number
  readonly allPassed: boolean
}

export function verifyMisty1KnownAnswers(): KatSummary {
  let passed = 0
  for (const vector of MISTY1_VECTORS) {
    const encrypted = encryptMisty1Block(vector.plaintext, vector.key)
    const decrypted = decryptMisty1Block(vector.ciphertext, vector.key)
    if (
      bytesToHex(encrypted) === bytesToHex(vector.ciphertext)
      && bytesToHex(decrypted) === bytesToHex(vector.plaintext)
    ) {
      passed += 1
    }
  }
  return { passed, total: MISTY1_VECTORS.length, allPassed: passed === MISTY1_VECTORS.length }
}

export function verifyKasumiKnownAnswers(): KatSummary {
  let passed = 0
  for (const vector of KASUMI_VECTORS) {
    let value = vector.plaintext
    for (let iteration = 0; iteration < vector.iterations; iteration += 1) {
      value = encryptKasumiBlock(value, vector.key)
    }
    const encryptedMatches = bytesToHex(value) === bytesToHex(vector.ciphertext)
    for (let iteration = 0; iteration < vector.iterations; iteration += 1) {
      value = decryptKasumiBlock(value, vector.key)
    }
    if (encryptedMatches && bytesToHex(value) === bytesToHex(vector.plaintext)) {
      passed += 1
    }
  }
  return { passed, total: KASUMI_VECTORS.length, allPassed: passed === KASUMI_VECTORS.length }
}