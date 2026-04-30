interface ICalendarEvent {
  /** Unique event identifier. */
  id: string
  /** Display label for the event. */
  label: string
  /** Start date (ISO string YYYY-MM-DD or Date). */
  start: string | Date
  /** End date (ISO string YYYY-MM-DD or Date). Defaults to start if omitted. */
  end?: string | Date
  /** CSS color for the event bar. Falls back to primary. */
  color?: string
  /** Arbitrary payload passed through to the event slot. */
  [key: string]: unknown
}

interface ICalendarProps {
  /** Events to display on the calendar. */
  events?: ICalendarEvent[]
  /** Initial month to display (ISO string YYYY-MM or Date). Defaults to today. */
  month?: string | Date
  /** First day of the week: 0 = Sunday, 1 = Monday. Defaults to 1 (Monday). */
  weekStart?: 0 | 1
  /** Locale for month/day names. Defaults to browser locale. */
  locale?: string
}

export type { ICalendarEvent, ICalendarProps }

export type {
  ICalendarEvent as NbCalendarEvent,
  ICalendarProps as NbCalendarProps,
}
