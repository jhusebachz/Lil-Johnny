# Lil Johnny

[![Lint](https://github.com/jhusebachz/Lil-Johnny/actions/workflows/lint.yml/badge.svg)](https://github.com/jhusebachz/Lil-Johnny/actions/workflows/lint.yml)

Lil Johnny is a personal life-tracker app built with Expo and React Native. It is designed to keep the main lanes of life visible in one place: certification study, health progress, reminders, OSRS progress, house projects, and 2026 streak goals.

## What The App Tracks

- `Dashboard`: overall life overview, pace-based Bliss Score, and suggested next actions
- `Cyber`: Linux+, PenTest+, and Cloud+ progress with chapter pacing and chapter-end practice scores
- `Health`: gym tracking, weight entries, loop run tracking, weekly gym pace, and weight-loss pace
- `Hobbies`: OSRS tracker and DIY to-do list
- `Streaks`: 2026 streak tracking plus reminder alarms and notifications
- `Settings`: app appearance and notification controls

## Current Highlights

- OSRS tracker with live snapshot data, pace bars, and coaching
- Certification tracker based on real Sybex chapter counts
- Dashboard Bliss Score now evaluates daily pace instead of raw year-to-date completion
- Health pacing reflects the real Wednesday/Thursday/Friday gym schedule
- Weight-loss pace is tracked from a `205 lb` starting point toward a `185 lb` goal
- DIY task tracking inside the Hobbies lane
- 2026 streak tracking and reminder alarms combined in one tab
- Real reminder notifications on supported builds
- Theme system with `Light`, `Dark`, `Gangsta Green`, and `Silver & Black`

## Project Structure

```text
.
|-- app/                    # Expo Router screens and layout
|-- assets/                 # Images, icons, and startup visuals
|-- components/             # Reusable UI and feature components
|-- context/                # App settings, reminders, persistence
|-- data/                   # Tracker data models and derived logic
|-- hooks/                  # Shared screen hooks
|-- scripts/                # Local automation helpers
|-- app.json                # Expo app config
|-- eas.json                # EAS build/update config
`-- README.md
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npx expo start
```

Run lint:

```bash
cmd /c npm run lint
```

## Android Testing

Build a preview APK:

```bash
eas build -p android --profile preview
```

Push an OTA update for JavaScript and asset changes:

```bash
eas update --channel preview --message "Describe the change"
```

Important:

- `GitHub pushes do not update the phone app by themselves.`
- `eas update` is enough for JS and asset changes.
- native changes like icons, splash config, plugins, or app config need a fresh APK.

## Versioning

Lil Johnny now follows a simple semantic versioning policy:

- `MAJOR` for structural or breaking product changes that redefine the app significantly
- `MINOR` for new tracker lanes, major feature additions, or substantial UX expansions
- `PATCH` for bug fixes, polish, copy cleanup, and low-risk refinements

Examples:

- `1.1.0 -> 1.2.0` for a major feature iteration
- `1.2.0 -> 1.2.1` for follow-up fixes and polish
- `1.2.1 -> 2.0.0` if the app changes in a way that meaningfully resets its structure or release expectations

The app version lives in:

- [`app.json`](./app.json)
- [`package.json`](./package.json)
- [`package-lock.json`](./package-lock.json)

Because Expo Updates uses `runtimeVersion.policy = "appVersion"`, version changes also matter for OTA compatibility.

## Current Release

`1.2.1`

This version reflects the shift from a dashboard/news-style app into a broader life-tracker system, plus the follow-up cleanup that removed stale Games/news remnants and tightened the tracker wording:

- dashboard action guidance and a pace-based Bliss Score
- Cyber chapter-based cert tracking
- Hobbies lane with OSRS and DIY
- broader health tracking with gym, loop-run, and weight-loss pacing
- Streaks lane with avoidance streaks and reminder alarms

## GitHub Sync

Manual push:

```bash
git add .
git commit -m "Describe the changes"
git push
```

Daily automatic push from this PC:

- safe sync script: [`scripts/daily-push.ps1`](./scripts/daily-push.ps1)
- task setup helper: [`scripts/setup-daily-push.ps1`](./scripts/setup-daily-push.ps1)

Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-daily-push.ps1 -Time "12:00"
```

## Notes

- This repo is configured for EAS builds and updates.
- The OSRS tracker data source is maintained separately in the OSRS-Daily-Tracker repo.
- Some content and branding are intentionally personal.
