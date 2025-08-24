// src/hooks/useSaved.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAppForeground } from './useAppForeground';
import { fetchArticlesByIds } from '../api';
import type { Article } from '../types';

export function useSaved({
  savedIds,
  reloadVersion,
  autoRefresh = true,
}: {
  savedIds: number[];
  reloadVersion?: number;
  autoRefresh?: boolean;
}) {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);        // первичная/жёсткая загрузка
  const [refreshing, setRefreshing] = useState(false); // мягкий pull-to-refresh
  const [error, setError] = useState<string | null>(null);

  // защита от гонок ответов
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    try {
      setError(null);
      if (!savedIds.length) {
        if (reqId === reqIdRef.current) setItems([]);
        return;
      }
      const data = await fetchArticlesByIds(savedIds);
      // сохранить исходный порядок savedIds
      const order = new Map(savedIds.map((id, i) => [id, i]));
      const sorted = [...data].sort((a, b) => (order.get(a.id)! - order.get(b.id)!));
      if (reqId === reqIdRef.current) setItems(sorted);
    } catch (e: any) {
      if (reqId === reqIdRef.current) setError(e?.message ?? 'Failed to load saved items');
    } finally {
      if (reqId === reqIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [savedIds]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const hardReload = useCallback(() => {
    setLoading(true);
    setItems([]);
    load();
  }, [load]);

  // force reload из стора
  useEffect(() => {
    if (reloadVersion === undefined) return;
    hardReload();
  }, [reloadVersion, hardReload]);

  // refocus + foreground авто-рефреш
  useFocusEffect(useCallback(() => { hardReload(); }, [hardReload]));
  useAppForeground(() => { if (autoRefresh && !loading && !refreshing) onRefresh(); });

  return { items, loading, refreshing, error, onRefresh, hardReload };
}
