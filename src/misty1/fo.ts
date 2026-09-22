import { misty1Fi } from './fi.ts'

export function misty1Fo(input: number, round: number, expandedKey: Uint16Array): number {
  let left = input >>> 16
  let right = input & 0xffff

  left ^= expandedKey[round]!
  left = misty1Fi(left, expandedKey[((round + 5) % 8) + 8]!)
  left ^= right
  right ^= expandedKey[(round + 2) % 8]!
  right = misty1Fi(right, expandedKey[((round + 1) % 8) + 8]!)
  right ^= left
  left ^= expandedKey[(round + 7) % 8]!
  left = misty1Fi(left, expandedKey[((round + 3) % 8) + 8]!)
  left ^= right
  right ^= expandedKey[(round + 4) % 8]!

  return ((right << 16) | left) >>> 0
}