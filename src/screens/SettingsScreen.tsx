import React from 'react';
import { SafeAreaView, ScrollView, View, Text, Switch, StyleSheet, Pressable } from 'react-native';
import Constants from 'expo-constants';
import { useStore } from '../store/useStore';
import { useThemeColors } from '../theme';

export default function SettingsScreen() {
  const c = useThemeColors();

  const [offline, setOffline] = React.useState(false); // demo
  const fontSize = useStore((s) => s.fontSize);
  const setFontSize = useStore((s) => s.setFontSize);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  // Dev-only force reload
  const forceReload = useStore((s) => s.forceReload);
  const isDev = __DEV__ || ((Constants.expoConfig as any)?.extra?.env === 'dev');

  const extra: any =
    (Constants.expoConfig?.extra as any) ||
    ((Constants as any).manifest?.extra as any) ||
    {};
  const appVersion = Constants.expoConfig?.version ?? '0.1';
  const directusUrl: string | undefined = extra?.DIRECTUS_URL;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* paddingTop побольше, чтобы визуально опустить содержимое */}
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.bg, paddingTop: 32 }]}>
        <Text style={[styles.h1, { color: c.text }]}>Settings</Text>

        {/* Theme */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sub, { color: c.text }]}>Theme</Text>
          <View style={styles.segment}>
            <Pressable
              onPress={() => setTheme('light')}
              style={[
                styles.segBtn,
                { borderColor: c.border, backgroundColor: theme === 'light' ? c.ctaBg : 'transparent' },
              ]}
            >
              <Text style={[styles.segText, { color: theme === 'light' ? c.ctaText : c.text }]}>Light</Text>
            </Pressable>
            <Pressable
              onPress={() => setTheme('dark')}
              style={[
                styles.segBtn,
                { borderColor: c.border, backgroundColor: theme === 'dark' ? c.ctaBg : 'transparent' },
              ]}
            >
              <Text style={[styles.segText, { color: theme === 'dark' ? c.ctaText : c.text }]}>Dark</Text>
            </Pressable>
          </View>
        </View>

        {/* Reading size */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sub, { color: c.text }]}>Reading text size</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setFontSize(fontSize - 2)} style={[styles.btn, { backgroundColor: c.ctaBg }]}>
              <Text style={[styles.btnText, { color: c.ctaText }]}>A−</Text>
            </Pressable>
            <Text style={{ minWidth: 44, textAlign: 'center', color: c.text }}>{fontSize} pt</Text>
            <Pressable onPress={() => setFontSize(fontSize + 2)} style={[styles.btn, { backgroundColor: c.ctaBg }]}>
              <Text style={[styles.btnText, { color: c.ctaText }]}>A+</Text>
            </Pressable>
          </View>
          <Text style={{ marginTop: 8, fontSize: fontSize, color: c.subtext }}>
            Preview: This is how article text looks.
          </Text>
        </View>

        {/* Offline (demo) */}
        <View style={[styles.rowCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.text }]}>Simulate offline mode</Text>
          <Switch value={offline} onValueChange={setOffline} />
        </View>

        {/* Dev tools (only in dev) */}
        {isDev && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
              },
            ]}
          >
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
                Set <Text style={styles.mono}>expo.extra.DIRECTUS_URL</Text> in <Text style={styles.mono}>app.json</Text>.
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
  rowCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

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

  btn: { height: 32, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontWeight: '700' },

  meta: { fontSize: 12, marginTop: 8, textAlign: 'center' },

  // dev
  devRow: { fontSize: 12, lineHeight: 16 },
  mono: { fontFamily: 'Courier', fontSize: 12 },
  devHint: { fontSize: 12, marginTop: 6 },
});
