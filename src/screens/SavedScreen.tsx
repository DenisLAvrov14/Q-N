// src/screens/Saved.tsx
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { useStore } from '../store/useStore';
import { useThemeColors } from '../theme';
import QCard, { CARD_SIDE_GUTTER } from '../components/QCard';
import type { Article } from '../types';
import { useSaved } from '../hooks/useSaved';
import { ChipsBar } from '../components/ChipsBar';
import { useTopics } from '../hooks/useTopics';
import { NetBanner } from '../components/NetBanner';
import { useDirectusHealth } from '../hooks/useDirectusHealth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';

const { height: WIN_H } = Dimensions.get('window');

const EXTRA: any =
  (Constants.expoConfig?.extra as any) || ((Constants as any).manifest?.extra as any) || {};
const BASE_URL: string | undefined = EXTRA?.DIRECTUS_URL;

export default function SavedScreen({ navigation }: any) {
  const c = useThemeColors();

  // NetBanner как на Home
  const { status: healthApi, raw: healthRaw } = useDirectusHealth(BASE_URL);

  // глобальные фильтры тем (общие с Home)
  const selectedTopics = useStore(s => s.selectedTopics);
  const setOnlyTopics = useStore(s => s.setOnlyTopics);

  const savedIds = useStore(s => s.savedIds);
  const toggleSaved = useStore(s => s.toggleSaved);
  const rv = useStore(s => s.reloadVersion);

  // темы для ChipsBar
  const { topics, loading: topicsLoading } = useTopics();
  const chipsTopics = topics;
  const clearLabel = selectedTopics.length > 0 ? `Clear (${selectedTopics.length})` : undefined;

  // высота контейнера — как на Home
  const [containerH, setContainerH] = useState(WIN_H - 140);
  const listRef = useRef<FlatList<Article>>(null);

  const { items, loading, refreshing, error, onRefresh } = useSaved({
    savedIds,
    reloadVersion: rv,
  });

  // фильтрация сохранёнок по темам
  const filteredItems = useMemo(() => {
    if (!selectedTopics.length) return items;
    const set = new Set(selectedTopics);
    return items.filter(it => !!it.topicSlug && set.has(it.topicSlug));
  }, [items, selectedTopics]);

  const onOpen = (item: Article) => navigation.navigate('Article', { item });

  const onChipPress = (slug: string) => {
    let next: string[] = selectedTopics;
    if (slug === 'all' || slug === '__clear') {
      next = [];
    } else {
      const s = new Set(selectedTopics);
      s.has(slug) ? s.delete(slug) : s.add(slug);
      next = Array.from(s);
    }
    setOnlyTopics(next);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  };

  // рендер карточки с Unsave-свайпом
  const renderItem = ({ item }: { item: Article }) => {
    const renderRightActions = () => (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'flex-end',
          backgroundColor: '#EF4444',
          borderRadius: 16,
          marginVertical: 6,
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontWeight: '700',
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          Remove
        </Text>
      </View>
    );

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        onSwipeableOpen={dir => {
          if (dir === 'right') toggleSaved(item.id);
        }}
      >
        <QCard
          item={item}
          height={containerH}
          bottomGap={12}
          onOpen={onOpen}
          saved={savedIds.includes(item.id)}
          onToggleSave={toggleSaved}
        />
      </Swipeable>
    );
  };

  const showOverlaySpinner = loading && filteredItems.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <NetBanner baseUrl={BASE_URL} status={healthApi} raw={healthRaw} />

      <ChipsBar
        topics={chipsTopics as any}
        selected={selectedTopics}
        onPress={onChipPress}
        clearLabel={clearLabel}
        bgColor={c.bg}
        padH={CARD_SIDE_GUTTER}
        loading={topicsLoading}
      />

      <View
        style={{ flex: 1, backgroundColor: c.bg }}
        onLayout={e => setContainerH(e.nativeEvent.layout.height)}
      >
        {error ? (
          <Text
            style={[
              styles.errorText,
              { color: '#ff5252', textAlign: 'center', paddingVertical: 8 },
            ]}
          >
            Ошибка: {error}
          </Text>
        ) : null}

        {filteredItems.length ? (
          <>
            <FlatList
              ref={listRef}
              data={filteredItems}
              keyExtractor={it => String(it.id)}
              renderItem={renderItem}
              snapToInterval={containerH}
              decelerationRate="fast"
              pagingEnabled
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, i) => ({ length: containerH, offset: containerH * i, index: i })}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListFooterComponent={
                refreshing ? <ActivityIndicator style={{ paddingVertical: 16 }} /> : null
              }
              style={{ backgroundColor: c.bg }}
            />

            {showOverlaySpinner && (
              <View style={styles.overlay}>
                <ActivityIndicator />
              </View>
            )}
          </>
        ) : (
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={[styles.emptyTitle, { color: c.subtext }]}>
                {selectedTopics.length
                  ? 'No saved cards for selected topics.'
                  : 'You have no saved cards yet.'}
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16 },
  errorText: { fontSize: 14 },
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
