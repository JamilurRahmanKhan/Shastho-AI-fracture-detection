/**
 * Frontend component: select
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { createContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const SelectCtx = createContext(null);

// Lightweight Select that supports the shadcn-like API used in the panels.
// It renders a native <select> for reliability in a Vite + Tailwind v3 app.

function getPlaceholder(triggerEl) {
  if (!triggerEl) return "";
  const kids = React.Children.toArray(triggerEl.props?.children ?? []);
  for (const k of kids) {
    if (React.isValidElement(k) && k.type === SelectValue) {
      return k.props?.placeholder ?? "";
    }
  }
  return "";
}

function getOptions(contentEl) {
  if (!contentEl) return [];
  const items = React.Children.toArray(contentEl.props?.children ?? []);
  return items
    .filter((it) => React.isValidElement(it) && it.type === SelectItem)
    .map((it) => ({ value: it.props.value, label: it.props.children }));
}

export function Select({ value: controlledValue, defaultValue, onValueChange, children }) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const value = controlledValue ?? uncontrolled;

  const setValue = (v) => {
    if (controlledValue === undefined) setUncontrolled(v);
    onValueChange?.(v);
  };

  const ctx = useMemo(() => ({ value, setValue }), [value]);

  const arr = React.Children.toArray(children).filter(Boolean);
  const triggerEl = arr.find((c) => React.isValidElement(c) && c.type === SelectTrigger);
  const contentEl = arr.find((c) => React.isValidElement(c) && c.type === SelectContent);

  const placeholder = getPlaceholder(triggerEl);
  const options = getOptions(contentEl);
  const triggerClass = triggerEl?.props?.className;

  return (
    <SelectCtx.Provider value={ctx}>
      <div className={cn("relative w-full", triggerClass)}>
        <select
          className={cn(
            "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          )}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </SelectCtx.Provider>
  );
}

// Marker components for API compatibility
export function SelectTrigger() {
  return null;
}
export function SelectValue() {
  return null;
}
export function SelectContent() {
  return null;
}
export function SelectItem() {
  return null;
}
