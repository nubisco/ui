/**
 * Identity that survives a second copy of the library in one page.
 *
 * An app can end up with two copies of a library module at once. The common
 * way is Vite's dev server: `@nubisco/ui/vite` resolves components through
 * their own entry points (`@nubisco/ui/components/CommandPalette`) while the
 * app imports composables and plugins from the main entry, and the dependency
 * pre-bundler can hold the same source module once in each. A production build
 * merges them, which is why this only ever showed up in development.
 *
 * Two copies of a module mean two of everything it creates at load time. A
 * `Symbol('x')` injection key becomes two different keys, so a plugin provides
 * under one and the component injects under the other and finds nothing. A
 * module-level registry or queue becomes two, so the app writes to one and the
 * component reads the other.
 *
 * `Symbol.for` returns the same symbol from the global registry no matter which
 * copy asks, so it fixes both: as the injection key itself, and as the key of
 * a slot on `globalThis` that holds the one shared value. The names are
 * namespaced (`@nubisco/ui:`) so they never collide with an app's own.
 *
 * With one copy, which is every production build, the behaviour is exactly
 * what a plain `Symbol()` or a module-level `const` gave: one key, one value.
 *
 * If the shape of a shared value ever changes incompatibly, give it a new name
 * (`toast-queue.v2`) so two different library versions in one page do not hand
 * each other a value they cannot read.
 */

/** The namespaced global symbol for `name`. */
export function sharedKey(name: string): symbol {
  return Symbol.for(`@nubisco/ui:${name}`)
}

/**
 * The one value stored under `name` for the whole page, created by `create`
 * the first time any copy of the library asks for it.
 *
 * Hold mutable state as properties of the returned object rather than
 * reassigning a module-level `let`, which a second copy would not see.
 */
export function sharedSingleton<T>(name: string, create: () => T): T {
  const key = sharedKey(name)
  const slots = globalThis as unknown as Record<symbol, T | undefined>
  if (slots[key] === undefined) slots[key] = create()
  return slots[key] as T
}
