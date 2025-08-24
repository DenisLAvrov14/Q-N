// src/screens/Saved.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  SafeAreaView, View, FlatList, RefreshControl, ActivityIndicator,
  Text, StyleSheet, Dimensions,
} from 'react-native';
import { useStore } from '../store/useStore';
import { useThemeColors } from '../theme';
import QCard from '../components/QCard';
import type { Article } from '../types';
import { SkeletonCard } from '../components/Skeleton';
import { useSaved } from '../hooks/useSaved';

const { height: WIN_H } = Dimensions.get('window');

export default function SavedScreen({ navigation }: any) {
  const c = useThemeColors();
  const savedIds   = useStore((s) => s.savedIds);
  const toggleSaved = useStore((s) => s.toggleSaved);
  const rv          = useStore((s) => s.reloadVersion);

  const [containerH, setContainerH] = useState(WIN_H - 140);
  const listRef = useRef<FlatList<Article>>(null);

  const { items, loading, refreshing, error, onRefresh, hardReload } =
    useSaved({ savedIds, reloadVersion: rv });

  // прокрутить в начало при жёстком reload (когда loading снова true)
  useEffect(() => {
    if (loading) listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [loading]);

  const onOpen = (item: Article) => navigation.navigate('Article', { item });

  // Скелетоны во весь экран
  if (loading) {
    const h = containerH || WIN_H - 140;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <FlatList
          data={savedIds.length ? [0, 1] : []}
          keyExtractor={(i) => `sk-${i}`}
          renderItem={() => <SkeletonCard height={h} />}
          snapToInterval={h}
          decelerationRate="fast"
          pagingEnabled
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: h, offset: h * i, index: i })}
          style={{ backgroundColor: c.bg }}
          ListEmptyComponent={<Empty text="You have no saved cards yet." color={c.subtext} />}
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
          <Text style={[styles.errorText, { color: '#ff5252', textAlign: 'center', paddingVertical: 8 }]}>
            Ошибка: {error}
          </Text>
        ) : null}

        {items.length ? (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(it) => String(it.id)}
            renderItem={({ item }) => (
              <QCard
                item={item}
                height={containerH}
                onOpen={onOpen}
                saved={savedIds.includes(item.id)}
                onToggleSave={toggleSaved}
              />
            )}
            snapToInterval={containerH}
            decelerationRate="fast"
            pagingEnabled
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, i) => ({ length: containerH, offset: containerH * i, index: i })}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListFooterComponent={refreshing ? <ActivityIndicator style={{ paddingVertical: 16 }} /> : null}
            style={{ backgroundColor: c.bg }}
          />
        ) : (
          <Empty text="You have no saved cards yet." color={c.subtext} />
        )}
      </View>
    </SafeAreaView>
  );
}

function Empty({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16 },
  errorText: { fontSize: 14 },
});
