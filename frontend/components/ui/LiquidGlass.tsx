'use client';

import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  forwardRef,
  HTMLAttributes,
  ReactNode,
} from 'react';

export interface LiquidGlassProps {
  variant?: 'card' | 'navbar' | 'button' | 'button-secondary' | 'badge';
  className?: string;
  children: ReactNode;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  as?: 'div' | 'nav' | 'button' | 'a' | 'span';
  onClick?: () => void;
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
    { variant = 'card', className = '', children, blur = 'lg', as, onClick, href, ...props },
    ref
  ) => {
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

    const elementType =
      as ||
      (() => {
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
      })();

    const commonProps = {
      className: classes,
      onClick,
      ...props,
    };

    if (elementType === 'a') {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          {...(commonProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    if (elementType === 'button') {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          {...(commonProps as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {children}
        </button>
      );
    }

    if (elementType === 'nav') {
      return (
        <nav ref={ref as React.Ref<HTMLElement>} {...(commonProps as HTMLAttributes<HTMLElement>)}>
          {children}
        </nav>
      );
    }

    if (elementType === 'span') {
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          {...(commonProps as HTMLAttributes<HTMLSpanElement>)}
        >
          {children}
        </span>
      );
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        {...(commonProps as HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }
);

LiquidGlass.displayName = 'LiquidGlass';

export default LiquidGlass;

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
