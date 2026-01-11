/**
 * LifeTag Typography Components
 * Pre-styled text components for consistent typography
 */

import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, typography as typographyStyles, duration } from '../../theme';

interface TextProps extends RNTextProps {
  color?: keyof typeof colors.text | string;
  align?: TextStyle['textAlign'];
  animated?: boolean;
  animationDelay?: number;
}

const AnimatedText = Animated.createAnimatedComponent(RNText);

// Helper to resolve color
const resolveColor = (color?: keyof typeof colors.text | string): string => {
  if (!color) return colors.text.primary;
  if (color in colors.text) {
    return colors.text[color as keyof typeof colors.text];
  }
  return color;
};

// Base text component factory
const createTextComponent = (baseStyle: TextStyle, defaultColor: keyof typeof colors.text = 'primary') => {
  const Component: React.FC<TextProps> = ({
    children,
    style,
    color,
    align,
    animated = false,
    animationDelay = 0,
    ...props
  }) => {
    const textStyle: TextStyle = {
      ...baseStyle,
      color: resolveColor(color || defaultColor),
      textAlign: align,
    };

    if (animated) {
      return (
        <AnimatedText
          entering={FadeInDown.delay(animationDelay).duration(duration.normal)}
          style={[textStyle, style]}
          {...props}
        >
          {children}
        </AnimatedText>
      );
    }

    return (
      <RNText style={[textStyle, style]} {...props}>
        {children}
      </RNText>
    );
  };

  return Component;
};

// Display components
export const DisplayLarge = createTextComponent(typographyStyles.displayLarge);
export const DisplayMedium = createTextComponent(typographyStyles.displayMedium);

// Heading components
export const H1 = createTextComponent(typographyStyles.h1);
export const H2 = createTextComponent(typographyStyles.h2);
export const H3 = createTextComponent(typographyStyles.h3);
export const H4 = createTextComponent(typographyStyles.h4);

// Body components
export const BodyLarge = createTextComponent(typographyStyles.bodyLarge);
export const Body = createTextComponent(typographyStyles.body);
export const BodySmall = createTextComponent(typographyStyles.bodySmall, 'secondary');

// Label components
export const LabelLarge = createTextComponent(typographyStyles.labelLarge);
export const Label = createTextComponent(typographyStyles.label, 'secondary');
export const LabelSmall = createTextComponent(typographyStyles.labelSmall, 'tertiary');

// Caption
export const Caption = createTextComponent(typographyStyles.caption, 'tertiary');

// Flexible Text component with variant prop
type TypographyVariant =
  | 'displayLarge'
  | 'displayMedium'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'labelLarge'
  | 'label'
  | 'labelSmall'
  | 'caption'
  | 'button'
  | 'buttonSmall';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
}

const variantDefaults: Record<TypographyVariant, keyof typeof colors.text> = {
  displayLarge: 'primary',
  displayMedium: 'primary',
  h1: 'primary',
  h2: 'primary',
  h3: 'primary',
  h4: 'primary',
  bodyLarge: 'primary',
  body: 'primary',
  bodySmall: 'secondary',
  labelLarge: 'primary',
  label: 'secondary',
  labelSmall: 'tertiary',
  caption: 'tertiary',
  button: 'primary',
  buttonSmall: 'primary',
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  children,
  style,
  color,
  align,
  animated = false,
  animationDelay = 0,
  ...props
}) => {
  const textStyle: TextStyle = {
    ...typographyStyles[variant],
    color: resolveColor(color || variantDefaults[variant]),
    textAlign: align,
  };

  if (animated) {
    return (
      <AnimatedText
        entering={FadeInDown.delay(animationDelay).duration(duration.normal)}
        style={[textStyle, style]}
        {...props}
      >
        {children}
      </AnimatedText>
    );
  }

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
};

export default Typography;
