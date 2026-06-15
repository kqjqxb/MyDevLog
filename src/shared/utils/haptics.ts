import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';

const OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
} as const;

/** Thin wrapper so call sites don't repeat option objects or import the enum. */
export function triggerHaptic(
  type: keyof typeof HapticFeedbackTypes = 'impactLight',
): void {
  try {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes[type], OPTIONS);
  } catch {
    // Haptics are non-critical; never let a failure bubble up.
  }
}
