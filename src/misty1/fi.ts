import { S7, S9 } from './sboxes.ts'

export function misty1Fi(input: number, key: number): number {
  let d9 = input >>> 7
  let d7 = input & 0x7f

  d9 = S9[d9]! ^ d7
  d7 = (S7[d7]! ^ d9) & 0x7f
  d7 ^= key >>> 9
  d9 ^= key & 0x1ff
  d9 = S9[d9]! ^ d7

  return ((d7 << 9) | d9) & 0xffff
}