import { useMemo } from 'react';
import { AnalysisResult } from '@/lib/analyzeData';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Props { result: AnalysisResult }

const getColor = (v: number) => {
  if (v >= 0.7) return 'bg-success/60 text-success-foreground';
  if (v >= 0.3) return 'bg-success/20 text-success';
  if (v <= -0.7) return 'bg-destructive/60 text-destructive-foreground';
  if (v <= -0.3) return 'bg-destructive/20 text-destructive';
  return 'bg-secondary/30 text-muted-foreground';
};

export default function TabCorrelation({ result }: Props) {
  const { columns, matrix } = result.correlation;

  const topPairs = useMemo(() => {
    const pairs: { a: string; b: string; r: number }[] = [];
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const r = matrix.find(m => m.x === columns[i] && m.y === columns[j])?.value ?? 0;
        if (Math.abs(r) > 0.3) pairs.push({ a: columns[i], b: columns[j], r });
      }
    }
    return pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [columns, matrix]);

  const strengthLabel = (r: number) => {
    const abs = Math.abs(r);
    if (abs > 0.8) return 'Very Strong';
    if (abs > 0.6) return 'Strong';
    if (abs > 0.4) return 'Moderate';
    return 'Weak';
  };

  if (columns.length === 0) return (
    <div className="glass-card p-6 animate-fade-in">
      <p className="text-muted-foreground">No numeric columns available for correlation analysis.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6 overflow-x-auto">
        <h3 className="font-bold text-foreground mb-4">Correlation Matrix</h3>
        <table className="text-sm">
          <thead>
            <tr>
              <th className="p-2" />
              {columns.map(c => <th key={c} className="p-2 text-xs text-muted-foreground font-medium text-center whitespace-nowrap">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {columns.map(row => (
              <tr key={row}>
                <td className="p-2 text-xs text-muted-foreground font-medium whitespace-nowrap">{row}</td>
                {columns.map(col => {
                  const cell = matrix.find(m => m.x === row && m.y === col);
                  const v = cell?.value ?? 0;
                  return (
                    <td key={col} className="p-1">
                      <div className={`rounded-md p-2 text-center text-xs font-semibold min-w-[50px] ${getColor(v)} transition-colors`} title={`${row} vs ${col}: r = ${v}`}>
                        {v.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {topPairs.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-foreground mb-4">Key Findings</h3>
          <div className="space-y-3">
            {topPairs.map(p => (
              <div key={`${p.a}-${p.b}`} className="flex items-center gap-3 text-sm">
                {p.r > 0 ? <ArrowUpRight className="w-5 h-5 text-success flex-shrink-0" /> : <ArrowDownRight className="w-5 h-5 text-destructive flex-shrink-0" />}
                <span className="text-foreground font-medium">{p.a} ↔ {p.b}:</span>
                <span className="text-muted-foreground">r = {p.r.toFixed(3)}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${p.r > 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                  {strengthLabel(p.r)} {p.r > 0 ? 'Positive' : 'Negative'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
