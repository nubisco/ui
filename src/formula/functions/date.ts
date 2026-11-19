import { daysInMonth, fromSerial, parseDateText, toSerial } from '../dates'
import type { IFormulaError, TScalar, TValue } from '../types'
import {
  eachCell,
  formulaError,
  isFormulaError,
  isMatrix,
  numberArg,
  optionalNumber,
  scalar,
  toNumber,
} from '../values'
import { firstError, type IFunctionDefinition } from './define'

/**
 * A date argument: a serial number, or text parseDateText reads (through
 * the usual number conversion). Serials before 1899-12-30 are #NUM!.
 */
function dateArg(value: TValue | undefined): number | IFormulaError {
  if (value === undefined) return formulaError('#VALUE!', 'A date is missing')
  const n = numberArg(value)
  if (isFormulaError(n)) return n
  if (n < 0)
    return formulaError('#NUM!', 'Dates before 1899-12-30 are not supported')
  return n
}

/** Wraps a function of one date. */
const ofDate =
  (fn: (serial: number) => TValue) =>
  (args: TValue[]): TValue => {
    const serial = dateArg(args[0])
    return isFormulaError(serial) ? serial : fn(serial)
  }

/** Every serial in a holidays argument, as whole days. */
function holidaySet(value: TValue | undefined): Set<number> | IFormulaError {
  const days = new Set<number>()
  if (value === undefined || value === null) return days
  const values: TScalar[] = isMatrix(value) ? [] : [value]
  if (isMatrix(value)) eachCell(value, (cell) => void values.push(cell))
  for (const cell of values) {
    if (cell === null) continue
    const n = toNumber(cell)
    if (isFormulaError(n)) return n
    days.add(Math.floor(n))
  }
  return days
}

const isWeekend = (day: number) => {
  // Serial 0 was a Saturday, so day mod 7 is 0 on Saturdays and 1 on Sundays.
  const mod = ((day % 7) + 7) % 7
  return mod === 0 || mod === 1
}

/** Adds months, keeping the day where the month allows it, as EDATE does. */
function addMonths(serial: number, months: number): number {
  const { year, month, day } = fromSerial(Math.floor(serial))
  const total = year * 12 + (month - 1) + Math.trunc(months)
  const y = Math.floor(total / 12)
  const m = total - y * 12 + 1
  return toSerial(y, m, Math.min(day, daysInMonth(y, m)))
}

/** The day of the week for WEEKDAY's return types (1 to 3 and 11 to 17). */
function weekday(serial: number, type: number): number | IFormulaError {
  const sunday0 = fromSerial(Math.floor(serial)).weekday
  if (type === 1) return sunday0 + 1
  if (type === 2) return ((sunday0 + 6) % 7) + 1
  if (type === 3) return (sunday0 + 6) % 7
  if (type >= 11 && type <= 17) {
    // 11 starts the week on Monday, 12 on Tuesday, up to 17 on Sunday.
    const start = (type - 10) % 7
    return ((sunday0 - start + 7) % 7) + 1
  }
  return formulaError('#NUM!', 'The return type is not supported')
}

function isoWeek(serial: number): number {
  const day = Math.floor(serial)
  const mondayBased = (fromSerial(day).weekday + 6) % 7
  // The ISO week belongs to the year of its Thursday.
  const thursday = day - mondayBased + 3
  const jan1 = toSerial(fromSerial(thursday).year, 1, 1)
  return Math.floor((thursday - jan1) / 7) + 1
}

function weekNumber(serial: number, type: number): number | IFormulaError {
  if (type === 21) return isoWeek(serial)
  const start =
    type === 1 || type === 17
      ? 0
      : type === 2 || type === 11
        ? 1
        : type >= 12 && type <= 16
          ? type - 10
          : -1
  if (start < 0)
    return formulaError('#NUM!', 'The return type is not supported')
  const day = Math.floor(serial)
  const jan1 = toSerial(fromSerial(day).year, 1, 1)
  const offset = (fromSerial(jan1).weekday - start + 7) % 7
  return Math.floor((day - jan1 + offset) / 7) + 1
}

function dateDif(
  start: number,
  end: number,
  unit: string,
): number | IFormulaError {
  const s = fromSerial(Math.floor(start))
  const e = fromSerial(Math.floor(end))
  const months =
    (e.year - s.year) * 12 + (e.month - s.month) - (e.day < s.day ? 1 : 0)
  switch (unit.toUpperCase()) {
    case 'Y':
      return Math.floor(months / 12)
    case 'M':
      return months
    case 'D':
      return Math.floor(end) - Math.floor(start)
    case 'YM':
      return months % 12
    case 'MD':
      // Days past the last whole month.
      return e.day >= s.day
        ? e.day - s.day
        : daysInMonth(e.year, e.month - 1) - s.day + e.day
    case 'YD': {
      let anniversary = toSerial(e.year, s.month, s.day)
      if (anniversary > Math.floor(end))
        anniversary = toSerial(e.year - 1, s.month, s.day)
      return Math.floor(end) - anniversary
    }
    default:
      return formulaError('#NUM!', 'The unit must be Y, M, D, MD, YM or YD')
  }
}

const isLeap = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

function yearFrac(
  start: number,
  end: number,
  basis: number,
): number | IFormulaError {
  let a = Math.floor(start)
  let b = Math.floor(end)
  if (a > b) [a, b] = [b, a]
  const s = fromSerial(a)
  const e = fromSerial(b)
  const days = b - a
  switch (basis) {
    case 0: {
      // US (NASD) 30/360, in the order Excel applies its end-of-month rules.
      let sd = s.day
      let ed = e.day
      const lastOfFeb = (p: { year: number; month: number; day: number }) =>
        p.month === 2 && p.day === daysInMonth(p.year, 2)
      if (sd === 31 && ed === 31) {
        sd = 30
        ed = 30
      } else if (sd === 31) sd = 30
      else if (sd === 30 && ed === 31) ed = 30
      else if (lastOfFeb(s) && lastOfFeb(e)) {
        sd = 30
        ed = 30
      } else if (lastOfFeb(s)) sd = 30
      return (
        ((e.year - s.year) * 360 + (e.month - s.month) * 30 + (ed - sd)) / 360
      )
    }
    case 1: {
      // Actual/actual: within a year, 366 when a 29 February falls in the
      // span. Over longer spans, the average length of the years covered.
      const withinYear =
        s.year === e.year ||
        (e.year === s.year + 1 &&
          (s.month > e.month || (s.month === e.month && s.day >= e.day)))
      if (withinYear) {
        let length = 365
        if (s.year === e.year) length = isLeap(s.year) ? 366 : 365
        else {
          for (const year of [s.year, e.year]) {
            if (!isLeap(year)) continue
            const leapDay = toSerial(year, 2, 29)
            if (leapDay >= a && leapDay <= b) length = 366
          }
        }
        return days / length
      }
      const years = e.year - s.year + 1
      const total = toSerial(e.year + 1, 1, 1) - toSerial(s.year, 1, 1)
      return days / (total / years)
    }
    case 2:
      return days / 360
    case 3:
      return days / 365
    case 4: {
      // European 30/360.
      const sd = Math.min(s.day, 30)
      const ed = Math.min(e.day, 30)
      return (
        ((e.year - s.year) * 360 + (e.month - s.month) * 30 + (ed - sd)) / 360
      )
    }
    default:
      return formulaError('#NUM!', 'The basis must be 0 to 4')
  }
}

/** Reads the local clock, since TODAY and NOW are about the person's own calendar. */
function localNow(withTime: boolean): number {
  const now = new Date()
  const date = toSerial(now.getFullYear(), now.getMonth() + 1, now.getDate())
  if (!withTime) return date
  return (
    date +
    (now.getHours() * 3600 +
      now.getMinutes() * 60 +
      now.getSeconds() +
      now.getMilliseconds() / 1000) /
      86400
  )
}

/** Date text a person wrote, for DATEVALUE and TIMEVALUE. */
function textDate(value: TValue): number | IFormulaError {
  const text = scalar(value)
  if (isFormulaError(text)) return text
  if (typeof text !== 'string')
    return formulaError('#VALUE!', 'Expected a date as text')
  const serial = parseDateText(text)
  return serial === null
    ? formulaError('#VALUE!', 'The text is not a date')
    : serial
}

export const DATE_FUNCTIONS: IFunctionDefinition[] = [
  {
    name: 'DATE',
    category: 'date',
    syntax: 'DATE(year, month, day)',
    description:
      'Returns the serial number of a date, rolling over months and days out of range.',
    minArgs: 3,
    maxArgs: 3,
    call: (args) => {
      const year = numberArg(args[0])
      const month = numberArg(args[1])
      const day = numberArg(args[2])
      const error = firstError(year, month, day)
      if (error) return error
      let y = Math.trunc(year as number)
      // As in Excel, years 0 to 1899 count from 1900.
      if (y >= 0 && y < 1900) y += 1900
      if (y < 0 || y > 9999)
        return formulaError('#NUM!', 'The year must be 0 to 9999')
      const serial = toSerial(y, month as number, day as number)
      return serial < 0
        ? formulaError('#NUM!', 'Dates before 1899-12-30 are not supported')
        : serial
    },
  },
  {
    name: 'TIME',
    category: 'date',
    syntax: 'TIME(hours, minutes, seconds)',
    description: 'Returns a time of day as a fraction of a day.',
    minArgs: 3,
    maxArgs: 3,
    call: (args) => {
      const parts = args.map(numberArg)
      const error = firstError(...parts)
      if (error) return error
      const [h, m, s] = (parts as number[]).map(Math.trunc)
      const total = h * 3600 + m * 60 + s
      if (total < 0) return formulaError('#NUM!', 'A time cannot be negative')
      return (total % 86400) / 86400
    },
  },
  {
    name: 'TODAY',
    category: 'date',
    syntax: 'TODAY()',
    description: "Returns today's date, recalculated on every change.",
    minArgs: 0,
    maxArgs: 0,
    call: () => localNow(false),
  },
  {
    name: 'NOW',
    category: 'date',
    syntax: 'NOW()',
    description:
      'Returns the current date and time, recalculated on every change.',
    minArgs: 0,
    maxArgs: 0,
    call: () => localNow(true),
  },
  {
    name: 'YEAR',
    category: 'date',
    syntax: 'YEAR(date)',
    description: 'Returns the year of a date.',
    minArgs: 1,
    maxArgs: 1,
    call: ofDate((serial) => fromSerial(serial).year),
  },
  {
    name: 'MONTH',
    category: 'date',
    syntax: 'MONTH(date)',
    description: 'Returns the month of a date, 1 to 12.',
    minArgs: 1,
    maxArgs: 1,
    call: ofDate((serial) => fromSerial(serial).month),
  },
  {
    name: 'DAY',
    category: 'date',
    syntax: 'DAY(date)',
    description: 'Returns the day of the month of a date, 1 to 31.',
    minArgs: 1,
    maxArgs: 1,
    call: ofDate((serial) => fromSerial(serial).day),
  },
  {
    name: 'HOUR',
    category: 'date',
    syntax: 'HOUR(time)',
    description: 'Returns the hour of a time, 0 to 23.',
    minArgs: 1,
    maxArgs: 1,
    call: ofDate((serial) => fromSerial(serial).hours),
  },
  {
    name: 'MINUTE',
    category: 'date',
    syntax: 'MINUTE(time)',
    description: 'Returns the minute of a time, 0 to 59.',
    minArgs: 1,
    maxArgs: 1,
    call: ofDate((serial) => fromSerial(serial).minutes),
  },
  {
    name: 'SECOND',
    category: 'date',
    syntax: 'SECOND(time)',
    description: 'Returns the second of a time, 0 to 59.',
    minArgs: 1,
    maxArgs: 1,
    call: ofDate((serial) => fromSerial(serial).seconds),
  },
  {
    name: 'WEEKDAY',
    category: 'date',
    syntax: 'WEEKDAY(date, [type])',
    description:
      'Returns the day of the week: type 1 counts Sunday as 1, type 2 Monday as 1, type 3 Monday as 0.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => {
      const serial = dateArg(args[0])
      const type = optionalNumber(args, 1, 1)
      return (
        firstError(serial, type) ??
        weekday(serial as number, Math.trunc(type as number))
      )
    },
  },
  {
    name: 'WEEKNUM',
    category: 'date',
    syntax: 'WEEKNUM(date, [type])',
    description:
      'Returns the week of the year, with weeks starting on Sunday (type 1) or Monday (type 2).',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => {
      const serial = dateArg(args[0])
      const type = optionalNumber(args, 1, 1)
      return (
        firstError(serial, type) ??
        weekNumber(serial as number, Math.trunc(type as number))
      )
    },
  },
  {
    name: 'ISOWEEKNUM',
    category: 'date',
    syntax: 'ISOWEEKNUM(date)',
    description:
      'Returns the ISO 8601 week of the year, where weeks start on Monday.',
    minArgs: 1,
    maxArgs: 1,
    call: ofDate(isoWeek),
  },
  {
    name: 'EDATE',
    category: 'date',
    syntax: 'EDATE(start_date, months)',
    description: 'Returns the date a number of months before or after another.',
    minArgs: 2,
    maxArgs: 2,
    call: (args) => {
      const serial = dateArg(args[0])
      const months = numberArg(args[1])
      return (
        firstError(serial, months) ??
        addMonths(serial as number, months as number)
      )
    },
  },
  {
    name: 'EOMONTH',
    category: 'date',
    syntax: 'EOMONTH(start_date, months)',
    description:
      'Returns the last day of the month a number of months before or after a date.',
    minArgs: 2,
    maxArgs: 2,
    call: (args) => {
      const serial = dateArg(args[0])
      const months = numberArg(args[1])
      const error = firstError(serial, months)
      if (error) return error
      const { year, month } = fromSerial(
        addMonths(serial as number, months as number),
      )
      return toSerial(year, month + 1, 0)
    },
  },
  {
    name: 'DAYS',
    category: 'date',
    syntax: 'DAYS(end_date, start_date)',
    description: 'Returns the number of days between two dates.',
    minArgs: 2,
    maxArgs: 2,
    call: (args) => {
      const end = dateArg(args[0])
      const start = dateArg(args[1])
      return (
        firstError(end, start) ??
        Math.floor(end as number) - Math.floor(start as number)
      )
    },
  },
  {
    name: 'DATEDIF',
    category: 'date',
    syntax: 'DATEDIF(start_date, end_date, unit)',
    description:
      'Returns the whole years (Y), months (M) or days (D) between two dates, or the remainders MD, YM and YD.',
    minArgs: 3,
    maxArgs: 3,
    call: (args) => {
      const start = dateArg(args[0])
      const end = dateArg(args[1])
      const unit = scalar(args[2])
      const error = firstError(start, end, unit)
      if (error) return error
      if (typeof unit !== 'string')
        return formulaError('#VALUE!', 'The unit must be text')
      if ((start as number) > (end as number)) {
        return formulaError('#NUM!', 'The start date is after the end date')
      }
      return dateDif(start as number, end as number, unit)
    },
  },
  {
    name: 'DATEVALUE',
    category: 'date',
    syntax: 'DATEVALUE(text)',
    description: 'Converts an ISO date written as text into its serial number.',
    minArgs: 1,
    maxArgs: 1,
    call: (args) => {
      const serial = textDate(args[0])
      return isFormulaError(serial) ? serial : Math.floor(serial)
    },
  },
  {
    name: 'TIMEVALUE',
    category: 'date',
    syntax: 'TIMEVALUE(text)',
    description: 'Converts a time written as text into a fraction of a day.',
    minArgs: 1,
    maxArgs: 1,
    call: (args) => {
      const serial = textDate(args[0])
      return isFormulaError(serial) ? serial : serial - Math.floor(serial)
    },
  },
  {
    name: 'NETWORKDAYS',
    category: 'date',
    syntax: 'NETWORKDAYS(start_date, end_date, [holidays])',
    description:
      'Counts the weekdays between two dates, inclusive, leaving out holidays.',
    minArgs: 2,
    maxArgs: 3,
    call: (args) => {
      const start = dateArg(args[0])
      const end = dateArg(args[1])
      const holidays = holidaySet(args[2])
      const error = firstError(start, end, holidays)
      if (error) return error
      const a = Math.floor(start as number)
      const b = Math.floor(end as number)
      const [from, to] = a <= b ? [a, b] : [b, a]
      let count = 0
      for (let day = from; day <= to; day++) {
        if (!isWeekend(day) && !(holidays as Set<number>).has(day)) count++
      }
      return a <= b ? count : -count
    },
  },
  {
    name: 'WORKDAY',
    category: 'date',
    syntax: 'WORKDAY(start_date, days, [holidays])',
    description:
      'Returns the date a number of weekdays after or before a date, skipping holidays.',
    minArgs: 2,
    maxArgs: 3,
    call: (args) => {
      const start = dateArg(args[0])
      const days = numberArg(args[1])
      const holidays = holidaySet(args[2])
      const error = firstError(start, days, holidays)
      if (error) return error
      let left = Math.trunc(days as number)
      if (Math.abs(left) > 1000000)
        return formulaError('#NUM!', 'Too many days')
      const step = left < 0 ? -1 : 1
      let day = Math.floor(start as number)
      while (left !== 0) {
        day += step
        if (!isWeekend(day) && !(holidays as Set<number>).has(day)) left -= step
      }
      return day < 0
        ? formulaError('#NUM!', 'Dates before 1899-12-30 are not supported')
        : day
    },
  },
  {
    name: 'YEARFRAC',
    category: 'date',
    syntax: 'YEARFRAC(start_date, end_date, [basis])',
    description:
      'Returns the fraction of a year between two dates, by a day count basis from 0 to 4.',
    minArgs: 2,
    maxArgs: 3,
    call: (args) => {
      const start = dateArg(args[0])
      const end = dateArg(args[1])
      const basis = optionalNumber(args, 2, 0)
      const error = firstError(start, end, basis)
      if (error) return error
      return yearFrac(
        start as number,
        end as number,
        Math.trunc(basis as number),
      )
    },
  },
]
