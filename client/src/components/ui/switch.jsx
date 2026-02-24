/**
 * Frontend component: switch
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { cn } from '@/lib/utils';

export function Switch({ checked, defaultChecked, onCheckedChange, className, ...props }) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const value = isControlled ? checked : internal;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => {
        const next = !value;
        if (!isControlled) setInternal(next);
        onCheckedChange?.(next);
      }}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        value ? 'bg-blue-600' : 'bg-gray-200',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
          value ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  );
}
