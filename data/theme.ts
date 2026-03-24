import { ThemeMode } from '../context/AppSettingsContext';

export type ThemeColors = {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  subtext: string;
  accent: string;
  accentSoft: string;
  inputBackground: string;
  inputBorder: string;
  success: string;
  warning: string;
  danger: string;
  tabInactive: string;
  hero: string;
  heroText: string;
  heroSubtext: string;
};

export function getThemeColors(theme: ThemeMode): ThemeColors {
  if (theme === 'dark') {
    return {
      background: '#0b1220',
      card: '#111827',
      cardBorder: '#1f2937',
      text: '#f9fafb',
      subtext: '#cbd5e1',
      accent: '#8b5cf6',
      accentSoft: '#312e81',
      inputBackground: '#0f172a',
      inputBorder: '#334155',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      tabInactive: '#94a3b8',
      hero: '#1e1b4b',
      heroText: '#ffffff',
      heroSubtext: 'rgba(255,255,255,0.78)',
    };
  }

  if (theme === 'gangsta-green') {
    return {
      background: '#07130b',
      card: '#0f1f14',
      cardBorder: '#1f3b28',
      text: '#ecfdf5',
      subtext: '#bbf7d0',
      accent: '#22c55e',
      accentSoft: '#14532d',
      inputBackground: '#0b1810',
      inputBorder: '#2f5a3b',
      success: '#22c55e',
      warning: '#eab308',
      danger: '#ef4444',
      tabInactive: '#86efac',
      hero: '#14532d',
      heroText: '#f0fdf4',
      heroSubtext: 'rgba(240,253,244,0.82)',
    };
  }

  return {
    background: '#f3f4f6',
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    text: '#111827',
    subtext: '#6b7280',
    accent: '#8b5cf6',
    accentSoft: '#ede9fe',
    inputBackground: '#f9fafb',
    inputBorder: '#d1d5db',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    tabInactive: '#6b7280',
    hero: '#111827',
    heroText: '#ffffff',
    heroSubtext: '#cbd5e1',
  };
}