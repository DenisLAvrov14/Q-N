// src/screens/Article.tsx
import React, { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Linking, Share } from 'react-native';
import { useThemeColors } from '../theme';
import { useStore } from '../store/useStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useRead } from '../hooks/useRead';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

export default function ArticleScreen({ route }: Props) {
  const c = useThemeColors();
  const { item } = route.params;

  const fontSize = useStore(s => s.fontSize);
  const savedIds = useStore(s => s.savedIds);
  const toggleSave = useStore(s => s.toggleSaved);

  const { markRead } = useRead(); // ← добавили

  // Помечаем статью прочитанной при открытии экрана
  useEffect(() => {
    markRead(item.id, item.topicSlug ?? 'general');
  }, [item.id, item.topicSlug, markRead]);

  const isSaved = savedIds.includes(item.id);
  const bodyLH = Math.round(fontSize * 1.5);

  const onShare = async () => {
    try {
      const msg =
        `${item.title}\n\n` +
        (item.excerpt ? `${item.excerpt}\n\n` : '') +
        [item.source1, item.source2].filter(Boolean).join('\n');
      await Share.share({ message: msg });
    } catch {}
  };

  const openSource = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: c.bg }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>

        <View style={styles.row}>
          <Pressable
            onPress={() => toggleSave(item.id)}
            style={[styles.btn, { backgroundColor: c.ctaBg }]}
          >
            <Text style={[styles.btnText, { color: c.ctaText }]}>
              {isSaved ? 'Saved ✓' : 'Save'}
            </Text>
          </Pressable>

          <Pressable onPress={onShare} style={[styles.btn, { backgroundColor: c.badgeBg }]}>
            <Text style={[styles.btnText, { color: c.badgeText }]}>Share</Text>
          </Pressable>
        </View>

        {item.excerpt ? (
          <Text style={[styles.excerpt, { color: c.subtext }]}>{item.excerpt}</Text>
        ) : null}

        {item.body1 ? (
          <Text style={[styles.body, { color: c.text, fontSize, lineHeight: bodyLH }]}>
            {item.body1}
          </Text>
        ) : null}

        {item.body2 ? (
          <Text style={[styles.body, { color: c.text, fontSize, lineHeight: bodyLH }]}>
            {item.body2}
          </Text>
        ) : null}

        {(item.source1 || item.source2) && (
          <View style={[styles.sources, { borderTopColor: c.border }]}>
            <Text style={[styles.sourcesTitle, { color: c.subtext }]}>Sources</Text>

            {item.source1 ? (
              <Pressable onPress={() => openSource(item.source1!)}>
                <Text style={[styles.link, { color: c.ctaBg }]} numberOfLines={1}>
                  {item.source1}
                </Text>
              </Pressable>
            ) : null}

            {item.source2 ? (
              <Pressable onPress={() => openSource(item.source2!)}>
                <Text style={[styles.link, { color: c.ctaBg }]} numberOfLines={1}>
                  {item.source2}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 0, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 10, marginTop: 2, marginBottom: 6 },
  btn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontWeight: '700' },
  excerpt: { marginTop: 6, fontSize: 14, opacity: 0.9 },
  body: { marginTop: 6 },
  sources: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  sourcesTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  link: { fontSize: 14 },
});
