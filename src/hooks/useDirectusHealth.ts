import { useEffect, useState } from 'react';
import { pingDirectus } from '../api/api';

export type HealthStatus = 'pending' | 'ok' | 'fail';

export function useDirectusHealth(baseUrl: string | undefined) {
  const [status, setStatus] = useState<HealthStatus>('pending');
  const [raw, setRaw] = useState<string>('pending');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!baseUrl) {
        if (!cancelled) {
          setRaw('⚠️ no_base_url');
          setStatus('fail');
        }
        return;
      }

      const cleanUrl = baseUrl.replace(/\/$/, '');

      // 1) Сырой пинг /server/health (для диагностики)
      try {
        const res = await fetch(`${cleanUrl}/server/health`);
        const txt = await res.text();
        if (!cancelled) {
          if (res.ok) {
            setRaw(`health: ${txt}`); // покажем "health: {"status":"ok"}"
          } else {
            setRaw(`http ${res.status}: ${txt}`);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setRaw(`network error: ${e?.message || 'failed'}`);
          setStatus('fail');
        }
        return;
      }

      // 2) pingDirectus (REST API + токен)
      try {
        const ok = await pingDirectus();
        if (!cancelled) {
          setStatus(ok ? 'ok' : 'fail');
          if (ok) setRaw('✅ API ok');
          else setRaw('❌ API fail');
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus('fail');
          setRaw(`❌ API error: ${e?.message || 'unknown'}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  return { status, raw };
}
