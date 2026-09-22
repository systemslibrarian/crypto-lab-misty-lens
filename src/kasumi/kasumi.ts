import { assertByteLength, readUint32BE, writeUint32BE } from '../shared/bytes.ts'
import { kasumiFl } from './fl.ts'
import { kasumiFo } from './fo.ts'
import { expandKasumiKey } from './keySchedule.ts'

function assertRoundCount(rounds: number): void {
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 8) {
    throw new RangeError('KASUMI round count must be an integer from 1 through 8')
  }
}

export function encryptKasumiBlockRounds(
  block: Uint8Array,
  key: Uint8Array,
  rounds: number,
): Uint8Array {
  assertByteLength(block, 8, 'KASUMI block')
  assertRoundCount(rounds)
  const roundKeys = expandKasumiKey(key)
  let left = readUint32BE(block)
  let right = readUint32BE(block, 4)

  for (let round = 0; round < rounds; round += 1) {
    if (round % 2 === 0) {
      right = (right ^ kasumiFo(kasumiFl(left, round, roundKeys), round, roundKeys)) >>> 0
    } else {
      left = (left ^ kasumiFl(kasumiFo(right, round, roundKeys), round, roundKeys)) >>> 0
    }
  }

  const output = new Uint8Array(8)
  writeUint32BE(left, output)
  writeUint32BE(right, output, 4)
  return output
}

export function encryptKasumiBlock(block: Uint8Array, key: Uint8Array): Uint8Array {
  return encryptKasumiBlockRounds(block, key, 8)
}

export function decryptKasumiBlockRounds(
  block: Uint8Array,
  key: Uint8Array,
  rounds: number,
): Uint8Array {
  assertByteLength(block, 8, 'KASUMI block')
  assertRoundCount(rounds)
  const roundKeys = expandKasumiKey(key)
  let left = readUint32BE(block)
  let right = readUint32BE(block, 4)

  for (let round = rounds - 1; round >= 0; round -= 1) {
    if (round % 2 === 0) {
      right = (right ^ kasumiFo(kasumiFl(left, round, roundKeys), round, roundKeys)) >>> 0
    } else {
      left = (left ^ kasumiFl(kasumiFo(right, round, roundKeys), round, roundKeys)) >>> 0
    }
  }

  const output = new Uint8Array(8)
  writeUint32BE(left, output)
  writeUint32BE(right, output, 4)
  return output
}

export function decryptKasumiBlock(block: Uint8Array, key: Uint8Array): Uint8Array {
  return decryptKasumiBlockRounds(block, key, 8)
}