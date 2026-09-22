import {
  decryptKasumiBlockRounds,
  encryptKasumiBlockRounds,
} from '../kasumi/kasumi.ts'
import {
  decryptMisty1CoreRounds,
  encryptMisty1CoreRounds,
} from '../misty1/misty1.ts'
import { assertByteLength, bytesToHex, hexToBytes } from '../shared/bytes.ts'

const INPUT_DIFFERENCE = hexToBytes('0000000000100000')
const KEY_DIFFERENCE_AB = hexToBytes('00000000800000000000000000000000')
const KEY_DIFFERENCE_AC = hexToBytes('00000000000000000000000080000000')

// Found by a deterministic scan under the paper's exact seven-round procedure.
// Only the inputs are pinned; every quartet output is recomputed by this module.
export const RIGHT_QUARTET_FIXTURE_HEX = [
  'a5a5b4ce1d771d69',
  'a5a5e978f14c091f',
  'a5a5f9c35bdeece8',
  'a5a5c58d12c8ca0f',
] as const

export type ReducedCipher = 'kasumi' | 'misty1'

export interface RelatedKeyQuartet {
  readonly a: Uint8Array
  readonly b: Uint8Array
  readonly c: Uint8Array
  readonly d: Uint8Array
}

export interface DistinguisherResult {
  readonly cipher: ReducedCipher
  readonly rounds: 7
  readonly plaintextA: Uint8Array
  readonly plaintextB: Uint8Array
  readonly ciphertextA: Uint8Array
  readonly ciphertextB: Uint8Array
  readonly ciphertextC: Uint8Array
  readonly ciphertextD: Uint8Array
  readonly plaintextC: Uint8Array
  readonly plaintextD: Uint8Array
  readonly observedDifference: Uint8Array
  readonly expectedDifference: Uint8Array
  readonly matches: boolean
}

function xorBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
  if (left.length !== right.length) {
    throw new RangeError('XOR inputs must have equal lengths')
  }
  return Uint8Array.from(left, (byte, index) => byte ^ right[index]!)
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((byte, index) => byte === right[index])
}

export function createPaperKeyQuartet(baseKey: Uint8Array): RelatedKeyQuartet {
  assertByteLength(baseKey, 16, 'Related-key base key')
  const a = baseKey.slice()
  const b = xorBytes(a, KEY_DIFFERENCE_AB)
  const c = xorBytes(a, KEY_DIFFERENCE_AC)
  const d = xorBytes(b, KEY_DIFFERENCE_AC)
  return { a, b, c, d }
}

export function assertPaperKeyRelation(keys: RelatedKeyQuartet): void {
  for (const [label, key] of Object.entries(keys)) {
    assertByteLength(key, 16, `Related key ${label.toUpperCase()}`)
  }

  const expected = createPaperKeyQuartet(keys.a)
  if (!equalBytes(keys.b, expected.b) || !equalBytes(keys.c, expected.c) || !equalBytes(keys.d, expected.d)) {
    throw new Error('Keys must satisfy the paper relation: ΔK3 = 0x8000 and ΔK7 = 0x8000')
  }
}

export function runRelatedKeyDistinguisher(
  cipher: ReducedCipher,
  plaintextA: Uint8Array,
  keys: RelatedKeyQuartet,
): DistinguisherResult {
  assertByteLength(plaintextA, 8, 'Distinguisher plaintext')
  assertPaperKeyRelation(keys)

  const encrypt = cipher === 'kasumi' ? encryptKasumiBlockRounds : encryptMisty1CoreRounds
  const decrypt = cipher === 'kasumi' ? decryptKasumiBlockRounds : decryptMisty1CoreRounds
  const plaintextB = xorBytes(plaintextA, INPUT_DIFFERENCE)
  const ciphertextA = encrypt(plaintextA, keys.a, 7)
  const ciphertextB = encrypt(plaintextB, keys.b, 7)
  const ciphertextC = xorBytes(ciphertextA, INPUT_DIFFERENCE)
  const ciphertextD = xorBytes(ciphertextB, INPUT_DIFFERENCE)
  const plaintextC = decrypt(ciphertextC, keys.c, 7)
  const plaintextD = decrypt(ciphertextD, keys.d, 7)
  const observedDifference = xorBytes(plaintextC, plaintextD)

  return {
    cipher,
    rounds: 7,
    plaintextA: plaintextA.slice(),
    plaintextB,
    ciphertextA,
    ciphertextB,
    ciphertextC,
    ciphertextD,
    plaintextC,
    plaintextD,
    observedDifference,
    expectedDifference: INPUT_DIFFERENCE.slice(),
    matches: equalBytes(observedDifference, INPUT_DIFFERENCE),
  }
}

export function summarizeDistinguisher(result: DistinguisherResult): string {
  return `${result.cipher}:${bytesToHex(result.observedDifference)}:${result.matches ? 'match' : 'miss'}`
}