/**
 * Frontend component: dialog
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const DialogCtx = createContext(null);

export function Dialog({ children, open: controlledOpen, onOpenChange }) {
  const [internal, setInternal] = useState(false);
  const open = controlledOpen ?? internal;
  const setOpen = (v) => {
    if (controlledOpen === undefined) setInternal(v);
    onOpenChange?.(v);
  };
  return <DialogCtx.Provider value={{ open, setOpen }}>{children}</DialogCtx.Provider>;
}

export function DialogTrigger({ children }) {
  const ctx = useContext(DialogCtx);
  // Preserve any existing onClick on the child (important for buttons that
  // also set local state before opening the dialog).
  const childOnClick = children?.props?.onClick;
  return React.cloneElement(children, {
    onClick: (e) => {
      try {
        childOnClick?.(e);
      } finally {
        ctx?.setOpen(true);
      }
    },
  });
}

export function DialogContent({ className, children }) {
  const ctx = useContext(DialogCtx);
  if (!ctx?.open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => ctx?.setOpen(false)} />
      <div className={cn('relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-gray-200', className)}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('mb-4', className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props} />;
}

// shadcn-compatible description export (some pages import DialogDescription)
export function DialogDescription({ className, ...props }) {
  return <p className={cn('text-sm text-slate-600', className)} {...props} />;
}

// shadcn-compatible footer export (some pages import DialogFooter)
export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  );
}
