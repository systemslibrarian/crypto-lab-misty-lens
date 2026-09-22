import { assertByteLength } from '../shared/bytes.ts'

const CONSTANTS = Uint16Array.from([
  0x0123, 0x4567, 0x89ab, 0xcdef, 0xfedc, 0xba98, 0x7654, 0x3210,
])

function rotateLeft16(value: number, count: number): number {
  return ((value << count) | (value >>> (16 - count))) & 0xffff
}

export interface KasumiRoundKeys {
  readonly kl1: Uint16Array
  readonly kl2: Uint16Array
  readonly ko1: Uint16Array
  readonly ko2: Uint16Array
  readonly ko3: Uint16Array
  readonly ki1: Uint16Array
  readonly ki2: Uint16Array
  readonly ki3: Uint16Array
}

export function expandKasumiKey(keyBytes: Uint8Array): KasumiRoundKeys {
  assertByteLength(keyBytes, 16, 'KASUMI key')
  const key = new Uint16Array(8)
  const derived = new Uint16Array(8)
  const roundKeys: KasumiRoundKeys = {
    kl1: new Uint16Array(8),
    kl2: new Uint16Array(8),
    ko1: new Uint16Array(8),
    ko2: new Uint16Array(8),
    ko3: new Uint16Array(8),
    ki1: new Uint16Array(8),
    ki2: new Uint16Array(8),
    ki3: new Uint16Array(8),
  }

  for (let index = 0; index < 8; index += 1) {
    key[index] = (keyBytes[index * 2]! << 8) | keyBytes[index * 2 + 1]!
    derived[index] = key[index]! ^ CONSTANTS[index]!
  }

  for (let round = 0; round < 8; round += 1) {
    roundKeys.kl1[round] = rotateLeft16(key[round]!, 1)
    roundKeys.kl2[round] = derived[(round + 2) & 7]!
    roundKeys.ko1[round] = rotateLeft16(key[(round + 1) & 7]!, 5)
    roundKeys.ko2[round] = rotateLeft16(key[(round + 5) & 7]!, 8)
    roundKeys.ko3[round] = rotateLeft16(key[(round + 6) & 7]!, 13)
    roundKeys.ki1[round] = derived[(round + 4) & 7]!
    roundKeys.ki2[round] = derived[(round + 3) & 7]!
    roundKeys.ki3[round] = derived[(round + 7) & 7]!
  }

  return roundKeys
}