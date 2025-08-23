// src/screens/Home.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { useStore } from '../store/useStore';
import { TOPICS } from '../data/mock';
import TopicChip from '../components/TopicChip';
import QCard from '../components/QCard';
import type { Article } from '../types';
import { useThemeColors } from '../theme';
import { SkeletonCard } from '../components/Skeleton';
import { fetchFeed, pingDirectus } from '../api';

const { height: WIN_H } = Dimensions.get('window');
const PAGE_SIZE = 10;

// читаем baseUrl из app.json -> expo.extra
const EXTRA: any =
  (Constants.expoConfig?.extra as any) ||
  ((Constants as any).manifest?.extra as any) ||
  {};
const BASE_URL: string = (EXTRA?.DIRECTUS_URL || '').replace(/\/$/, '');
const DEBUG_HEALTH_URL = BASE_URL ? `${BASE_URL}/server/health` : '';

export default function HomeScreen({ navigation }: any) {
  const c = useThemeColors();

  const selectedTopics = useStore((s) => s.selectedTopics);
  const toggleTopic     = useStore((s) => s.toggleTopic);
  const clearTopics     = useStore((s) => s.clearTopics);

  const savedIds    = useStore((s) => s.savedIds);
  const toggleSaved = useStore((s) => s.toggleSaved);

  const [containerH, setContainerH] = useState(WIN_H - 140);
  const listRef = useRef<FlatList<Article>>(null);

  // Данные из Directus
  const [items, setItems] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);        // первичная загрузка
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Диагностика сети / видимый баннер
  const [healthRaw, setHealthRaw] = useState<string>('pending');
  const [healthApi, setHealthApi] = useState<'pending' | 'ok' | 'fail'>('pending');

  // --- NET DEBUG: однократный тест доступности Directus ---
  useEffect(() => {
    (async () => {
      if (!DEBUG_HEALTH_URL) {
        setHealthRaw('no_base_url');
        setHealthApi('fail');
        console.log('[HEALTH] BASE_URL is empty. Check expo.extra.DIRECTUS_URL');
        return;
      }
      try {
        const res = await fetch(DEBUG_HEALTH_URL);
        const txt = await res.text();
        console.log('[HEALTH raw]', res.status, txt);
        setHealthRaw(`${res.status}:${txt.slice(0, 120)}`);
      } catch (e: any) {
        console.log('[HEALTH raw ERR]', e?.message || e);
        setHealthRaw(`ERR:${e?.message || 'Network request failed'}`);
      }

      try {
        const ok = await pingDirectus();
        console.log('[HEALTH api]', ok ? 'OK' : 'FAIL');
        setHealthApi(ok ? 'ok' : 'fail');
      } catch (e: any) {
        console.log('[HEALTH api ERR]', e?.message || e);
        setHealthApi('fail');
      }
    })();
  }, []);

  const chips = useMemo(() => {
    const base = TOPICS;
    return selectedTopics.length > 0
      ? [...base, { slug: '__clear', title: `Clear (${selectedTopics.length})` } as any]
      : base;
  }, [selectedTopics]);

  const isActive = (slug: string) =>
    slug === 'all' ? selectedTopics.length === 0 : selectedTopics.includes(slug);

  const onChipPress = (slug: string) => {
    if (slug === 'all' || slug === '__clear') clearTopics();
    else toggleTopic(slug);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const openArticle = (a: Article) => navigation.navigate('Article', { item: a });

  // Загрузка страницы
  const load = useCallback(
    async (pageToLoad: number, replace = false) => {
      try {
        const data = await fetchFeed(selectedTopics, pageToLoad, PAGE_SIZE);
        setError(null);
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageToLoad);
        setItems((prev) => (replace ? data : [...prev, ...data]));
      } catch (e: any) {
        console.log('[FEED ERR]', e?.message || e);
        setError(e?.message ?? 'Failed to load feed'); // типично "Network request failed"
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [selectedTopics]
  );

  // первичная загрузка + смена фильтра
  useEffect(() => {
    setLoading(true);
    setItems([]);
    setHasMore(true);
    load(1, true);
  }, [selectedTopics, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(1, true);
  }, [load]);

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    setLoadingMore(true);
    load(page + 1, false);
  }, [loading, loadingMore, refreshing, hasMore, page, load]);

  const renderItem = ({ item }: { item: Article }) => (
    <QCard
      item={item}
      height={containerH}
      onOpen={openArticle}
      saved={savedIds.includes(item.id)}
      onToggleSave={toggleSaved}   
    />
  );

  // Скелетоны при первичной загрузке
  if (loading && items.length === 0) {
    const skHeight = containerH || WIN_H - 140;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        {/* Баннер диагностики */}
        <NetBanner baseUrl={BASE_URL} healthApi={healthApi} healthRaw={healthRaw} />

        <View style={[styles.chipsRow, { backgroundColor: c.bg }]}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[70, 90, 110, 85, 100, 80, 95]}
            keyExtractor={(_, i) => `chip-${i}`}
            renderItem={({ item }) => (
              <View
                style={{
                  height: 36,
                  width: item,
                  borderRadius: 10,
                  marginRight: 8,
                  backgroundColor: c.border,
                }}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        <FlatList
          data={[0, 1, 2]}
          keyExtractor={(i) => `sk-${i}`}
          renderItem={() => <SkeletonCard height={skHeight} />}
          snapToInterval={skHeight}
          decelerationRate="fast"
          pagingEnabled
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: skHeight, offset: skHeight * index, index })}
          style={{ backgroundColor: c.bg }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Баннер диагностики */}
      <NetBanner baseUrl={BASE_URL} healthApi={healthApi} healthRaw={healthRaw} />

      <View style={[styles.chipsRow, { backgroundColor: c.bg }]}>
        <FlatList
          data={chips}
          keyExtractor={(t: any, i) => t.slug ?? String(i)}
          renderItem={({ item }: any) => (
            <TopicChip
              label={item.title}
              active={item.slug !== '__clear' && isActive(item.slug)}
              onPress={() => onChipPress(item.slug)}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      <View
        style={{ flex: 1, backgroundColor: c.bg }}
        onLayout={(e) => setContainerH(e.nativeEvent.layout.height)}
      >
        {error ? (
          <View style={styles.error}>
            <Text style={[styles.errorText, { color: '#ff5252' }]}>Ошибка: {error}</Text>
          </View>
        ) : null}

        {items.length ? (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(it) => String(it.id)}
            renderItem={renderItem}
            snapToInterval={containerH}
            decelerationRate="fast"
            pagingEnabled
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: containerH, offset: containerH * index, index })}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        ) : (
          !error && (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: c.subtext }]}>
                No results for selected topics.
              </Text>
            </View>
          )
        )}
      </View>
    </SafeAreaView>
  );
}

function NetBanner({
  baseUrl,
  healthApi,
  healthRaw,
}: {
  baseUrl: string;
  healthApi: 'pending' | 'ok' | 'fail';
  healthRaw: string;
}) {
  if (!baseUrl) {
    return (
      <View style={[styles.banner, { backgroundColor: '#ffefe8' }]}>
        <Text style={styles.bannerText}>
          DIRECTUS_URL не задан в app.json → expo.extra.DIRECTUS_URL
        </Text>
      </View>
    );
  }
  if (healthApi === 'ok') return null;

  const color = healthApi === 'pending' ? '#fff6d6' : '#ffefe8';
  const msg =
    healthApi === 'pending'
      ? `Проверяем доступность: ${baseUrl}`
      : `Не удаётся подключиться к Directus: ${baseUrl}\n[HEALTH] ${healthRaw}`;

  return (
    <View style={[styles.banner, { backgroundColor: color }]}>
      <Text style={styles.bannerText}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: { height: 56, justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16 },
  error: { paddingVertical: 8, alignItems: 'center' },
  errorText: { fontSize: 14 },
  footer: { paddingVertical: 16 },
  banner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000014',
  },
  bannerText: { fontSize: 12, lineHeight: 16 },
});
