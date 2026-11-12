'use client';

/**
 * Captures a lightweight client-side JPEG snapshot of a rendered template DOM element
 * using SVG <foreignObject> -> <canvas>, sanitizing external <img> sources so
 * canvas export never throws tainted-CORS errors in Chrome or Safari.
 */
export async function capturePreviewSnapshotDataUrl(
  element: HTMLElement | null,
  cssVarOverrides?: Record<string, string>
): Promise<string | null> {
  if (!element || typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    const rect = element.getBoundingClientRect();
    const width = Math.max(600, Math.min(900, Math.round(rect.width || 794)));
    const height = Math.max(700, Math.min(1300, Math.round(rect.height || 1050)));

    const cloned = element.cloneNode(true) as HTMLElement;
    // Neutralize non-data images so canvas serialization never fails cross-origin checks
    const images = cloned.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (!src.startsWith('data:image/')) {
        img.setAttribute(
          'src',
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" rx="6" fill="%23e2e8f0"/></svg>'
        );
      }
    });

    const serializer = new XMLSerializer();
    const xhtml = serializer.serializeToString(cloned);

    const varStyle = [
      `--sc-font-sans: 'Inter', 'SF Pro Text', 'Segoe UI', system-ui, sans-serif`,
      `--sc-font-geometric: 'Plus Jakarta Sans', 'Avenir Next', 'Montserrat', sans-serif`,
      `--sc-font-editorial: 'Playfair Display', 'Georgia', serif`,
      `--sc-font-condensed: 'DIN Condensed', 'Arial Narrow', sans-serif`,
      `--sc-font-mono: 'JetBrains Mono', 'Menlo', monospace`,
      ...Object.entries(cssVarOverrides || {}).map(([k, v]) => `${k}: ${v}`),
    ].join('; ');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;background:#ffffff;color:#0f172a;font-family:system-ui,sans-serif;${varStyle}">
            ${xhtml}
          </div>
        </foreignObject>
      </svg>
    `.trim();

    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = (err) => reject(err);
        image.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

