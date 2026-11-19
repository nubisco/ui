/**
 * Reads CSV text into rows of fields, as RFC 4180 has it: a field in double
 * quotes may hold the delimiter, line breaks and `""` for a quote. Line
 * endings may be `\n`, `\r\n` or `\r`, and a final line break adds no row.
 *
 * ```ts
 * parseCsv('Item,Note\nApples,"Red, crisp"')
 * // [['Item', 'Note'], ['Apples', 'Red, crisp']]
 * ```
 *
 * Without a `delimiter`, the one the first line uses most of comma,
 * semicolon and tab is taken, so a file saved by a spreadsheet in a locale
 * with a decimal comma (which writes semicolons) reads the same.
 */
export function parseCsv(text: string, delimiter?: string): string[][] {
  const sep = delimiter ?? detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  // A UTF-8 byte order mark is a spreadsheet's way to say the encoding.
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0
  while (i < text.length) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
      } else field += ch
      i++
      continue
    }
    if (ch === '"' && field === '') {
      quoted = true
    } else if (text.startsWith(sep, i)) {
      row.push(field)
      field = ''
      i += sep.length
      continue
    } else if (ch === '\n' || ch === '\r') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      if (ch === '\r' && text[i + 1] === '\n') i++
    } else field += ch
    i++
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/**
 * Writes rows of fields as CSV. A field is quoted only when it holds the
 * delimiter, a quote or a line break, and lines end in `\r\n` as RFC 4180
 * asks. `null` and `undefined` are empty fields.
 */
export function toCsv(
  rows: ReadonlyArray<ReadonlyArray<unknown>>,
  delimiter: string = ',',
): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text =
            value === null || value === undefined ? '' : String(value)
          return text.includes(delimiter) || /["\r\n]/.test(text)
            ? `"${text.replace(/"/g, '""')}"`
            : text
        })
        .join(delimiter),
    )
    .join('\r\n')
}

// The first line's most frequent candidate, counting only outside quotes.
function detectDelimiter(text: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 }
  let quoted = false
  for (const ch of text) {
    if (ch === '"') quoted = !quoted
    else if (!quoted && (ch === '\n' || ch === '\r')) break
    else if (!quoted && ch in counts) counts[ch]++
  }
  let best = ','
  for (const sep of [';', '\t']) if (counts[sep] > counts[best]) best = sep
  return best
}
