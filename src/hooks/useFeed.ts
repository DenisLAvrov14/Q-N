import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Article } from '../types';
import { fetchFeed } from '../api/api';
import { useConnectivity } from './useConnectivity';

type Params = {
  selectedTopics: string[];
  pageSize: number;
  reloadVersion?: number;
  enableAutoRefresh?: boolean;
  /** Не очищать список при перезагрузке (для мягкого UI-обновления) */
  keepItemsWhileReloading?: boolean;
};

export function useFeed({
  selectedTopics,
  pageSize,
  reloadVersion = 0,
  enableAutoRefresh = true,
  keepItemsWhileReloading = false,
}: Params) {
  const { isOffline } = useConnectivity();

  const [items, setItems] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ключ кэша: темы + размер страницы
  const cacheKey = useMemo(() => {
    const key = selectedTopics.length ? selectedTopics.slice().sort().join(',') : 'ALL';
    return `feed:${key}:${pageSize}`;
  }, [selectedTopics, pageSize]);

  const load = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      // офлайн → показать кэш (если есть)
      if (isOffline) {
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const data: Article[] = JSON.parse(cached);
            setItems(data);
            setHasMore(false);
            setError(null);
          } else {
            setItems([]);
            setError('Offline. No cached feed yet.');
          }
        } finally {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
        return;
      }

      try {
        const data = await fetchFeed(selectedTopics, pageToLoad, pageSize);
        setError(null);
        setHasMore(data.length === pageSize);
        setPage(pageToLoad);
        setItems(prev => (replace ? data : [...prev, ...data]));

        // кэшируем только первую страницу (как «последний фид»)
        if (pageToLoad === 1) {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (e: any) {
        // сеть упала → пробуем кэш
        if (pageToLoad === 1) {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            setItems(JSON.parse(cached));
            setHasMore(false);
            setError(null);
          } else {
            setError(e?.message ?? 'Failed to load feed');
          }
        } else {
          setError(e?.message ?? 'Failed to load feed');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [selectedTopics, pageSize, cacheKey, isOffline]
  );

  // первичная загрузка / смена фильтров / force reload
  useEffect(() => {
    setLoading(true);
    if (!keepItemsWhileReloading) {
      setItems([]); // ← только если нужна «жёсткая» перезагрузка
    }
    setHasMore(true);
    load(1, true);
  }, [cacheKey, reloadVersion, keepItemsWhileReloading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(1, true);
  }, [load]);

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore || isOffline) return;
    setLoadingMore(true);
    load(page + 1, false);
  }, [loading, loadingMore, refreshing, hasMore, isOffline, page, load]);

  // авто-обновление можно включать/выключать снаружи
  useEffect(() => {
    if (!enableAutoRefresh) return;
    const visHandler = () => onRefresh();
    const sub = () => {
      // no-op in bare RN; оставлено на будущее
    };
    return () => {
      if (typeof sub === 'function') sub();
    };
  }, [enableAutoRefresh, onRefresh]);

  return { items, loading, loadingMore, refreshing, error, onRefresh, onEndReached };
}
