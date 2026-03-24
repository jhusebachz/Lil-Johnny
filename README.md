# Lil Johnny

Lil Johnny is a personal dashboard app built with Expo and React Native. It combines reminders, cyber intel, gym tracking, gaming feeds, and RuneScape progress into one mobile-first app.

## Stack

- Expo
- React Native
- Expo Router
- TypeScript

## Main Features

- Dashboard with a personalized daily overview
- Reminder scheduling with native notification support
- Cyber tab with refresh-on-focus intel updates
- Gym workout logging and recent progress tracking
- Games tab with gaming news, Pokopia, and OSRS tracking
- RuneScape tracker powered by live JSON data

## Local Development

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
npx expo start
```

3. Build an Android preview APK with EAS

```bash
eas build -p android --profile preview
```

## Notes

- This repo is configured for EAS builds.
- Local caches and generated folders are ignored in Git.
- Some app content is intentionally personal and branded.

## GitHub Sync

Manual push:

```bash
git add .
git commit -m "Describe the changes"
git push
```

Daily automatic push from this PC:

- Safe sync script: [scripts/daily-push.ps1](C:\Users\johnw\johnny-app\scripts\daily-push.ps1)
- Task setup helper: [scripts/setup-daily-push.ps1](C:\Users\johnw\johnny-app\scripts\setup-daily-push.ps1)

Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-daily-push.ps1 -Time "19:00"
```
