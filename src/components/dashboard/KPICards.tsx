import { useMemo } from 'react';
import { Rows3, Columns3, AlertTriangle, Copy, TrendingDown } from 'lucide-react';
import { DataRow, getMissingValues } from '@/lib/generateData';

interface Props { data: DataRow[] }

export default function KPICards({ data }: Props) {
  const missing = useMemo(() => getMissingValues(data), [data]);
  const totalMissing = missing.reduce((s, m) => s + m.missing, 0);
  const missingPct = ((totalMissing / (data.length * Object.keys(data[0]).length)) * 100).toFixed(1);
  const dupes = 10;
  const outliers = 5;

  const kpis = [
    { icon: Rows3, label: 'Total Rows', value: data.length.toString(), border: 'border-l-primary', glow: 'glow-blue' },
    { icon: Columns3, label: 'Total Columns', value: '10', border: 'border-l-accent', glow: 'glow-cyan' },
    { icon: AlertTriangle, label: 'Missing Values', value: `${missingPct}%`, border: 'border-l-warning', glow: 'glow-amber' },
    { icon: Copy, label: 'Duplicates Found', value: dupes.toString(), border: 'border-l-warning', glow: 'glow-amber' },
    { icon: TrendingDown, label: 'Outliers Detected', value: outliers.toString(), border: 'border-l-destructive', glow: 'glow-red' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {kpis.map((k, i) => (
        <div key={k.label} className={`glass-card p-5 border-l-4 ${k.border} hover-lift`} style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="flex items-center justify-between mb-2">
            <k.icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-extrabold text-foreground">{k.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
        </div>
      ))}
    </div>
  );
}
