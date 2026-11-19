import { fromSerial } from './dates'
import { numberToText } from './values'

// TEXT's format codes, the practical subset of Excel's:
//   Numbers: 0 # ? (? reads as #), '.', ',' for thousands (or, after the
//   last digit, to divide by 1000), % (multiplies by 100), E+ and E- for
//   scientific notation, up to four sections split by ';' (positive,
//   negative, zero, text with @).
//   Dates and times: yyyy yy m mm mmm mmmm d dd ddd dddd h hh mm (minutes
//   after h or before s) ss AM/PM A/P.
//   Literals: "quoted text", \x escapes, and any other character as is.
// Square-bracket codes (colours, conditions, elapsed time) are dropped.
// Digit placeholders split by literals ('000-0000') are not interleaved:
// the whole number goes where the first group is.
// Output always uses '.' for decimals and ',' for thousands, since TEXT
// returns stored text, not a display in the reader's locale.

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

type TPart =
  | { kind: 'literal'; text: string }
  | { kind: 'date'; code: string }
  | { kind: 'ampm'; short: boolean }
  | { kind: 'number'; text: string }

const textOf = (part: TPart) =>
  part.kind === 'literal' || part.kind === 'number' ? part.text : ''

/** Splits a format on ';' outside quotes and escapes. */
function sections(format: string): string[] {
  const out: string[] = []
  let current = ''
  for (let i = 0; i < format.length; i++) {
    const char = format[i]
    if (char === '"') {
      const close = format.indexOf('"', i + 1)
      const end = close < 0 ? format.length : close + 1
      current += format.slice(i, end)
      i = end - 1
    } else if (char === '\\') {
      current += format.slice(i, i + 2)
      i++
    } else if (char === ';') {
      out.push(current)
      current = ''
    } else current += char
  }
  out.push(current)
  return out
}

function parts(format: string): TPart[] {
  const list: TPart[] = []
  const literal = (text: string) => {
    const last = list[list.length - 1]
    if (last && last.kind === 'literal') last.text += text
    else list.push({ kind: 'literal', text })
  }
  let i = 0
  while (i < format.length) {
    const char = format[i]
    const lower = char.toLowerCase()
    if (char === '"') {
      const close = format.indexOf('"', i + 1)
      const end = close < 0 ? format.length : close
      literal(format.slice(i + 1, end))
      i = end + 1
    } else if (char === '\\') {
      literal(format[i + 1] ?? '')
      i += 2
    } else if (char === '[') {
      const close = format.indexOf(']', i)
      i = close < 0 ? format.length : close + 1
    } else if (format.slice(i, i + 5).toUpperCase() === 'AM/PM') {
      list.push({ kind: 'ampm', short: false })
      i += 5
    } else if (format.slice(i, i + 3).toUpperCase() === 'A/P') {
      list.push({ kind: 'ampm', short: true })
      i += 3
    } else if ('ymdhs'.includes(lower)) {
      let j = i
      while (j < format.length && format[j].toLowerCase() === lower) j++
      list.push({ kind: 'date', code: lower.repeat(j - i) })
      i = j
    } else if (
      '0#?.,%'.includes(char) ||
      (lower === 'e' && /[+-]/.test(format[i + 1] ?? ''))
    ) {
      const length = lower === 'e' ? 2 : 1
      const last = list[list.length - 1]
      if (last && last.kind === 'number')
        last.text += format.slice(i, i + length)
      else list.push({ kind: 'number', text: format.slice(i, i + length) })
      i += length
    } else {
      literal(char)
      i++
    }
  }
  return list
}

const pad = (n: number, width: number) => String(n).padStart(width, '0')

function formatDate(serial: number, list: TPart[]): string {
  const d = fromSerial(serial)
  const twelveHour = list.some((part) => part.kind === 'ampm')
  const codes = list.filter((part) => part.kind === 'date') as {
    code: string
  }[]
  let out = ''
  for (const part of list) {
    if (part.kind === 'literal') out += part.text
    else if (part.kind === 'number') out += part.text
    else if (part.kind === 'ampm') {
      const pm = d.hours >= 12
      out += part.short ? (pm ? 'P' : 'A') : pm ? 'PM' : 'AM'
    } else {
      const index = codes.indexOf(part)
      const code = part.code
      switch (code[0]) {
        case 'y':
          out += code.length <= 2 ? pad(d.year % 100, 2) : String(d.year)
          break
        case 'd':
          if (code.length === 1) out += d.day
          else if (code.length === 2) out += pad(d.day, 2)
          else if (code.length === 3) out += DAYS[d.weekday].slice(0, 3)
          else out += DAYS[d.weekday]
          break
        case 'h': {
          const hours = twelveHour ? d.hours % 12 || 12 : d.hours
          out += code.length === 1 ? hours : pad(hours, 2)
          break
        }
        case 's':
          out += code.length === 1 ? d.seconds : pad(d.seconds, 2)
          break
        default: {
          // 'm' and 'mm' are minutes right after an hour or right before a
          // second, and months anywhere else.
          const before = codes[index - 1]?.code[0]
          const after = codes[index + 1]?.code[0]
          if (code.length <= 2 && (before === 'h' || after === 's')) {
            out += code.length === 1 ? d.minutes : pad(d.minutes, 2)
          } else if (code.length === 1) out += d.month
          else if (code.length === 2) out += pad(d.month, 2)
          else if (code.length === 3) out += MONTHS[d.month - 1].slice(0, 3)
          else if (code.length === 4) out += MONTHS[d.month - 1]
          else out += MONTHS[d.month - 1][0]
        }
      }
    }
  }
  return out
}

// Rounds half away from zero, cleaning binary noise first (1.005 -> 1.01).
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(Number((value * factor).toPrecision(15))) / factor
}

function group(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatNumber(value: number, pattern: string, percent: number): string {
  let n = Math.abs(value) * Math.pow(100, percent)
  const exponentAt = pattern.search(/[eE][+-]/)
  const mantissa = exponentAt < 0 ? pattern : pattern.slice(0, exponentAt)

  const point = mantissa.indexOf('.')
  let integer = point < 0 ? mantissa : mantissa.slice(0, point)
  const fraction = point < 0 ? '' : mantissa.slice(point + 1).replace(/,/g, '')
  // Commas after the last digit placeholder divide by a thousand each.
  const trailing = /,+$/.exec(integer)
  if (trailing) {
    n /= Math.pow(1000, trailing[0].length)
    integer = integer.slice(0, -trailing[0].length)
  }
  const grouped = integer.includes(',')
  const minInteger = (integer.match(/0/g) ?? []).length
  const decimals = (fraction.match(/[0#?]/g) ?? []).length
  const minDecimals = (/^0*/.exec(fraction) ?? [''])[0].length

  let exponentText = ''
  if (exponentAt >= 0) {
    const exponentPattern = pattern.slice(exponentAt + 2)
    let exponent = n === 0 ? 0 : Math.floor(Math.log10(n))
    let m = n / Math.pow(10, exponent)
    if (roundTo(m, decimals) >= 10) {
      exponent++
      m = n / Math.pow(10, exponent)
    }
    n = m
    const sign = exponent < 0 ? '-' : pattern[exponentAt + 1] === '+' ? '+' : ''
    const width = (exponentPattern.match(/0/g) ?? []).length
    exponentText = pattern[exponentAt] + sign + pad(Math.abs(exponent), width)
  }

  const [whole, rest = ''] = roundTo(n, decimals).toFixed(decimals).split('.')
  let fractionText = rest
  while (fractionText.length > minDecimals && fractionText.endsWith('0')) {
    fractionText = fractionText.slice(0, -1)
  }
  let wholeText = whole === '0' && minInteger === 0 ? '' : whole
  wholeText = wholeText.padStart(minInteger, '0')
  if (grouped) wholeText = group(wholeText)
  return wholeText + (point >= 0 ? '.' + fractionText : '') + exponentText
}

/**
 * Formats a number with an Excel format code, for TEXT. Text values go
 * through the fourth section when there is one and come back unchanged
 * otherwise.
 */
export function formatValue(value: number | string, format: string): string {
  const all = sections(format)
  if (typeof value === 'string') {
    return all.length >= 4
      ? all[3].replace(/@/g, value).replace(/"/g, '')
      : value
  }

  let section = all[0]
  let signed = true
  if (value < 0 && all.length >= 2 && all[1] !== '') {
    section = all[1]
    signed = false
  } else if (value === 0 && all.length >= 3 && all[2] !== '') {
    section = all[2]
  }
  if (section.trim().toUpperCase() === 'GENERAL' || section === '') {
    return numberToText(value)
  }

  const list = parts(section)
  if (list.some((part) => part.kind === 'date' || part.kind === 'ampm')) {
    return formatDate(value, list)
  }

  const numberParts = list.filter((part) => part.kind === 'number')
  const pattern = numberParts.map((part) => part.text).join('')
  if (!/[0#?]/.test(pattern)) {
    // No digit placeholder: the format is all literal text.
    return list.map(textOf).join('')
  }
  const percent = (pattern.match(/%/g) ?? []).length
  const digits = formatNumber(
    value,
    pattern.replace(/%/g, '').replace(/\?/g, '#'),
    percent,
  )
  const negative = signed && value < 0 && /[1-9]/.test(digits)

  // The number goes where the first placeholder group is. Further groups
  // (as in '000-0000') are not split apart: their digits are already in
  // the first, and only their '%' signs are kept.
  let placed = false
  let out = ''
  for (const part of list) {
    if (part.kind !== 'number') out += textOf(part)
    else if (!placed && /[0#?]/.test(part.text)) {
      out +=
        (negative ? '-' : '') +
        digits +
        '%'.repeat((part.text.match(/%/g) ?? []).length)
      placed = true
    } else out += '%'.repeat((part.text.match(/%/g) ?? []).length)
  }
  return out
}
