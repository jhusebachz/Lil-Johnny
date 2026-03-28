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
  metallicGlint: boolean;
};

export function getThemeColors(theme: ThemeMode): ThemeColors {
  if (theme === 'dark') {
    return {
      background: '#06090d',
      card: '#0d131a',
      cardBorder: '#1d2a36',
      text: '#f8fafc',
      subtext: '#b8c4d3',
      accent: '#178fad',
      accentSoft: '#102d38',
      inputBackground: '#0a1118',
      inputBorder: '#2c3d4b',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      tabInactive: '#8fa2b8',
      hero: '#0f1c28',
      heroText: '#ffffff',
      heroSubtext: 'rgba(232,241,248,0.78)',
      metallicGlint: false,
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
      metallicGlint: false,
    };
  }

  if (theme === 'silver-black') {
    return {
      background: '#050505',
      card: '#111111',
      cardBorder: '#3b3b3b',
      text: '#f3f4f6',
      subtext: '#c4c4c4',
      accent: '#bcc3c7',
      accentSoft: '#3a4148',
      inputBackground: '#0b0b0b',
      inputBorder: '#4b5563',
      success: '#9ca3af',
      warning: '#d1d5db',
      danger: '#ef4444',
      tabInactive: '#9ca3af',
      hero: '#17191c',
      heroText: '#f9fafb',
      heroSubtext: 'rgba(229,231,235,0.84)',
      metallicGlint: true,
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
    metallicGlint: false,
  };
}
