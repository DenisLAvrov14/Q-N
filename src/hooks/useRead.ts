// src/hooks/useRead.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const READ_KEY = 'read:v1';

type PersistShape = Record<string, string[]>;

export function useRead() {
  const [byTopic, setByTopic] = useState<Map<string, Set<string>>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const savingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // загрузка
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(READ_KEY);
        if (!raw) {
          setByTopic(new Map());
          setLoaded(true);
          return;
        }
        const parsed: PersistShape = JSON.parse(raw);
        const map = new Map<string, Set<string>>();
        for (const [slug, arr] of Object.entries(parsed)) {
          const set = new Set<string>((arr ?? []).map(String));
          if (set.size > 0) map.set(slug, set);
        }
        setByTopic(map);
      } catch {
        setByTopic(new Map());
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // отложенная запись
  const persist = useCallback((map: Map<string, Set<string>>) => {
    if (savingRef.current) clearTimeout(savingRef.current);
    savingRef.current = setTimeout(() => {
      const obj: PersistShape = {};
      map.forEach((set, slug) => {
        const arr = Array.from(set);
        if (arr.length > 0) obj[slug] = arr;
      });
      AsyncStorage.setItem(READ_KEY, JSON.stringify(obj)).catch(() => {});
      savingRef.current = null;
    }, 150);
  }, []);

  // пометить как прочитанную
  const markRead = useCallback(
    (id: number | string, topic?: string | null) => {
      const slug = String(topic ?? '').trim();
      if (!slug) return;

      setByTopic(prev => {
        const next = new Map(prev);
        const set = new Set(next.get(slug) ?? new Set<string>());
        const key = String(id);
        if (!set.has(key)) {
          set.add(key);
          next.set(slug, set);
          persist(next);
        }
        return next;
      });
    },
    [persist]
  );

  const isRead = useCallback(
    (id: number | string, topic?: string | null) => {
      const slug = String(topic ?? '').trim();
      if (!slug) return false;
      const set = byTopic.get(slug);
      return !!set && set.has(String(id));
    },
    [byTopic]
  );

  const readCountByTopic = useMemo(() => {
    const m = new Map<string, number>();
    byTopic.forEach((set, slug) => m.set(slug, set.size));
    return m;
  }, [byTopic]);

  // очистка
  const clearAll = useCallback(async () => {
    try {
      await AsyncStorage.setItem(READ_KEY, '{}'); // 👈 вместо removeItem
    } catch {}
    setByTopic(new Map());
  }, []);

  return {
    loaded,
    readCountByTopic,
    isRead,
    markRead,
    clearAll,
  };
}
