import type { OsrsApiResponse } from './osrsTrackerTypes.ts';

const TRACKER_URLS = [
  'https://raw.githubusercontent.com/jhusebachz/OSRS-Daily-Tracker/main/data/last_stats.json',
  'https://github.com/jhusebachz/OSRS-Daily-Tracker/raw/main/data/last_stats.json',
  'https://cdn.jsdelivr.net/gh/jhusebachz/OSRS-Daily-Tracker@main/data/last_stats.json',
] as const;

export async function fetchRawRunescapeData() {
  let lastError: Error | null = null;

  for (const trackerUrl of TRACKER_URLS) {
    try {
      const response = await fetch(`${trackerUrl}?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`OSRS tracker request failed: ${response.status}`);
      }

      return (await response.json()) as OsrsApiResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown OSRS tracker fetch failure.');
    }
  }

  throw lastError ?? new Error('Unable to load the OSRS tracker feed.');
}
