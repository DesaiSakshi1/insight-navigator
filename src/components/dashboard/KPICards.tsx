import { Rows3, Columns3, AlertTriangle, Copy, TrendingDown } from 'lucide-react';
import { AnalysisResult } from '@/lib/analyzeData';

interface Props { result: AnalysisResult }

export default function KPICards({ result }: Props) {
  const totalMissing = result.missing.reduce((s, m) => s + m.missing, 0);
  const totalCells = result.data.length * result.columns.length;
  const missingPct = totalCells > 0 ? ((totalMissing / totalCells) * 100).toFixed(1) : '0.0';
  const totalOutliers = result.outliers.reduce((s, o) => s + o.count, 0);

  const kpis = [
    { icon: Rows3, label: 'Total Rows', value: result.data.length.toLocaleString(), border: 'border-l-primary', glow: 'glow-blue' },
    { icon: Columns3, label: 'Total Columns', value: result.columns.length.toString(), border: 'border-l-accent', glow: 'glow-cyan' },
    { icon: AlertTriangle, label: 'Missing Values', value: `${missingPct}%`, border: 'border-l-warning', glow: 'glow-amber' },
    { icon: Copy, label: 'Duplicates Found', value: result.duplicates.toString(), border: 'border-l-warning', glow: 'glow-amber' },
    { icon: TrendingDown, label: 'Outliers Detected', value: totalOutliers.toString(), border: 'border-l-destructive', glow: 'glow-red' },
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
