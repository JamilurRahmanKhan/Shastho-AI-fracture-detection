/**
 * Backend: ioRef
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Server entrypoint and core backend wiring for ShasthoAI.
 *
 * Project-specific notes:
 * - (none)
 */

// Small shared reference to the active Socket.IO server instance.
// This lets non-socket modules (e.g., notifications) emit realtime updates.

let _io = null;

export function setIO(io) {
  _io = io;
}

export function getIO() {
  return _io;
}
