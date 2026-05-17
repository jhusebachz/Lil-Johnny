import { OsrsApiResponse } from './osrsTrackerTypes.ts';

const TRACKER_URL =
  'https://raw.githubusercontent.com/jhusebachz/OSRS-Daily-Tracker/main/data/last_stats.json';

export async function fetchRawRunescapeData() {
  const response = await fetch(`${TRACKER_URL}?t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`OSRS tracker request failed: ${response.status}`);
  }

  return (await response.json()) as OsrsApiResponse;
}
