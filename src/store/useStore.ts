import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface StoreState {
  // Темы (мультивыбор): [] = All
  selectedTopics: string[];
  toggleTopic: (slug: string) => void;
  clearTopics: () => void;
  setOnlyTopics: (slugs: string[]) => void;

  // Избранное
  savedIds: number[];
  toggleSaved: (id: number) => void;

  // Настройки UI
  fontSize: number;
  setFontSize: (n: number) => void;

  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  // Dev/QA: форс-обновление экранов (не сохраняется)
  reloadVersion: number;
  forceReload: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // --- Фильтры тем ---
      selectedTopics: [],
      toggleTopic: (slug) =>
        set((state) => {
          if (slug === 'all') return { selectedTopics: [] };
          const next = new Set(state.selectedTopics);
          next.has(slug) ? next.delete(slug) : next.add(slug);
          return { selectedTopics: Array.from(next) };
        }),
      clearTopics: () => set({ selectedTopics: [] }),
      setOnlyTopics: (slugs) =>
        set({ selectedTopics: Array.from(new Set(slugs.filter((s) => s !== 'all'))) }),

      // --- Избранное ---
      savedIds: [],
      toggleSaved: (id) =>
        set((s) => ({
          savedIds: s.savedIds.includes(id)
            ? s.savedIds.filter((x) => x !== id)
            : [...s.savedIds, id],
        })),

      // --- UI ---
      fontSize: 16,
      setFontSize: (n) => set({ fontSize: Math.min(22, Math.max(14, Math.round(n))) }),

      theme: 'light',
      setTheme: (t) => set({ theme: t }),

      // --- Dev/QA reload (эпhemeral) ---
      reloadVersion: 0,
      forceReload: () => set((s) => ({ reloadVersion: s.reloadVersion + 1 })),
    }),
    {
      name: 'qa-swipe-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // сохраняем только нужные поля (reloadVersion не попадает в persist)
      partialize: (s) => ({
        selectedTopics: s.selectedTopics,
        savedIds: s.savedIds,
        fontSize: s.fontSize,
        theme: s.theme,
      }),
    }
  )
);
