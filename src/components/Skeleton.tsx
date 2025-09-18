import React from 'react';
import { View, StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';
import { useThemeColors } from '../theme';

export function SkeletonLine({
  h = 16,
  w = '100%',
  r = 8,
}: {
  h?: number;
  w?: DimensionValue;
  r?: number;
}) {
  const c = useThemeColors();
  const lineStyle: ViewStyle = {
    height: h,
    width: w,
    borderRadius: r,
    backgroundColor: c.border,
  };
  return <View style={[styles.line, lineStyle]} />;
}

export function SkeletonCard({ height }: { height: number }) {
  const c = useThemeColors();
  return (
    <View style={[styles.cardWrap, { height }]}>
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <SkeletonLine h={20} w={80} r={6} />
          <View style={{ flexDirection: 'row', columnGap: 8 }}>
            <SkeletonLine h={32} w={32} r={10} />
            <SkeletonLine h={32} w={32} r={10} />
          </View>
        </View>

        <SkeletonLine h={28} w={'85%'} r={8} />
        <View style={{ height: 10 }} />
        <SkeletonLine h={16} w={'95%'} />
        <View style={{ height: 8 }} />
        <SkeletonLine h={16} w={'70%'} />

        <View style={{ flex: 1 }} />
        <SkeletonLine h={44} w={'100%'} r={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { opacity: 0.6 },
  // убрали width: '100%' — TS иногда ругается; растянем по умолчанию
  cardWrap: { alignSelf: 'stretch' },
  card: { flex: 1, padding: 20, borderRadius: 16, borderWidth: 1 },
});
