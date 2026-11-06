/**
 * The plural forms a language may need. `one` and `other` are required
 * because every language the library is likely to meet has them; the rest are
 * chosen by `Intl.PluralRules` only where the locale uses them (`few` in
 * Polish, `two` in Arabic, `zero` in Latvian).
 */
export interface IPluralForms {
  zero?: string
  one: string
  two?: string
  few?: string
  many?: string
  other: string
}

const rulesCache = new Map<string, Intl.PluralRules>()
const numberCache = new Map<string, Intl.NumberFormat>()

function cached<T>(cache: Map<string, T>, locale: string, make: () => T): T {
  let value = cache.get(locale)
  if (!value) {
    value = make()
    cache.set(locale, value)
  }
  return value
}

/**
 * Picks the plural form for `count` with `Intl.PluralRules`, and replaces
 * `{count}` in it with the number formatted for the same locale.
 *
 * ```ts
 * pluralize(1, { one: '{count} card', other: '{count} cards' }) // '1 card'
 * pluralize(1200, { one: '{count} card', other: '{count} cards' }) // '1,200 cards'
 * ```
 *
 * Never a ternary on `count === 1`: English has two forms, and Polish,
 * Russian and Arabic have more, with boundaries a ternary cannot express.
 */
export function pluralize(
  count: number,
  forms: IPluralForms,
  locale: string = 'en',
): string {
  const rules = cached(rulesCache, locale, () => new Intl.PluralRules(locale))
  const category = rules.select(count) as keyof IPluralForms
  const form = forms[category] ?? forms.other
  if (!form.includes('{count}')) return form
  const number = cached(
    numberCache,
    locale,
    () => new Intl.NumberFormat(locale),
  ).format(count)
  return form.split('{count}').join(number)
}
