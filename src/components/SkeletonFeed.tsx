import React from 'react';
import { FlatList, View, Dimensions } from 'react-native';
import { SkeletonCard } from './Skeleton';

const { height: WIN_H } = Dimensions.get('window');

export function SkeletonFeed({
  containerH,
  chipPlaceholders = [70, 90, 110, 85, 100, 80, 95],
  bgColor,
  borderColor,
  padH = 16,
}: {
  containerH?: number;
  chipPlaceholders?: number[];
  bgColor?: string;
  borderColor?: string;
  padH?: number;
}) {
  const skHeight = containerH || WIN_H - 140;

  return (
    <>
      <View style={{ height: 56, justifyContent: 'center', backgroundColor: bgColor }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={chipPlaceholders}
          keyExtractor={(_, i) => `chip-${i}`}
          renderItem={({ item }) => (
            <View
              style={{
                height: 36,
                width: item,
                borderRadius: 10,
                marginRight: 8,
                backgroundColor: borderColor,
              }}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: padH }}
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
        style={{ backgroundColor: bgColor }}
      />
    </>
  );
}
