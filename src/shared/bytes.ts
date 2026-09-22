export function assertByteLength(value: Uint8Array, expected: number, label: string): void {
  if (value.length !== expected) {
    throw new RangeError(`${label} must be exactly ${expected} bytes`)
  }
}

export function readUint32BE(bytes: Uint8Array, offset = 0): number {
  return (
    bytes[offset]! * 0x1000000
    + bytes[offset + 1]! * 0x10000
    + bytes[offset + 2]! * 0x100
    + bytes[offset + 3]!
  ) >>> 0
}

export function writeUint32BE(value: number, output: Uint8Array, offset = 0): void {
  output[offset] = value >>> 24
  output[offset + 1] = value >>> 16
  output[offset + 2] = value >>> 8
  output[offset + 3] = value
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.replaceAll(/\s/g, '').toLowerCase()
  if (!/^[0-9a-f]*$/.test(normalized) || normalized.length % 2 !== 0) {
    throw new TypeError('Hex input must contain complete bytes using only 0-9 and a-f')
  }

  return Uint8Array.from(
    normalized.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
  )
}