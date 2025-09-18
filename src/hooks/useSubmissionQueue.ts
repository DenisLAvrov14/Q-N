// src/hooks/useSubmissionQueue.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitQuestion, validateQuestion } from '../api/api';
import { queueBus } from '../lib/queueBus';

const QUEUE_KEY = 'pendingSubmissions:v1';

export type PendingSubmission = {
  id: string; // локальный id
  question: string;
  topic?: string | null;
  created_at: number; // ms
};

async function readQueue(): Promise<PendingSubmission[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingSubmission[];
  } catch {
    return [];
  }
}
async function writeQueue(items: PendingSubmission[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function useSubmissionQueue(isOnline: boolean) {
  const [pending, setPending] = useState<PendingSubmission[]>([]);
  const flushing = useRef(false);

  const reload = useCallback(async () => {
    const q = await readQueue();
    setPending(q);
  }, []);

  const enqueue = useCallback(async (q: Omit<PendingSubmission, 'id' | 'created_at'>) => {
    const v = validateQuestion(q.question);
    if (!v.ok) throw new Error(v.reason);
    const item: PendingSubmission = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      question: v.value!,
      topic: q.topic ?? null,
      created_at: Date.now(),
    };
    const cur = await readQueue();
    const next = [...cur, item];
    await writeQueue(next);
    setPending(next);
    queueBus.notify(); // ← сообщим всем слушателям (вкл. Tabs)
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current) return { sent: 0, left: pending.length };
    flushing.current = true;
    try {
      let items = await readQueue();
      let sent = 0;

      for (const it of items) {
        try {
          await submitQuestion({ question: it.question, topic: it.topic ?? undefined });
          sent++;
          items = items.filter(x => x.id !== it.id);
          await writeQueue(items);
          setPending(items);
          queueBus.notify(); // ← уведомить про изменение
        } catch {
          break;
        }
      }
      return { sent, left: items.length };
    } finally {
      flushing.current = false;
    }
  }, [pending.length]);

  // авто-флаш при появлении интернета
  useEffect(() => {
    if (isOnline) {
      void flush();
    }
  }, [isOnline, flush]);

  // начальная загрузка + подписка на внешние изменения очереди
  useEffect(() => {
    void reload();
    const unsub = queueBus.subscribe(reload);
    return () => {
      unsub();
    };
  }, [reload]);

  return { pending, enqueue, flush, reload };
}
