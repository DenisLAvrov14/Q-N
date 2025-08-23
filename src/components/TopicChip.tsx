import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme';

type Props = { label: string; active?: boolean; onPress?: () => void };

export default function TopicChip({ label, active, onPress }: Props) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          borderColor: active ? c.ctaBg : c.border,
          backgroundColor: active ? c.ctaBg : 'transparent',
        },
      ]}
      android_ripple={{ color: c.border }}
    >
      <Text
        style={[
          styles.text,
          { color: active ? c.ctaText : c.text },
          active && styles.textActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  text: { fontSize: 14 },
  textActive: { fontWeight: '600' },
});
