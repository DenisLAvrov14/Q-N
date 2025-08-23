import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface StoreState {
  // Мультивыбор тем: [] = All
  selectedTopics: string[];
  toggleTopic: (slug: string) => void;
  clearTopics: () => void;
  setOnlyTopics: (slugs: string[]) => void;

  savedIds: number[];
  toggleSaved: (id: number) => void;

  fontSize: number;
  setFontSize: (n: number) => void;

  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
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

      savedIds: [],
      toggleSaved: (id) =>
        set((s) => ({
          savedIds: s.savedIds.includes(id)
            ? s.savedIds.filter((x) => x !== id)
            : [...s.savedIds, id],
        })),

      fontSize: 16,
      setFontSize: (n) => set({ fontSize: Math.min(22, Math.max(14, Math.round(n))) }),

      theme: 'light',
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: 'qa-swipe-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // сохраняем только нужные поля
      partialize: (s) => ({
        selectedTopics: s.selectedTopics,
        savedIds: s.savedIds,
        fontSize: s.fontSize,
        theme: s.theme,
      }),
    }
  )
);
