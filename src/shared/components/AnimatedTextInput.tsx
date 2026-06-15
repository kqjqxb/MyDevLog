import React, { forwardRef, useCallback, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { COLORS, FONTS, FONT_SIZE, RADIUS, SPACING } from '@/shared/constants';

import { ThemedText } from './ThemedText';

interface AnimatedTextInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Text input whose border animates from the default border colour to the
 * brand purple when focused (a gradient-feeling focus state via
 * interpolateColor on the UI thread).
 */
export const AnimatedTextInput = forwardRef<TextInput, AnimatedTextInputProps>(
  ({ label, containerStyle, onFocus, onBlur, style, multiline, ...rest }, ref) => {
    const focus = useSharedValue(0);
    const [, setFocused] = useState(false);

    const borderStyle = useAnimatedStyle(() => ({
      borderColor: interpolateColor(
        focus.value,
        [0, 1],
        [COLORS.border, '#7C3AED'],
      ),
    }));

    const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>(
      event => {
        focus.value = withTiming(1, { duration: 200 });
        setFocused(true);
        onFocus?.(event);
      },
      [focus, onFocus],
    );

    const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>(
      event => {
        focus.value = withTiming(0, { duration: 200 });
        setFocused(false);
        onBlur?.(event);
      },
      [focus, onBlur],
    );

    return (
      <View style={containerStyle}>
        {label ? (
          <ThemedText variant="caption" color={COLORS.textSecondary} style={styles.label}>
            {label}
          </ThemedText>
        ) : null}
        <Animated.View style={[styles.field, multiline && styles.multiline, borderStyle]}>
          <TextInput
            ref={ref}
            placeholderTextColor={COLORS.textTertiary}
            selectionColor="#8B5CF6"
            multiline={multiline}
            style={[styles.input, multiline && styles.inputMultiline, style]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />
        </Animated.View>
      </View>
    );
  },
);

AnimatedTextInput.displayName = 'AnimatedTextInput';

const styles = StyleSheet.create({
  label: {
    marginBottom: SPACING.sm,
  },
  field: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.lg,
  },
  multiline: {
    paddingVertical: SPACING.sm,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.body,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  inputMultiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
});
