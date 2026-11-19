// Dates are serial numbers, as in Google Sheets and in Excel after March
// 1900: serial 0 is 1899-12-30, one day is 1, and the time of day is the
// fraction. All calendar arithmetic is in UTC, so a serial means the same
// date on every machine whatever its time zone.

const DAY_MS = 86400000
const EPOCH = Date.UTC(1899, 11, 30)

/** A UTC timestamp for a calendar date. Date.UTC would read years 0 to 99 as 1900 to 1999. */
function utcDate(year: number, month: number, day: number): number {
  const date = new Date(EPOCH)
  date.setUTCFullYear(year, month - 1, day)
  return date.getTime()
}

/**
 * The serial number of a date and time. Out-of-range parts roll over as
 * DATE does: month 13 is January of the next year, day 0 is the last day of
 * the month before.
 */
export function toSerial(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
): number {
  const days = Math.round(
    (utcDate(Math.trunc(year), Math.trunc(month), Math.trunc(day)) - EPOCH) /
      DAY_MS,
  )
  return days + (hours * 3600 + minutes * 60 + seconds) / 86400
}

export interface IFormulaDateParts {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
  /** 0 is Sunday. */
  weekday: number
}

/**
 * The calendar parts of a serial number. The time is rounded to the
 * nearest second, so 0.99999999 reads as the next midnight rather than
 * 23:59:59.
 */
export function fromSerial(serial: number): IFormulaDateParts {
  const total = Math.round(serial * 86400)
  const days = Math.floor(total / 86400)
  const rest = total - days * 86400
  const date = new Date(EPOCH + days * DAY_MS)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hours: Math.floor(rest / 3600),
    minutes: Math.floor((rest % 3600) / 60),
    seconds: rest % 60,
    weekday: date.getUTCDay(),
  }
}

export function daysInMonth(year: number, month: number): number {
  return fromSerial(toSerial(year, month + 1, 0)).day
}

const DATE_TEXT =
  /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?)?$/
const TIME_TEXT = /^(\d{1,2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/

function timeFraction(
  hours: string,
  minutes: string,
  seconds: string | undefined,
): number | null {
  const h = Number(hours)
  const m = Number(minutes)
  const s = seconds === undefined ? 0 : Number(seconds)
  if (h > 23 || m > 59 || s >= 60) return null
  return (h * 3600 + m * 60 + s) / 86400
}

/**
 * Reads ISO dates ('2026-11-19'), dates with a time ('2026-11-19T14:30',
 * '2026-11-19 14:30:15') and a time alone ('14:30', a fraction of a day).
 * Anything else, including dates that do not exist such as '2026-02-30',
 * is null. Locale formats are for the caller to convert first.
 */
export function parseDateText(text: string): number | null {
  const trimmed = text.trim()
  const time = TIME_TEXT.exec(trimmed)
  if (time) return timeFraction(time[1], time[2], time[3])

  const match = DATE_TEXT.exec(trimmed)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null
  }
  const serial = toSerial(year, month, day)
  if (match[4] === undefined) return serial
  const fraction = timeFraction(match[4], match[5], match[6])
  return fraction === null ? null : serial + fraction
}
