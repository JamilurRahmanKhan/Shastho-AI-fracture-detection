/**
 * Backend library: aiChatProvider
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

// // AI provider abstraction for the /chat feature.
// //
// // This project intentionally supports *free online* LLM providers via optional env keys.
// // Choose one:
// //   - GROQ_API_KEY (recommended, free tier): https://console.groq.com/
// //   - HF_TOKEN (optional): HuggingFace Inference API token
// //
// // If no key is configured, the chat will still work (no crashes) but will return
// // an instruction message telling how to enable AI.

// function formatXrayContext(xray) {
//   if (!xray) return null;
//   const a = xray.analysis || {};
//   const prob = typeof a.probability === 'number' ? a.probability : null;
//   return {
//     id: String(xray._id || xray.id || ''),
//     region: a.region ?? 'N/A',
//     fractureDetected: Boolean(a.fractureDetected),
//     probabilityPct: prob == null ? null : Math.round(prob * 1000) / 10,
//     fractureType: a.fractureType ?? null,
//     severity: a.severity ?? null,
//     recoveryTimeline: a.recoveryTimeline ?? null,
//     recommendations: Array.isArray(a.recommendations) ? a.recommendations.slice(0, 10) : [],
//     rehabExercises: Array.isArray(a.rehabExercises) ? a.rehabExercises.slice(0, 10) : [],
//   };
// }

// async function getFetch() {
//   // Node 18+ has global fetch; older Node versions (common in student setups)
//   // do not. Use node-fetch as a lightweight polyfill.
//   if (typeof globalThis.fetch === 'function') return globalThis.fetch;
//   const mod = await import('node-fetch');
//   return mod.default;
// }

// async function callGroq({ system, user }) {
//   const key = process.env.GROQ_API_KEY;
//   if (!key) throw new Error('GROQ_API_KEY not set');

//   const fetch = await getFetch();

//   const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${key}`,
//     },
//     body: JSON.stringify({
//       model: process.env.GROQ_MODEL || 'llama3-8b-8192',
//       temperature: 0.2,
//       max_tokens: 600,
//       messages: [
//         { role: 'system', content: system },
//         { role: 'user', content: user },
//       ],
//     }),
//   });

//   const data = await resp.json().catch(() => ({}));
//   if (!resp.ok) {
//     const msg = data?.error?.message || data?.message || `Groq request failed (${resp.status})`;
//     throw new Error(msg);
//   }
//   const text = data?.choices?.[0]?.message?.content;
//   return (text || '').trim();
// }

// async function callHuggingFace({ system, user }) {
//   const token = process.env.HF_TOKEN;
//   if (!token) throw new Error('HF_TOKEN not set');

//   const fetch = await getFetch();

//   // Simple text generation endpoint.
//   // Note: Many HF models require an auth token; keep this provider optional.
//   const model = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
//   const prompt = `[SYSTEM]\n${system}\n[/SYSTEM]\n[USER]\n${user}\n[/USER]\n[ASSISTANT]\n`;

//   const resp = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({
//       inputs: prompt,
//       parameters: {
//         max_new_tokens: 500,
//         temperature: 0.2,
//         return_full_text: false,
//       },
//     }),
//   });
//   const data = await resp.json().catch(() => ({}));
//   if (!resp.ok) {
//     const msg = data?.error || data?.message || `HF request failed (${resp.status})`;
//     throw new Error(msg);
//   }

//   // HF returns either [{generated_text: "..."}] or {generated_text: "..."} depending on model.
//   const text = Array.isArray(data) ? data?.[0]?.generated_text : data?.generated_text;
//   return (text || '').trim();
// }

// export async function generateAssistantReply({ userMessage, context }) {
//   const xrayCtx = formatXrayContext(context?.xray);

//   const system = `You are ShasthoAI, a medical assistant for bone-fracture triage and recovery guidance.
// You must:
// - Be clear you are not a doctor; this is decision support.
// - If symptoms are severe (extreme pain, open fracture, numbness, deformity, fever), advise urgent in-person care.
// - Use the provided X-ray analysis context if available; do not invent findings.
// - Keep answers structured: Summary, What it means, Next steps, Red flags, (optional) Rehab tips.
// Avoid dosing/prescription claims.`;

//   const user = xrayCtx
//     ? `X-RAY CONTEXT (JSON):\n${JSON.stringify(xrayCtx, null, 2)}\n\nUSER QUESTION: ${userMessage}`
//     : `USER QUESTION: ${userMessage}`;

//   // Provider preference order: Groq -> HuggingFace -> fallback.
//   try {
//     if (process.env.GROQ_API_KEY) {
//       const out = await callGroq({ system, user });
//       if (out) return out;
//     }
//   } catch (_e) {
//     // fall through
//   }

//   try {
//     if (process.env.HF_TOKEN) {
//       const out = await callHuggingFace({ system, user });
//       if (out) return out;
//     }
//   } catch (_e) {
//     // fall through
//   }

//   const intro = xrayCtx ? `I’ve received your X-ray context (report ID: ${xrayCtx.id}). ` : '';
//   return (
//     `${intro}AI chat is not configured on the server yet.\n\n` +
//     `To enable answers, set one of these environment variables and restart the server:\n` +
//     `• GROQ_API_KEY (recommended, free tier)\n` +
//     `• HF_TOKEN (HuggingFace Inference API)\n\n` +
//     `Your question: "${userMessage}"`
//   );
// }



// server/src/lib/aiChatProvider.js
// AI provider abstraction for the /chat feature.
//
// Supports free/optional LLM providers via env keys.
// Choose one:
//   - GROQ_API_KEY (recommended): https://console.groq.com/
//   - HF_TOKEN (optional): HuggingFace Inference API token
//
// If no key is configured, chat returns an instruction message.

function formatXrayContext(xray) {
  if (!xray) return null;
  const a = xray.analysis || {};
  const prob = typeof a.probability === "number" ? a.probability : null;
  return {
    id: String(xray._id || xray.id || ""),
    region: a.region ?? "N/A",
    fractureDetected: Boolean(a.fractureDetected),
    probabilityPct: prob == null ? null : Math.round(prob * 1000) / 10,
    fractureType: a.fractureType ?? null,
    severity: a.severity ?? null,
    recoveryTimeline: a.recoveryTimeline ?? null,
    recommendations: Array.isArray(a.recommendations) ? a.recommendations.slice(0, 10) : [],
    rehabExercises: Array.isArray(a.rehabExercises) ? a.rehabExercises.slice(0, 10) : [],
  };
}

async function getFetch() {
  if (typeof globalThis.fetch === "function") return globalThis.fetch;
  const mod = await import("node-fetch");
  return mod.default;
}

/**
 * Make output look consistent even if provider returns Markdown.
 * - Removes **bold**
 * - Removes leading Markdown headings (###, ##, #)
 * - Normalizes common section labels
 */
function normalizeAssistantText(text) {
  if (!text) return "";

  let t = String(text);

  // Remove markdown bold markers **like this**
  t = t.replace(/\*\*(.+?)\*\*/g, "$1");

  // Remove markdown headings, keep the text
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");

  // Normalize a few common variants to consistent labels
  const labelMap = [
    [/^\s*summary\s*[:\-]\s*/gim, "Summary: "],
    [/^\s*what\s+it\s+means\s*[:\-]\s*/gim, "What it means: "],
    [/^\s*interpretation\s*[:\-]\s*/gim, "What it means: "],
    [/^\s*next\s+steps\s*[:\-]\s*/gim, "Next steps: "],
    [/^\s*recommendations\s*[:\-]\s*/gim, "Next steps: "],
    [/^\s*red\s*flags\s*[:\-]\s*/gim, "Red flags: "],
    [/^\s*when\s+to\s+seek\s+help\s*[:\-]\s*/gim, "Red flags: "],
    [/^\s*rehab(\s+tips)?\s*[:\-]\s*/gim, "Rehab tips: "],
    [/^\s*exercises\s*[:\-]\s*/gim, "Rehab tips: "],
  ];
  for (const [re, repl] of labelMap) t = t.replace(re, repl);

  // Clean excessive blank lines
  t = t.replace(/\n{4,}/g, "\n\n\n").trim();

  return t;
}

async function callGroq({ system, user }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");

  const fetch = await getFetch();

  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = data?.error?.message || data?.message || `Groq request failed (${resp.status})`;
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content;
  return normalizeAssistantText((text || "").trim());
}

async function callHuggingFace({ system, user }) {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN not set");

  const fetch = await getFetch();

  const model = process.env.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

  // HF generation is prompt-based; keep it plain text (no markdown).
  const prompt =
    `SYSTEM:\n${system}\n\n` +
    `USER:\n${user}\n\n` +
    `ASSISTANT:\n`;

  const resp = await fetch(
    `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 650,
          temperature: 0.2,
          return_full_text: false,
        },
      }),
    }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = data?.error || data?.message || `HF request failed (${resp.status})`;
    throw new Error(msg);
  }

  const text = Array.isArray(data) ? data?.[0]?.generated_text : data?.generated_text;
  return normalizeAssistantText((text || "").trim());
}

export async function generateAssistantReply({ userMessage, context }) {
  const xrayCtx = formatXrayContext(context?.xray);

  // ✅ Key change for Option 2: ask for plain text headings, no Markdown, no ** **
  const system =
    `You are ShasthoAI, a medical assistant for bone-fracture triage and recovery guidance.\n` +
    `Important rules:\n` +
    `- You are not a doctor; provide decision-support, not a diagnosis.\n` +
    `- If symptoms are severe (extreme pain, open fracture, numbness/tingling, deformity, fever, uncontrolled bleeding), advise urgent in-person care.\n` +
    `- Use the provided X-ray analysis context if available; do not invent findings.\n` +
    `- Avoid prescription dosing or medication instructions.\n\n` +
    `OUTPUT FORMAT (plain text only):\n` +
    `Write the answer using these exact section labels (no Markdown, no **bold**, no # headings):\n` +
    `Summary:\n` +
    `What it means:\n` +
    `Next steps:\n` +
    `Red flags:\n` +
    `Rehab tips: (only if relevant)\n\n` +
    `Keep each section concise. Use numbered points only under "Next steps" if needed.`;

  const user = xrayCtx
    ? `X-RAY CONTEXT (JSON):\n${JSON.stringify(xrayCtx, null, 2)}\n\nUSER QUESTION: ${userMessage}`
    : `USER QUESTION: ${userMessage}`;

  // Provider preference order: Groq -> HuggingFace -> fallback.
  const providerErrors = [];

  try {
    if (process.env.GROQ_API_KEY) {
      const out = await callGroq({ system, user });
      if (out) return out;
    }
  } catch (e) {
    providerErrors.push(`Groq: ${e?.message || String(e)}`);
  }

  try {
    if (process.env.HF_TOKEN) {
      const out = await callHuggingFace({ system, user });
      if (out) return out;
    }
  } catch (e) {
    providerErrors.push(`HF: ${e?.message || String(e)}`);
  }

  const intro = xrayCtx ? `I’ve received your X-ray context (report ID: ${xrayCtx.id}). ` : "";

  if (providerErrors.length) {
    return (
      `${intro}AI chat is enabled, but the provider request failed.\n\n` +
      `What to check:\n` +
      `1) Make sure the API key is valid and not expired/revoked.\n` +
      `2) Make sure your server can access the internet.\n` +
      `3) Check quota/rate limits on the provider dashboard.\n\n` +
      `Provider error(s):\n` +
      providerErrors.map((x) => `- ${x}`).join("\n") +
      `\n\nYour question: "${userMessage}"`
    );
  }

  return (
    `${intro}AI chat is not configured on the server yet.\n\n` +
    `To enable answers, set one of these environment variables and restart the server:\n` +
    `• GROQ_API_KEY (recommended)\n` +
    `• HF_TOKEN (HuggingFace Inference API)\n\n` +
    `Your question: "${userMessage}"`
  );
}