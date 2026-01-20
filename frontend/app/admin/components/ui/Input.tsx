'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--admin-text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`admin-input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {hint && !error && <p className="text-sm text-[var(--admin-text-muted)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
