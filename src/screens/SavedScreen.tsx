import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import QCard from '../components/QCard';
import { useThemeColors } from '../theme';
import type { Article } from '../types';
import { SkeletonCard } from '../components/Skeleton';
import { fetchArticlesByIds } from '../api';

const { height: WIN_H } = Dimensions.get('window');

export default function SavedScreen({ navigation }: any) {
  const c = useThemeColors();
  const savedIds = useStore((s) => s.savedIds);
  const toggleSaved = useStore((s) => s.toggleSaved);

  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerH, setContainerH] = useState(WIN_H - 140);

  const listRef = useRef<FlatList<Article>>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchArticlesByIds(savedIds);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load saved items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [savedIds]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  useEffect(() => {
    if (!loading) load();
  }, [savedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const onOpen = (item: Article) => navigation.navigate('Article', { item });
  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Скелетоны при первичной загрузке
  if (loading) {
    const skHeight = containerH || WIN_H - 140;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <FlatList
          data={savedIds.length ? [0, 1] : []}
          keyExtractor={(i) => `sk-${i}`}
          renderItem={() => <SkeletonCard height={skHeight} />}
          snapToInterval={skHeight}
          decelerationRate="fast"
          pagingEnabled
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: skHeight, offset: skHeight * index, index })}
          style={{ backgroundColor: c.bg }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: c.subtext }]}>
                You have no saved cards yet.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
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
            renderItem={({ item }) => (
              <QCard
                item={item}
                height={containerH}          // ← как в Home, «страничная» прокрутка
                onOpen={onOpen}
                saved={savedIds.includes(item.id)}
                onToggleSave={toggleSaved}
              />
            )}
            snapToInterval={containerH}
            decelerationRate="fast"
            pagingEnabled
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: containerH, offset: containerH * index, index })}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListFooterComponent={
              refreshing ? <ActivityIndicator style={{ paddingVertical: 16 }} /> : null
            }
            style={{ backgroundColor: c.bg }}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: c.subtext }]}>
              You have no saved cards yet.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16 },
  error: { paddingVertical: 8, alignItems: 'center' },
  errorText: { fontSize: 14 },
});
