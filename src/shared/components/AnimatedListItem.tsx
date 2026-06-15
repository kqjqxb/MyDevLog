import React, { ReactNode } from 'react';
import { MotiView } from 'moti';

import { MOTION } from '@/shared/constants';

interface AnimatedListItemProps {
  index: number;
  children: ReactNode;
}

/**
 * Staggered fade+slide-up entrance. Each item delays by `index * staggerStep`
 * so a list cascades into view on mount.
 */
export function AnimatedListItem({ index, children }: AnimatedListItemProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: MOTION.spring.damping,
        stiffness: MOTION.spring.stiffness,
        delay: index * MOTION.staggerStep,
      }}>
      {children}
    </MotiView>
  );
}
