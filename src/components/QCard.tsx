// src/components/QCard.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { useStore } from '../store/useStore';
import type { Article } from '../types';
import { useRead } from '../hooks/useRead';

type Props = {
  item: Article;
  height: number;
  bottomGap?: number;
  saved: boolean;
  onToggleSave: (id: Article['id']) => void;
  onOpen?: (a: Article) => void;
};

export const CARD_SIDE_GUTTER = 12;

export default function QCard({ item, height, bottomGap = 12, saved, onToggleSave }: Props) {
  const c = useThemeColors();
  const fontSize = useStore(s => s.fontSize);
  const { markRead, isRead } = useRead();

  const [expanded, setExpanded] = useState(false);
  const readingTime = useMemo(() => calcReadingTime(item), [item]);

  const alreadyRead = isRead(item.id, item.topicSlug ?? 'general');

  // 🔹 Animated opacity
  const [opacity] = useState(new Animated.Value(alreadyRead ? 0.55 : 1));
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: alreadyRead ? 0.55 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [alreadyRead, opacity]);

  // ✅ отмечаем как прочитанную только при закрытии
  const handleToggle = useCallback(() => {
    setExpanded(prev => {
      if (prev === true) {
        markRead(item.id, item.topicSlug ?? 'general');
      }
      return !prev;
    });
  }, [item.id, item.topicSlug, markRead]);

  const handleShare = useCallback(async () => {
    try {
      const title = item.title ?? 'Article';
      const lines = [item.source1, item.source2].filter(Boolean).join('\n');
      await Share.share({ title, message: `${title}${lines ? `\n\n${lines}` : ''}` });
    } catch {}
  }, [item]);

  return (
    <View style={{ height, paddingBottom: bottomGap }}>
      <Animated.View
        style={[
          styles.card,
          {
            flex: 1,
            backgroundColor: c.surface,
            borderColor: c.border,
            opacity,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.topicTitle, { color: alreadyRead ? c.border : c.subtext }]}>
            {item.topicTitle ?? 'General'}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleShare} hitSlop={8} style={styles.actionBtn}>
              <Ionicons name="share-outline" size={20} color={c.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onToggleSave(item.id)}
              hitSlop={8}
              style={styles.actionBtn}
            >
              <MaterialIcons
                name={saved ? 'bookmark' : 'bookmark-border'}
                size={22}
                color={saved ? c.text : c.icon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, expanded ? styles.contentExpanded : styles.contentCentered]}>
          <Text
            style={[
              styles.title,
              {
                color: c.text,
                textAlign: expanded ? 'left' : 'center',
              },
            ]}
            numberOfLines={expanded ? 6 : 3}
          >
            {item.title}
          </Text>

          {!expanded && (
            <TouchableOpacity
              onPress={handleToggle}
              style={[styles.cta, { borderColor: c.border, alignSelf: 'center' }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.ctaText, { color: c.text }]}>Read in ~{readingTime} </Text>
              <Text style={[styles.ctaSuf, { color: c.subtext }]}>min</Text>
            </TouchableOpacity>
          )}

          {expanded && (
            <ScrollView
              style={styles.reader}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {!!item.body1 && (
                <Text style={[styles.body, { color: c.text, fontSize }]}>{item.body1}</Text>
              )}
              {!!item.body2 && (
                <Text style={[styles.body, { color: c.text, fontSize, marginTop: 12 }]}>
                  {item.body2}
                </Text>
              )}

              {(item.source1 || item.source2) && (
                <View style={[styles.sources, { borderTopColor: c.border }]}>
                  {!!item.source1 && (
                    <Text style={[styles.source, { color: c.subtext }]} numberOfLines={1}>
                      {item.source1}
                    </Text>
                  )}
                  {!!item.source2 && (
                    <Text style={[styles.source, { color: c.subtext }]} numberOfLines={1}>
                      {item.source2}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                onPress={handleToggle}
                style={[styles.cta, { borderColor: c.border, alignSelf: 'center', marginTop: 16 }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.ctaText, { color: c.text }]}>Collapse</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

function calcReadingTime(a: Article) {
  const text = `${a.body1 ?? ''} ${a.body2 ?? ''}`.trim();
  if (!text) return 1;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    marginHorizontal: CARD_SIDE_GUTTER,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  topicTitle: { fontSize: 12, letterSpacing: 0.2, textTransform: 'uppercase' },
  actions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: { padding: 4, borderRadius: 8 },

  content: { flex: 1, width: '100%' },
  contentCentered: { justifyContent: 'center' },
  contentExpanded: { justifyContent: 'flex-start' },

  title: { marginTop: 8, fontSize: 20, fontWeight: '700', lineHeight: 26 },

  cta: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  ctaText: { fontSize: 14, fontWeight: '600' },
  ctaSuf: { fontSize: 12, opacity: 0.8 },

  reader: { marginTop: 12, alignSelf: 'stretch' },
  body: { lineHeight: 22 },
  sources: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
    paddingTop: 10,
    gap: 6,
  },
  source: { fontSize: 12 },
});
