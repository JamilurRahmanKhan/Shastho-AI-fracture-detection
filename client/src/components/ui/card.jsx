/**
 * Frontend component: card
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }) {
  return <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)} {...props} />;
}

// Lightweight shadcn-style helpers used across the dashboard pages.
// Some pages import these from "@/components/ui/card".
export function CardHeader({ className, ...props }) {
  return <div className={cn('p-6 pb-2', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props} />;
}

// Some pages expect a shadcn-style CardDescription export.
// Keep it lightweight and consistent with the existing design system.
export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-gray-600 mt-1', className)} {...props} />;
}
