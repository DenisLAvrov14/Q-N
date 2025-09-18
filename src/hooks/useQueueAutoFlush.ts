// src/hooks/useQueueAutoFlush.ts
import { useEffect } from 'react';
import { useConnectivity } from './useConnectivity';
import { useSubmissionQueue } from './useSubmissionQueue';
import { useAppForeground } from './useAppForeground';

/**
 * Глобальный авто-флаш очереди:
 * - при появлении интернета
 * - при возвращении приложения на передний план
 * Работает в фоновом режиме, не показывает UI.
 */
export function useQueueAutoFlush() {
  const { isOffline } = useConnectivity();
  const isOnline = !isOffline;
  const { flush } = useSubmissionQueue(isOnline);

  // Флаш при онлайне
  useEffect(() => {
    if (isOnline) {
      void flush();
    }
  }, [isOnline, flush]);

  // Флаш при возврате на передний план
  useAppForeground(() => {
    if (isOnline) {
      void flush();
    }
  });
}
