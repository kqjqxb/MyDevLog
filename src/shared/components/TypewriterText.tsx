import React, { useEffect, useMemo, useState } from 'react';
import { StyleProp, TextStyle } from 'react-native';

import { TypographyVariant } from '@/shared/constants';

import { ThemedText } from './ThemedText';

interface TypewriterTextProps {
  text: string;
  variant?: TypographyVariant;
  color?: string;
  /** Delay between revealed words (ms). */
  speed?: number;
  onDone?: () => void;
  style?: StyleProp<TextStyle>;
}

/**
 * Reveals text word-by-word for the "streamed AI response" effect. Uses a JS
 * interval (not the UI thread) because it mutates the rendered string, which
 * Reanimated can't do off-thread.
 */
export function TypewriterText({
  text,
  variant = 'body',
  color,
  speed = 38,
  onDone,
  style,
}: TypewriterTextProps) {
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
  }, [text]);

  useEffect(() => {
    if (count >= words.length) {
      onDone?.();
      return;
    }
    const timer = setTimeout(() => setCount(c => c + 1), speed);
    return () => clearTimeout(timer);
  }, [count, words.length, speed, onDone]);

  return (
    <ThemedText variant={variant} color={color} style={style}>
      {words.slice(0, count).join('')}
    </ThemedText>
  );
}
