/**
 * Frontend: utils
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

export function cn(...classes) {
  return classes.flat().filter(Boolean).join(' ');
}
