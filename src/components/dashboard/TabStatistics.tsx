import { useMemo, useState } from 'react';
import { DataRow, getNumericStats } from '@/lib/generateData';
import { Search } from 'lucide-react';

interface Props { data: DataRow[] }

export default function TabStatistics({ data }: Props) {
  const stats = useMemo(() => getNumericStats(data), [data]);
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = stats.filter(s => s.feature.toLowerCase().includes(filter.toLowerCase()));
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = (a as any)[sortCol], bv = (b as any)[sortCol];
        return sortAsc ? av - bv : bv - av;
      })
    : filtered;

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const skewnessColor = (v: number) => {
    const abs = Math.abs(v);
    if (abs < 0.5) return 'text-success';
    if (abs < 1) return 'text-warning';
    return 'text-destructive';
  };

  const cols = ['feature', 'count', 'mean', 'median', 'std', 'min', 'max', 'skewness'];

  return (
    <div className="glass-card p-6 animate-fade-in overflow-x-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-bold text-foreground">Descriptive Statistics</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground outline-none focus:border-primary/50" placeholder="Filter columns..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            {cols.map(c => (
              <th key={c} className="text-left py-2 px-3 cursor-pointer hover:text-foreground transition-colors select-none" onClick={() => c !== 'feature' && handleSort(c)}>
                {c.charAt(0).toUpperCase() + c.slice(1)} {sortCol === c ? (sortAsc ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.feature} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-secondary/20' : ''}`}>
              <td className="py-2 px-3 font-medium text-foreground">{s.feature}</td>
              <td className="py-2 px-3 text-muted-foreground">{s.count}</td>
              <td className="py-2 px-3 text-muted-foreground">{s.mean}</td>
              <td className="py-2 px-3 text-muted-foreground">{s.median}</td>
              <td className="py-2 px-3 text-muted-foreground">{s.std}</td>
              <td className="py-2 px-3 text-primary">{s.min}</td>
              <td className="py-2 px-3 text-accent">{s.max}</td>
              <td className={`py-2 px-3 font-semibold ${skewnessColor(s.skewness)}`}>{s.skewness}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
