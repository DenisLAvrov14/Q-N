import React, { memo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme';

type Props = {
  label: string;
  active?: boolean;
  onPress: () => void;
  disabled?: boolean;
};

function TopicChip({ label, active = false, onPress, disabled }: Props) {
  const c = useThemeColors();

  const bg = active ? c.badgeBg : 'transparent';
  const border = active ? c.badgeBg : c.border;
  const text = active ? c.badgeText : c.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
      ]}
    >
      <Text style={[styles.label, { color: text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default memo(TopicChip);

const styles = StyleSheet.create({
  base: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 220,
  },
});
