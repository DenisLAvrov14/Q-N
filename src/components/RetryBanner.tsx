import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';

type Props = {
  message?: string | null;
  onRetry: () => void;
};

export default function RetryBanner({ message, onRetry }: Props) {
  if (!message) return null;

  return (
    <Pressable onPress={onRetry} style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.title}>Network error</Text>
        <Text style={styles.cta}>Tap to retry</Text>
      </View>
      <Text style={styles.msg} numberOfLines={2}>
        {message}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#ffefe8',
    borderColor: '#ffc7bd',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#8a1c10' },
  cta: { fontSize: 12, fontWeight: '600', color: '#8a1c10' },
  msg: { fontSize: 12, color: '#5a1b14' },
});
