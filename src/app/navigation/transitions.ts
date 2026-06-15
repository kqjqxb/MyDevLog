import {
  StackCardStyleInterpolator,
  StackNavigationOptions,
} from '@react-navigation/stack';

type TransitionSpec = NonNullable<StackNavigationOptions['transitionSpec']>['open'];

/** Shared spring used for both open and close of every custom transition. */
const SPRING_SPEC: TransitionSpec = {
  animation: 'spring',
  config: {
    stiffness: 300,
    damping: 35,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

export const springTransition = {
  open: SPRING_SPEC,
  close: SPRING_SPEC,
};

/**
 * iOS-sheet-style entrance: the incoming card slides up from 30% of the screen
 * height while fading in; reverses (slide down + fade out) on back.
 */
export const slideUpFade: StackCardStyleInterpolator = ({ current, layouts }) => ({
  cardStyle: {
    transform: [
      {
        translateY: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.height * 0.3, 0],
        }),
      },
    ],
    opacity: current.progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1],
    }),
  },
  overlayStyle: {
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5],
    }),
  },
});

/**
 * Bottom-sheet presentation: the card springs up from the bottom of the screen
 * with a dimming overlay behind it.
 */
export const bottomSheet: StackCardStyleInterpolator = ({ current, layouts }) => ({
  cardStyle: {
    transform: [
      {
        translateY: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.height, 0],
        }),
      },
    ],
  },
  overlayStyle: {
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5],
    }),
  },
});
