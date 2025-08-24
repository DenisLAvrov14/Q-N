import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { HealthStatus } from '../hooks/useDirectusHealth';

export function NetBanner({
  baseUrl,
  status,
  raw,
}: {
  baseUrl?: string;
  status: HealthStatus;
  raw: string;
}) {
  if (!baseUrl) {
    return (
      <View style={[styles.banner, { backgroundColor: '#ffefe8' }]}>
        <Text style={styles.bannerText}>
          DIRECTUS_URL not set in app.json → expo.extra.DIRECTUS_URL
        </Text>
      </View>
    );
  }
  if (status === 'ok') return null;

  const color = status === 'pending' ? '#fff6d6' : '#ffefe8';
  const msg =
    status === 'pending'
      ? `Checking Directus: ${baseUrl}`
      : `Can't reach Directus: ${baseUrl}\n[HEALTH] ${raw}`;

  return (
    <View style={[styles.banner, { backgroundColor: color }]}>
      <Text style={styles.bannerText}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000014',
  },
  bannerText: { fontSize: 12, lineHeight: 16 },
});
