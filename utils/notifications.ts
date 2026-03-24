import Constants from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

export const isExpoGo = Constants.executionEnvironment === 'storeClient';

export function getNotificationsModule(): NotificationsModule | null {
  if (Platform.OS === 'web' || isExpoGo) {
    return null;
  }

  return require('expo-notifications') as NotificationsModule;
}
