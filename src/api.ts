// src/api.ts
import Constants from 'expo-constants';
import type { Article } from './types';

type Extra = { DIRECTUS_URL?: string; DIRECTUS_TOKEN?: string };

const EXTRA: Extra =
  (Constants.expoConfig?.extra as Extra) ||
  // fallback для старых dev-манифестов
  ((Constants as any).manifest?.extra as Extra) ||
  {};

const BASE_URL = (EXTRA?.DIRECTUS_URL ?? '').replace(/\/$/, '');
const TOKEN    = EXTRA?.DIRECTUS_TOKEN ?? ''; // опц. статический токен

function assertBaseUrl() {
  if (!BASE_URL) {
    throw new Error(
      'DIRECTUS_URL не задан. Укажи его в app.json → expo.extra.DIRECTUS_URL'
    );
  }
}

/** GET-хелпер для Directus с корректной сериализацией параметров */
async function dget<T>(path: string, params?: Record<string, any>): Promise<T> {
  assertBaseUrl();
  const url = new URL(path, BASE_URL);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;

      if (k === 'fields' && Array.isArray(v)) {
        // Directus принимает CSV либо fields[]=...
        url.searchParams.set('fields', v.join(','));
      } else if (k === 'sort' && Array.isArray(v)) {
        // Тоже CSV, например "-date_created,title"
        url.searchParams.set('sort', v.join(','));
      } else if (k === 'filter' && typeof v === 'object') {
        // filter должен быть JSON-строкой
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

/** Маппер Directus item -> Article */
function mapItemToArticle(it: any): Article {
  return {
    id: it.id,
    slug: it.slug,
    title: it.title,
    excerpt: it.excerpt ?? '',
    body1: it.body1 ?? '',
    body2: it.body2 ?? '',
    topic: it.topic,
    source1: it.source1 ?? undefined,
    source2: it.source2 ?? undefined,
  };
}

/**
 * Лента карточек (мультивыбор тем).
 * topics.length === 0 => без фильтра (All)
 */
export async function fetchFeed(topics: string[], page = 1, limit = 10): Promise<Article[]> {
  const filter = topics.length > 0 ? { topic: { _in: topics } } : undefined;

  const params = {
    // ⚠️ Явно запрашиваем только нужные поля
    fields: ['id','slug','title','excerpt','body1','body2','topic','source1','source2'],
    // ✅ вместо -date_created (требует прав) — сортируем по id
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
    fields: ['id', 'slug', 'title', 'excerpt', 'body1', 'body2', 'topic', 'source1', 'source2'],
  });
  const first = json.data?.[0];
  return first ? mapItemToArticle(first) : null;
}

/** Быстрый пинг для проверки URL/токена (опционально) */
export async function pingDirectus(): Promise<boolean> {
  try {
    const res = await fetch(`${(EXTRA?.DIRECTUS_URL ?? '').replace(/\/$/, '')}/server/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchArticlesByIds(ids: Array<number | string>): Promise<Article[]> {
  if (!ids || ids.length === 0) return [];

  const params = {
    fields: ['id','slug','title','excerpt','body1','body2','topic','source1','source2'],
    filter: { id: { _in: ids } },
    limit: ids.length, // хватит на все
  };

  type Resp = { data: any[] };
  const json = await dget<Resp>('/items/articles', params);
  const list = (json.data ?? []).map(mapItemToArticle);

  // Вернём в порядке, как пользователь сохранял
  const order = new Map(ids.map((v, i) => [String(v), i]));
  list.sort((a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0));
  return list;
}