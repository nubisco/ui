import type { TBlueprintPinDataType } from './BlueprintCard.types'

/**
 * Whether a wire between ports carrying `a` and `b` passes the built-in type
 * rule. Undeclared and `'any'` types connect to anything, an exact match
 * connects, and a family matches its own members so `audio:mono` can reach
 * `audio:stereo` while `midi` cannot reach either.
 *
 * The rule is the same for the known data types and for any other string a
 * consumer declares: the family is whatever comes before the first `:`.
 *
 * It lives here rather than in the card because two places ask it: every pin,
 * while a wire is in flight (the drop-target affordance), and the canvas, when
 * a host-supplied `canConnect` makes it refuse a drop.
 */
export function arePinTypesCompatible(
  a: TBlueprintPinDataType | undefined,
  b: TBlueprintPinDataType | undefined,
): boolean {
  if (!a || !b || a === 'any' || b === 'any') return true
  if (a === b) return true
  return a.split(':')[0] === b.split(':')[0]
}
