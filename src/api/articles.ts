// src/api/articles.ts
import { dget } from './client'; // твой helper для GET-запросов
import type { Article } from '../types';

/** Получить статьи по id-шникам */
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

  // маппим Directus → Article
  const list: Article[] = (json.data ?? []).map(mapItemToArticle);

  // возвращаем в порядке, как передали ids
  const order = new Map(ids.map((v, i) => [String(v), i]));
  list.sort((a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0));

  return list;
}

/** Маппер сырых данных Directus → Article */
function mapItemToArticle(raw: any): Article {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title ?? '',
    excerpt: raw.excerpt ?? '',
    body1: raw.body1 ?? '',
    body2: raw.body2 ?? '',
    source1: raw.source1 ?? undefined,
    source2: raw.source2 ?? undefined,

    // relation → topics
    topicId: raw.topic?.id ?? null,
    topicSlug: raw.topic?.slug ?? null,
    topicTitle: raw.topic?.title ?? null,
  };
}
