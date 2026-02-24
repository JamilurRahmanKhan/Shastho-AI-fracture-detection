/**
 * Backend library: program
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

/**
 * Rehab program templates
 *
 * These are conservative, educational suggestions.
 * They are NOT a substitute for medical advice.
 *
 * We keep the structure stable so the client can render it without design changes.
 */

function makeTask(key, title, description, frequency = 'daily') {
  return { key, title, description, frequency };
}

export function getProgramTemplate(programDays) {
  const days = Number(programDays) || 0;

  // Accident Pass: day 1-7 guidance
  if (days <= 7) {
    return {
      programDays: 7,
      phases: [
        {
          key: 'day0_7',
          title: 'Week 1 (Acute care)',
          startDay: 0,
          endDay: 7,
          summary: 'Immobilization, swelling control, and red-flag monitoring.',
          tasks: [
            makeTask('immobilize', 'Immobilize the area', 'Keep the injured area immobilized as advised by a clinician.'),
            makeTask('elevate', 'Elevation', 'Elevate the limb when possible to reduce swelling.'),
            makeTask('ice', 'Cold therapy (if safe)', 'Apply cold packs briefly if advised; avoid direct skin contact.'),
            makeTask('redflags', 'Red-flag check', 'Seek urgent care for severe pain, numbness, color change, or fever.'),
          ],
        },
      ],
    };
  }

  // Default 6-week template (used for trial & Recovery 6W)
  if (days <= 42) {
    return {
      programDays: 42,
      phases: [
        {
          key: 'week0_1',
          title: 'Week 0–1 (Acute)',
          startDay: 0,
          endDay: 7,
          summary: 'Swelling control, pain monitoring, protection/immobilization, red flags.',
          tasks: [
            makeTask('protect', 'Protect & immobilize', 'Follow immobilization instructions (splint/cast) and avoid risky movement.'),
            makeTask('swelling', 'Swelling management', 'Elevation and gentle movement of safe joints (as advised).'),
            makeTask('circulation', 'Circulation checks', 'If safe, do gentle finger/toe movement to keep circulation.'),
            makeTask('redflags', 'Red-flag check', 'Seek care for worsening pain, numbness, severe swelling, or discoloration.'),
          ],
        },
        {
          key: 'week2_3',
          title: 'Week 2–3 (Mobility)',
          startDay: 8,
          endDay: 21,
          summary: 'Gentle range-of-motion (ROM) and stiffness prevention, only if cleared.',
          tasks: [
            makeTask('rom', 'Gentle ROM (if cleared)', 'Start gentle ROM exercises only after clinician approval.'),
            makeTask('posture', 'Posture & alignment', 'Maintain good posture; avoid awkward loading.'),
            makeTask('sleep', 'Sleep & recovery', 'Prioritize sleep; keep cast/splint protected.'),
          ],
        },
        {
          key: 'week4_6',
          title: 'Week 4–6 (Strength)',
          startDay: 22,
          endDay: 42,
          summary: 'Gradual strengthening and functional movement progression if healing allows.',
          tasks: [
            makeTask('strength', 'Light strengthening (if cleared)', 'Add light strengthening under guidance, progressing slowly.'),
            makeTask('function', 'Functional movement', 'Practice safe daily activities; avoid pain-provoking loads.'),
            makeTask('followup', 'Follow-up check', 'Consider follow-up imaging/visit if symptoms persist.'),
          ],
        },
      ],
    };
  }

  // 12-week template (Recovery Plus)
  return {
    programDays: 84,
    phases: [
      {
        key: 'week0_1',
        title: 'Week 0–1 (Acute)',
        startDay: 0,
        endDay: 7,
        summary: 'Swelling control, pain monitoring, protection/immobilization, red flags.',
        tasks: [
          makeTask('protect', 'Protect & immobilize', 'Follow immobilization instructions (splint/cast) and avoid risky movement.'),
          makeTask('swelling', 'Swelling management', 'Elevation and gentle movement of safe joints (as advised).'),
          makeTask('redflags', 'Red-flag check', 'Seek care for worsening pain, numbness, severe swelling, or discoloration.'),
        ],
      },
      {
        key: 'week2_4',
        title: 'Week 2–4 (Mobility)',
        startDay: 8,
        endDay: 28,
        summary: 'Gentle ROM and circulation exercises if cleared; avoid overload.',
        tasks: [
          makeTask('rom', 'Gentle ROM (if cleared)', 'Start gentle ROM exercises only after clinician approval.'),
          makeTask('circulation', 'Circulation exercises', 'Low-risk movement to maintain circulation (as advised).'),
        ],
      },
      {
        key: 'week5_8',
        title: 'Week 5–8 (Strength & stability)',
        startDay: 29,
        endDay: 56,
        summary: 'Strength progression, stability, and graded activity as healing improves.',
        tasks: [
          makeTask('strength', 'Strength progression (if cleared)', 'Increase resistance gradually; stop if sharp pain occurs.'),
          makeTask('stability', 'Stability work', 'Add stability/balance exercises appropriate to the injured region.'),
        ],
      },
      {
        key: 'week9_12',
        title: 'Week 9–12 (Return to activity)',
        startDay: 57,
        endDay: 84,
        summary: 'Functional return-to-work/sport guidance and readiness checks.',
        tasks: [
          makeTask('function', 'Functional training', 'Practice work/sport movements at low intensity, progressing slowly.'),
          makeTask('readiness', 'Readiness check', 'Review pain, swelling, and mobility before increasing loads.'),
        ],
      },
    ],
  };
}

// Backward-compatible alias used by the episodes rehab API.
// Keep this named export stable to avoid ESM import errors.
export function generateRehabProgram({ durationDays } = {}) {
  return getProgramTemplate(durationDays);
}
