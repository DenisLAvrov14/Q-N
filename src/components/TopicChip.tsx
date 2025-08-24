// src/components/TopicChip.tsx
import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '../theme';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle | ViewStyle[];
};

function TopicChip({ label, active, onPress, disabled, testID, style }: Props) {
  const c = useThemeColors();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      accessibilityLabel={`${label}${active ? ', selected' : ''}`}
      android_ripple={{ color: active ? c.badgeBg : c.border, borderless: false }}
      style={({ pressed }) => [
        styles.base,
        {
          borderColor: active ? c.ctaBg : c.border,
          backgroundColor: active ? c.ctaBg : 'transparent',
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
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

export default memo(TopicChip);

const styles = StyleSheet.create({
  base: {
    height: 36,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 14 },
  textActive: { fontWeight: '600' },
});
