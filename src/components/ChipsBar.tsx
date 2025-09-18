import React, { useMemo } from 'react';
import { View, FlatList } from 'react-native';
import TopicChip from './TopicChip';

type Topic = { slug: string; title: string };

type Props = {
  topics: Topic[];
  selected: string[];
  onPress: (slug: string) => void;
  clearLabel?: string;
  bgColor?: string;
  padH?: number;
  loading?: boolean;
  getBadge?: (slug: string) => number | undefined; // ✅ добавляем
};

export function ChipsBar({
  topics,
  selected,
  onPress,
  clearLabel,
  bgColor,
  padH = 16, // ← теперь реально используется для marginHorizontal
  loading = false,
}: Props) {
  // Скелетоны при загрузке
  if (loading) {
    return (
      <View
        style={{
          height: 56,
          justifyContent: 'center',
          backgroundColor: bgColor,
          marginHorizontal: padH,
        }}
      >
        <FlatList
          horizontal
          data={[70, 90, 110, 85, 100, 80, 95]}
          keyExtractor={(_, i) => `chip-sk-${i}`}
          renderItem={({ item }) => (
            <View
              style={{
                height: 36,
                width: item,
                borderRadius: 10,
                marginRight: 8,
                backgroundColor: '#00000014',
              }}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 0 }}
        />
      </View>
    );
  }

  // Готовые чипы: добавляем "All" только если его нет, + дедуп по slug
  const data = useMemo(() => {
    const hasAll = topics.some(t => t.slug === 'all');
    const base: Topic[] = hasAll ? [...topics] : [{ slug: 'all', title: 'All' }, ...topics];

    if (clearLabel) base.push({ slug: '__clear', title: clearLabel });

    const seen = new Set<string>();
    return base.filter(t => {
      if (seen.has(t.slug)) return false;
      seen.add(t.slug);
      return true;
    });
  }, [topics, clearLabel]);

  const isActive = (slug: string) =>
    slug === 'all' ? selected.length === 0 : selected.includes(slug);

  return (
    <View
      style={{
        height: 56,
        justifyContent: 'center',
        backgroundColor: bgColor,
        marginHorizontal: padH, // ← совпадает с CARD_SIDE_GUTTER у QCard
      }}
    >
      <FlatList
        horizontal
        data={data}
        keyExtractor={t => t.slug}
        renderItem={({ item }) => (
          <TopicChip
            label={item.title}
            active={item.slug !== '__clear' && isActive(item.slug)}
            onPress={() => onPress(item.slug)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0 }}
      />
    </View>
  );
}

export default ChipsBar;
