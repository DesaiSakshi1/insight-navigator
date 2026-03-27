import { useMemo } from 'react';
import { DataRow, getMissingValues } from '@/lib/generateData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Lightbulb } from 'lucide-react';

interface Props { data: DataRow[] }

const getColor = (pct: number) => {
  if (pct > 10) return '#ef4444';
  if (pct > 5) return '#f59e0b';
  if (pct > 1) return '#eab308';
  return '#10b981';
};

const recommendations: Record<string, string> = {
  Rating: 'Fill with Median (3.0)',
  Discount: 'Fill with Mode (0)',
};

export default function TabMissing({ data }: Props) {
  const missing = useMemo(() => getMissingValues(data), [data]);
  const withMissing = missing.filter(m => m.missing > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <h3 className="font-bold text-foreground mb-2">Missing Values Summary</h3>
        <p className="text-muted-foreground text-sm mb-6">
          <span className="text-foreground font-semibold">{withMissing.length}</span> columns have missing values out of <span className="text-foreground font-semibold">{missing.length}</span>
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={missing} layout="vertical" margin={{ left: 80 }}>
            <XAxis type="number" domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="column" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'hsl(217,33%,11%)', border: '1px solid hsl(217,33%,17%)', borderRadius: 8, color: '#f8fafc' }} formatter={(v: number) => `${v}%`} />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
              {missing.map((m, i) => <Cell key={i} fill={getColor(m.pct)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Recommendations */}
      {withMissing.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {withMissing.map(m => (
            <div key={m.column} className="glass-card p-5 border-l-4 border-l-warning">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{m.column} column</p>
                  <p className="text-sm text-muted-foreground">{m.pct}% missing ({m.missing} values)</p>
                  <p className="text-sm text-accent mt-1">Recommended fix: {recommendations[m.column] || 'Review manually'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
