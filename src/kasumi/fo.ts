import { kasumiFi } from './fi.ts'
import type { KasumiRoundKeys } from './keySchedule.ts'

export function kasumiFo(input: number, round: number, keys: KasumiRoundKeys): number {
  let left = input >>> 16
  let right = input & 0xffff

  left = kasumiFi(left ^ keys.ko1[round]!, keys.ki1[round]!) ^ right
  right = kasumiFi(right ^ keys.ko2[round]!, keys.ki2[round]!) ^ left
  left = kasumiFi(left ^ keys.ko3[round]!, keys.ki3[round]!) ^ right

  return ((right << 16) | left) >>> 0
}