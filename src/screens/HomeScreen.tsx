// src/screens/Home.tsx
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useRead } from '../hooks/useRead';
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StyleSheet,
  FlatList,
} from 'react-native';
import Constants from 'expo-constants';
import { useThemeColors } from '../theme';
import { useStore } from '../store/useStore';
import type { Article } from '../types';
import QCard from '../components/QCard';
import { NetBanner } from '../components/NetBanner';
import { useDirectusHealth } from '../hooks/useDirectusHealth';
import { useFeed } from '../hooks/useFeed';
import { ChipsBar } from '../components/ChipsBar';
import { SkeletonFeed } from '../components/SkeletonFeed';
import RetryBanner from '../components/RetryBanner';
import { useTopics } from '../hooks/useTopics';
import { CARD_SIDE_GUTTER } from '../components/QCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: WIN_H } = Dimensions.get('window');
const PAGE_SIZE = 10;

const EXTRA: any =
  (Constants.expoConfig?.extra as any) || ((Constants as any).manifest?.extra as any) || {};
const BASE_URL: string | undefined = EXTRA?.DIRECTUS_URL;

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort().join('|');
  const sb = [...b].sort().join('|');
  return sa === sb;
}

export default function HomeScreen({ navigation }: any) {
  const c = useThemeColors();

  // Глобальный выбор тем (UI)
  const selectedTopics = useStore(s => s.selectedTopics);
  const setOnlyTopics = useStore(s => s.setOnlyTopics);

  const savedIds = useStore(s => s.savedIds);
  const toggleSaved = useStore(s => s.toggleSaved);
  const rv = useStore(s => s.reloadVersion);

  // “Применённые” темы — по ним реально грузим ленту
  const [appliedTopics, setAppliedTopics] = useState<string[]>(selectedTopics);
  const [containerH, setContainerH] = useState(WIN_H - 140);
  const listRef = useRef<FlatList<Article>>(null);

  // Диагностика Directus
  const { status: healthApi, raw: healthRaw } = useDirectusHealth(BASE_URL);

  // Лента: грузим по appliedTopics; важно — не очищать список во время перезагрузки
  const {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    onRefresh: feedRefresh,
    onEndReached,
  } = useFeed({
    selectedTopics: appliedTopics,
    pageSize: PAGE_SIZE,
    reloadVersion: rv,
    enableAutoRefresh: false,
    keepItemsWhileReloading: true, // ← ключ к «мягкой» перезагрузке
  });

  // Чипсы из CMS + их загрузка
  const { topics: chipsTopics, loading: topicsLoading } = useTopics();

  // “Непрочитанные” по темам
  const { readCountByTopic } = useRead();
  const totalByTopic = useMemo(() => {
    const m = new Map<string, number>();
    (chipsTopics ?? []).forEach((t: any) => {
      if (t?.slug && t.slug !== 'all' && t.slug !== '__clear' && typeof t.count === 'number') {
        m.set(t.slug, t.count);
      }
    });
    return m;
  }, [chipsTopics]);

  const getUnreadBadge = useCallback(
    (slug: string) => {
      if (!slug || slug === 'all' || slug === '__clear') return undefined;
      const total = totalByTopic.get(slug) ?? 0;
      const read = readCountByTopic.get(slug) ?? 0;
      const unread = total - read;
      return unread > 0 ? unread : undefined; // 0 не показываем
    },
    [totalByTopic, readCountByTopic]
  );

  const clearLabel = selectedTopics.length > 0 ? `Clear (${selectedTopics.length})` : undefined;

  // Мягкое применение фильтра сразу по тапу
  const onChipPress = (slug: string) => {
    // 1) посчитаем будущий набор тем локально
    let next = selectedTopics;
    if (slug === 'all' || slug === '__clear') {
      next = [];
    } else {
      const s = new Set(selectedTopics);
      s.has(slug) ? s.delete(slug) : s.add(slug);
      next = Array.from(s);
    }

    // 2) обновим глобальный стор и appliedTopics
    setOnlyTopics(next);
    if (!arraysEqual(next, appliedTopics)) {
      setAppliedTopics(next);
      // 3) плавно наверх
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    }
  };

  const openArticle = (a: Article) => navigation.navigate('Article', { item: a });

  const renderItem = ({ item }: { item: Article }) => (
    <QCard
      item={item}
      height={containerH}
      bottomGap={12}
      onOpen={openArticle}
      saved={savedIds.includes(item.id)}
      onToggleSave={toggleSaved}
    />
  );

  // Скелетоны — первая загрузка / force reload, когда ещё нет контента
  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <NetBanner baseUrl={BASE_URL} status={healthApi} raw={healthRaw} />
        <SkeletonFeed containerH={containerH} bgColor={c.bg} borderColor={c.border} />
      </SafeAreaView>
    );
  }

  // компактный оверлей-спиннер на мягкую перезагрузку (когда список уже есть)
  const showOverlaySpinner = loading && items.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <NetBanner baseUrl={BASE_URL} status={healthApi} raw={healthRaw} />

      <ChipsBar
        topics={chipsTopics as any}
        selected={selectedTopics}
        onPress={onChipPress}
        clearLabel={clearLabel}
        bgColor={c.bg}
        loading={topicsLoading}
        padH={CARD_SIDE_GUTTER}
        getBadge={getUnreadBadge} // ← непрочитанные по теме
      />

      <View
        style={{ flex: 1, backgroundColor: c.bg }}
        onLayout={e => setContainerH(e.nativeEvent.layout.height)}
      >
        {error ? <RetryBanner message={error} onRetry={feedRefresh} /> : null}

        {items.length ? (
          <>
            <FlatList
              ref={listRef}
              data={items}
              keyExtractor={it => String(it.id)}
              renderItem={renderItem}
              snapToInterval={containerH}
              decelerationRate="fast"
              pagingEnabled
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: containerH,
                offset: containerH * index,
                index,
              })}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.6}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={feedRefresh} />}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.footer}>
                    <ActivityIndicator />
                  </View>
                ) : null
              }
              contentInsetAdjustmentBehavior="never"
              removeClippedSubviews
              initialNumToRender={1}
              windowSize={3}
              maxToRenderPerBatch={2}
              style={{ backgroundColor: c.bg }}
            />

            {showOverlaySpinner && (
              <View style={styles.overlay}>
                <ActivityIndicator />
              </View>
            )}
          </>
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

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16 },
  footer: { paddingVertical: 16 },
  overlay: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#00000022',
  },
});
