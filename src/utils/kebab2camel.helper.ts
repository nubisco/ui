/**
 * Converts kebab-case tokens to lower camelCase.
 */
export function kebab2camel(str: string): string {
  return str.toLowerCase().replace(/-([a-z0-9])/g, (g) => {
    return g[1].toUpperCase()
  })
}

export default kebab2camel
