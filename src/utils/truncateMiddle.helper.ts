/**
 * Shortens `text` to at most `max` characters by cutting the middle and
 * joining the two ends with `separator`, so both the start (what kind of thing
 * it is) and the end (which one: a date, a version, a file extension) survive.
 *
 * ```ts
 * truncateMiddle('quarterly-report-final-2026-11-05.pdf', 24)
 * // 'quarterly-r...-11-05.pdf'
 * ```
 *
 * Characters are counted as code points, so an emoji or an accented letter is
 * never split in half. The full string still has to be reachable: render it
 * in a `title`, a tooltip or the accessible name beside the shortened one.
 */
export function truncateMiddle(
  text: string,
  max: number,
  separator: string = '...',
): string {
  const chars = Array.from(text)
  if (chars.length <= max) return text
  const sep = Array.from(separator)
  const room = max - sep.length
  if (room <= 0) return chars.slice(0, Math.max(0, max)).join('')
  // The start gets the extra character when the room is odd: it is the part
  // a reader scans first.
  const head = Math.ceil(room / 2)
  const tail = room - head
  return (
    chars.slice(0, head).join('') +
    separator +
    (tail > 0 ? chars.slice(chars.length - tail).join('') : '')
  )
}
