import { useMemo } from 'react';
import { AnalysisResult } from '@/lib/analyzeData';

interface Props { result: AnalysisResult }

interface Insight {
  id: string;
  text: string;
  sub: string;
}

function generateInsights(result: AnalysisResult): Insight[] {
  const { data, colInfo, stats, missing, duplicates, outliers, correlation, categorical } = result;
  const insights: Insight[] = [];
  const rows = data.length;
  const cols = colInfo.length;

  // ── General ──────────────────────────────────────────────────────────────
  const sizeLabel = rows < 200 ? 'Small' : rows < 1000 ? 'Medium' : 'Large';
  insights.push({
    id: 'size',
    text: `📋 Dataset has ${rows.toLocaleString()} rows and ${cols} columns — ${sizeLabel} sized dataset`,
    sub: 'Understanding dataset size helps choose appropriate modeling strategies.',
  });

  if (duplicates > 0) {
    insights.push({
      id: 'dupes',
      text: `🔁 ${duplicates} duplicate rows found — remove before training any ML model`,
      sub: 'Duplicate rows can bias model training and inflate accuracy metrics.',
    });
  }

  // Top category (first categorical column)
  const topCat = categorical[0];
  if (topCat && topCat.data.length > 0) {
    const top = topCat.data[0];
    insights.push({
      id: 'top-cat',
      text: `🏆 Top performing category: ${top.name} (${top.value} entries) in column "${topCat.column}"`,
      sub: 'Dominant categories may require special handling to avoid class imbalance.',
    });
  }

  // Most common region (second categorical column if available)
  const regionCat = categorical[1] ?? categorical[0];
  if (regionCat && regionCat.data.length > 0 && regionCat !== topCat) {
    const top = regionCat.data[0];
    insights.push({
      id: 'top-region',
      text: `📍 Most common value in "${regionCat.column}": ${top.name} (${top.value} occurrences)`,
      sub: 'High concentration in one group may introduce geographic or categorical bias.',
    });
  }

  // ── Missing values ────────────────────────────────────────────────────────
  let anyMissing = false;
  missing.forEach(m => {
    if (m.missing === 0) return;
    anyMissing = true;
    if (m.pct > 5) {
      insights.push({
        id: `miss-high-${m.column}`,
        text: `🔴 ${m.column} has ${m.pct}% missing values — high risk, consider dropping or imputing`,
        sub: 'High missingness can severely degrade model quality if not addressed.',
      });
    } else {
      insights.push({
        id: `miss-low-${m.column}`,
        text: `🟡 ${m.column} has ${m.pct}% missing — recommend ${m.recommendation}`,
        sub: 'Low-to-moderate missingness is recoverable with robust imputation strategies.',
      });
    }
  });
  if (!anyMissing) {
    insights.push({
      id: 'miss-clean',
      text: '✅ No missing values detected — dataset is clean',
      sub: 'Clean datasets reduce preprocessing time and improve model reliability.',
    });
  }

  // ── Skewness ──────────────────────────────────────────────────────────────
  stats.forEach(s => {
    const sk = s.skewness;
    if (Math.abs(sk) > 2) {
      insights.push({
        id: `skew-high-${s.feature}`,
        text: `⚠️ ${s.feature} is highly right-skewed (skewness: ${sk}) — recommend log transformation before ML modeling`,
        sub: 'Highly skewed distributions violate normality assumptions in many ML algorithms.',
      });
    } else if (Math.abs(sk) >= 0.5) {
      insights.push({
        id: `skew-mod-${s.feature}`,
        text: `📊 ${s.feature} shows moderate skewness (${sk}) — consider normalization`,
        sub: 'Moderate skewness may still affect distance-based and linear models.',
      });
    } else {
      insights.push({
        id: `skew-ok-${s.feature}`,
        text: `✅ ${s.feature} is normally distributed (skewness: ${sk}) — ML ready`,
        sub: 'Near-zero skewness means this feature is well-suited for linear and Gaussian models.',
      });
    }
  });

  // ── Outliers ──────────────────────────────────────────────────────────────
  const significantOutliers = outliers.filter(o => o.count > 0);
  if (significantOutliers.length > 0) {
    significantOutliers.forEach(o => {
      insights.push({
        id: `outliers-${o.column}`,
        text: `⚠️ ${o.count} outliers found in ${o.column} — investigate before predictive modeling`,
        sub: 'Outliers can skew regression targets and distort feature importance scores.',
      });
    });
  }

  // ── Correlation ───────────────────────────────────────────────────────────
  const { columns: corrCols, matrix } = correlation;
  const strongPairs: { a: string; b: string; r: number }[] = [];
  matrix.forEach(cell => {
    if (cell.x !== cell.y && Math.abs(cell.value) > 0.7) {
      const already = strongPairs.some(
        p => (p.a === cell.x && p.b === cell.y) || (p.a === cell.y && p.b === cell.x)
      );
      if (!already) strongPairs.push({ a: cell.x, b: cell.y, r: cell.value });
    }
  });

  if (strongPairs.length > 0) {
    strongPairs.forEach(p => {
      insights.push({
        id: `corr-${p.a}-${p.b}`,
        text: `🔗 Strong correlation detected between ${p.a} and ${p.b} (r=${p.r}) — potential multicollinearity risk`,
        sub: 'Highly correlated features can destabilize linear models and reduce interpretability.',
      });
    });
  } else if (corrCols.length >= 2) {
    insights.push({
      id: 'corr-ok',
      text: '✅ No multicollinearity detected — features are independent',
      sub: 'Independent features improve interpretability and stability of linear models.',
    });
  }

  return insights;
}

export default function AIInsights({ result }: Props) {
  const insights = useMemo(() => generateInsights(result), [result]);

  return (
    <div
      className="mt-8 rounded-xl border border-cyan-400/40 bg-[hsl(217_33%_8%)] p-6"
      style={{
        boxShadow:
          '0 0 0 1px hsl(187 96% 42% / 0.25), 0 0 24px hsl(187 96% 42% / 0.18), 0 0 60px hsl(187 96% 42% / 0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🧠</span>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">AI-Powered Insights</h2>
          <p className="text-xs text-slate-400 mt-0.5">Rule-based analysis of your uploaded dataset</p>
        </div>
      </div>

      {/* Insight rows */}
      <div className="space-y-0">
        {insights.map((insight, i) => (
          <div
            key={insight.id}
            className="ai-insight-row flex items-start gap-4 py-3.5"
            style={{
              animationDelay: `${i * 0.1}s`,
              borderBottom: i < insights.length - 1 ? '1px solid hsl(217 33% 17% / 0.8)' : 'none',
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 leading-snug">{insight.text}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{insight.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer badge */}
      <div className="mt-5 pt-4 border-t border-[hsl(217_33%_17%)]">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'hsl(160 84% 39% / 0.15)',
            border: '1px solid hsl(160 84% 39% / 0.4)',
            color: 'hsl(160 84% 60%)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          ✓ Analysis Complete — {insights.length} insights generated
        </span>
      </div>
    </div>
  );
}
