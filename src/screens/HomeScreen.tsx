// src/screens/Home.tsx
import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  SafeAreaView,
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
import { TOPICS } from '../data/mock';
import type { Article } from '../types';
import QCard from '../components/QCard';
import { NetBanner } from '../components/NetBanner';
import { useDirectusHealth } from '../hooks/useDirectusHealth';
import { useFeed } from '../hooks/useFeed';
import { ChipsBar } from '../components/ChipsBar';
import { SkeletonFeed } from '../components/SkeletonFeed';

const { height: WIN_H } = Dimensions.get('window');
const PAGE_SIZE = 10;

const EXTRA: any =
  (Constants.expoConfig?.extra as any) ||
  ((Constants as any).manifest?.extra as any) ||
  {};
const BASE_URL: string | undefined = EXTRA?.DIRECTUS_URL;

export default function HomeScreen({ navigation }: any) {
  const c = useThemeColors();

  // Глобальный выбор тем (UI)
  const selectedTopics = useStore((s) => s.selectedTopics);
  const toggleTopic     = useStore((s) => s.toggleTopic);
  const clearTopics     = useStore((s) => s.clearTopics);

  const savedIds        = useStore((s) => s.savedIds);
  const toggleSaved     = useStore((s) => s.toggleSaved);
  const rv              = useStore((s) => s.reloadVersion);

  // “Применённые” темы — по ним реально грузим ленту
  const [appliedTopics, setAppliedTopics] = useState<string[]>(selectedTopics);

  const [containerH, setContainerH] = useState(WIN_H - 140);
  const listRef = useRef<FlatList<Article>>(null);

  // Диагностика Directus
  const { status: healthApi, raw: healthRaw } = useDirectusHealth(BASE_URL);

  // Лента: грузим по appliedTopics
  const {
    items, loading, loadingMore, refreshing, error,
    onRefresh: feedRefresh, onEndReached,
  } = useFeed({
    selectedTopics: appliedTopics,
    pageSize: PAGE_SIZE,
    reloadVersion: rv,
    enableAutoRefresh: false, // фильтры применяем вручную
  });

  // Сравнение фильтров (UI vs applied)
  const filtersChanged = useMemo(() => {
    const a = selectedTopics.join('|');
    const b = appliedTopics.join('|');
    return a !== b;
  }, [selectedTopics, appliedTopics]);

  // Чипсы
  const chipsTopics = TOPICS;
  const clearLabel =
    selectedTopics.length > 0 ? `Clear (${selectedTopics.length})` : undefined;

  const onChipPress = (slug: string) => {
    if (slug === 'all' || slug === '__clear') clearTopics();
    else toggleTopic(slug);
    // Не грузим сразу — ждём pull-to-refresh
  };

  // ЕДИНАЯ функция refresh:
  // - если фильтры менялись — применяем их и скроллим к началу
  // - всегда триггерим рефетч, чтобы корректно отработал спиннер
  const handleRefresh = useCallback(() => {
    // защита от повторных жестов, пока идёт refresh
    if (refreshing || loading) return;

    if (filtersChanged) {
      setAppliedTopics(selectedTopics);
      // скроллим мгновенно, чтобы не дёргать UX
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    }

    // ВАЖНО: всегда вызываем реальный рефетч из хука
    feedRefresh();
  }, [filtersChanged, selectedTopics, feedRefresh, refreshing, loading]);

  const openArticle = (a: Article) => navigation.navigate('Article', { item: a });

  const renderItem = ({ item }: { item: Article }) => (
    <QCard
      item={item}
      height={containerH}
      onOpen={openArticle}
      saved={savedIds.includes(item.id)}
      onToggleSave={toggleSaved}
    />
  );

  // Скелетоны — первичная загрузка / force reload
  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <NetBanner baseUrl={BASE_URL} status={healthApi} raw={healthRaw} />
        <SkeletonFeed containerH={containerH} bgColor={c.bg} borderColor={c.border} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <NetBanner baseUrl={BASE_URL} status={healthApi} raw={healthRaw} />

      {/* Чипсы */}
      <ChipsBar
        topics={chipsTopics as any}
        selected={selectedTopics}
        onPress={onChipPress}
        clearLabel={clearLabel}
        bgColor={c.bg}
      />

      {/* Подсказка про pull-to-refresh только если фильтры менялись */}
      {filtersChanged && (
        <View style={[styles.hint, { borderColor: c.border, backgroundColor: c.surface }]}>
          <Text style={[styles.hintText, { color: c.subtext }]}>
            Filters changed — pull down to refresh to apply
          </Text>
        </View>
      )}

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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}  // ← фикс залипания
              />
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
            style={{ backgroundColor: c.bg }}
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

const styles = StyleSheet.create({
  hint: {
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  hintText: { fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16 },
  error: { paddingVertical: 8, alignItems: 'center' },
  errorText: { fontSize: 14 },
  footer: { paddingVertical: 16 },
});
