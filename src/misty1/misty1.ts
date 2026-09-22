import { assertByteLength, readUint32BE, writeUint32BE } from '../shared/bytes.ts'
import { misty1Fl, misty1FlInverse } from './fl.ts'
import { misty1Fo } from './fo.ts'
import { expandMisty1Key } from './keySchedule.ts'

function assertRoundCount(rounds: number): void {
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 8) {
    throw new RangeError('MISTY1 round count must be an integer from 1 through 8')
  }
}

export function encryptMisty1CoreRounds(
  block: Uint8Array,
  key: Uint8Array,
  rounds: number,
): Uint8Array {
  assertByteLength(block, 8, 'MISTY1 block')
  assertRoundCount(rounds)
  const expandedKey = expandMisty1Key(key)
  let left = readUint32BE(block)
  let right = readUint32BE(block, 4)

  for (let round = 0; round < rounds; round += 1) {
    if (round % 2 === 0) {
      left = misty1Fl(left, round, expandedKey)
      right = misty1Fl(right, round + 1, expandedKey)
      right = (right ^ misty1Fo(left, round, expandedKey)) >>> 0
    } else {
      left = (left ^ misty1Fo(right, round, expandedKey)) >>> 0
    }
  }

  const output = new Uint8Array(8)
  writeUint32BE(left, output)
  writeUint32BE(right, output, 4)
  return output
}

export function decryptMisty1CoreRounds(
  block: Uint8Array,
  key: Uint8Array,
  rounds: number,
): Uint8Array {
  assertByteLength(block, 8, 'MISTY1 block')
  assertRoundCount(rounds)
  const expandedKey = expandMisty1Key(key)
  let left = readUint32BE(block)
  let right = readUint32BE(block, 4)

  for (let round = rounds - 1; round >= 0; round -= 1) {
    if (round % 2 === 0) {
      right = (right ^ misty1Fo(left, round, expandedKey)) >>> 0
      left = misty1FlInverse(left, round, expandedKey)
      right = misty1FlInverse(right, round + 1, expandedKey)
    } else {
      left = (left ^ misty1Fo(right, round, expandedKey)) >>> 0
    }
  }

  const output = new Uint8Array(8)
  writeUint32BE(left, output)
  writeUint32BE(right, output, 4)
  return output
}

export function encryptMisty1Block(block: Uint8Array, key: Uint8Array): Uint8Array {
  assertByteLength(block, 8, 'MISTY1 block')
  const expandedKey = expandMisty1Key(key)
  let left = readUint32BE(block)
  let right = readUint32BE(block, 4)

  for (let round = 0; round < 8; round += 1) {
    if (round % 2 === 0) {
      left = misty1Fl(left, round, expandedKey)
      right = misty1Fl(right, round + 1, expandedKey)
      right = (right ^ misty1Fo(left, round, expandedKey)) >>> 0
    } else {
      left = (left ^ misty1Fo(right, round, expandedKey)) >>> 0
    }
  }

  left = misty1Fl(left, 8, expandedKey)
  right = misty1Fl(right, 9, expandedKey)

  const output = new Uint8Array(8)
  writeUint32BE(right, output)
  writeUint32BE(left, output, 4)
  return output
}

export function decryptMisty1Block(block: Uint8Array, key: Uint8Array): Uint8Array {
  assertByteLength(block, 8, 'MISTY1 block')
  const expandedKey = expandMisty1Key(key)
  let right = readUint32BE(block)
  let left = readUint32BE(block, 4)

  left = misty1FlInverse(left, 8, expandedKey)
  right = misty1FlInverse(right, 9, expandedKey)

  for (let round = 7; round >= 0; round -= 1) {
    if (round % 2 === 0) {
      right = (right ^ misty1Fo(left, round, expandedKey)) >>> 0
      left = misty1FlInverse(left, round, expandedKey)
      right = misty1FlInverse(right, round + 1, expandedKey)
    } else {
      left = (left ^ misty1Fo(right, round, expandedKey)) >>> 0
    }
  }

  const output = new Uint8Array(8)
  writeUint32BE(left, output)
  writeUint32BE(right, output, 4)
  return output
}