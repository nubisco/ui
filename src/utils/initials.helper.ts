/**
 * Up to two letters that stand for a person when there is no picture.
 *
 * First and last word of the name when there is one ("Ana Maria Costa" is
 * "AC"), otherwise the first two characters of the email's local part. Shared by
 * NbAvatar and NbUserMenu so a person reads the same everywhere.
 */
export function initialsOf(entity: {
  name?: string | null
  email?: string | null
}): string {
  const name = entity.name?.trim()
  if (name) {
    const parts = name.split(/\s+/)
    const first = parts[0]?.[0] ?? ''
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
    return (first + last).toUpperCase()
  }
  return (entity.email?.trim().split('@')[0] ?? '').slice(0, 2).toUpperCase()
}
