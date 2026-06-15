import React, { memo } from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { TYPOGRAPHY, TypographyVariant } from '@/shared/constants';

interface ThemedTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Single source of truth for text rendering. Components pick a typographic
 * variant instead of declaring font size/weight inline.
 */
function ThemedTextComponent({
  variant = 'body',
  color,
  style,
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      {...rest}
      style={[TYPOGRAPHY[variant], color ? { color } : null, style]}
    />
  );
}

export const ThemedText = memo(ThemedTextComponent);
