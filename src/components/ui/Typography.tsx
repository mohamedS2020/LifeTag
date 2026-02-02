/**
 * LifeTag Typography Components
 * Pre-styled text components for consistent typography
 * Now supports dynamic theming via useTheme hook
 */

import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { duration } from '../../theme';

interface TextProps extends RNTextProps {
  color?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'inverse' | string;
  align?: TextStyle['textAlign'];
  animated?: boolean;
  animationDelay?: number;
}

const AnimatedText = Animated.createAnimatedComponent(RNText);

// Base text component factory with theme support
const createTextComponent = (
  getBaseStyle: (typography: any) => TextStyle,
  defaultColor: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'inverse' = 'primary'
) => {
  const Component: React.FC<TextProps> = ({
    children,
    style,
    color,
    align,
    animated = false,
    animationDelay = 0,
    ...props
  }) => {
    const { colors, typography } = useTheme();

    // Helper to resolve color
    const resolveColor = (c?: string): string => {
      if (!c) return colors.text[defaultColor];
      if (c in colors.text) {
        return colors.text[c as keyof typeof colors.text];
      }
      return c;
    };

    const textStyle: TextStyle = {
      ...getBaseStyle(typography),
      color: resolveColor(color),
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
export const DisplayLarge = createTextComponent((t) => t.displayLarge);
export const DisplayMedium = createTextComponent((t) => t.displayMedium);

// Heading components
export const H1 = createTextComponent((t) => t.h1);
export const H2 = createTextComponent((t) => t.h2);
export const H3 = createTextComponent((t) => t.h3);
export const H4 = createTextComponent((t) => t.h4);

// Body components
export const BodyLarge = createTextComponent((t) => t.bodyLarge);
export const Body = createTextComponent((t) => t.body);
export const BodySmall = createTextComponent((t) => t.bodySmall, 'secondary');

// Label components
export const LabelLarge = createTextComponent((t) => t.labelLarge);
export const Label = createTextComponent((t) => t.label, 'secondary');
export const LabelSmall = createTextComponent((t) => t.labelSmall, 'tertiary');

// Caption
export const Caption = createTextComponent((t) => t.caption, 'tertiary');

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

const variantDefaults: Record<TypographyVariant, 'primary' | 'secondary' | 'tertiary'> = {
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
  const { colors, typography } = useTheme();

  // Helper to resolve color
  const resolveColor = (c?: string): string => {
    if (!c) return colors.text[variantDefaults[variant]];
    if (c in colors.text) {
      return colors.text[c as keyof typeof colors.text];
    }
    return c;
  };

  const textStyle: TextStyle = {
    ...typography[variant],
    color: resolveColor(color),
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
