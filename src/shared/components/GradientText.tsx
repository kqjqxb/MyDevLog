import React from 'react';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { FONTS, GRADIENTS, GradientName } from '@/shared/constants';

interface GradientTextProps {
  text: string;
  fontSize?: number;
  gradient?: GradientName;
  height?: number;
  width?: number;
}

/**
 * Gradient-filled text using SVG (no MaskedView dependency). Used for the
 * "DevLog" wordmark in the list header.
 */
export function GradientText({
  text,
  fontSize = 34,
  gradient = 'accent',
  height,
  width = 280,
}: GradientTextProps) {
  const stops = GRADIENTS[gradient];
  const h = height ?? fontSize * 1.3;

  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
          {stops.map((color, index) => (
            <Stop
              key={color}
              offset={`${(index / (stops.length - 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#grad)"
        fontSize={fontSize}
        fontFamily={FONTS.heavy}
        x={0}
        y={fontSize}>
        {text}
      </SvgText>
    </Svg>
  );
}
