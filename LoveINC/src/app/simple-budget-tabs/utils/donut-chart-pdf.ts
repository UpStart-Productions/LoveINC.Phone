/** Renders a donut chart to a canvas and returns a PNG data URL for PDF embedding. */

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

/**
 * Draw a donut chart on canvas and return data URL.
 * Uses same proportions as app-pie-chart (cx=50, cy=50, ro=45, ri=28).
 */
export function renderDonutToDataUrl(slices: PieSlice[], size = 180): string | null {
  const filtered = slices.filter((s) => s.value > 0);
  if (filtered.length === 0) return null;

  const total = filtered.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const scale = size / 100;
  const cx = 50 * scale;
  const cy = 50 * scale;
  const ro = 45 * scale;
  const ri = 28 * scale;
  const gapAngle = 1;
  let startAngle = -90;

  for (const slice of filtered) {
    const angle = (slice.value / total) * 360;
    const endAngle = startAngle + angle;
    const sliceStart = startAngle + gapAngle / 2;
    const sliceEnd = endAngle - gapAngle / 2;
    const drawAngle = Math.max(0, sliceEnd - sliceStart);
    if (drawAngle <= 0) {
      startAngle = endAngle;
      continue;
    }

    const startRad = (sliceStart * Math.PI) / 180;
    const endRad = (sliceEnd * Math.PI) / 180;

    ctx.beginPath();
    ctx.moveTo(cx + ri * Math.cos(startRad), cy + ri * Math.sin(startRad));
    ctx.arc(cx, cy, ri, startRad, endRad, false);
    ctx.lineTo(cx + ro * Math.cos(endRad), cy + ro * Math.sin(endRad));
    ctx.arc(cx, cy, ro, endRad, startRad, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();

    startAngle = endAngle;
  }

  return canvas.toDataURL('image/png');
}
