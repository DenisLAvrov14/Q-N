// src/api.ts
import Constants from 'expo-constants';
import type { Article, SubmissionCreate, SubmissionCreateResult } from '../types';

type Extra = { DIRECTUS_URL?: string; DIRECTUS_TOKEN?: string };

const EXTRA: Extra =
  (Constants.expoConfig?.extra as Extra) || ((Constants as any).manifest?.extra as Extra) || {};

const BASE_URL = (EXTRA?.DIRECTUS_URL ?? '').replace(/\/$/, '');
const TOKEN = EXTRA?.DIRECTUS_TOKEN ?? '';

function assertBaseUrl() {
  if (!BASE_URL) {
    throw new Error('DIRECTUS_URL не задан. Укажи его в app.json → expo.extra.DIRECTUS_URL');
  }
}

/** GET-хелпер */
async function dget<T>(path: string, params?: Record<string, any>): Promise<T> {
  assertBaseUrl();
  const url = new URL(path, BASE_URL);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;

      if (k === 'fields' && Array.isArray(v)) {
        url.searchParams.set('fields', v.join(','));
      } else if (k === 'sort' && Array.isArray(v)) {
        url.searchParams.set('sort', v.join(','));
      } else if (k === 'filter' && typeof v === 'object') {
        url.searchParams.set('filter', JSON.stringify(v));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Directus ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

/** POST-хелпер */
async function dpost<T = any>(path: string, body: any): Promise<T> {
  assertBaseUrl();
  const url = new URL(path, BASE_URL);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=representation',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`Directus ${res.status}: ${text || res.statusText}`);
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

/** Маппер Directus item -> Article */
function mapItemToArticle(raw: any): Article {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt ?? '',
    body1: raw.body1 ?? '',
    body2: raw.body2 ?? '',
    source1: raw.source1 ?? '',
    source2: raw.source2 ?? '',
    topicId: raw.topic?.id ?? null,
    topicSlug: raw.topic?.slug ?? null,
    topicTitle: raw.topic?.title ?? null,
  };
}

/** Лента статей */
export async function fetchFeed(topics: string[], page = 1, limit = 10): Promise<Article[]> {
  const filter = topics.length > 0 ? { topic: { _in: topics } } : undefined;

  const params = {
    fields: [
      'id',
      'slug',
      'title',
      'excerpt',
      'body1',
      'body2',
      'source1',
      'source2',
      'topic.id',
      'topic.slug',
      'topic.title',
    ],
    sort: ['-id'],
    limit,
    page,
    ...(filter ? { filter } : {}),
  };

  type Resp = { data: any[] };
  const json = await dget<Resp>('/items/articles', params);
  return (json.data ?? []).map(mapItemToArticle);
}

/** Одна статья по slug */
export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  type Resp = { data: any[] };
  const json = await dget<Resp>('/items/articles', {
    filter: { slug: { _eq: slug } },
    limit: 1,
    fields: [
      'id',
      'slug',
      'title',
      'excerpt',
      'body1',
      'body2',
      'source1',
      'source2',
      'topic.id',
      'topic.slug',
      'topic.title',
    ],
  });
  const first = json.data?.[0];
  return first ? mapItemToArticle(first) : null;
}

/** Получить статьи по id */
export async function fetchArticlesByIds(ids: Array<number | string>): Promise<Article[]> {
  if (!ids || ids.length === 0) return [];

  const params = {
    fields: [
      'id',
      'slug',
      'title',
      'excerpt',
      'body1',
      'body2',
      'source1',
      'source2',
      'topic.id',
      'topic.slug',
      'topic.title',
    ],
    filter: { id: { _in: ids } },
    limit: ids.length,
  };

  type Resp = { data: any[] };
  const json = await dget<Resp>('/items/articles', params);
  const list = (json.data ?? []).map(mapItemToArticle);

  const order = new Map(ids.map((v, i) => [String(v), i]));
  list.sort((a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0));
  return list;
}

/** Получить список тем + счётчики */
export async function fetchTopics(): Promise<{ slug: string; title: string; count: number }[]> {
  type TopicRow = { slug: string; title: string; order?: number | null };
  type CountRow = { topic: { slug: string } | null; count: number };

  let topics: TopicRow[] = [];
  try {
    const topicsRes = await dget<{ data: TopicRow[] }>('/items/topics', {
      fields: ['slug', 'title', 'order'],
      sort: ['order', 'title'],
      limit: 100,
    });
    topics = (topicsRes.data ?? []).filter(Boolean);
  } catch {
    topics = [];
  }

  let countsMap = new Map<string, number>();
  try {
    const agg = await dget<{ data: CountRow[] }>('/items/articles', {
      'aggregate[count]': '*',
      groupBy: 'topic.slug',
      fields: ['topic.slug'],
      limit: -1,
    });

    for (const r of agg.data ?? []) {
      const slug = r.topic?.slug?.trim();
      if (!slug || slug.toLowerCase() === 'all') continue;
      countsMap.set(slug, r.count ?? 0);
    }
  } catch {
    countsMap = new Map();
  }

  if (!topics.length && countsMap.size > 0) {
    topics = Array.from(countsMap.keys()).map<Partial<TopicRow>>(slug => ({
      slug,
      title: slug.charAt(0).toUpperCase() + slug.slice(1),
    })) as TopicRow[];
  }

  const merged = topics
    .filter(t => t.slug && t.slug.toLowerCase() !== 'all')
    .map(({ slug, title }) => ({
      slug,
      title: title || slug,
      count: countsMap.get(slug) ?? 0,
    }));

  for (const [slug, count] of countsMap.entries()) {
    if (slug.toLowerCase() === 'all') continue;
    if (!merged.find(t => t.slug === slug)) {
      merged.push({
        slug,
        title: slug.charAt(0).toUpperCase() + slug.slice(1),
        count,
      });
    }
  }

  merged.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.title.localeCompare(b.title);
  });

  return merged;
}

/* ======================= ASK (submissions) ======================= */

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt', 'bastard'];
function maskBadWords(s: string): string {
  if (!BAD_WORDS.length) return s;
  const re = new RegExp(`\\b(${BAD_WORDS.join('|')})\\b`, 'gi');
  return s.replace(re, m => m[0] + '*'.repeat(Math.max(m.length - 2, 1)) + m.slice(-1));
}

export function validateQuestion(input: string): { ok: boolean; reason?: string; value?: string } {
  const s = input?.trim() ?? '';
  if (s.length < 20) return { ok: false, reason: 'Too short (min 20 chars)' };
  if (s.length > 400) return { ok: false, reason: 'Too long (max 400 chars)' };
  const allowed = /^[A-Za-z0-9\s.,:;!?'"()\-–—/&%+*=#@]+$/;
  if (!allowed.test(s))
    return { ok: false, reason: 'Only English letters, numbers and punctuation' };
  return { ok: true, value: maskBadWords(s) };
}

/** POST /items/submissions */
export async function submitQuestion(payload: SubmissionCreate): Promise<SubmissionCreateResult> {
  const v = validateQuestion(payload.question);
  if (!v.ok) throw new Error(v.reason);

  const body = {
    question: v.value!,
    topic: payload.topic ?? null,
  };

  const json = await dpost<{ data: any }>('/items/submissions', body);
  const d = json.data || {};
  return {
    id: d.id,
    status: (d.status as 'new' | 'approved' | 'rejected') ?? 'new',
    created_at: d.created_at ?? new Date().toISOString(),
  };
}

export async function pingDirectus(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/server/health`);
    if (!res.ok) return false;

    const json = await res.json().catch(() => null);
    // Directus обычно отвечает { status: "ok" }
    return json?.status === 'ok';
  } catch {
    return false;
  }
}
