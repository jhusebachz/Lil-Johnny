import * as FileSystem from 'expo-file-system/legacy';

import type { OsrsApiResponse } from './osrsTracker';

const SNAPSHOT_FILE = `${FileSystem.documentDirectory ?? ''}osrs-daily-snapshots.json`;

export type SnapshotStore = {
  snapshots: Record<string, OsrsApiResponse>;
};

export async function readSnapshotStore(): Promise<SnapshotStore> {
  const fileInfo = await FileSystem.getInfoAsync(SNAPSHOT_FILE);

  if (!fileInfo.exists) {
    return { snapshots: {} };
  }

  const raw = await FileSystem.readAsStringAsync(SNAPSHOT_FILE);

  if (!raw.trim()) {
    return { snapshots: {} };
  }

  try {
    return JSON.parse(raw) as SnapshotStore;
  } catch {
    return { snapshots: {} };
  }
}

export async function writeSnapshotStore(store: SnapshotStore) {
  await FileSystem.writeAsStringAsync(SNAPSHOT_FILE, JSON.stringify(store));
}

export function findLatestSnapshotKey(store: SnapshotStore) {
  return Object.keys(store.snapshots).sort().at(-1) ?? null;
}

export function findPreviousSnapshotKey(store: SnapshotStore, currentKey: string) {
  return Object.keys(store.snapshots)
    .filter((key) => key < currentKey)
    .sort()
    .at(-1) ?? null;
}
