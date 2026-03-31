export function escapeHtml(unsafe: string): string {
  if (!unsafe) return unsafe

  // Define allowed tags (`b|em|strong|br|p`) with optional `style` and `class` attributes
  const allowedTagsPattern =
    '<\\/?\\s*(?:b|em|strong|br|p)(?:\\s+(?:style="[^"]*"|class="[^"]*"))*\\s*>'

  // Regex to match an exact allowed tag
  const exactAllowedTagRegex = new RegExp(`^${allowedTagsPattern}$`, 'i')

  // Regex to split while capturing allowed tags
  const splitRegex = new RegExp(`(${allowedTagsPattern})`, 'gi')

  const parts = unsafe.split(splitRegex)

  return parts
    .map((part) => {
      // If the part is exactly an allowed tag, return it unchanged
      if (exactAllowedTagRegex.test(part)) {
        return part
      }
      // Otherwise, escape special characters and convert newlines to <br>
      return part
        .replaceAll(/&(?!amp;|lt;|gt;|quot;|#039;)/g, '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
        .replaceAll('\n', '<br>')
    })
    .join('')
}
