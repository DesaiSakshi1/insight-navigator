// ─────────────────────────────────────────────────────────────────────────────
// analyzeData.ts  –  Real data analysis engine (no hardcoded data)
// ─────────────────────────────────────────────────────────────────────────────

export type RawRow = Record<string, unknown>;

// ── Column types ──────────────────────────────────────────────────────────────
export type ColType = 'numeric' | 'categorical' | 'date' | 'empty';

function detectType(values: unknown[]): ColType {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'empty';
  const dateRe = /^\d{4}-\d{2}-\d{2}|^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/;
  const dateCount = nonNull.filter(v => typeof v === 'string' && dateRe.test(String(v))).length;
  if (dateCount / nonNull.length > 0.7) return 'date';
  const numCount = nonNull.filter(v => typeof v === 'number' || (!isNaN(Number(v)) && v !== '')).length;
  if (numCount / nonNull.length > 0.7) return 'numeric';
  return 'categorical';
}

// ── Column info ───────────────────────────────────────────────────────────────
export interface ColInfo {
  name: string;
  type: ColType;
  unique: number;
  nonNull: number;
  total: number;
}

export function getColumnInfo(data: RawRow[]): ColInfo[] {
  const cols = Object.keys(data[0]);
  return cols.slice(0, 50).map(col => {
    const values = data.map(r => r[col]);
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const type = detectType(values);
    return { name: col, type, unique: new Set(nonNull.map(String)).size, nonNull: nonNull.length, total: values.length };
  });
}

// ── Numeric stats ─────────────────────────────────────────────────────────────
export interface NumericStat {
  feature: string;
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  skewness: number;
}

function numericValues(data: RawRow[], col: string): number[] {
  return data
    .map(r => r[col])
    .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
    .map(Number);
}

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  return n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
}

export function getNumericStats(data: RawRow[], colInfo: ColInfo[]): NumericStat[] {
  const numCols = colInfo.filter(c => c.type === 'numeric').map(c => c.name);
  return numCols.map(col => {
    const vals = numericValues(data, col).sort((a, b) => a - b);
    const n = vals.length;
    if (n === 0) return { feature: col, count: 0, mean: 0, median: 0, std: 0, min: 0, max: 0, skewness: 0 };
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const med = median(vals);
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    const skewness = std !== 0 ? parseFloat(((3 * (mean - med)) / std).toFixed(3)) : 0;
    return {
      feature: col,
      count: n,
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(med.toFixed(2)),
      std: parseFloat(std.toFixed(2)),
      min: parseFloat(vals[0].toFixed(2)),
      max: parseFloat(vals[n - 1].toFixed(2)),
      skewness,
    };
  });
}

// ── Missing values ────────────────────────────────────────────────────────────
export interface MissingInfo {
  column: string;
  missing: number;
  pct: number;
  recommendation: string;
}

export function getMissingValues(data: RawRow[], colInfo: ColInfo[]): MissingInfo[] {
  return colInfo.map(c => {
    const missing = data.filter(r => {
      const v = r[c.name];
      return v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v));
    }).length;
    const pct = parseFloat(((missing / data.length) * 100).toFixed(1));
    let recommendation = 'No action needed';
    if (missing > 0) {
      if (pct > 20) recommendation = 'Consider dropping column';
      else if (c.type === 'numeric') recommendation = 'Fill with Median';
      else recommendation = 'Fill with Mode';
    }
    return { column: c.name, missing, pct, recommendation };
  });
}

// ── Duplicate detection ───────────────────────────────────────────────────────
export function getDuplicateCount(data: RawRow[]): number {
  const seen = new Set<string>();
  let count = 0;
  for (const row of data) {
    const key = JSON.stringify(row);
    if (seen.has(key)) count++;
    else seen.add(key);
  }
  return count;
}

// ── Outliers (IQR method) ─────────────────────────────────────────────────────
export interface OutlierInfo {
  column: string;
  count: number;
  indices: number[];
}

export function getOutliers(data: RawRow[], colInfo: ColInfo[]): OutlierInfo[] {
  const numCols = colInfo.filter(c => c.type === 'numeric').map(c => c.name);
  return numCols.map(col => {
    const sorted = numericValues(data, col).sort((a, b) => a - b);
    const n = sorted.length;
    if (n < 4) return { column: col, count: 0, indices: [] };
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const lo = q1 - 1.5 * iqr;
    const hi = q3 + 1.5 * iqr;
    const indices: number[] = [];
    data.forEach((row, i) => {
      const v = Number(row[col]);
      if (!isNaN(v) && (v < lo || v > hi)) indices.push(i);
    });
    return { column: col, count: indices.length, indices };
  });
}

// ── Correlation matrix ────────────────────────────────────────────────────────
export interface CorrCell { x: string; y: string; value: number }

export function getCorrelationMatrix(data: RawRow[], colInfo: ColInfo[]): { columns: string[]; matrix: CorrCell[] } {
  const numCols = colInfo.filter(c => c.type === 'numeric').map(c => c.name);

  const corr = (a: number[], b: number[]) => {
    const n = Math.min(a.length, b.length);
    if (n < 2) return 0;
    const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
    const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
    let num = 0, denA = 0, denB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - meanA, db = b[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }
    return denA && denB ? parseFloat((num / Math.sqrt(denA * denB)).toFixed(3)) : 0;
  };

  const valMap: Record<string, number[]> = {};
  for (const col of numCols) valMap[col] = numericValues(data, col);

  const matrix: CorrCell[] = [];
  for (const c1 of numCols) {
    for (const c2 of numCols) {
      matrix.push({ x: c1, y: c2, value: corr(valMap[c1], valMap[c2]) });
    }
  }
  return { columns: numCols, matrix };
}

// ── Categorical counts ────────────────────────────────────────────────────────
export interface CatCount {
  column: string;
  data: { name: string; value: number }[];
  topValue: string;
  unique: number;
}

export function getCategoricalCounts(data: RawRow[], colInfo: ColInfo[]): CatCount[] {
  const catCols = colInfo.filter(c => c.type === 'categorical' || c.type === 'date').map(c => c.name);
  return catCols.map(col => {
    const counts: Record<string, number> = {};
    data.forEach(r => {
      if (r[col] !== null && r[col] !== undefined && r[col] !== '') {
        const v = String(r[col]);
        counts[v] = (counts[v] || 0) + 1;
      }
    });
    const entries = Object.entries(counts).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return {
      column: col,
      data: entries,
      topValue: entries[0]?.name ?? '—',
      unique: entries.length,
    };
  });
}

// ── Histogram bins ────────────────────────────────────────────────────────────
export interface HistBin { range: string; count: number; mid: number }
export interface HistData { column: string; bins: HistBin[]; mean: number }

export function getHistogramData(data: RawRow[], colInfo: ColInfo[]): HistData[] {
  const numCols = colInfo.filter(c => c.type === 'numeric').map(c => c.name);
  return numCols.map(col => {
    const vals = numericValues(data, col);
    if (vals.length === 0) return { column: col, bins: [], mean: 0 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const unique = new Set(vals).size;
    const binCount = Math.min(20, unique, 15);
    const binWidth = binCount > 1 ? (max - min) / binCount : 1;
    const bins: HistBin[] = [];
    for (let i = 0; i < binCount; i++) {
      const lo = min + i * binWidth;
      const hi = lo + binWidth;
      const count = vals.filter(v => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)).length;
      bins.push({ range: `${lo.toFixed(1)}-${hi.toFixed(1)}`, count, mid: (lo + hi) / 2 });
    }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { column: col, bins, mean: parseFloat(mean.toFixed(2)) };
  });
}

// ── Memory estimate ───────────────────────────────────────────────────────────
export function estimateMemory(data: RawRow[]): string {
  const bytes = new Blob([JSON.stringify(data)]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Full analysis result ──────────────────────────────────────────────────────
export interface AnalysisResult {
  data: RawRow[];
  columns: string[];
  colInfo: ColInfo[];
  stats: NumericStat[];
  missing: MissingInfo[];
  duplicates: number;
  outliers: OutlierInfo[];
  correlation: { columns: string[]; matrix: CorrCell[] };
  categorical: CatCount[];
  histograms: HistData[];
  memorySize: string;
  warnings: string[];
}

export function runAnalysis(data: RawRow[]): AnalysisResult {
  const warnings: string[] = [];
  const allCols = Object.keys(data[0]);
  let displayCols = allCols;
  if (allCols.length > 50) {
    warnings.push('Large dataset — showing first 50 columns');
    displayCols = allCols.slice(0, 50);
    data = data.map(r => {
      const row: RawRow = {};
      displayCols.forEach(k => { row[k] = r[k]; });
      return row;
    });
  }
  if (data.length > 100_000) warnings.push('Large file — analysis may take a few seconds');
  if (displayCols.length === 1) warnings.push('Only 1 column detected — limited analysis available');

  const colInfo = getColumnInfo(data);
  const stats = getNumericStats(data, colInfo);
  const missing = getMissingValues(data, colInfo);
  const duplicates = getDuplicateCount(data);
  const outliers = getOutliers(data, colInfo);
  const correlation = getCorrelationMatrix(data, colInfo);
  const categorical = getCategoricalCounts(data, colInfo);
  const histograms = getHistogramData(data, colInfo);
  const memorySize = estimateMemory(data);

  return { data, columns: displayCols, colInfo, stats, missing, duplicates, outliers, correlation, categorical, histograms, memorySize, warnings };
}

// ── Data cleaning helpers ─────────────────────────────────────────────────────
function mode(vals: string[]): string {
  const counts: Record<string, number> = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

export function fixMissingValues(data: RawRow[], colInfo: ColInfo[]): RawRow[] {
  const filled = data.map(r => ({ ...r }));
  for (const col of colInfo) {
    const isMissing = (v: unknown) => v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v));
    if (col.type === 'numeric') {
      const vals = filled.map(r => r[col.name]).filter(v => !isMissing(v)).map(Number).sort((a, b) => a - b);
      const med = median(vals);
      filled.forEach(r => { if (isMissing(r[col.name])) r[col.name] = med; });
    } else if (col.type === 'categorical') {
      const vals = filled.map(r => r[col.name]).filter(v => !isMissing(v)).map(String);
      const m = mode(vals);
      filled.forEach(r => { if (isMissing(r[col.name])) r[col.name] = m; });
    }
  }
  return filled;
}

export function removeDuplicates(data: RawRow[]): RawRow[] {
  const seen = new Set<string>();
  return data.filter(row => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
