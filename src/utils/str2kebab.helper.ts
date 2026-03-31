/**
 * Normalizes an identifier-like string into kebab-case.
 * Handles camelCase, PascalCase, snake_case, and whitespace-delimited input.
 */
export function str2kebab(source: string): string {
  return source
    .replace(/(?<=[A-Z0-9])([A-Z])(?=[a-z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

export default str2kebab
