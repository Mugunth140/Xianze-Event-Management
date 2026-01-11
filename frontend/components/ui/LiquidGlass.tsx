'use client';

import { forwardRef, ReactNode } from 'react';

export interface LiquidGlassProps {
  /** The variant of the liquid glass component */
  variant?: 'card' | 'navbar' | 'button' | 'button-secondary' | 'badge';
  /** Additional CSS classes */
  className?: string;
  /** Child elements */
  children: ReactNode;
  /** Blur intensity */
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show glow effect on hover (for buttons) */
  glow?: boolean;
  /** HTML element to render as */
  as?: 'div' | 'nav' | 'button' | 'a' | 'span';
  /** Click handler */
  onClick?: () => void;
  /** Href for anchor elements */
  href?: string;
}

const blurMap = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

/**
 * LiquidGlass - A reusable glassmorphism component
 *
 * Variants:
 * - card: Frosted glass card container
 * - navbar: Navigation bar style
 * - button: Primary glass button
 * - button-secondary: Secondary outlined glass button
 * - badge: Small glass tag/badge
 */
const LiquidGlass = forwardRef<HTMLElement, LiquidGlassProps>(
  (
    {
      variant = 'card',
      className = '',
      children,
      blur = 'lg',
      // glow = true,
      as,
      onClick,
      href,
      ...props
    },
    ref
  ) => {
    // Determine the element type based on variant or explicit 'as' prop
    const getElement = () => {
      if (as) return as;
      switch (variant) {
        case 'navbar':
          return 'nav';
        case 'button':
        case 'button-secondary':
          return href ? 'a' : 'button';
        case 'badge':
          return 'span';
        default:
          return 'div';
      }
    };

    const Element = getElement() as keyof JSX.IntrinsicElements;

    // Get variant-specific classes
    const getVariantClasses = () => {
      switch (variant) {
        case 'card':
          return 'liquid-glass-card';
        case 'navbar':
          return 'liquid-glass-navbar';
        case 'button':
          return 'liquid-glass-btn';
        case 'button-secondary':
          return 'liquid-glass-btn-secondary';
        case 'badge':
          return 'liquid-glass-badge';
        default:
          return '';
      }
    };

    const classes = [getVariantClasses(), blur !== 'lg' ? blurMap[blur] : '', className]
      .filter(Boolean)
      .join(' ');

    return (
      <Element
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        onClick={onClick}
        href={href}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

LiquidGlass.displayName = 'LiquidGlass';

export default LiquidGlass;

// Named exports for convenience
export const GlassCard = forwardRef<HTMLDivElement, Omit<LiquidGlassProps, 'variant'>>(
  (props, ref) => <LiquidGlass ref={ref} variant="card" {...props} />
);
GlassCard.displayName = 'GlassCard';

export const GlassNavbar = forwardRef<HTMLElement, Omit<LiquidGlassProps, 'variant'>>(
  (props, ref) => <LiquidGlass ref={ref} variant="navbar" as="nav" {...props} />
);
GlassNavbar.displayName = 'GlassNavbar';

export const GlassButton = forwardRef<HTMLButtonElement, Omit<LiquidGlassProps, 'variant'>>(
  (props, ref) => <LiquidGlass ref={ref} variant="button" {...props} />
);
GlassButton.displayName = 'GlassButton';

export const GlassButtonSecondary = forwardRef<
  HTMLButtonElement,
  Omit<LiquidGlassProps, 'variant'>
>((props, ref) => <LiquidGlass ref={ref} variant="button-secondary" {...props} />);
GlassButtonSecondary.displayName = 'GlassButtonSecondary';

export const GlassBadge = forwardRef<HTMLSpanElement, Omit<LiquidGlassProps, 'variant'>>(
  (props, ref) => <LiquidGlass ref={ref} variant="badge" as="span" {...props} />
);
GlassBadge.displayName = 'GlassBadge';
