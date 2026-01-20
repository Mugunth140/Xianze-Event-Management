'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'primary-soft' | 'danger-soft';
  size?: 'sm' | 'default' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'default',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClass = 'admin-btn';
    const variantClass = `admin-btn-${variant}`;
    const sizeClass = size === 'lg' ? 'admin-btn-lg' : size === 'sm' ? 'admin-btn-sm' : '';

    return (
      <button
        ref={ref}
        className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
