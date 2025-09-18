// src/screens/SettingsScreen.tsx
import React from 'react';
import { ScrollView, View, Text, Switch, StyleSheet, Pressable } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useThemeColors } from '../theme';
import { useConnectivity } from '../hooks/useConnectivity';
import { useRead } from '../hooks/useRead';

export default function SettingsScreen() {
  const c = useThemeColors();

  // Store-backed prefs
  const offline = useStore(s => s.offlineOverride);
  const setOffline = useStore(s => s.setOfflineOverride);
  const fontSize = useStore(s => s.fontSize);
  const setFontSize = useStore(s => s.setFontSize);
  const theme = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);

  // Dev-only force reload
  const forceReload = useStore(s => s.forceReload);
  const isDev = __DEV__ || (Constants.expoConfig as any)?.extra?.env === 'dev';

  // Connectivity
  const { isOffline, reason } = useConnectivity();

  // Read state
  const { clearAll } = useRead();

  const extra: any =
    (Constants.expoConfig?.extra as any) || ((Constants as any).manifest?.extra as any) || {};
  const appVersion = Constants.expoConfig?.version ?? '0.1';
  const directusUrl: string | undefined = extra?.DIRECTUS_URL;

  const connText = isOffline
    ? reason === 'override'
      ? 'Offline (forced)'
      : 'Offline (no internet)'
    : 'Online';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: c.bg, paddingTop: 32 }]}
      >
        <Text style={[styles.h1, { color: c.text }]}>Settings</Text>

        {/* Theme */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sub, { color: c.text }]}>Theme</Text>
          <View style={styles.segment}>
            <Pressable
              onPress={() => setTheme('light')}
              style={[
                styles.segBtn,
                {
                  borderColor: c.border,
                  backgroundColor: theme === 'light' ? c.ctaBg : 'transparent',
                },
              ]}
            >
              <Text style={[styles.segText, { color: theme === 'light' ? c.ctaText : c.text }]}>
                Light
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTheme('dark')}
              style={[
                styles.segBtn,
                {
                  borderColor: c.border,
                  backgroundColor: theme === 'dark' ? c.ctaBg : 'transparent',
                },
              ]}
            >
              <Text style={[styles.segText, { color: theme === 'dark' ? c.ctaText : c.text }]}>
                Dark
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Reading size */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sub, { color: c.text }]}>Reading text size</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => setFontSize(fontSize - 2)}
              style={[styles.btn, { backgroundColor: c.ctaBg }]}
            >
              <Text style={[styles.btnText, { color: c.ctaText }]}>A−</Text>
            </Pressable>
            <Text style={{ minWidth: 44, textAlign: 'center', color: c.text }}>{fontSize} pt</Text>
            <Pressable
              onPress={() => setFontSize(fontSize + 2)}
              style={[styles.btn, { backgroundColor: c.ctaBg }]}
            >
              <Text style={[styles.btnText, { color: c.ctaText }]}>A+</Text>
            </Pressable>
          </View>
          <Text style={{ marginTop: 8, fontSize: fontSize, color: c.subtext }}>
            Preview: This is how article text looks.
          </Text>
        </View>

        {/* Offline override */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.row, { marginBottom: 8 }]}>
            <Text style={[styles.label, { color: c.text }]}>Simulate offline mode</Text>
            <Switch value={offline} onValueChange={setOffline} />
          </View>
          <Text style={[styles.metaRow, { color: c.subtext }]}>Status: {connText}</Text>
          <Text style={[styles.metaRow, { color: c.subtext }]}>
            When forced offline, feed loads from the last cached page (if available).
          </Text>
        </View>

        {/* Read history */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sub, { color: c.text }]}>Read articles</Text>
          <Pressable
            onPress={clearAll}
            style={[styles.btn, { backgroundColor: c.ctaBg, marginTop: 8 }]}
          >
            <Text style={[styles.btnText, { color: c.ctaText }]}>Clear read history</Text>
          </Pressable>
          <Text style={[styles.metaRow, { color: c.subtext, marginTop: 4 }]}>
            This will reset all dimmed cards back to normal.
          </Text>
        </View>

        {/* Dev tools */}
        {isDev && (
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.sub, { color: c.text }]}>Developer Tools</Text>
            <Text style={[styles.devRow, { color: c.subtext }]}>
              Directus URL:{' '}
              <Text style={[styles.mono, { color: c.text }]}>{directusUrl || '— not set —'}</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Pressable onPress={forceReload} style={[styles.btn, { backgroundColor: c.ctaBg }]}>
                <Text style={[styles.btnText, { color: c.ctaText }]}>Force reload</Text>
              </Pressable>
            </View>
            {!directusUrl && (
              <Text style={[styles.devHint, { color: c.subtext }]}>
                Set <Text style={styles.mono}>expo.extra.DIRECTUS_URL</Text> in{' '}
                <Text style={styles.mono}>app.json</Text>.
              </Text>
            )}
          </View>
        )}

        <Text style={[styles.meta, { color: c.subtext }]}>
          Bite-size answers to big questions. v{appVersion}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16, paddingBottom: 24 },
  h1: { fontSize: 22, fontWeight: '700' },

  card: { padding: 14, borderWidth: 1, borderRadius: 14, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  sub: { fontSize: 14, fontWeight: '600' },
  label: { fontSize: 16 },

  segment: { flexDirection: 'row', gap: 8 },
  segBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segText: { fontWeight: '600' },

  btn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontWeight: '700' },

  meta: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  metaRow: { fontSize: 12, lineHeight: 16 },

  // dev
  devRow: { fontSize: 12, lineHeight: 16 },
  mono: { fontFamily: 'Courier', fontSize: 12 },
  devHint: { fontSize: 12, marginTop: 6 },
});
