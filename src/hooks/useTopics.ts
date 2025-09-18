// src/hooks/useTopics.ts
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTopics } from '../api/api';
import { TOPICS } from '../data/mock'; // fallback на «All» и дефолтный список

// локальный тип с поддержкой count
type Topic = { slug: string; title: string; count?: number };

const CACHE_KEY = 'topics:v1';

// Нормализуем список: убираем любые варианты "all"/"__clear" и добавляем единый "All" первым.
// Дедуп по slug (регистр игнорируем). Сохраняем count, если он есть.
function normalizeWithAll(items: Topic[]): Topic[] {
  const seen = new Set<string>();
  const cleaned: Topic[] = [];

  for (const t of items) {
    const slug = String(t?.slug ?? '').trim();
    if (!slug) continue;
    const lower = slug.toLowerCase();

    // выкидываем служебные
    if (lower === 'all' || lower === '__clear') continue;

    if (!seen.has(lower)) {
      seen.add(lower);
      cleaned.push({
        slug,
        title: t?.title || slug,
        count: typeof t?.count === 'number' ? t.count : undefined,
      });
    }
  }

  // единый "All" первым
  return [{ slug: 'all', title: 'All' }, ...cleaned];
}

export function useTopics() {
  // стартуем с дефолта (без count — это ок)
  const [topics, setTopics] = useState<Topic[]>(normalizeWithAll(TOPICS as Topic[]));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 1) Быстрый кеш
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Topic[];
          if (Array.isArray(parsed) && parsed.length) {
            setTopics(normalizeWithAll(parsed));
          }
        } catch {
          // битый кеш — игнор
        }
      }

      // 2) Тянем актуальные темы из CMS (ожидаем {slug,title,count?}[])
      const remote = await fetchTopics();
      if (remote && remote.length) {
        const normalized = normalizeWithAll(remote as Topic[]);
        setTopics(normalized);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(normalized));
      } else {
        // если CMS пуст — оставим кеш/дефолт
        if (!cached) {
          setTopics(normalizeWithAll(TOPICS as Topic[]));
        }
      }
    } catch {
      // сеть/ошибка API: если нет кеша — дефолт
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) {
        setTopics(normalizeWithAll(TOPICS as Topic[]));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // моментальный показ кеша (не блокируя основную загрузку)
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && mounted) {
          const parsed = JSON.parse(cached) as Topic[];
          if (Array.isArray(parsed) && parsed.length) {
            setTopics(normalizeWithAll(parsed));
          }
        }
      } catch {
        // ignore
      }

      if (!mounted) return;
      await load();
    })();

    return () => {
      mounted = false;
    };
  }, [load]);

  return { topics, loading, refetch: load };
}
