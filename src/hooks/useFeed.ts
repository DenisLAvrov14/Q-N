import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { Article } from '../types';
import { fetchFeed } from '../api';
import { useAppForeground } from './useAppForeground';

/** простая задержка, чтобы сгладить быстрые клики по чипсам */
function useDebouncedValue<T>(value: T, delay = 160) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

type UseFeedParams = {
  selectedTopics: string[];
  pageSize?: number;
  reloadVersion?: number;      // Force reload извне
  enableAutoRefresh?: boolean; // foreground + refocus
  debounceMs?: number;         // дебаунс смены фильтра
  skeletonOnFilterChange?: boolean; // по умолчанию false (мягкая перезагрузка)
};

export function useFeed({
  selectedTopics,
  pageSize = 10,
  reloadVersion,
  enableAutoRefresh = true,
  debounceMs = 160,
  skeletonOnFilterChange = false,
}: UseFeedParams) {
  const debouncedTopics = useDebouncedValue(selectedTopics, debounceMs);

  const [items, setItems] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);        // показываем скелетоны ТОЛЬКО на первичке/force
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // мягкий refresh для смены фильтра
  const [error, setError] = useState<string | null>(null);

  // защита от гонок
  const reqIdRef = useRef(0);
  const topicsKeyRef = useRef<string>('');

  const load = useCallback(
    async (pageToLoad: number, replace = false) => {
      const reqId = ++reqIdRef.current;
      try {
        const data = await fetchFeed(debouncedTopics, pageToLoad, pageSize);
        if (reqId !== reqIdRef.current) return;
        setError(null);
        setHasMore(data.length === pageSize);
        setPage(pageToLoad);
        setItems((prev) => (replace ? data : [...prev, ...data]));
      } catch (e: any) {
        if (reqId !== reqIdRef.current) return;
        setError(e?.message ?? 'Failed to load feed');
      } finally {
        if (reqId === reqIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [debouncedTopics, pageSize]
  );

  // первичная загрузка
  useEffect(() => {
    setLoading(true);
    setItems([]);
    setHasMore(true);
    setPage(1);
    topicsKeyRef.current = debouncedTopics.join('|');
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // только однажды при маунте

  // смена фильтра (мягко: без скелетонов, оставляем текущий список)
  useEffect(() => {
    const newKey = debouncedTopics.join('|');
    if (topicsKeyRef.current === '') return; // первичка уже покрыта выше
    if (topicsKeyRef.current === newKey) return;

    topicsKeyRef.current = newKey;
    setHasMore(true);
    setPage(1);

    if (skeletonOnFilterChange || items.length === 0) {
      // хотим прям хард-переключение? — оставил опцию
      setLoading(true);
      setItems([]);
      load(1, true);
    } else {
      // по умолчанию — мягко: показываем pull-to-refresh, без скачка
      setRefreshing(true);
      load(1, true);
    }
  }, [debouncedTopics, skeletonOnFilterChange, items.length, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(1, true);
  }, [load]);

  const hardReload = useCallback(() => {
    setLoading(true);
    setItems([]);
    setHasMore(true);
    setPage(1);
    load(1, true);
  }, [load]);

  // Force reload триггер
  useEffect(() => {
    if (reloadVersion === undefined) return;
    hardReload();
  }, [reloadVersion, hardReload]);

  // авто-обновление
  useAppForeground(() => {
    if (enableAutoRefresh && !loading && !refreshing) onRefresh();
  });
  useFocusEffect(
    useCallback(() => {
      if (enableAutoRefresh && !loading) onRefresh();
    }, [onRefresh, enableAutoRefresh, loading])
  );

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    setLoadingMore(true);
    load(page + 1, false);
  }, [loading, loadingMore, refreshing, hasMore, page, load]);

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    page,
    onRefresh,
    onEndReached,
    hardReload,
    setItems,
  };
}
