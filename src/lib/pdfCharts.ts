import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/** Create a hidden canvas, render a Chart.js chart, return its data URL */
function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.style.position = 'absolute';
  c.style.left = '-9999px';
  document.body.appendChild(c);
  return c;
}

function cleanup(canvas: HTMLCanvasElement, chart: Chart) {
  chart.destroy();
  document.body.removeChild(canvas);
}

async function renderChart(
  canvas: HTMLCanvasElement,
  config: any
): Promise<string> {
  const chart = new Chart(canvas.getContext('2d')!, {
    ...config,
    options: {
      ...config.options,
      responsive: false,
      animation: false,
      devicePixelRatio: 2,
    },
  });
  // Chart.js with animation:false renders synchronously
  const url = canvas.toDataURL('image/png');
  cleanup(canvas, chart);
  return url;
}

// ── 1. Donut: Numeric vs Categorical ──
export async function renderDonutChart(numeric: number, categorical: number): Promise<string> {
  const c = createCanvas(400, 400);
  return renderChart(c, {
    type: 'doughnut',
    data: {
      labels: ['Numeric', 'Categorical'],
      datasets: [{
        data: [numeric, categorical],
        backgroundColor: ['#1565C0', '#06B6D4'],
        borderColor: ['#0D47A1', '#0097A7'],
        borderWidth: 2,
      }],
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { color: '#1E293B', font: { size: 14, weight: 'bold' } } },
        title: { display: false },
      },
    },
  });
}

// ── 2. Horizontal bar: Mean values ──
export async function renderMeanBarChart(
  labels: string[], values: number[]
): Promise<string> {
  const c = createCanvas(700, 350);
  return renderChart(c, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Mean Value',
        data: values,
        backgroundColor: '#1565C0',
        borderColor: '#0D47A1',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y' as const,
      scales: {
        x: { ticks: { color: '#475569', font: { size: 11 } }, grid: { color: '#E2E8F0' } },
        y: { ticks: { color: '#1E293B', font: { size: 12, weight: 'bold' } }, grid: { display: false } },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

// ── 3. Histograms ──
export async function renderHistogram(
  labels: string[], values: number[], color: string, title: string
): Promise<string> {
  const c = createCanvas(380, 300);
  return renderChart(c, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: title,
        data: values,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 3,
      }],
    },
    options: {
      scales: {
        x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: '#E2E8F0' }, beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
        title: { display: true, text: title, color: '#1E293B', font: { size: 13, weight: 'bold' } },
      },
    },
  });
}

// ── 4. Category bar charts ──
export async function renderCategoryBar(
  labels: string[], values: number[], colors: string[], title: string
): Promise<string> {
  const c = createCanvas(700, 320);
  return renderChart(c, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: title,
        data: values,
        backgroundColor: colors,
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      scales: {
        x: { ticks: { color: '#1E293B', font: { size: 12, weight: 'bold' } }, grid: { display: false } },
        y: { ticks: { color: '#475569', font: { size: 11 } }, grid: { color: '#E2E8F0' }, beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
        title: { display: true, text: title, color: '#1E293B', font: { size: 14, weight: 'bold' } },
      },
    },
  });
}

// ── 5. Pie chart ──
export async function renderPieChart(
  labels: string[], values: number[], colors: string[]
): Promise<string> {
  const c = createCanvas(400, 380);
  return renderChart(c, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
      }],
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { color: '#1E293B', font: { size: 12, weight: 'bold' }, padding: 15 } },
      },
    },
  });
}

// ── 6. Missing values horizontal bar ──
export async function renderMissingBar(
  labels: string[], values: number[]
): Promise<string> {
  const c = createCanvas(700, 350);
  return renderChart(c, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Missing %',
        data: values,
        backgroundColor: values.map(v => v > 5 ? '#EF4444' : v >= 1 ? '#F59E0B' : '#10B981'),
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y' as const,
      scales: {
        x: {
          ticks: { color: '#475569', font: { size: 11 } },
          grid: { color: '#E2E8F0' },
          max: Math.max(10, ...values) + 2,
          title: { display: true, text: 'Missing %', color: '#475569' },
        },
        y: {
          ticks: { color: '#1E293B', font: { size: 12, weight: 'bold' } },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        annotation: undefined,
      },
    },
  });
}

// ── 7. Correlation heatmap (pure canvas) ──
export async function renderCorrelationHeatmap(
  labels: string[],
  matrix: { x: string; y: string; value: number }[]
): Promise<string> {
  const n = labels.length;
  const cellSize = 70;
  const labelW = 100;
  const legendW = 60;
  const w = labelW + n * cellSize + legendW + 20;
  const h = 40 + n * cellSize + 30;
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d')!;

  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, w, h);

  const getColor = (v: number): string => {
    if (v >= 0) {
      const intensity = Math.min(Math.abs(v), 1);
      const r = Math.round(255 - intensity * (255 - 16));
      const g = Math.round(255 - intensity * (255 - 185));
      const b = Math.round(255 - intensity * (255 - 129));
      return `rgb(${r},${g},${b})`;
    } else {
      const intensity = Math.min(Math.abs(v), 1);
      const r = Math.round(255 - intensity * (255 - 239));
      const g = Math.round(255 - intensity * (255 - 68));
      const b = Math.round(255 - intensity * (255 - 68));
      return `rgb(${r},${g},${b})`;
    }
  };

  const startX = labelW;
  const startY = 40;

  // Column labels (top)
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 10px Helvetica';
  ctx.textAlign = 'center';
  labels.forEach((l, i) => {
    ctx.save();
    ctx.translate(startX + i * cellSize + cellSize / 2, startY - 5);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(l, 0, 0);
    ctx.restore();
  });

  // Cells + row labels
  labels.forEach((rowLabel, ri) => {
    // Row label
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 11px Helvetica';
    ctx.textAlign = 'right';
    ctx.fillText(rowLabel, startX - 8, startY + ri * cellSize + cellSize / 2 + 4);

    labels.forEach((colLabel, ci) => {
      const val = matrix.find(m => m.x === rowLabel && m.y === colLabel)?.value ?? 0;
      const x = startX + ci * cellSize;
      const y = startY + ri * cellSize;

      // Cell bg
      ctx.fillStyle = getColor(val);
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

      // Cell border
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

      // Cell text
      ctx.fillStyle = Math.abs(val) > 0.6 ? '#FFFFFF' : '#1E293B';
      ctx.font = 'bold 11px Helvetica';
      ctx.textAlign = 'center';
      ctx.fillText(val.toFixed(2), x + cellSize / 2, y + cellSize / 2 + 4);
    });
  });

  // Color legend bar
  const legX = startX + n * cellSize + 15;
  const legY = startY;
  const legH = n * cellSize;
  const legW = 18;
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const val = 1 - (i / (steps - 1)) * 2; // 1 to -1
    ctx.fillStyle = getColor(val);
    ctx.fillRect(legX, legY + (i / steps) * legH, legW, legH / steps + 1);
  }
  ctx.strokeStyle = '#94A3B8';
  ctx.strokeRect(legX, legY, legW, legH);
  ctx.fillStyle = '#1E293B';
  ctx.font = '10px Helvetica';
  ctx.textAlign = 'left';
  ctx.fillText('+1.0', legX + legW + 4, legY + 8);
  ctx.fillText('0.0', legX + legW + 4, legY + legH / 2 + 4);
  ctx.fillText('-1.0', legX + legW + 4, legY + legH);

  const url = c.toDataURL('image/png');
  document.body.removeChild(c);
  return url;
}

// ── 8. Box plot (pure canvas) ──
export async function renderBoxPlots(
  plots: { label: string; min: number; q1: number; median: number; q3: number; max: number; outliers: number[] }[]
): Promise<string> {
  const w = 700;
  const h = 320;
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, w, h);

  const padL = 80, padR = 30, padT = 30, padB = 50;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const count = plots.length;
  const boxWidth = Math.min(80, (plotW / count) * 0.6);
  const spacing = plotW / count;

  // Find global min/max for scale
  let globalMin = Infinity, globalMax = -Infinity;
  plots.forEach(p => {
    globalMin = Math.min(globalMin, p.min, ...p.outliers);
    globalMax = Math.max(globalMax, p.max, ...p.outliers);
  });
  const range = globalMax - globalMin || 1;
  const scale = (v: number) => padT + plotH - ((v - globalMin) / range) * plotH;

  // Y-axis grid
  const ticks = 6;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#475569';
  ctx.font = '10px Helvetica';
  ctx.textAlign = 'right';
  for (let i = 0; i <= ticks; i++) {
    const val = globalMin + (range * i) / ticks;
    const y = scale(val);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.fillText(val.toFixed(0), padL - 8, y + 3);
  }

  const colors = ['#1565C0', '#06B6D4', '#F59E0B'];

  plots.forEach((p, i) => {
    const cx = padL + spacing * i + spacing / 2;
    const color = colors[i % colors.length];

    // Whisker lines
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, scale(p.max));
    ctx.lineTo(cx, scale(p.q3));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, scale(p.q1));
    ctx.lineTo(cx, scale(p.min));
    ctx.stroke();

    // Whisker caps
    ctx.beginPath();
    ctx.moveTo(cx - boxWidth / 4, scale(p.max));
    ctx.lineTo(cx + boxWidth / 4, scale(p.max));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - boxWidth / 4, scale(p.min));
    ctx.lineTo(cx + boxWidth / 4, scale(p.min));
    ctx.stroke();

    // Box
    const bx = cx - boxWidth / 2;
    const by = scale(p.q3);
    const bh = scale(p.q1) - scale(p.q3);
    ctx.fillStyle = color + '55';
    ctx.fillRect(bx, by, boxWidth, bh);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, boxWidth, bh);

    // Median line
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, scale(p.median));
    ctx.lineTo(bx + boxWidth, scale(p.median));
    ctx.stroke();

    // Outliers
    p.outliers.forEach(o => {
      ctx.beginPath();
      ctx.arc(cx, scale(o), 5, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#B91C1C';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Label
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 12px Helvetica';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, cx, h - padB + 20);
  });

  const url = c.toDataURL('image/png');
  document.body.removeChild(c);
  return url;
}
