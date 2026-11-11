/**
 * How many actions fit in a row, in reading order, for an action group that
 * folds by width (`overflow: 'auto'`).
 *
 * All of them when they fit side by side. Otherwise as many as fit with the
 * overflow trigger after them, because once one action folds the trigger
 * takes a slot of its own. Never fewer than none: a row too narrow for even
 * the trigger still shows the trigger, and the actions are all in its menu.
 *
 * A row with no width of its own (not laid out yet, hidden, a test
 * environment) keeps every action: an unmeasured row is never folded by
 * mistake.
 *
 * @param widths  Each action's width in px, in reading order.
 * @param available  The room the row has, in px.
 * @param trigger  The overflow trigger's width, in px.
 * @param gap  The space between neighbours, in px.
 */
export function fitActions(
  widths: number[],
  available: number,
  trigger: number,
  gap: number,
): number {
  const total = (list: number[]) =>
    list.reduce((sum, width) => sum + width, 0) +
    gap * Math.max(0, list.length - 1)

  if (available <= 0 || total(widths) <= available) return widths.length

  let used = trigger
  let count = 0
  for (const width of widths) {
    const next = used + gap + width
    if (next > available) break
    used = next
    count++
  }
  return count
}
