import React, { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Settings, Sparkles } from 'lucide-react-native';

import { AIAgentScreen } from '@/features/ai';
import { SettingsScreen } from '@/features/settings';
import { TaskListScreen } from '@/features/tasks';
import { COLORS, STRINGS } from '@/shared/constants';
import { ErrorBoundary } from '@/shared/components';

// ─── Animation constants ──────────────────────────────────────────────────────

const SLIDE_PX = 44;

// Underdamped spring: noticeable spring feel without excessive bounce.
const SPRING_TRANSLATE = {
  damping: 22,
  stiffness: 220,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Clamped so opacity never overshoots past 1.
const SPRING_OPACITY = {
  ...SPRING_TRANSLATE,
  overshootClamping: true,
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

const ACTIVE_COLOR = '#A78BFA';
const TAB_HEIGHT = 56; // content row height; bottom inset added separately

interface TabDef {
  label: string;
  Screen: React.ComponentType;
  Icon: React.ComponentType<{ color: string; size: number }>;
}

const TABS: TabDef[] = [
  {
    label: STRINGS.tabs.tasks,
    Screen: () => <ErrorBoundary><TaskListScreen /></ErrorBoundary>,
    Icon: LayoutGrid,
  },
  {
    label: STRINGS.tabs.ai,
    Screen: () => <ErrorBoundary><AIAgentScreen /></ErrorBoundary>,
    Icon: Sparkles,
  },
  {
    label: STRINGS.tabs.settings,
    Screen: () => <ErrorBoundary><SettingsScreen /></ErrorBoundary>,
    Icon: Settings,
  },
];

// ─── ScreenSlot ───────────────────────────────────────────────────────────────

interface ScreenSlotProps {
  translateX: SharedValue<number>;
  opacity: SharedValue<number>;
  active: boolean;
  children: React.ReactNode;
}

function ScreenSlot({ translateX, opacity, active, children }: ScreenSlotProps) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, animStyle, { pointerEvents: active ? 'auto' : 'none' }]}>
      {children}
    </Animated.View>
  );
}

// ─── Tab bar background ───────────────────────────────────────────────────────

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={24}
        reducedTransparencyFallbackColor={COLORS.surface}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFill, styles.androidBar]} />;
}

// ─── Navigator ────────────────────────────────────────────────────────────────

export function TabNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const prevIndexRef = useRef(0);
  const insets = useSafeAreaInsets();

  // One translateX + opacity pair per screen. Screens 1 and 2 start
  // positioned off to the right and invisible.
  const tx0 = useSharedValue(0);
  const op0 = useSharedValue(1);
  const tx1 = useSharedValue(SLIDE_PX);
  const op1 = useSharedValue(0);
  const tx2 = useSharedValue(SLIDE_PX);
  const op2 = useSharedValue(0);

  const handleTabPress = useCallback(
    (nextIndex: number) => {
      const prevIndex = prevIndexRef.current;
      if (prevIndex === nextIndex) return;

      const txAll = [tx0, tx1, tx2];
      const opAll = [op0, op1, op2];
      // Positive direction → moving to a tab with a higher index (rightward).
      const dir = nextIndex > prevIndex ? 1 : -1;

      // Outgoing: slide away from center, fade out.
      txAll[prevIndex].value = withSpring(-dir * SLIDE_PX, SPRING_TRANSLATE);
      opAll[prevIndex].value = withSpring(0, SPRING_OPACITY);

      // Incoming: jump to entry edge, then spring into view.
      txAll[nextIndex].value = dir * SLIDE_PX;
      opAll[nextIndex].value = 0;
      txAll[nextIndex].value = withSpring(0, SPRING_TRANSLATE);
      opAll[nextIndex].value = withSpring(1, SPRING_OPACITY);

      prevIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    },
    [tx0, tx1, tx2, op0, op1, op2],
  );

  return (
    <View style={styles.root}>
      {/* Screen stack */}
      {TABS.map((tab, index) => (
        <ScreenSlot
          key={tab.label}
          translateX={[tx0, tx1, tx2][index]}
          opacity={[op0, op1, op2][index]}
          active={index === activeIndex}>
          <tab.Screen />
        </ScreenSlot>
      ))}

      {/* Floating tab bar */}
      <View style={[styles.tabBar, { height: TAB_HEIGHT + insets.bottom }]}>
        <TabBarBackground />
        <View style={styles.border} />
        <View style={styles.tabRow}>
          {TABS.map((tab, index) => {
            const active = index === activeIndex;
            const tint = active ? ACTIVE_COLOR : COLORS.textTertiary;
            return (
              <Pressable
                key={tab.label}
                style={styles.tabItem}
                onPress={() => handleTabPress(index)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}>
                <tab.Icon color={tint} size={22} />
                <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  androidBar: {
    backgroundColor: COLORS.surface,
  },
  tabRow: {
    flexDirection: 'row',
    height: TAB_HEIGHT,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
