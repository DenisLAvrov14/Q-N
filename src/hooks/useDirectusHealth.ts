import { useEffect, useState } from 'react';
import { pingDirectus } from '../api';

export type HealthStatus = 'pending' | 'ok' | 'fail';

export function useDirectusHealth(baseUrl: string | undefined) {
  const [status, setStatus] = useState<HealthStatus>('pending');
  const [raw, setRaw] = useState<string>('pending');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!baseUrl) {
        if (!cancelled) {
          setRaw('no_base_url');
          setStatus('fail');
        }
        return;
      }

      // 1) сырой пинг /server/health (для диагностики)
      try {
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/server/health`);
        const txt = await res.text();
        if (!cancelled) setRaw(`${res.status}:${txt.slice(0, 120)}`);
      } catch (e: any) {
        if (!cancelled) setRaw(`ERR:${e?.message || 'Network request failed'}`);
      }

      // 2) pingDirectus из api (проверка токена/рестов)
      try {
        const ok = await pingDirectus();
        if (!cancelled) setStatus(ok ? 'ok' : 'fail');
      } catch {
        if (!cancelled) setStatus('fail');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  return { status, raw };
}
