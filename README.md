# Lil Johnny

[![Lint](https://github.com/jhusebachz/Lil-Johnny/actions/workflows/lint.yml/badge.svg)](https://github.com/jhusebachz/Lil-Johnny/actions/workflows/lint.yml)

Lil Johnny is a personal tracker app built with Expo and React Native. It keeps your day-to-day pace visible across certifications, health, hobbies, streaks, reminder alarms, and long-term OSRS goals.

## What The App Tracks

- `Dashboard`: pace-based Bliss Score, simplified overview cards, and suggested next actions based on what is currently behind
- `Cyber`: Linux+, PenTest+, and Cloud+ tracking with separate chapter counts, timed cert windows, study logs, and chapter-end practice scores
- `Health`: set-by-set gym logging, weekly gym pace, weight tracking, weight-loss pace, loop-run tracking, and daily coaching insight
- `Hobbies`: DIY to-do tracking first, with OSRS as a separate sub-view
- `Streaks`: avoidance streaks plus reminder alarms in the same tab
- `Settings`: appearance and notification controls

## Current Highlights

- Dashboard overview now checks whether each major area is on pace today instead of relying on raw totals
- Bliss Score is a daily pace score driven by Cyber, Health, Hobbies, and Streaks
- Certification tracking is based on current Sybex guide chapter counts and cert-specific study timelines
- Health pacing follows the real Wednesday/Thursday/Friday gym schedule without penalizing you too early in the week
- Gym logging is set-by-set, so each exercise can record multiple sets with different reps and weight
- The workout list in Health is more compact now, so long Push / Pull / Legs days are faster to scroll through on mobile
- Weight tracking starts from a `205 lb` baseline and measures progress toward a `185 lb` goal
- Loop runs are tracked by time with a sub-9 target
- Health coaching insight changes daily and reacts to what is actually behind
- OSRS tracker uses live tracker snapshots, goal pace bars, and a more realistic Slayer-to-combat projection model for long-term pacing
- DIY tasks are tracked as their own cards with explicit completion buttons
- Avoidance streaks and reminder alarms share one tab, while streak timing follows local midnight
- Life-tracker data now lives in a shared app-level context so Health, Cyber, Hobbies, Dashboard, and Streaks stop overwriting each other across tabs
- Gym data also lives in shared app-level state now, so Health and Dashboard stay in sync
- Streaks now track both current streak and all-time best streak for each item
- Theme system includes `Light`, `Dark`, `Gangsta Green`, and `Silver & Black`

## Project Structure

```text
.
|-- app/                    # Expo Router screens and layout
|-- assets/                 # Images, icons, and startup visuals
|-- components/             # Reusable UI and feature components
|-- context/                # App settings, reminder logic, and shared tracker state
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
- when runtime-breaking fixes land, pushing an OTA promptly matters because the installed preview build will only see GitHub changes after `eas update`

## Versioning

Lil Johnny now follows a simple semantic versioning policy:

- `MAJOR` for structural or breaking product changes that redefine the app significantly
- `MINOR` for new tracker areas, major feature additions, or substantial UX expansions
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

This version reflects the shift from a dashboard/news-style app into a pace-based personal tracker, plus follow-up cleanup and tracker refinements:

- dashboard action guidance and a daily pace-based Bliss Score
- Cyber chapter-based cert tracking with certification windows
- Hobbies tab with DIY first and OSRS in a separate sub-tab
- broader health tracking with set-by-set gym logging, loop-run tracking, rotating coaching, and weight-loss pacing
- Streaks tab with avoidance streaks and reminder alarms that follow local-midnight rollover
- OSRS pace tracking that no longer assumes combat stats magically become 99 just because Slayer is zero-time
- shared life-tracker persistence across tabs so saved Health and tracker data stays consistent
- shared gym persistence across Health and Dashboard, plus all-time-best streak tracking

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
