/**
 * Frontend component: tabs
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const TabsCtx = createContext(null);

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children, ...props }) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlledValue ?? uncontrolled;
  const setValue = (v) => {
    if (controlledValue === undefined) setUncontrolled(v);
    onValueChange?.(v);
  };

  const ctx = useMemo(() => ({ value, setValue }), [value]);

  return (
    <TabsCtx.Provider value={ctx}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ className, ...props }) {
  return <div className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1', className)} {...props} />;
}

export function TabsTrigger({ value, className, children, ...props }) {
  const ctx = useContext(TabsCtx);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }) {
  const ctx = useContext(TabsCtx);
  if (ctx?.value !== value) return null;
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  );
}
