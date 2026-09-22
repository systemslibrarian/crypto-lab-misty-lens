import { hexToBytes } from '../shared/bytes.ts'

export interface KasumiKnownAnswerVector {
  readonly name: string
  readonly key: Uint8Array
  readonly plaintext: Uint8Array
  readonly ciphertext: Uint8Array
  readonly iterations: number
  readonly source: string
}

export const KASUMI_VECTORS: readonly KasumiKnownAnswerVector[] = [
  {
    name: 'TS 35.203 core test set 1',
    key: hexToBytes('2bd6459f82c5b300952c49104881ff48'),
    plaintext: hexToBytes('ea024714ad5c4d84'),
    ciphertext: hexToBytes('df1f9b251c0bf45f'),
    iterations: 1,
    source: '3GPP TS 35.203, KASUMI test set 1',
  },
  {
    name: 'TS 35.203 core test set 2',
    key: hexToBytes('8ce33e2cc3c0b5fc1f3de8a6dc66b1f3'),
    plaintext: hexToBytes('d3c5d592327fb11c'),
    ciphertext: hexToBytes('de551988ceb2f9b7'),
    iterations: 1,
    source: '3GPP TS 35.203, KASUMI test set 2',
  },
  {
    name: 'TS 35.203 core test set 3',
    key: hexToBytes('4035c6680af8c6d1a8ff8667b1714013'),
    plaintext: hexToBytes('62a540981ba6f9b7'),
    ciphertext: hexToBytes('4592b0e78690f71b'),
    iterations: 1,
    source: '3GPP TS 35.203, KASUMI test set 3',
  },
  {
    name: 'TS 35.203 core test set 4 (50 iterations)',
    key: hexToBytes('3a3b39b5c3f2376d69f7d546e5f85d43'),
    plaintext: hexToBytes('ca49c1c75771ab0b'),
    ciphertext: hexToBytes('738bad4c4a690802'),
    iterations: 50,
    source: '3GPP TS 35.203, KASUMI test set 4',
  },
]