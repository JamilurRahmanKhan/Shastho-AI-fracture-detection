/**
 * Frontend: useRoleRequestSummary
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function useRoleRequestSummary({ pollMs = 20000 } = {}) {
  const [summary, setSummary] = useState({ pending: 0, unseenPending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let timer;

    const run = async () => {
      try {
        const res = await api.roleRequestSummary();
        const c = res?.counts || res || {};
        if (!alive) return;
        setSummary({
          pending: Number(c?.pending || 0),
          unseenPending: Number(c?.pendingUnseen || c?.unseenPending || 0),
          approved: Number(c?.approved || 0),
          rejected: Number(c?.rejected || 0),
        });
      } catch {
        // ignore (admin may not be logged in yet)
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    if (pollMs > 0) {
      timer = setInterval(run, pollMs);
    }

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [pollMs]);

  return { summary, loading };
}
