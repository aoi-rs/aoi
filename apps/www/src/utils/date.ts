import { type DateArg, intervalToDuration } from 'date-fns'

const SHORTEN_UNITS = [
  ['years', 'y'],
  ['months', 'm'],
  ['days', 'd'],
  ['hours', 'h'],
  ['minutes', 'min'],
  ['seconds', 's'],
] as const

function shortenCreationDate(date: DateArg<Date>) {
  const duration = intervalToDuration({ start: date, end: new Date() })

  for (const [key, label] of SHORTEN_UNITS) {
    const value = duration[key] ?? 0

    if (value > 0) {
      return value + label
    }
  }

  return 'now'
}

export { shortenCreationDate }
