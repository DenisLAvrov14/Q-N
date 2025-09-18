// src/api/client.ts
const BASE_URL = process.env.EXPO_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

export async function dget<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, String(value));
    }
  }

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}
