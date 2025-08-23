import React from 'react';
import { Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import type { Article } from '../types';
import { useStore } from '../store/useStore';
import { useThemeColors } from '../theme';

export default function ArticleScreen({ route }: any) {
  const { item }: { item: Article } = route.params;
  const fontSize = useStore((s) => s.fontSize);
  const c = useThemeColors();

  const loading = false; // скелетон выключен

  if (loading) {
    // если когда-нибудь опять включишь — вернём ArticleSkeleton
    // return <ArticleSkeleton />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={[styles.badge, { backgroundColor: c.badgeBg, color: c.badgeText }]}>
          {item.topic.toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
        <Text style={[styles.body, { color: c.text, fontSize }]}>{item.body1}</Text>
        <Text style={[styles.body, { color: c.text, fontSize }]}>{item.body2}</Text>
        {item.source1 ? <Text style={[styles.source, { color: c.subtext }]}>Source: {item.source1}</Text> : null}
        {item.source2 ? <Text style={[styles.source, { color: c.subtext }]}>Source: {item.source2}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  badge: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  title: { fontSize: 24, fontWeight: '700' },
  body: { lineHeight: 22 },
  source: { fontSize: 12 },
});
