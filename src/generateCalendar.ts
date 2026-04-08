import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import {
  DEFAULT_END_YEAR,
  DEFAULT_START_YEAR,
  NOWRUZ_DATES,
  YALDA_DATES
} from './data.js'

type HolidayName =
  | 'Nowruz'
  | 'Sizdah Bedar'
  | 'Chaharshanbe Suri'
  | 'Yalda Night'

type HolidayEvent = {
  summary: HolidayName
  date: string
}

const OUTPUT_FILE = 'persian-holidays.ics'
const DAY_IN_MS = 24 * 60 * 60 * 1000

function parseArgs(argv: string[]) {
  let startYear = DEFAULT_START_YEAR
  let endYear = DEFAULT_END_YEAR

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    const nextToken = argv[index + 1]

    if (token === '--startYear') {
      startYear = parseYearFlag(token, nextToken)
      index += 1
      continue
    }

    if (token.startsWith('--startYear=')) {
      startYear = parseYearValue(token, token.split('=')[1] ?? '')
      continue
    }

    if (token === '--endYear') {
      endYear = parseYearFlag(token, nextToken)
      index += 1
      continue
    }

    if (token.startsWith('--endYear=')) {
      endYear = parseYearValue(token, token.split('=')[1] ?? '')
      continue
    }

    throw new Error(`Unknown argument: ${token}`)
  }

  if (startYear > endYear) {
    throw new Error(`startYear must be less than or equal to endYear: ${startYear} > ${endYear}`)
  }

  return { startYear, endYear }
}

function parseYearFlag(flag: string, value: string | undefined) {
  if (value === undefined) {
    throw new Error(`Missing value for ${flag}`)
  }

  return parseYearValue(flag, value)
}

function parseYearValue(flag: string, value: string) {
  const year = Number.parseInt(value, 10)

  if (!Number.isInteger(year)) {
    throw new Error(`Invalid year for ${flag}: ${value}`)
  }

  return year
}

function createDate(date: string) {
  return new Date(`${date}T00:00:00Z`)
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatIcsDate(date: string) {
  return date.replaceAll('-', '')
}

function addDays(date: string, days: number) {
  return formatDate(new Date(createDate(date).getTime() + days * DAY_IN_MS))
}

function getPreviousWeekday(date: string, targetWeekday: number) {
  const current = createDate(date)

  do {
    current.setUTCDate(current.getUTCDate() - 1)
  } while (current.getUTCDay() !== targetWeekday)

  return formatDate(current)
}

function getKnownDate(mapping: Record<number, string>, year: number, holidayName: HolidayName) {
  const value = mapping[year]

  if (!value) {
    throw new Error(`No ${holidayName} date configured for ${year}`)
  }

  return value
}

function buildEvents(startYear: number, endYear: number) {
  const events: HolidayEvent[] = []

  for (let year = startYear; year <= endYear; year += 1) {
    const nowruz = getKnownDate(NOWRUZ_DATES, year, 'Nowruz')
    const yalda = getKnownDate(YALDA_DATES, year, 'Yalda Night')

    events.push({ summary: 'Chaharshanbe Suri', date: getPreviousWeekday(nowruz, 2) })
    events.push({ summary: 'Nowruz', date: nowruz })
    events.push({ summary: 'Sizdah Bedar', date: addDays(nowruz, 12) })
    events.push({ summary: 'Yalda Night', date: yalda })
  }

  return events.sort((left, right) => left.date.localeCompare(right.date))
}

function createUid(event: HolidayEvent) {
  const digest = createHash('sha1').update(`${event.summary}-${event.date}`).digest('hex')
  return `${digest}@iran-holidays-calendar`
}

function escapeText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n')
}

function foldLine(line: string) {
  if (line.length <= 75) {
    return line
  }

  const segments: string[] = []

  for (let index = 0; index < line.length; index += 75) {
    const chunk = line.slice(index, index + 75)
    segments.push(index === 0 ? chunk : ` ${chunk}`)
  }

  return segments.join('\r\n')
}

function createEventBlock(event: HolidayEvent, dtstamp: string) {
  const start = formatIcsDate(event.date)
  const end = formatIcsDate(addDays(event.date, 1))

  return [
    'BEGIN:VEVENT',
    foldLine(`UID:${createUid(event)}`),
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    foldLine(`SUMMARY:${escapeText(event.summary)}`),
    'END:VEVENT'
  ].join('\r\n')
}

function createCalendar(events: HolidayEvent[]) {
  const dtstamp = new Date().toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const blocks = events.map((event) => createEventBlock(event, dtstamp))

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//iran-holidays-calendar//Persian Cultural Holidays//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...blocks,
    'END:VCALENDAR',
    ''
  ].join('\r\n')
}

function main() {
  const { startYear, endYear } = parseArgs(process.argv.slice(2))
  const events = buildEvents(startYear, endYear)
  const outputPath = resolve(process.cwd(), OUTPUT_FILE)

  writeFileSync(outputPath, createCalendar(events), 'utf8')
  console.log(`Generated ${OUTPUT_FILE} for ${startYear}-${endYear}`)
}

main()
