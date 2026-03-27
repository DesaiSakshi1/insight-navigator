import { useMemo, useState } from 'react';
import { DataRow, getCategoricalCounts, getHistogramData } from '@/lib/generateData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, ReferenceLine } from 'recharts';

interface Props { data: DataRow[] }

const subTabs = ['Histograms', 'Bar Charts', 'Box Plots'] as const;

export default function TabCharts({ data }: Props) {
  const [sub, setSub] = useState<typeof subTabs[number]>('Histograms');
  const categorical = useMemo(() => getCategoricalCounts(data), [data]);
  const histograms = useMemo(() => getHistogramData(data), [data]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-2">
        {subTabs.map(t => (
          <button key={t} onClick={() => setSub(t)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${sub === t ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary/30 text-muted-foreground hover:text-foreground'}`}>{t}</button>
        ))}
      </div>

      {sub === 'Histograms' && (
        <div className="grid md:grid-cols-2 gap-6">
          {histograms.map(h => (
            <div key={h.column} className="glass-card p-5">
              <h4 className="font-semibold text-foreground mb-3">{h.column} Distribution</h4>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={h.bins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,17%)" />
                  <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(217,33%,11%)', border: '1px solid hsl(217,33%,17%)', borderRadius: 8, color: '#f8fafc' }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(217,91%,60%)" fill="hsl(217,91%,60%)" fillOpacity={0.3} />
                  <ReferenceLine x={h.bins.findIndex(b => b.mid >= h.mean)} stroke="hsl(187,96%,42%)" strokeDasharray="5 5" label={{ value: `Mean: ${h.mean}`, fill: '#06b6d4', fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {sub === 'Bar Charts' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorical.map(c => (
            <div key={c.column} className="glass-card p-5">
              <h4 className="font-semibold text-foreground mb-3">{c.column} Distribution</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={c.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,17%)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(217,33%,11%)', border: '1px solid hsl(217,33%,17%)', borderRadius: 8, color: '#f8fafc' }} />
                  <Bar dataKey="value" fill="hsl(187,96%,42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {sub === 'Box Plots' && <BoxPlots data={data} />}
    </div>
  );
}

function BoxPlots({ data }: Props) {
  const numericCols: (keyof DataRow)[] = ['Customer_Age', 'Quantity', 'Unit_Price', 'Rating', 'Net_Revenue'];
  const boxData = numericCols.map(col => {
    const vals = (data.map(r => r[col]).filter(v => v !== null) as number[]).sort((a, b) => a - b);
    const n = vals.length;
    const q1 = vals[Math.floor(n * 0.25)];
    const median = vals[Math.floor(n * 0.5)];
    const q3 = vals[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const min = Math.max(vals[0], q1 - 1.5 * iqr);
    const max = Math.min(vals[n - 1], q3 + 1.5 * iqr);
    return { name: col, min, q1, median, q3, max };
  });

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {boxData.map(b => (
        <div key={b.name} className="glass-card p-5">
          <h4 className="font-semibold text-foreground mb-4">{b.name} Box Plot</h4>
          <div className="flex items-center gap-4 h-16">
            <span className="text-xs text-muted-foreground w-16 text-right">{b.min.toFixed(0)}</span>
            <div className="flex-1 relative h-8">
              {/* whisker */}
              <div className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-muted-foreground/30 w-full" />
              {/* box */}
              <div
                className="absolute top-0 h-full bg-primary/30 border border-primary rounded"
                style={{
                  left: `${((b.q1 - b.min) / (b.max - b.min)) * 100}%`,
                  width: `${((b.q3 - b.q1) / (b.max - b.min)) * 100}%`,
                }}
              />
              {/* median line */}
              <div
                className="absolute top-0 h-full w-0.5 bg-accent"
                style={{ left: `${((b.median - b.min) / (b.max - b.min)) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-16">{b.max.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-16">
            <span>Q1: {b.q1.toFixed(1)}</span>
            <span>Med: {b.median.toFixed(1)}</span>
            <span>Q3: {b.q3.toFixed(1)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
