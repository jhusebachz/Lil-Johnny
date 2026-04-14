# Lil Johnny Chat Handoff

Use this file to bootstrap a new chat instead of making it reconstruct the full thread history.

## Current Local State

- Repo: `C:\Users\johnw\johnny-app`
- Current local `HEAD`: `912bff2`
- Uncommitted local changes:
  - `README.md`
  - `app/(tabs)/gym.tsx`

These local changes are intentional and should be treated as the current working state unless I say otherwise.

## App Purpose

Lil Johnny is now a personal life-tracker app, not a cyber-intel/news app.

Main tabs:

- `Dashboard`
- `Cyber`
- `Health`
- `Hobbies`
- `Streaks`
- `Settings`

## Current Product Structure

### Dashboard

- Shows a daily `Bliss Score`
- Shows `Overview` cards for:
  - `Cyber`
  - `Health`
  - `Hobbies`
- Shows streak summary cards
- Shows `Suggested Next Actions`

Important current logic:

- `Bliss Score` is pace-based, not total-progress-based
- Current weighting:
  - `Health`: 40%
  - `Cyber`: 30%
  - `Streaks`: 25%
  - `Hobbies`: 5%
- `Hobbies` is intentionally a small part of the score

### Cyber

Only these certs should exist:

1. `Linux+`
2. `PenTest+`
3. `Cloud+`

No `Security+`. No `PNPT`.

Linux+ chapter count:

- `26` chapters

Cert timelines:

- `Linux+`: June 20, 2026 to September 15, 2026
- `PenTest+`: October 15, 2026 to December 15, 2026
- `Cloud+`: January 15, 2027 to March 15, 2027

Pacing rules:

- actual progress can move before the timeline starts
- pacer stays at `0%` until the cert window starts
- dashboard should not recommend Cyber actions if there is no active cert window

Cyber UI:

- cert tabs per cert
- chapter logging
- practice exam score logging
- no old cyber threat-intel feed

### Health

Current health features:

- set-by-set gym logging
- weekly gym pace
- weight tracking
- weight-loss pace
- loop run tracking
- stretching guide at the bottom

Important health rules:

- gym schedule is `Wednesday / Thursday / Friday`
- gym pace should not penalize too early in the week
- one logged exercise with at least one saved set counts as a gym day
- current weight baseline is `205 lb`
- goal weight is `185 lb`

Health tab status:

- `Coaching Insight` should be completely removed
- workout logging should be easy to reach
- stretching is guide-only, not tracked here
- stretching guide should stay hidden until opened and should be at the end of the tab

Current local unpushed Health fix:

- `app/(tabs)/gym.tsx` restores the real `Workout` view instead of a broken fallback path
- removes Health `Coaching Insight`
- keeps `Stretching Guide` collapsed at the bottom
- moves workout controls back near the top

### Hobbies

Current structure:

- `DIY To-Do` first
- `OSRS` second

DIY:

- each task is its own card
- explicit `Task completed` button

### OSRS

OSRS lives under `Hobbies`.

Important current rules:

- `Top gains` should only show if there were actual gains
- friend order should use:
  - `gwahpy`
  - `beefmissle13`
  - `kingxdabber`
  - `hedith`
- RuneFest pace should not assume Slayer-trained combat stats become free 99s
- no `manual lane` wording anywhere

If OSRS pace logic changes in the app, also update:

- `C:\Users\johnw\OSRS-Daily-Tracker`

### Streaks

Current structure:

- `Streaks` tab contains:
  - streaks
  - reminder alarms

Important rules:

- streaks are avoidance-style
- no daily check streak UI anymore
- each streak should show:
  - current streak
  - all-time best
- each streak has two buttons:
  - `I broke this streak yesterday`
  - `I broke this streak today`
- streak rollover should use local midnight, not UTC

## Persistence / Architecture

This app previously had real overwrite bugs. Current intended architecture:

- life-tracker state is shared through app-level context
- gym state is shared through app-level context
- dashboard must not write tracker state during refresh

Important contexts:

- `context/LifeTrackerContext.tsx`
- `context/GymDataContext.tsx`
- `context/AppSettingsContext.tsx`

Avoid reintroducing per-tab copies of persistent state.

## Automation Rule

Weekly code-health automation should be:

- review-only
- no edits
- no commits
- no pushes

It should remind me to bring changes back through the main Lil Johnny chat before shipping anything.

## Theme / UI Direction

- `Dark` theme should be black plus modern blue/blue-green, not purple
- dashboard is allowed to be more dashboard-like
- avoid unnecessary taglines/descriptions
- hero cards should be simple and consistent
- not everything has to be left-aligned; use center alignment selectively when it improves the layout

## Readme / Release Notes

Keep `README.md` aligned with current app behavior when meaningful features change.

Right now, local README updates reflect:

- Health no longer uses coaching insight
- Health uses a collapsible stretching guide
- workout logging is the primary Health interaction again

## Phone Update Commands

For JS / UI changes:

```bash
eas update --channel preview --message "Describe the change"
```

For native/config changes:

```bash
eas build -p android --profile preview
```

GitHub pushes alone do **not** update the phone app.

## Good First Check In A New Chat

Ask the new chat to:

1. Read this file first.
2. Check `git status --short`.
3. Respect the existing local uncommitted changes unless asked to discard them.
4. Avoid pushing unrelated changes together.

