/**
 * Frontend component: button
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { cn } from '@/lib/utils';

const base = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variantClasses = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  outline: 'border border-gray-200 text-gray-900 hover:bg-gray-50 focus:ring-gray-400',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
};

const sizeClasses = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-11 px-6',
  icon: 'h-10 w-10 p-0',
};

export const Button = React.forwardRef(function Button(
  { className, variant = 'default', size = 'default', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variantClasses[variant] || variantClasses.default, sizeClasses[size] || sizeClasses.default, className)}
      {...props}
    />
  );
});
