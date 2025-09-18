// src/hooks/useConnectivity.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useStore } from '../store/useStore';

/**
 * Системный онлайн + ручной тумблер офлайна из стора.
 * - isOffline = override || !sysOnline
 * - Онлайновые всплески сглаживаем небольшой задержкой (анти-дребезг)
 */
export function useConnectivity() {
  const override = useStore(s => s.offlineOverride);
  const setOverride = useStore(s => s.setOfflineOverride); // для Settings
  const [sysOnline, setSysOnline] = useState(true);

  // debounce: оффлайн применяем мгновенно, онлайн — с небольшой задержкой
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const apply = (state: NetInfoState) => {
      const ok = Boolean(state.isConnected && (state.isInternetReachable ?? true));
      if (!mounted) return;

      if (tRef.current) clearTimeout(tRef.current);
      if (ok) {
        // немного ждём стабильности сети
        tRef.current = setTimeout(() => mounted && setSysOnline(true), 200);
      } else {
        // оффлайн — сразу
        setSysOnline(false);
      }
    };

    const unsubscribe = NetInfo.addEventListener(apply);

    NetInfo.fetch()
      .then(apply)
      .catch(() => mounted && setSysOnline(false));

    return () => {
      mounted = false;
      unsubscribe();
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, []);

  const isOffline = override || !sysOnline;

  const reason = useMemo<'override' | 'no-internet' | 'online'>(() => {
    if (override) return 'override';
    return sysOnline ? 'online' : 'no-internet';
  }, [override, sysOnline]);

  return {
    isOffline,
    sysOnline,
    override,
    reason,
    setOverride, // можно дергать в Settings
  };
}
