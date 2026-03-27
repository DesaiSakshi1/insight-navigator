import { AnalysisResult } from '@/lib/analyzeData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wrench } from 'lucide-react';

interface Props {
  result: AnalysisResult;
  outlierSet: Set<number>;
  onFixMissing: () => void;
  onRemoveDuplicates: () => void;
  onFlagOutliers: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  numeric: 'hsl(217,91%,60%)',
  categorical: 'hsl(187,96%,42%)',
  date: 'hsl(38,92%,50%)',
  empty: 'hsl(0,84%,60%)',
};

export default function TabOverview({ result, outlierSet, onFixMissing, onRemoveDuplicates, onFlagOutliers }: Props) {
  const { data, colInfo, columns } = result;
  const preview = data.slice(0, 10);

  const typeCounts: Record<string, number> = {};
  colInfo.forEach(c => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

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
              {colInfo.map((c, i) => (
                <tr key={c.name} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                  <td className="py-2 px-3 font-medium text-foreground">{c.name}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${TYPE_COLORS[c.type]}22`, color: TYPE_COLORS[c.type] }}>
                      {c.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{c.unique}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{c.nonNull}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Donut + cleaning */}
        <div className="space-y-4">
          <div className="glass-card p-6 flex flex-col items-center">
            <h3 className="font-bold text-foreground mb-4">Data Type Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={TYPE_COLORS[entry.name] ?? '#888'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(217,33%,11%)', border: '1px solid hsl(217,33%,17%)', borderRadius: 8, color: '#f8fafc' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[d.name] ?? '#888' }} />
                  <span className="text-muted-foreground">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data cleaning actions */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-bold text-foreground text-sm">Data Cleaning</h3>
            </div>
            <div className="space-y-2">
              <button onClick={onFixMissing} className="w-full text-left px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                🔧 Fix Missing Values
              </button>
              <button onClick={onRemoveDuplicates} className="w-full text-left px-3 py-2 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors">
                🗑️ Remove Duplicates
              </button>
              <button onClick={onFlagOutliers} className="w-full text-left px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors">
                🚩 Flag Outliers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data preview — first 10 rows */}
      <div className="glass-card p-6 overflow-x-auto">
        <h3 className="font-bold text-foreground mb-1">Data Preview</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Showing first {Math.min(10, data.length)} of {data.length.toLocaleString()} rows
          {outlierSet.size > 0 && <span className="ml-2 text-destructive">· Outlier rows highlighted in red</span>}
        </p>
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-right py-2 px-2 text-xs">#</th>
              {columns.map(k => <th key={k} className="text-left py-2 px-3">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} className={`border-b border-border/30 ${outlierSet.has(i) ? 'bg-destructive/10' : i % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                <td className="py-2 px-2 text-xs text-muted-foreground/50 text-right">{i + 1}</td>
                {columns.map(k => {
                  const v = row[k];
                  const isNum = typeof v === 'number';
                  return (
                    <td key={k} className={`py-2 px-3 ${isNum ? 'text-right text-muted-foreground' : 'text-left text-muted-foreground'}`}>
                      {v === null || v === undefined || v === ''
                        ? <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground/50 text-xs">null</span>
                        : String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
