// Simple "wait-on" replacement without extra npm deps.
// Ensures the API server is reachable before starting the Vite dev server,
// preventing noisy proxy ECONNREFUSED errors on first load.

const url = process.env.WAIT_FOR_URL || 'http://localhost:5001/api/health';
const timeoutMs = Number(process.env.WAIT_FOR_TIMEOUT_MS || 30000);
const intervalMs = Number(process.env.WAIT_FOR_INTERVAL_MS || 500);

const start = Date.now();

async function ping() {
  try {
    const res = await fetch(url, { method: 'GET' });
    // Any HTTP response means the server is listening.
    if (res) return true;
  } catch (e) {
    // ignore
  }
  return false;
}

while (Date.now() - start < timeoutMs) {
  // eslint-disable-next-line no-await-in-loop
  const ok = await ping();
  if (ok) process.exit(0);
  // eslint-disable-next-line no-await-in-loop
  await new Promise((r) => setTimeout(r, intervalMs));
}

console.error(`Timed out waiting for server: ${url}`);
process.exit(1);
