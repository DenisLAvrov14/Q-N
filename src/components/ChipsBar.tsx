import React from 'react';
import { FlatList, View } from 'react-native';
import TopicChip from './TopicChip';

type Topic = { slug: string; title: string };

export function ChipsBar({
  topics,
  selected,
  onPress,
  clearLabel,
  bgColor,
  padH = 16,
}: {
  topics: Topic[];
  selected: string[];
  onPress: (slug: string) => void;
  clearLabel?: string;     // например: Clear (N)
  bgColor?: string;
  padH?: number;
}) {
  const data = clearLabel ? [...topics, { slug: '__clear', title: clearLabel } as Topic] : topics;

  const isActive = (slug: string) =>
    slug === 'all' ? selected.length === 0 : selected.includes(slug);

  return (
    <View style={{ height: 56, justifyContent: 'center', backgroundColor: bgColor }}>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(t: any, i) => t.slug ?? String(i)}
        renderItem={({ item }: any) => (
          <TopicChip
            label={item.title}
            active={item.slug !== '__clear' && isActive(item.slug)}
            onPress={() => onPress(item.slug)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: padH }}
      />
    </View>
  );
}
