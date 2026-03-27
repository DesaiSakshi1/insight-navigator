// Seeded random number generator for consistent data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((rand() * (max - min) + min).toFixed(decimals));
}

export interface DataRow {
  Order_ID: string;
  Customer_Age: number;
  Region: string;
  Category: string;
  Segment: string;
  Quantity: number;
  Unit_Price: number;
  Discount: number | null;
  Rating: number | null;
  Net_Revenue: number;
}

const regions = ['North', 'South', 'East', 'West'];
const categories = ['Electronics', 'Clothing', 'Furniture', 'Home', 'Sports'];
const segments = ['Consumer', 'Corporate', 'Home Office'];

export function generateDataset(): DataRow[] {
  const rows: DataRow[] = [];
  
  for (let i = 0; i < 500; i++) {
    const qty = randInt(1, 15);
    const price = randFloat(50, 2000);
    const disc = randInt(0, 4) * 5;
    const rating = randFloat(1, 5, 1);
    let revenue = parseFloat((qty * price * (1 - disc / 100)).toFixed(2));

    // Add outliers
    if (i === 77 || i === 203 || i === 310 || i === 421 || i === 488) {
      revenue = randFloat(50000, 99000);
    }

    const row: DataRow = {
      Order_ID: `ORD-${String(1000 + i).padStart(5, '0')}`,
      Customer_Age: randInt(18, 65),
      Region: pick(regions),
      Category: pick(categories),
      Segment: pick(segments),
      Quantity: qty,
      Unit_Price: price,
      Discount: disc,
      Rating: rating,
      Net_Revenue: revenue,
    };

    // Missing values: Rating ~4.8%, Discount ~3.2%
    if (i % 21 === 0) row.Rating = null;     // ~24 nulls = 4.8%
    if (i % 31 === 0) row.Discount = null;   // ~16 nulls = 3.2%

    rows.push(row);
  }

  // Add 10 duplicates
  for (let i = 0; i < 10; i++) {
    rows.push({ ...rows[i * 40] });
  }

  return rows;
}

export function getColumnInfo(data: DataRow[]) {
  const columns = Object.keys(data[0]) as (keyof DataRow)[];
  return columns.map(col => {
    const values = data.map(r => r[col]);
    const nonNull = values.filter(v => v !== null && v !== undefined);
    const isNumeric = typeof nonNull[0] === 'number';
    const unique = new Set(nonNull).size;
    return { name: col, type: isNumeric ? 'numeric' : 'object', unique, nonNull: nonNull.length, total: values.length };
  });
}

export function getNumericStats(data: DataRow[]) {
  const numericCols: (keyof DataRow)[] = ['Customer_Age', 'Quantity', 'Unit_Price', 'Discount', 'Rating', 'Net_Revenue'];
  return numericCols.map(col => {
    const vals = data.map(r => r[col]).filter(v => v !== null && v !== undefined) as number[];
    vals.sort((a, b) => a - b);
    const n = vals.length;
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 0 ? (vals[n / 2 - 1] + vals[n / 2]) / 2 : vals[Math.floor(n / 2)];
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
    const min = vals[0];
    const max = vals[n - 1];
    const skewness = vals.reduce((s, v) => s + ((v - mean) / std) ** 3, 0) / n;
    return {
      feature: col,
      count: n,
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      std: parseFloat(std.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      skewness: parseFloat(skewness.toFixed(3)),
    };
  });
}

export function getMissingValues(data: DataRow[]) {
  const columns = Object.keys(data[0]) as (keyof DataRow)[];
  return columns.map(col => {
    const missing = data.filter(r => r[col] === null || r[col] === undefined).length;
    const pct = parseFloat(((missing / data.length) * 100).toFixed(1));
    return { column: col, missing, pct };
  });
}

export function getCorrelationMatrix(data: DataRow[]) {
  const numericCols: (keyof DataRow)[] = ['Customer_Age', 'Quantity', 'Unit_Price', 'Discount', 'Rating', 'Net_Revenue'];
  
  const getVals = (col: keyof DataRow) => data.map(r => r[col] as number ?? 0);
  
  const corr = (a: number[], b: number[]) => {
    const n = a.length;
    const meanA = a.reduce((s, v) => s + v, 0) / n;
    const meanB = b.reduce((s, v) => s + v, 0) / n;
    let num = 0, denA = 0, denB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - meanA, db = b[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }
    return denA && denB ? parseFloat((num / Math.sqrt(denA * denB)).toFixed(3)) : 0;
  };

  const matrix: { x: string; y: string; value: number }[] = [];
  for (const c1 of numericCols) {
    for (const c2 of numericCols) {
      matrix.push({ x: c1, y: c2, value: corr(getVals(c1), getVals(c2)) });
    }
  }
  return { columns: numericCols as string[], matrix };
}

export function getCategoricalCounts(data: DataRow[]) {
  const catCols: (keyof DataRow)[] = ['Region', 'Category', 'Segment'];
  return catCols.map(col => {
    const counts: Record<string, number> = {};
    data.forEach(r => {
      const v = String(r[col]);
      counts[v] = (counts[v] || 0) + 1;
    });
    return {
      column: col,
      data: Object.entries(counts).map(([name, value]) => ({ name, value })),
    };
  });
}

export function getHistogramData(data: DataRow[]) {
  const numericCols: (keyof DataRow)[] = ['Customer_Age', 'Quantity', 'Unit_Price', 'Rating', 'Net_Revenue'];
  return numericCols.map(col => {
    const vals = data.map(r => r[col]).filter(v => v !== null) as number[];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const binCount = 15;
    const binWidth = (max - min) / binCount || 1;
    const bins: { range: string; count: number; mid: number }[] = [];
    for (let i = 0; i < binCount; i++) {
      const lo = min + i * binWidth;
      const hi = lo + binWidth;
      const count = vals.filter(v => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)).length;
      bins.push({ range: `${lo.toFixed(0)}-${hi.toFixed(0)}`, count, mid: (lo + hi) / 2 });
    }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { column: col, bins, mean: parseFloat(mean.toFixed(2)) };
  });
}
