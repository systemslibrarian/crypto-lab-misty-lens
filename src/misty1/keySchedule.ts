import { assertByteLength } from '../shared/bytes.ts'
import { misty1Fi } from './fi.ts'

export function expandMisty1Key(key: Uint8Array): Uint16Array {
  assertByteLength(key, 16, 'MISTY1 key')
  const expanded = new Uint16Array(32)

  for (let index = 0; index < 8; index += 1) {
    expanded[index] = (key[index * 2]! << 8) | key[index * 2 + 1]!
  }

  for (let index = 0; index < 8; index += 1) {
    expanded[index + 8] = misty1Fi(expanded[index]!, expanded[(index + 1) % 8]!)
    expanded[index + 16] = expanded[index + 8]! & 0x1ff
    expanded[index + 24] = expanded[index + 8]! >>> 9
  }

  return expanded
}