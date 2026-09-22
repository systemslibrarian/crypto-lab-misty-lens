export function misty1Fl(input: number, round: number, expandedKey: Uint16Array): number {
  let left = input >>> 16
  let right = input & 0xffff

  if (round % 2 === 0) {
    right = (right ^ (left & expandedKey[round / 2]!)) & 0xffff
    left = (left ^ (right | expandedKey[((round / 2 + 6) % 8) + 8]!)) & 0xffff
  } else {
    right = (right ^ (left & expandedKey[(((round - 1) / 2 + 2) % 8) + 8]!)) & 0xffff
    left = (left ^ (right | expandedKey[((round - 1) / 2 + 4) % 8]!)) & 0xffff
  }

  return ((left << 16) | right) >>> 0
}

export function misty1FlInverse(input: number, round: number, expandedKey: Uint16Array): number {
  let left = input >>> 16
  let right = input & 0xffff

  if (round % 2 === 0) {
    left = (left ^ (right | expandedKey[((round / 2 + 6) % 8) + 8]!)) & 0xffff
    right = (right ^ (left & expandedKey[round / 2]!)) & 0xffff
  } else {
    left = (left ^ (right | expandedKey[((round - 1) / 2 + 4) % 8]!)) & 0xffff
    right = (right ^ (left & expandedKey[(((round - 1) / 2 + 2) % 8) + 8]!)) & 0xffff
  }

  return ((left << 16) | right) >>> 0
}