import { useMemo, useState } from 'react';
import { AnalysisResult } from '@/lib/analyzeData';
import { BarChart3, Download, Share2, FileText, Database, AlertTriangle, TrendingUp, Copy, Check, Mail, MessageCircle, Link, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  renderDonutChart, renderMeanBarChart, renderHistogram,
  renderCategoryBar, renderMissingBar,
  renderCorrelationHeatmap,
} from '@/lib/pdfCharts';

interface FileInfo { name: string; size: string; rows: number; duration: string }
interface Props { result: AnalysisResult; fileInfo: FileInfo | null }

export default function TabReport({ result, fileInfo }: Props) {
  const { data, colInfo, stats, missing, correlation, categorical } = result;
  const { columns: corrCols, matrix } = correlation;
  const withMissing = missing.filter(m => m.missing > 0);
  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const numericCount = colInfo.filter(c => c.type === 'numeric').length;
  const categoricalCount = colInfo.filter(c => c.type === 'categorical' || c.type === 'date').length;
  const totalOutliers = result.outliers.reduce((s, o) => s + o.count, 0);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const topCorr = useMemo(() => {
    const pairs: { a: string; b: string; r: number }[] = [];
    for (let i = 0; i < corrCols.length; i++) {
      for (let j = i + 1; j < corrCols.length; j++) {
        const r = matrix.find(m => m.x === corrCols[i] && m.y === corrCols[j])?.value ?? 0;
        if (Math.abs(r) > 0.5) pairs.push({ a: corrCols[i], b: corrCols[j], r });
      }
    }
    return pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 5);
  }, [corrCols, matrix]);

  const strengthLabel = (r: number) => {
    const abs = Math.abs(r);
    if (abs > 0.9) return 'Very Strong';
    if (abs > 0.7) return 'Strong';
    if (abs > 0.5) return 'Moderate';
    return 'Weak';
  };

  // ── PDF Generation ─────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      await generatePDF();
      toast({ title: 'PDF Downloaded!', description: 'Your comprehensive AutoEDA report has been saved.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to generate PDF.' });
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, M = 15, CW = W - M * 2;
    let pageNum = 1;
    const now = new Date().toLocaleString();
    let figNum = 0;
    const BLUE = [21, 101, 192] as const;
    const NAVY = [11, 22, 40] as const;
    const WHITE_ALT = [239, 246, 255] as const;
    const LIGHT = [248, 250, 252] as const;

    const footer = () => {
      pdf.setFontSize(9); pdf.setTextColor(150);
      pdf.text('AutoEDA | Automated EDA Report | Confidential', M, H - 8);
      pdf.text(`Page ${pageNum}`, W - M, H - 8, { align: 'right' });
      pageNum++;
    };
    const sectionHead = (text: string, y: number) => {
      pdf.setFillColor(...BLUE);
      pdf.rect(M, y, CW, 9, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text(text, M + 3, y + 6.5);
      return y + 13;
    };
    const addChartImage = (imgData: string, x: number, y: number, w: number, h: number, title: string): number => {
      figNum++;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(30, 41, 59);
      pdf.text(title, x + w / 2, y, { align: 'center' }); y += 4;
      pdf.setFillColor(248, 250, 252); pdf.setDrawColor(203, 213, 225); pdf.setLineWidth(0.3);
      pdf.rect(x, y, w, h, 'FD');
      pdf.addImage(imgData, 'PNG', x + 2, y + 2, w - 4, h - 4); y += h + 2;
      pdf.setFont('helvetica', 'italic'); pdf.setFontSize(8); pdf.setTextColor(148, 163, 184);
      pdf.text(`Figure ${figNum}: ${title}`, x + w / 2, y + 3, { align: 'center' });
      return y + 7;
    };

    // Pre-render charts
    const donutImg = await renderDonutChart(numericCount, categoricalCount);
    const meanImg = await renderMeanBarChart(stats.map(s => s.feature), stats.map(s => s.mean));

    // Histograms (first 3 numeric columns)
    const histImgs: string[] = [];
    const histCols = result.histograms.slice(0, 3);
    for (const h of histCols) {
      const img = await renderHistogram(h.bins.map(b => b.range), h.bins.map(b => b.count), '#1565C0', h.column);
      histImgs.push(img);
    }

    // Category bars (first 2 categorical columns)
    const catImgs: { img: string; title: string }[] = [];
    const PALETTE = ['#1565C0','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];
    for (const c of categorical.slice(0, 2)) {
      const img = await renderCategoryBar(
        c.data.slice(0, 10).map(d => d.name),
        c.data.slice(0, 10).map(d => d.value),
        PALETTE,
        c.column
      );
      catImgs.push({ img, title: c.column });
    }

    const heatmapImg = corrCols.length >= 2 ? await renderCorrelationHeatmap(corrCols, matrix) : null;
    const missingImg = await renderMissingBar(missing.map(m => m.column), missing.map(m => m.pct));

    // PAGE 1: Cover
    pdf.setFillColor(...NAVY); pdf.rect(0, 0, W, 22, 'F');
    pdf.setTextColor(255, 255, 255); pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
    pdf.text('AutoEDA — Automated EDA Report', M, 15);
    pdf.setTextColor(60, 60, 60); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(13);
    pdf.text('Automated Exploratory Data Analysis', M, 38);
    pdf.setFontSize(11);
    pdf.text(`Report Generated: ${now}`, M, 50);
    pdf.text(`Dataset: ${fileInfo?.name ?? 'Uploaded File'} (${data.length.toLocaleString()} rows, ${colInfo.length} columns)`, M, 58);
    pdf.setDrawColor(180); pdf.line(M, 66, W - M, 66);
    footer();

    // PAGE 2: Dataset Overview
    pdf.addPage();
    let y = sectionHead('1. Dataset Overview', M);
    autoTable(pdf, {
      startY: y, head: [['Metric', 'Value']],
      body: [
        ['Total Rows', data.length.toLocaleString()],
        ['Total Columns', String(colInfo.length)],
        ['Numeric Columns', String(numericCount)],
        ['Categorical/Date Columns', String(categoricalCount)],
        ['Memory Size', result.memorySize],
        ['Duplicate Rows', String(result.duplicates)],
        ['Total Outliers (IQR)', String(totalOutliers)],
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...WHITE_ALT] },
      margin: { left: M, right: M },
    });
    y = (pdf as any).lastAutoTable.finalY + 4;
    autoTable(pdf, {
      startY: y,
      head: [['Column Name', 'Data Type', 'Non-Null Count', 'Unique Values']],
      body: colInfo.map(c => [c.name, c.type, String(c.nonNull), String(c.unique)]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...LIGHT] },
      margin: { left: M, right: M },
    });
    y = (pdf as any).lastAutoTable.finalY + 6;
    if (y + 65 < H - 20) addChartImage(donutImg, M + CW / 2 - 30, y, 60, 60, 'Column Type Distribution');
    footer();

    // PAGE 3: Statistics
    if (stats.length > 0) {
      pdf.addPage();
      y = sectionHead('2. Statistical Summary', M);
      autoTable(pdf, {
        startY: y,
        head: [['Feature', 'Count', 'Mean', 'Median', 'Std Dev', 'Min', 'Max', 'Skewness']],
        body: stats.map(s => [s.feature, String(s.count), String(s.mean), String(s.median), String(s.std), String(s.min), String(s.max), String(s.skewness)]),
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2.5, halign: 'center' },
        headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...WHITE_ALT] },
        margin: { left: M, right: M },
      });
      y = (pdf as any).lastAutoTable.finalY + 8;
      if (y + 65 < H - 20) addChartImage(meanImg, M, y, CW, 60, 'Mean Values — Numeric Columns');
      footer();
    }

    // PAGE 4: Histograms
    if (histImgs.length > 0) {
      pdf.addPage();
      y = sectionHead('3. Data Distribution Analysis', M);
      const histW = histImgs.length === 1 ? CW : histImgs.length === 2 ? (CW - 4) / 2 : (CW - 8) / 3;
      histImgs.forEach((img, i) => {
        addChartImage(img, M + i * (histW + 4), y, histW, 55, histCols[i].column);
      });
      footer();
    }

    // PAGE 5: Categorical
    if (catImgs.length > 0) {
      pdf.addPage();
      y = sectionHead('4. Categorical Analysis', M);
      for (const c of catImgs) {
        y = addChartImage(c.img, M, y, CW, 60, c.title);
        y += 4;
      }
      footer();
    }

    // PAGE 6: Correlation
    if (heatmapImg && corrCols.length >= 2) {
      pdf.addPage();
      y = sectionHead('5. Correlation Analysis', M);
      y = addChartImage(heatmapImg, M, y, CW, 90, 'Correlation Heatmap');
      y += 2;
      if (topCorr.length > 0) {
        autoTable(pdf, {
          startY: y,
          head: [['Feature A', 'Feature B', 'Correlation', 'Strength']],
          body: topCorr.map(p => [p.a, p.b, p.r.toFixed(3), `${strengthLabel(p.r)} ${p.r > 0 ? 'Positive' : 'Negative'}`]),
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 2.5 },
          headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [...WHITE_ALT] },
          margin: { left: M, right: M },
        });
      }
      footer();
    }

    // PAGE 7: Missing Values
    pdf.addPage();
    y = sectionHead('6. Data Quality Report', M);
    y = addChartImage(missingImg, M, y, CW, 65, 'Missing Values by Column');
    y += 2;
    autoTable(pdf, {
      startY: y,
      head: [['Column', 'Missing Count', 'Missing %', 'Recommendation']],
      body: missing.map(m => [m.column, String(m.missing), `${m.pct}%`, m.recommendation]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...LIGHT] },
      margin: { left: M, right: M },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const pct = parseFloat(String(hookData.cell.raw).replace('%', ''));
          if (pct > 5) hookData.cell.styles.textColor = [220, 38, 38];
          else if (pct >= 1) hookData.cell.styles.textColor = [234, 138, 0];
          else hookData.cell.styles.textColor = [16, 185, 129];
        }
      },
    });
    y = (pdf as any).lastAutoTable.finalY + 6;
    pdf.setTextColor(60); pdf.setFontSize(10);
    pdf.text(`Duplicate Rows Detected: ${result.duplicates}`, M, y);
    pdf.text(`Total Outliers Detected: ${totalOutliers}`, M, y + 6);
    footer();

    // PAGE 8: Conclusion
    pdf.addPage();
    y = sectionHead('7. Conclusion & Recommendations', M);
    pdf.setTextColor(60); pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
    const bullets = [
      `The dataset contains ${data.length.toLocaleString()} rows and ${colInfo.length} columns.`,
      `${numericCount} numeric and ${categoricalCount} categorical/date columns were detected.`,
      withMissing.length > 0
        ? `${withMissing.length} column(s) have missing values. See data quality report for details.`
        : 'No missing values detected — dataset is clean.',
      result.duplicates > 0
        ? `${result.duplicates} duplicate rows were identified and should be removed before modeling.`
        : 'No duplicate rows detected.',
      totalOutliers > 0
        ? `${totalOutliers} outliers were detected across numeric columns requiring further investigation.`
        : 'No significant outliers detected.',
      topCorr.length > 0
        ? `${topCorr.length} notable correlation(s) found among numeric features.`
        : 'No strong correlations found among features.',
      '',
      'Recommendations:',
      '• Remove duplicate rows to improve data quality.',
      ...withMissing.map(m => `• ${m.column}: ${m.recommendation}`),
      '• Investigate and handle outliers before predictive modeling.',
      '• Apply standard scaling to numeric features before ML model training.',
    ];
    bullets.forEach(b => {
      if (b === '') { y += 4; return; }
      if (b.startsWith('Recommendations')) {
        pdf.setFont('helvetica', 'bold'); pdf.text(b, M, y); pdf.setFont('helvetica', 'normal');
      } else {
        pdf.text(b.startsWith('•') ? b : `• ${b}`, M + 3, y);
      }
      y += 7;
    });
    footer();

    const fname = fileInfo?.name.replace(/\.[^.]+$/, '') ?? 'AutoEDA';
    pdf.save(`${fname}_Report.pdf`);
  };

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = () => {
    const summary = `AutoEDA Report | ${data.length} rows, ${colInfo.length} cols | Missing: ${withMissing.length} cols | Duplicates: ${result.duplicates} | Outliers: ${totalOutliers}`;
    const encoded = encodeURIComponent(summary);
    const link = `${window.location.origin}/?report=${encoded}`;
    setShareLink(link);
    setCopied(false);
    setShareOpen(true);
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      toast({ title: 'Copied!', description: 'Link copied to clipboard.' });
      setTimeout(() => setCopied(false), 3000);
    });
  };
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this AutoEDA report: ${shareLink}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent('AutoEDA Report')}&body=${encodeURIComponent(`View the AutoEDA report here: ${shareLink}`)}`;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-8 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-extrabold text-gradient">AutoEDA Report</h2>
              <p className="text-sm text-muted-foreground">Automated Exploratory Data Analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{date}</span></div>
            <div><span className="text-muted-foreground">Dataset:</span> <span className="text-foreground">{fileInfo?.name ?? 'Uploaded File'}</span></div>
            <div><span className="text-muted-foreground">Rows:</span> <span className="text-foreground">{data.length.toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Columns:</span> <span className="text-foreground">{colInfo.length}</span></div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <Section icon={Database} title="Dataset Overview" color="border-l-primary">
            <p className="text-sm text-muted-foreground">
              The dataset contains <b className="text-foreground">{data.length.toLocaleString()} rows</b> and <b className="text-foreground">{colInfo.length} columns</b>.
              {' '}<b className="text-foreground">{numericCount} numeric</b> and <b className="text-foreground">{categoricalCount} categorical/date</b> columns detected.
              {result.duplicates > 0 && <> <b className="text-foreground">{result.duplicates} duplicate rows</b> detected.</>}
              {totalOutliers > 0 && <> <b className="text-foreground">{totalOutliers} outliers</b> detected across numeric columns.</>}
            </p>
          </Section>

          {stats.length > 0 && (
            <Section icon={FileText} title="Statistical Summary" color="border-l-accent">
              <div className="space-y-2">
                {stats.slice(0, 5).map(s => (
                  <p key={s.feature} className="text-sm text-muted-foreground">
                    <b className="text-foreground">{s.feature}:</b> Mean={s.mean}, Median={s.median}, Std={s.std}, Range=[{s.min}, {s.max}]
                  </p>
                ))}
              </div>
            </Section>
          )}

          <Section icon={AlertTriangle} title="Missing Values" color="border-l-warning">
            {withMissing.length === 0 ? (
              <p className="text-sm text-success">No missing values detected.</p>
            ) : (
              <div className="space-y-1">
                {withMissing.map(m => (
                  <p key={m.column} className="text-sm text-muted-foreground">
                    <b className="text-foreground">{m.column}:</b> {m.pct}% missing ({m.missing} values) — {m.recommendation}
                  </p>
                ))}
              </div>
            )}
          </Section>

          {topCorr.length > 0 && (
            <Section icon={TrendingUp} title="Key Correlations" color="border-l-success">
              <div className="space-y-1">
                {topCorr.map(p => (
                  <p key={`${p.a}-${p.b}`} className="text-sm text-muted-foreground">
                    <b className="text-foreground">{p.a} ↔ {p.b}:</b> r = {p.r.toFixed(3)} ({strengthLabel(p.r)}, {p.r > 0 ? 'Positive' : 'Negative'})
                  </p>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 pt-0 flex gap-3">
          <button onClick={handleDownloadPDF} disabled={generating} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-105 active:scale-95 transition-transform glow-blue disabled:opacity-60 disabled:hover:scale-100">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Generating PDF...' : 'Download Report as PDF'}
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-secondary/50 transition-colors">
            <Share2 className="w-4 h-4" /> Share Report
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" /> Report Link Generated!
            </DialogTitle>
            <DialogDescription>Copy the link below or share via your preferred platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input readOnly value={shareLink} className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground text-sm border border-border truncate" />
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:scale-105 active:scale-95 transition-transform">
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
              </button>
            </div>
            <div className="flex gap-3">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] text-white font-semibold text-sm hover:scale-105 active:scale-95 transition-transform">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a href={emailUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:scale-105 active:scale-95 transition-transform">
                <Mail className="w-4 h-4" /> Email
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
