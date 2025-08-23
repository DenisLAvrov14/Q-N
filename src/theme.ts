// src/theme.ts
import { useStore } from './store/useStore';

type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  bg: string;         // цвет фона экрана
  surface: string;    // фон карточек/блоков
  text: string;       // основной текст
  subtext: string;    // вторичный текст (пояснения)
  border: string;     // границы/разделители
  badgeBg: string;    // фон бейджа темы
  badgeText: string;  // текст бейджа
  ctaBg: string;      // кнопка CTA фон
  ctaText: string;    // кнопка CTA текст
  icon: string;       // иконки
};

export const COLORS: Record<ThemeMode, ThemeColors> = {
  light: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#0f172a',
    subtext: '#475569',
    border: '#e5e7eb',
    badgeBg: '#e2e8f0',
    badgeText: '#0f172a',
    ctaBg: '#0f172a',
    ctaText: '#FFFFFF',
    icon: '#334155',
  },
  dark: {
    bg: '#0b0f14',
    surface: '#121826',
    text: '#e5e7eb',         // светлее текст
    subtext: '#cbd5e1',      // ещё светлее вторичный
    border: '#334155',
    badgeBg: '#1f2937',
    badgeText: '#e5e7eb',
    ctaBg: '#e5e7eb',        // инверсия CTA
    ctaText: '#0f172a',
    icon: '#cbd5e1',
  },
};

export function useThemeColors() {
  const mode = useStore((s) => s.theme);
  return COLORS[mode];
}
