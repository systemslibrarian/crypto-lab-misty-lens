import { hexToBytes } from '../shared/bytes.ts'

export interface Misty1KnownAnswerVector {
  readonly name: string
  readonly key: Uint8Array
  readonly plaintext: Uint8Array
  readonly ciphertext: Uint8Array
  readonly source: string
}

const RFC_KEY = hexToBytes('00112233445566778899aabbccddeeff')

export const MISTY1_VECTORS: readonly Misty1KnownAnswerVector[] = [
  {
    name: 'RFC 2994 Appendix A, ECB block 1',
    key: RFC_KEY,
    plaintext: hexToBytes('0123456789abcdef'),
    ciphertext: hexToBytes('8b1da5f56ab3d07c'),
    source: 'RFC 2994 Appendix A',
  },
  {
    name: 'RFC 2994 Appendix A, ECB block 2',
    key: RFC_KEY,
    plaintext: hexToBytes('fedcba9876543210'),
    ciphertext: hexToBytes('04b68240b13be95d'),
    source: 'RFC 2994 Appendix A',
  },
]