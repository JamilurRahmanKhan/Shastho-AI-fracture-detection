// /**
//  * Backend library: runFractureModel
//  *
//  * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
//  * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
//  *
//  * Project-specific notes:
//  * - (none)
//  */

// import { spawn } from 'node:child_process';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import fs from 'node:fs/promises';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// function projectRoot() {
//   // server/src/lib/ml -> project root is 4 levels up
//   return path.resolve(__dirname, '../../../../');
// }

// function defaultWeightsPath() {
//   return path.join(
//     projectRoot(),
//     'model',
//     'Fracture_Detection_Improved_YOLOv8',
//     'baseline',
//     'yolov8n_baseline_clean',
//     'weights',
//     'best.pt'
//   );
// }

// function resolvePythonExecutable() {
//   // Prefer the provided model venv (user will restore venv39 later)
//   const venvPy =
//     process.platform === 'win32'
//       ? path.join(projectRoot(), 'model', 'Fracture_Detection_Improved_YOLOv8', 'venv39', 'Scripts', 'python.exe')
//       : path.join(projectRoot(), 'model', 'Fracture_Detection_Improved_YOLOv8', 'venv39', 'bin', 'python');
//   return venvPy;
// }

// async function exists(p) {
//   try {
//     await fs.access(p);
//     return true;
//   } catch {
//     return false;
//   }
// }

// async function findAnyWeightsFallback() {
//   // If the expected best.pt path is not present (some zips use a different path/name),
//   // try to locate any .pt file under the model directory.
//   const root = path.join(projectRoot(), 'model', 'Fracture_Detection_Improved_YOLOv8');
//   if (!(await exists(root))) return null;

//   const hits = [];
//   async function walk(dir, depth = 0) {
//     if (depth > 8) return; // safety
//     let entries = [];
//     try {
//       entries = await fs.readdir(dir, { withFileTypes: true });
//     } catch {
//       return;
//     }
//     for (const ent of entries) {
//       const p = path.join(dir, ent.name);
//       if (ent.isDirectory()) {
//         if (['venv39', '.git', '__pycache__'].includes(ent.name)) continue;
//         await walk(p, depth + 1);
//       } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.pt')) {
//         hits.push(p);
//       }
//     }
//   }
//   await walk(root);

//   if (!hits.length) return null;

//   // Prefer a path that looks like trained weights (best.pt) if present.
//   const best = hits.find((p) => p.toLowerCase().endsWith(`${path.sep}best.pt`));
//   return best || hits[0];
// }

// export async function runFractureModel({ imagePath, conf = 0.25, weightsPath }) {
//   let weights = weightsPath || process.env.FRACTURE_MODEL_WEIGHTS || defaultWeightsPath();
//   if (!(await exists(weights))) {
//     const fallback = await findAnyWeightsFallback();
//     if (fallback) weights = fallback;
//   }
//   const pyFromVenv = resolvePythonExecutable();
//   const python = (await exists(pyFromVenv)) ? pyFromVenv : (process.env.PYTHON_BIN || 'python3');

//   const script = path.join(__dirname, 'fracture_infer.py');

//   return new Promise((resolve, reject) => {
//     const args = ['-u', script, '--image', imagePath, '--weights', weights, '--conf', String(conf)];
//     const proc = spawn(python, args, {
//       cwd: projectRoot(),
//       env: { ...process.env },
//       stdio: ['ignore', 'pipe', 'pipe'],
//     });

//     let stdout = '';
//     let stderr = '';
//     proc.stdout.on('data', (d) => (stdout += d.toString()));
//     proc.stderr.on('data', (d) => (stderr += d.toString()));

//     proc.on('error', (err) => reject(err));
//     proc.on('close', (code) => {
//       const text = (stdout || '').trim();
//       let parsed = null;
//       try {
//         parsed = text ? JSON.parse(text) : null;
//       } catch {
//         // no-op
//       }

//       if (code !== 0) {
//         const msg = parsed?.error || `Python inference failed (exit ${code})`;
//         const details = parsed?.details || stderr || text;
//         const e = new Error(msg);
//         e.details = details;
//         return reject(e);
//       }

//       if (!parsed || typeof parsed !== 'object') {
//         const e = new Error('Invalid inference output');
//         e.details = stderr || text;
//         return reject(e);
//       }
//       return resolve(parsed);
//     });
//   });
// }



import fs from "fs";
import FormData from "form-data";

const MODEL_API_URL = process.env.MODEL_API_URL;

function normalizeImagePath(input) {
  // Case 1: string path
  if (typeof input === "string") return input;

  // Case 2: multer file object or similar: { path, filename, ... }
  if (input && typeof input === "object") {
    if (typeof input.path === "string") return input.path;
    if (typeof input.filepath === "string") return input.filepath; // sometimes used by other libs
  }

  throw new Error(
    `runFractureModel expected a file path string or an object with {path}. Got: ${typeof input}`
  );
}

export async function runFractureModel(imageInput) {
  if (!MODEL_API_URL) {
    throw new Error("MODEL_API_URL is not set in backend environment variables.");
  }

  const imagePath = normalizeImagePath(imageInput);

  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));

  const res = await fetch(`${MODEL_API_URL}/infer`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Model API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  const boxes = data.boxes || [];
  const fractureDetected = boxes.length > 0;
  const probability = fractureDetected ? Math.max(...boxes.map((b) => b.conf ?? 0)) : 0;

  return {
    ok: true,
    fractureDetected,
    probability,
    boxes,
  };
}