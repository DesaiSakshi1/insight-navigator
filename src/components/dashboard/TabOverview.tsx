import { useMemo } from 'react';
import { DataRow, getColumnInfo } from '@/lib/generateData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props { data: DataRow[] }

export default function TabOverview({ data }: Props) {
  const columns = useMemo(() => getColumnInfo(data), [data]);
  const first5 = data.slice(0, 5);
  const numericCount = columns.filter(c => c.type === 'numeric').length;
  const objectCount = columns.filter(c => c.type === 'object').length;
  const pieData = [
    { name: 'Numeric', value: numericCount },
    { name: 'Categorical', value: objectCount },
  ];
  const COLORS = ['hsl(217,91%,60%)', 'hsl(187,96%,42%)'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Column info table */}
        <div className="lg:col-span-2 glass-card p-6 overflow-x-auto">
          <h3 className="font-bold text-foreground mb-4">Column Information</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3">Column</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-right py-2 px-3">Unique</th>
                <th className="text-right py-2 px-3">Non-Null</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((c, i) => (
                <tr key={c.name} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                  <td className="py-2 px-3 font-medium text-foreground">{c.name}</td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.type === 'numeric' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>{c.type}</span></td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{c.unique}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{c.nonNull}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Donut chart */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <h3 className="font-bold text-foreground mb-4">Data Type Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(217,33%,11%)', border: '1px solid hsl(217,33%,17%)', borderRadius: 8, color: '#f8fafc' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* First 5 rows */}
      <div className="glass-card p-6 overflow-x-auto">
        <h3 className="font-bold text-foreground mb-4">Data Preview (First 5 Rows)</h3>
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {Object.keys(first5[0]).map(k => <th key={k} className="text-left py-2 px-3">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {first5.map((row, i) => (
              <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                {Object.values(row).map((v, j) => <td key={j} className="py-2 px-3 text-muted-foreground">{v === null ? <span className="text-destructive">null</span> : String(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
