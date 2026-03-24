import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}lil-johnny-settings.json`;
export const WEB_STORAGE_KEY = 'lil-johnny-settings';

export async function readPersistedSettings<T>(): Promise<T | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(WEB_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  }

  const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE);

  if (!fileInfo.exists) {
    return null;
  }

  const raw = await FileSystem.readAsStringAsync(STORAGE_FILE);
  return JSON.parse(raw) as T;
}

export async function writePersistedSettings<T>(settings: T) {
  const raw = JSON.stringify(settings);

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEB_STORAGE_KEY, raw);
    }

    return;
  }

  await FileSystem.writeAsStringAsync(STORAGE_FILE, raw);
}
