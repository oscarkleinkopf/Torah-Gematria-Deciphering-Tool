/**
 * export.js — PNG / report export utility for ELS matrix and Gematria visuals.
 * Contract (PROJECT.md): ExportMatrixAsPNG(canvasElement | containerId, filename)
 */

function ExportMatrixAsPNG(canvasElementOrContainerId, filename) {
  const filenameSafe = filename || 'ELS_matrix.png';

  // Direct canvas path
  if (canvasElementOrContainerId && canvasElementOrContainerId.tagName === 'CANVAS') {
    const link = document.createElement('a');
    link.download = filenameSafe;
    link.href = canvasElementOrContainerId.toDataURL('image/png');
    link.click();
    return true;
  }

  // Resolve DOM node from id or element
  let root = canvasElementOrContainerId;
  if (typeof canvasElementOrContainerId === 'string') {
    root = document.getElementById(canvasElementOrContainerId);
  }
  if (!root) return false;

  const table = root.querySelector
    ? (root.querySelector('.bible-code-matrix') || (root.classList && root.classList.contains('bible-code-matrix') ? root : null))
    : null;

  if (!table) {
    // If root itself is a canvas-like fallback already handled above
    return false;
  }

  const matchMeta = arguments.length > 2 ? arguments[2] : null;
  const wordLabel = (matchMeta && matchMeta.word) || 'matriz';
  const skipLabel = matchMeta && matchMeta.skip != null ? matchMeta.skip : '?';

  const W = table.offsetWidth + 40;
  const H = table.offsetHeight + 80;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');

  ctx.scale(2, 2);
  ctx.fillStyle = '#05040a';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 13px serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Código de la Biblia ELS — "${wordLabel}" | Salto: ${skipLabel} | Torah Gematria Decipher`,
    W / 2,
    20
  );

  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W - 40}" height="${H - 40}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: monospace; font-size: 11px; color: #ccc; background: #05040a; padding: 4px;">
          ${table.outerHTML}
        </div>
      </foreignObject>
    </svg>`;

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const downloadName =
    filenameSafe !== 'ELS_matrix.png'
      ? filenameSafe
      : `ELS_${String(wordLabel).replace(/[^א-ת\w]/g, '_')}_skip${skipLabel}.png`;

  img.onload = () => {
    ctx.drawImage(img, 20, 30);
    ctx.fillStyle = 'rgba(212,175,55,0.6)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generado por GematriaDecipher — Torah Gematria Deciphering Tool', W / 2, H - 8);
    URL.revokeObjectURL(url);
    const link = document.createElement('a');
    link.download = downloadName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    const link = document.createElement('a');
    link.download = 'ELS_matrix.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  img.src = url;
  return true;
}

/**
 * Download a plain-text correlation report.
 * @param {string} reportText
 * @param {string} [filename]
 */
function ExportCorrelationReport(reportText, filename) {
  if (!reportText) return false;
  const name = filename || `correlacion_${Date.now()}.txt`;
  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = name;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExportMatrixAsPNG, ExportCorrelationReport };
}
if (typeof window !== 'undefined') {
  window.ExportMatrixAsPNG = ExportMatrixAsPNG;
  window.ExportCorrelationReport = ExportCorrelationReport;
}
