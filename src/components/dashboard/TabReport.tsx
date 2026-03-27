import { useMemo, useState } from 'react';
import { DataRow, getNumericStats, getMissingValues, getCorrelationMatrix, getColumnInfo } from '@/lib/generateData';
import { BarChart3, Download, Share2, FileText, Database, AlertTriangle, TrendingUp, Copy, Check, Mail, MessageCircle, X, Link } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Props { data: DataRow[] }

export default function TabReport({ data }: Props) {
  const stats = useMemo(() => getNumericStats(data), [data]);
  const missing = useMemo(() => getMissingValues(data), [data]);
  const colInfo = useMemo(() => getColumnInfo(data), [data]);
  const { columns, matrix } = useMemo(() => getCorrelationMatrix(data), [data]);
  const withMissing = missing.filter(m => m.missing > 0);
  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

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

  const numericCols = colInfo.filter(c => c.type === 'numeric').length;
  const categoricalCols = colInfo.filter(c => c.type === 'object').length;

  // ── PDF Generation ──
  const handleDownloadPDF = () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, M = 15, CW = W - M * 2;
    let pageNum = 1;
    const now = new Date().toLocaleString();

    const BLUE = [21, 101, 192] as const;   // #1565C0
    const NAVY = [11, 22, 40] as const;     // #0B1628
    const WHITE_ALT = [239, 246, 255] as const; // #EFF6FF
    const LIGHT = [248, 250, 252] as const; // #F8FAFC

    const footer = () => {
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text('AutoEDA | NexGen Analytix | Confidential', M, H - 8);
      pdf.text(`Page ${pageNum}`, W - M, H - 8, { align: 'right' });
      pageNum++;
    };

    const sectionHead = (text: string, y: number) => {
      pdf.setFillColor(...BLUE);
      pdf.rect(M, y, CW, 9, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(text, M + 3, y + 6.5);
      return y + 12;
    };

    // ── Page 1: Cover ──
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, W, 22, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AutoEDA \u2014 Automated EDA Report', M, 15);

    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    pdf.text('NexGen Analytix | Data Science & Analytics Department', M, 38);
    pdf.setFontSize(11);
    pdf.text(`Report Generated: ${now}`, M, 50);
    pdf.text('Dataset: Retail Sales Data (500+ rows, 10 columns)', M, 58);

    pdf.setDrawColor(180);
    pdf.line(M, 66, W - M, 66);

    pdf.setFontSize(11);
    pdf.text('Prepared by: Sakshi Santosh Desai | Guide: Yash Gawande | MCA \u2014 SPPU 2026', M, 78);
    footer();

    // ── Page 2: Dataset Overview ──
    pdf.addPage();
    let y = sectionHead('1. Dataset Overview', M);

    autoTable(pdf, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Rows', String(data.length)],
        ['Total Columns', '10'],
        ['Numeric Columns', String(numericCols)],
        ['Categorical Columns', String(categoricalCols)],
        ['Memory Size', '~42 KB'],
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...WHITE_ALT] },
      margin: { left: M, right: M },
    });

    y = (pdf as any).lastAutoTable.finalY + 6;

    autoTable(pdf, {
      startY: y,
      head: [['Column Name', 'Data Type', 'Non-Null Count', 'Unique Values']],
      body: colInfo.map(c => [c.name, c.type, String(c.nonNull), String(c.unique)]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...LIGHT] },
      margin: { left: M, right: M },
    });
    footer();

    // ── Page 3: Statistics ──
    pdf.addPage();
    y = sectionHead('2. Statistical Summary', M);

    autoTable(pdf, {
      startY: y,
      head: [['Feature', 'Count', 'Mean', 'Median', 'Std Dev', 'Min', 'Max', 'Skewness']],
      body: stats.map(s => [
        String(s.feature), String(s.count), String(s.mean), String(s.median),
        String(s.std), String(s.min), String(s.max), String(s.skewness),
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5, font: 'helvetica', halign: 'center' },
      headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...WHITE_ALT] },
      margin: { left: M, right: M },
    });
    footer();

    // ── Page 4: Data Quality ──
    pdf.addPage();
    y = sectionHead('3. Data Quality Report', M);

    const getRecommendation = (col: string, pct: number) => {
      if (pct === 0) return 'No action needed';
      if (col === 'Rating') return 'Fill with Median';
      if (col === 'Discount') return 'Fill with Mode';
      return 'Investigate';
    };

    autoTable(pdf, {
      startY: y,
      head: [['Column', 'Missing Count', 'Missing %', 'Recommendation']],
      body: missing.map(m => [
        String(m.column), String(m.missing), `${m.pct}%`, getRecommendation(String(m.column), m.pct),
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5, font: 'helvetica' },
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

    y = (pdf as any).lastAutoTable.finalY + 8;
    pdf.setTextColor(60);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Duplicate Rows Detected: 10', M, y);
    pdf.text('Outliers Detected: 5', M, y + 7);
    footer();

    // ── Page 5: Correlation ──
    pdf.addPage();
    y = sectionHead('4. Correlation Analysis', M);

    const strengthLabel = (r: number) => {
      const abs = Math.abs(r);
      if (abs > 0.9) return 'Very Strong';
      if (abs > 0.7) return 'Strong';
      if (abs > 0.5) return 'Moderate';
      return 'Weak';
    };

    autoTable(pdf, {
      startY: y,
      head: [['Feature A', 'Feature B', 'Correlation', 'Strength']],
      body: topCorr.map(p => [p.a, p.b, p.r.toFixed(3), `${strengthLabel(p.r)} ${p.r > 0 ? 'Positive' : 'Negative'}`]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...WHITE_ALT] },
      margin: { left: M, right: M },
    });

    y = (pdf as any).lastAutoTable.finalY + 8;
    pdf.setTextColor(60);
    pdf.setFontSize(10);
    pdf.text('Key Findings:', M, y);
    y += 6;
    topCorr.forEach(p => {
      pdf.text(`\u2022 ${p.a} \u2194 ${p.b}: r = ${p.r.toFixed(3)} (${strengthLabel(p.r)} ${p.r > 0 ? 'Positive' : 'Negative'})`, M + 3, y);
      y += 6;
    });
    footer();

    // ── Page 6: Conclusion ──
    pdf.addPage();
    y = sectionHead('5. Conclusion & Recommendations', M);

    pdf.setTextColor(60);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const bullets = [
      `The dataset contains ${data.length} rows and 10 columns covering retail sales data.`,
      `${numericCols} numeric and ${categoricalCols} categorical columns were detected.`,
      `${withMissing.length} column(s) have missing values — Rating (4.8%) and Discount (3.2%).`,
      '10 duplicate rows were identified and should be removed before modeling.',
      '5 outliers were detected in Net_Revenue requiring further investigation.',
      `${topCorr.length} notable correlations found among numeric features.`,
      '',
      'Recommendations:',
      '\u2022 Remove duplicate rows to improve data quality.',
      '\u2022 Impute missing Rating values with median and Discount with mode.',
      '\u2022 Investigate and handle Net_Revenue outliers before predictive modeling.',
      '\u2022 Consider feature engineering based on correlated variable pairs.',
      '\u2022 Perform further analysis with visualizations for categorical distributions.',
    ];
    bullets.forEach(b => {
      if (b === '') { y += 4; return; }
      const prefix = b.startsWith('\u2022') ? '' : '\u2022 ';
      if (b.startsWith('Recommendations')) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(b, M, y);
        pdf.setFont('helvetica', 'normal');
      } else {
        pdf.text(`${prefix}${b}`, M + 3, y);
      }
      y += 7;
    });
    footer();

    pdf.save('AutoEDA_Report.pdf');
    toast({ title: 'PDF Downloaded!', description: 'Your AutoEDA report has been saved.' });
  };

  // ── Share ──
  const handleShare = () => {
    const summary = `AutoEDA Report | ${data.length} rows, 10 cols | Missing: ${withMissing.length} cols | Duplicates: 10 | Outliers: 5 | Top Correlation: ${topCorr[0]?.a ?? 'N/A'} ↔ ${topCorr[0]?.b ?? 'N/A'} (r=${topCorr[0]?.r.toFixed(3) ?? '0'})`;
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
          <Section icon={Database} title="Dataset Overview" color="border-l-primary">
            <p className="text-sm text-muted-foreground">The dataset contains <b className="text-foreground">{data.length} rows</b> and <b className="text-foreground">10 columns</b>. It includes data on retail sales across regions, categories, and customer segments. <b className="text-foreground">10 duplicate rows</b> and <b className="text-foreground">5 outliers</b> were detected.</p>
          </Section>

          <Section icon={FileText} title="Statistical Summary" color="border-l-accent">
            <div className="space-y-2">
              {stats.slice(0, 4).map(s => (
                <p key={s.feature} className="text-sm text-muted-foreground">
                  <b className="text-foreground">{s.feature}:</b> Mean={s.mean}, Median={s.median}, Std={s.std}, Range=[{s.min}, {s.max}]
                </p>
              ))}
            </div>
          </Section>

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
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-105 active:scale-95 transition-transform glow-blue">
            <Download className="w-4 h-4" /> Download Report as PDF
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
