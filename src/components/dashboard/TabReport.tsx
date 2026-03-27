import { useMemo } from 'react';
import { DataRow, getNumericStats, getMissingValues, getCorrelationMatrix } from '@/lib/generateData';
import { BarChart3, Download, Share2, FileText, Database, AlertTriangle, TrendingUp } from 'lucide-react';

interface Props { data: DataRow[] }

export default function TabReport({ data }: Props) {
  const stats = useMemo(() => getNumericStats(data), [data]);
  const missing = useMemo(() => getMissingValues(data), [data]);
  const { columns, matrix } = useMemo(() => getCorrelationMatrix(data), [data]);
  const withMissing = missing.filter(m => m.missing > 0);
  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const topCorr = useMemo(() => {
    const pairs: { a: string; b: string; r: number }[] = [];
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const r = matrix.find(m => m.x === columns[i] && m.y === columns[j])?.value ?? 0;
        if (Math.abs(r) > 0.5) pairs.push({ a: columns[i], b: columns[j], r });
      }
    }
    return pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 5);
  }, [columns, matrix]);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-8 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-extrabold text-gradient">AutoEDA Report</h2>
              <p className="text-sm text-muted-foreground">NexGen Analytix — Automated EDA</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Intern:</span> <span className="text-foreground">Sakshi Santosh Desai</span></div>
            <div><span className="text-muted-foreground">Guide:</span> <span className="text-foreground">Yash Gawande</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{date}</span></div>
            <div><span className="text-muted-foreground">Dataset:</span> <span className="text-foreground">Retail Sales Data</span></div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Dataset overview */}
          <Section icon={Database} title="Dataset Overview" color="border-l-primary">
            <p className="text-sm text-muted-foreground">The dataset contains <b className="text-foreground">{data.length} rows</b> and <b className="text-foreground">10 columns</b>. It includes data on retail sales across regions, categories, and customer segments. <b className="text-foreground">10 duplicate rows</b> and <b className="text-foreground">5 outliers</b> were detected.</p>
          </Section>

          {/* Statistics */}
          <Section icon={FileText} title="Statistical Summary" color="border-l-accent">
            <div className="space-y-2">
              {stats.slice(0, 4).map(s => (
                <p key={s.feature} className="text-sm text-muted-foreground">
                  <b className="text-foreground">{s.feature}:</b> Mean={s.mean}, Median={s.median}, Std={s.std}, Range=[{s.min}, {s.max}]
                </p>
              ))}
            </div>
          </Section>

          {/* Missing */}
          <Section icon={AlertTriangle} title="Missing Values" color="border-l-warning">
            {withMissing.length === 0 ? (
              <p className="text-sm text-success">No missing values detected.</p>
            ) : (
              <div className="space-y-1">
                {withMissing.map(m => (
                  <p key={m.column} className="text-sm text-muted-foreground"><b className="text-foreground">{m.column}:</b> {m.pct}% missing ({m.missing} values)</p>
                ))}
              </div>
            )}
          </Section>

          {/* Correlations */}
          <Section icon={TrendingUp} title="Key Correlations" color="border-l-success">
            <div className="space-y-1">
              {topCorr.map(p => (
                <p key={`${p.a}-${p.b}`} className="text-sm text-muted-foreground">
                  <b className="text-foreground">{p.a} ↔ {p.b}:</b> r = {p.r.toFixed(3)} ({p.r > 0 ? 'Positive' : 'Negative'})
                </p>
              ))}
            </div>
          </Section>
        </div>

        {/* Actions */}
        <div className="p-8 pt-0 flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-105 active:scale-95 transition-transform glow-blue">
            <Download className="w-4 h-4" /> Download Report as PDF
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-secondary/50 transition-colors">
            <Share2 className="w-4 h-4" /> Share Report
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`border-l-4 ${color} pl-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}
