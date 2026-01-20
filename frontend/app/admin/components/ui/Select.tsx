'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[var(--admin-text-secondary)]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`admin-select ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
