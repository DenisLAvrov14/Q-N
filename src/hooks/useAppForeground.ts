import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/** Вызывает onActive, когда приложение возвращается из background/inactive в active */
export function useAppForeground(onActive: () => void) {
  const prev = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      const was = prev.current;
      prev.current = next;
      if ((was === 'background' || was === 'inactive') && next === 'active') {
        onActive?.();
      }
    });
    return () => sub.remove();
  }, [onActive]);
}
