// src/screens/Ask.tsx
import React, { useMemo, useState, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../theme';
import { useTopics } from '../hooks/useTopics';
import TopicChip from '../components/TopicChip';
import { submitQuestion, validateQuestion } from '../api/api';
import { useConnectivity } from '../hooks/useConnectivity';
import { useSubmissionQueue } from '../hooks/useSubmissionQueue';

const { height: WIN_H } = Dimensions.get('window');
const TOP_SHIFT = Math.min(140, Math.max(56, Math.round(WIN_H * 0.08)));

export default function AskScreen() {
  const c = useThemeColors();

  const { topics } = useTopics();
  const filteredTopics = useMemo(
    () => topics.filter(t => t.slug !== 'all' && t.slug !== '__clear'),
    [topics]
  );

  const { isOffline } = useConnectivity();
  const isOnline = !isOffline;
  const { pending, enqueue, flush } = useSubmissionQueue(isOnline);

  const [question, setQuestion] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [buttonMsg, setButtonMsg] = useState<string | null>(null);
  const [buttonType, setButtonType] = useState<'default' | 'success' | 'error' | 'info'>('default');

  const fadeAnim = useRef(new Animated.Value(1)).current; // прозрачность текста
  const bgAnim = useRef(new Animated.Value(0)).current; // фон от 0=default до 1=msg

  const v = validateQuestion(question);
  const canSend = v.ok && !sending && !buttonMsg;

  const animateChange = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    Animated.timing(bgAnim, {
      toValue: buttonMsg ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const onSubmit = async () => {
    if (!v.ok) return;
    setSending(true);
    try {
      if (isOnline) {
        await submitQuestion({ question, topic: topic ?? undefined });
        setQuestion('');
        setTopic(null);
        setButtonMsg('Submitted — thanks!');
        setButtonType('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        await enqueue({ question, topic });
        setQuestion('');
        setTopic(null);
        setButtonMsg('Saved offline — will send later');
        setButtonType('info');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    } catch {
      try {
        await enqueue({ question, topic });
      } catch {}
      setButtonMsg('Saved to queue (retry later)');
      setButtonType('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setSending(false);
      animateChange();
      if (isOnline) void flush();
      setTimeout(() => {
        setButtonMsg(null);
        setButtonType('default');
        animateChange();
      }, 2000);
    }
  };

  const colors = (() => {
    switch (buttonType) {
      case 'success':
        return { bg: c.ctaBg, text: c.ctaText };
      case 'error':
        return { bg: '#EF4444', text: '#fff' };
      case 'info':
        return { bg: c.surface, text: c.text };
      default:
        return { bg: canSend ? c.ctaBg : c.border, text: canSend ? c.ctaText : c.subtext };
    }
  })();

  // Для плавного перехода фона
  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [canSend ? c.ctaBg : c.border, colors.bg],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          paddingTop: TOP_SHIFT,
        }}
      >
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '600', marginBottom: 12 }}>
          Ask a question
        </Text>

        {/* Поле ввода */}
        <View
          style={{
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 14,
            backgroundColor: 'transparent',
          }}
        >
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Type your question in English…"
            placeholderTextColor={c.subtext}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 140,
              color: c.text,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              lineHeight: 22,
            }}
            maxLength={400}
          />
        </View>

        {/* Счётчик и ошибка */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ color: v.ok ? c.subtext : '#ff7b7b', fontSize: 12 }}>
            {v.ok ? 'Looks good' : v.reason}
          </Text>
          <Text style={{ color: c.subtext, fontSize: 12 }}>{question.trim().length}/400</Text>
        </View>

        {/* Выбор темы */}
        <Text style={{ color: c.subtext, marginTop: 16, marginBottom: 8 }}>Topic (optional)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 4 }}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TopicChip label="No topic" active={topic == null} onPress={() => setTopic(null)} />
            {filteredTopics.map(t => (
              <TopicChip
                key={t.slug}
                label={t.title}
                active={topic === t.slug}
                onPress={() => setTopic(t.slug)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Кнопка с анимацией */}
        <Pressable
          onPress={onSubmit}
          disabled={!canSend}
          style={{ marginTop: 24, alignSelf: 'center', minWidth: 180, borderRadius: 14 }}
        >
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: bgColor,
            }}
          >
            {sending ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Animated.Text
                style={{
                  opacity: fadeAnim,
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                {buttonMsg ?? 'Submit'}
              </Animated.Text>
            )}
          </Animated.View>
        </Pressable>

        {pending.length > 0 && (
          <Text style={{ marginTop: 12, color: c.subtext, fontSize: 12, textAlign: 'center' }}>
            Pending offline: {pending.length}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
