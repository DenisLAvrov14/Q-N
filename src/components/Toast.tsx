// src/components/Toast.tsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { View, Text, Animated, Easing, Platform, Dimensions } from 'react-native';
import { useThemeColors } from '../theme';

type ToastType = 'success' | 'error' | 'info';
type ToastPosition = 'top' | 'center' | 'bottom';
type ToastOptions = { type?: ToastType; duration?: number; position?: ToastPosition };

type Ctx = { show: (message: string, opts?: ToastOptions) => void };
const ToastCtx = createContext<Ctx>({ show: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const c = useThemeColors();
  const [msg, setMsg] = useState<string>('');
  const [type, setType] = useState<ToastType>('info');
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<ToastPosition>('bottom');
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = useMemo(() => {
    switch (type) {
      case 'success':
        return { bg: c.ctaBg, text: c.ctaText, border: c.border };
      case 'error':
        return { bg: '#EF4444', text: '#fff', border: '#00000022' };
      default:
        return { bg: c.surface, text: c.text, border: c.border };
    }
  }, [type, c]);

  const hide = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [opacity]);

  const show = useCallback(
    (message: string, opts?: ToastOptions) => {
      if (!message) return;
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      setMsg(message);
      setType(opts?.type ?? 'info');
      setPosition(opts?.position ?? 'bottom');
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      const dur = Math.max(1200, Math.min(6000, opts?.duration ?? 2000));
      hideTimer.current = setTimeout(hide, dur);
    },
    [hide]
  );

  // вычисляем позицию
  const posStyle = useMemo(() => {
    const { height } = Dimensions.get('window');
    switch (position) {
      case 'top':
        return { top: Platform.select({ ios: 60, android: 40 }) };
      case 'center':
        return { top: height / 2 - 40 }; // 40 ~ половина высоты тоста
      case 'bottom':
      default:
        return { bottom: Platform.select({ ios: 34, android: 24 }) };
    }
  }, [position]);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            opacity,
            ...posStyle,
          }}
        >
          <View
            style={{
              maxWidth: '92%',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{msg}</Text>
          </View>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
}
