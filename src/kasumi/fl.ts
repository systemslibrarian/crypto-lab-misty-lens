import type { KasumiRoundKeys } from './keySchedule.ts'

function rotateLeft1(value: number): number {
  return ((value << 1) | (value >>> 15)) & 0xffff
}

export function kasumiFl(input: number, round: number, keys: KasumiRoundKeys): number {
  let left = input >>> 16
  let right = input & 0xffff

  right ^= rotateLeft1(left & keys.kl1[round]!)
  left ^= rotateLeft1(right | keys.kl2[round]!)

  return ((left << 16) | right) >>> 0
}