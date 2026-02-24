/**
 * Backend library: simplePdf
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

/**
 * Very small, dependency-free PDF generator.
 *
 * Generates a single-page PDF containing monospaced-ish text using Helvetica.
 * This is sufficient for "export a report" use cases without adding new deps.
 */

function pdfEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ');
}

export function makeSimplePdf({ title, lines }) {
  const pageWidth = 612; // 8.5in * 72
  const pageHeight = 792; // 11in * 72

  const safeTitle = pdfEscape(title || 'Report');
  const safeLines = (lines || []).map(pdfEscape);

  // Build a simple text stream.
  // Start near top-left with margins.
  let stream = '';
  stream += 'BT\n';
  stream += '/F1 18 Tf\n';
  stream += '50 760 Td\n';
  stream += `(${safeTitle}) Tj\n`;
  stream += '/F1 12 Tf\n';
  stream += '0 -26 Td\n';

  let shown = 0;
  for (const line of safeLines) {
    if (!line) {
      stream += '0 -14 Td\n';
      continue;
    }
    // Soft truncate lines to avoid overflow.
    const truncated = line.length > 110 ? line.slice(0, 107) + '...' : line;
    stream += `(${truncated}) Tj\n`;
    stream += '0 -14 Td\n';
    shown += 1;
    // Keep within page height.
    if (shown > 45) break;
  }

  stream += 'ET\n';

  const streamBytes = Buffer.from(stream, 'utf8');

  const objects = [];
  objects.append = (s) => objects.push(Buffer.from(s, 'utf8'));

  // PDF header
  const header = Buffer.from('%PDF-1.4\n%âãÏÓ\n', 'binary');

  // Object 1: Catalog
  objects.append('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  // Object 2: Pages
  objects.append('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  // Object 3: Page
  objects.append(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n'
  );
  // Object 4: Font
  objects.append('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  // Object 5: Content stream
  objects.push(
    Buffer.concat([
      Buffer.from(`5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`, 'utf8'),
      streamBytes,
      Buffer.from('\nendstream\nendobj\n', 'utf8'),
    ])
  );

  // Compute xref offsets
  let offset = header.length;
  const offsets = [0]; // object 0
  for (const obj of objects) {
    offsets.push(offset);
    offset += obj.length;
  }

  const xrefStart = offset;
  let xref = '';
  xref += 'xref\n';
  xref += `0 ${offsets.length}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer =
    'trailer\n' +
    `<< /Size ${offsets.length} /Root 1 0 R >>\n` +
    'startxref\n' +
    `${xrefStart}\n` +
    '%%EOF\n';

  return Buffer.concat([header, ...objects, Buffer.from(xref, 'utf8'), Buffer.from(trailer, 'utf8')]);
}
