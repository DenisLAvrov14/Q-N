import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import Constants from 'expo-constants';
import { useStore } from '../store/useStore';
import { useDirectusHealth } from '../hooks/useDirectusHealth';

export default function DevTools() {
  // показываем только в dev
  const isDev = __DEV__ || (Constants.expoConfig as any)?.extra?.env === 'dev';
  if (!isDev) return null;

  const extra: any =
    (Constants.expoConfig?.extra as any) ||
    ((Constants as any).manifest?.extra as any) ||
    {};
  const baseUrl: string | undefined = extra?.DIRECTUS_URL;

  const forceReload = useStore((s) => s.forceReload);
  const { status, raw } = useDirectusHealth(baseUrl);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Developer Tools</Text>
      <Text style={styles.row}>Directus URL: <Text style={styles.mono}>{baseUrl || '—'}</Text></Text>
      <Text style={styles.row}>Health: <Text style={styles.mono}>{status}</Text></Text>
      {status !== 'ok' && !!raw && (
        <Text style={[styles.row, styles.dim]}>[{raw}]</Text>
      )}
      <View style={{ height: 8 }} />
      <Button title="Force reload" onPress={forceReload} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000022',
    backgroundColor: '#fafafa',
  },
  title: { fontWeight: '700', marginBottom: 8 },
  row: { fontSize: 12, lineHeight: 16 },
  mono: { fontFamily: 'Courier', fontSize: 12 },
  dim: { opacity: 0.8 },
});
