# iran-holidays-calendar

Small Node.js + TypeScript generator for a clean ICS calendar of Persian cultural holidays.

## Included holidays

- Nowruz (Persian New Year)
- Chaharshanbe Suri
- Sizdah Bedar
- Yalda Night

This project intentionally excludes Islamic holidays and focuses on the cultural observances listed above.

## Default coverage

The generator ships with hardcoded known dates for Nowruz and Yalda Night for the years 2026 through 2035. The default output range is also 2026 through 2035.

Derived holidays are calculated from those dates:

- Chaharshanbe Suri: the last Tuesday before Nowruz
- Sizdah Bedar: Farvardin 13, calculated as 12 days after Nowruz

## Install and run

```bash
npm install
npm run generate
```

This writes `persian-holidays.ics` in the project root.

## CLI options

You can generate a custom range with:

```bash
npm run generate -- --startYear 2028 --endYear 2032
```

The flags also support `--startYear=2028` and `--endYear=2032`.

## Build

```bash
npm run build
```

## Add to iPhone Calendar

### One-time import

1. Generate the `.ics` file.
2. Send or save `persian-holidays.ics` somewhere your iPhone can access, such as iCloud Drive, AirDrop, Mail, or Files.
3. Open the file on iPhone and choose to add all events to Calendar.
4. Pick an existing calendar or create a new one for these holidays.

### Subscribe from a public URL

Use this hosted calendar URL:

`https://raw.githubusercontent.com/juseniah/iran-holidays-calendar/main/persian-holidays.ics`

On iPhone:

1. Open the Calendar app.
2. Tap `Calendars`.
3. Tap `Add Calendar`.
4. Tap `Add Subscription Calendar`.
5. Paste the URL above.
6. Tap `Subscribe`.

This subscription uses the published `.ics` file from GitHub, so updates appear when the file is regenerated, committed, and pushed to `main`.
