import React from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme';
import { SkeletonLine } from './Skeleton';

export default function ArticleSkeleton() {
  const c = useThemeColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: c.bg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.badge, { backgroundColor: c.border }]} />
        <SkeletonLine h={28} w={'80%'} r={8} />
        <View style={{ height: 12 }} />
        <SkeletonLine h={16} w={'100%'} />
        <View style={{ height: 8 }} />
        <SkeletonLine h={16} w={'95%'} />
        <View style={{ height: 8 }} />
        <SkeletonLine h={16} w={'85%'} />
        <View style={{ height: 16 }} />
        <SkeletonLine h={16} w={'100%'} />
        <View style={{ height: 8 }} />
        <SkeletonLine h={16} w={'92%'} />
        <View style={{ height: 8 }} />
        <SkeletonLine h={16} w={'70%'} />
        <View style={{ height: 16 }} />
        <SkeletonLine h={12} w={'40%'} r={6} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10 },
  badge: { width: 90, height: 22, borderRadius: 6, alignSelf: 'flex-start' },
});
