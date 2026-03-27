import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Home, ChevronRight, Plus, CloudUpload,
  CheckCircle2, Loader2, Sparkles, FileText, X,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { runAnalysis, fixMissingValues, removeDuplicates, AnalysisResult, RawRow } from '@/lib/analyzeData';
import KPICards from '@/components/dashboard/KPICards';
import AIInsights from '@/components/dashboard/AIInsights';
import TabOverview from '@/components/dashboard/TabOverview';
import TabStatistics from '@/components/dashboard/TabStatistics';
import TabMissing from '@/components/dashboard/TabMissing';
import DataCleaning, { CleaningState, defaultCleaningState } from '@/components/dashboard/DataCleaning';
import TabCharts from '@/components/dashboard/TabCharts';
import TabCorrelation from '@/components/dashboard/TabCorrelation';
import TabReport from '@/components/dashboard/TabReport';

const tabs = ['Overview', 'Statistics', 'Missing Values', 'Data Cleaning', 'Charts', 'Correlation', 'Report'] as const;
type Tab = typeof tabs[number];

const loadingSteps = [
  'Reading dataset...',
  'Detecting data types...',
  'Computing statistics...',
  'Detecting missing values...',
  'Generating visualizations...',
  'Building correlation matrix...',
  'Preparing report...',
];

interface FileInfo {
  name: string;
  size: string;
  rows: number;
  duration: string;
}

export default function Dashboard() {
  const [phase, setPhase] = useState<'upload' | 'loading' | 'ready'>('upload');
  const [loadStep, setLoadStep] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [clock, setClock] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outlierSet, setOutlierSet] = useState<Set<number>>(new Set());
  const [cleaningState, setCleaningState] = useState<CleaningState>(defaultCleaningState);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const runLoadingAnimation = (onDone: () => void) => {
    setPhase('loading');
    setLoadStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= loadingSteps.length) {
        clearInterval(interval);
        setTimeout(onDone, 400);
      } else {
        setLoadStep(step);
      }
    }, 350);
  };

  const finalize = useCallback((rows: RawRow[], fname: string, fsize: number, startTime: number) => {
    if (rows.length === 0) {
      setError('❌ File appears to be empty.');
      setPhase('upload');
      return;
    }
    const analysis = runAnalysis(rows);
    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    const sizeStr = fsize < 1024 ? `${fsize} B` : fsize < 1024 * 1024 ? `${(fsize / 1024).toFixed(1)} KB` : `${(fsize / (1024 * 1024)).toFixed(1)} MB`;

    // Collect all outlier indices across columns
    const allOutliers = new Set<number>();
    analysis.outliers.forEach(o => o.indices.forEach(i => allOutliers.add(i)));
    setOutlierSet(allOutliers);
    setResult(analysis);
    setFileInfo({ name: fname, size: sizeStr, rows: rows.length, duration: `${duration}s` });
    setPhase('ready');
  }, []);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('❌ Unsupported file format. Please upload CSV or Excel file only.');
      return;
    }
    const startTime = performance.now();
    runLoadingAnimation(() => {
      if (ext === 'csv') {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            finalize(results.data as RawRow[], file.name, file.size, startTime);
          },
          error: () => {
            setError('❌ Failed to parse CSV file.');
            setPhase('upload');
          },
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target!.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { defval: null }) as RawRow[];
            finalize(data, file.name, file.size, startTime);
          } catch {
            setError('❌ Failed to parse Excel file.');
            setPhase('upload');
          }
        };
        reader.readAsBinaryString(file);
      }
    });
  }, [finalize]);

  const resetApp = () => {
    setPhase('upload');
    setResult(null);
    setFileInfo(null);
    setError(null);
    setActiveTab('Overview');
    setOutlierSet(new Set());
    setCleaningState(defaultCleaningState);
  };

  // Data cleaning actions on real data
  const handleFixMissing = () => {
    if (!result) return;
    const fixed = fixMissingValues(result.data, result.colInfo);
    const analysis = runAnalysis(fixed);
    const allOutliers = new Set<number>();
    analysis.outliers.forEach(o => o.indices.forEach(i => allOutliers.add(i)));
    setOutlierSet(allOutliers);
    setResult(analysis);
    if (fileInfo) setFileInfo({ ...fileInfo, rows: fixed.length });
  };

  const handleRemoveDuplicates = () => {
    if (!result) return;
    const cleaned = removeDuplicates(result.data);
    const analysis = runAnalysis(cleaned);
    const allOutliers = new Set<number>();
    analysis.outliers.forEach(o => o.indices.forEach(i => allOutliers.add(i)));
    setOutlierSet(allOutliers);
    setResult(analysis);
    if (fileInfo) setFileInfo({ ...fileInfo, rows: cleaned.length });
  };

  const handleFlagOutliers = () => {
    if (!result) return;
    const allOutliers = new Set<number>();
    result.outliers.forEach(o => o.indices.forEach(i => allOutliers.add(i)));
    setOutlierSet(allOutliers);
    setActiveTab('Overview');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="font-bold text-gradient">AutoEDA</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <Home className="w-3.5 h-3.5" />
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground">Analysis</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">{clock}</span>
            {phase === 'ready' && (
              <button onClick={resetApp} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:scale-105 active:scale-95 transition-transform">
                <Plus className="w-4 h-4" /> New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {phase === 'upload' && (
          <UploadZone onFile={handleFile} error={error} onClearError={() => setError(null)} />
        )}
        {phase === 'loading' && <LoadingOverlay step={loadStep} />}
        {phase === 'ready' && result && (
          <div className="animate-fade-in">
            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="mb-4 space-y-2">
                {result.warnings.map(w => (
                  <div key={w} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm font-medium">
                    <span>⚠️</span> {w}
                  </div>
                ))}
              </div>
            )}
            {/* File info bar */}
            {fileInfo && <FileInfoBar info={fileInfo} onReset={resetApp} />}

            <KPICards result={result} />
            <AIInsights result={result} />

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mt-8 mb-6">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === t ? 'bg-primary text-primary-foreground glow-blue' : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="min-h-[500px]">
              {activeTab === 'Overview' && (
                <TabOverview result={result} outlierSet={outlierSet} onFixMissing={handleFixMissing} onRemoveDuplicates={handleRemoveDuplicates} onFlagOutliers={handleFlagOutliers} />
              )}
              {activeTab === 'Statistics' && <TabStatistics result={result} />}
              {activeTab === 'Missing Values' && <TabMissing result={result} />}
              {activeTab === 'Charts' && <TabCharts result={result} />}
              {activeTab === 'Correlation' && <TabCorrelation result={result} />}
              {activeTab === 'Report' && <TabReport result={result} fileInfo={fileInfo} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── File Info Bar ─────────────────────────────────────────────────────────────
function FileInfoBar({ info, onReset }: { info: FileInfo; onReset: () => void }) {
  return (
    <div className="mb-6 flex items-center gap-4 px-5 py-3 rounded-xl bg-card/60 border border-border/50 backdrop-blur flex-wrap">
      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="flex flex-wrap gap-x-6 gap-y-1 flex-1 text-sm">
        <span className="text-foreground font-semibold">{info.name}</span>
        <span className="text-muted-foreground">Size: <span className="text-foreground">{info.size}</span></span>
        <span className="text-muted-foreground">Rows: <span className="text-foreground">{info.rows.toLocaleString()}</span></span>
        <span className="text-muted-foreground">Analyzed in: <span className="text-success font-semibold">{info.duration}</span></span>
      </div>
      <button onClick={onReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs hover:text-foreground hover:border-primary/50 transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5" /> Change File
      </button>
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onFile, error, onClearError }: { onFile: (f: File) => void; error: string | null; onClearError: () => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useState<HTMLInputElement | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <label
        className={`glass-card p-16 text-center max-w-xl w-full border-2 border-dashed transition-colors cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <CloudUpload className="w-16 h-16 text-primary mx-auto mb-6 animate-float" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload a CSV or Excel file to begin analysis</h2>
        <p className="text-muted-foreground mb-4">
          Drag & drop or <span className="text-primary font-semibold">Browse Files</span>
        </p>
        <p className="text-xs text-muted-foreground">Supported: CSV, XLSX, XLS · Max size: 50MB</p>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          ref={r => { inputRef[0] = r; }}
          onChange={handleChange}
        />
      </label>
      {error && (
        <div className="flex items-center gap-3 max-w-xl w-full px-5 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
          <span className="flex-1">{error}</span>
          <button onClick={onClearError}><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

// ── Loading Overlay ───────────────────────────────────────────────────────────
function LoadingOverlay({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass-card p-12 max-w-md w-full text-center">
        <Sparkles className="w-12 h-12 text-accent mx-auto mb-6 animate-pulse" />
        <h2 className="text-xl font-bold text-foreground mb-6">Running EDA...</h2>
        <div className="w-full bg-secondary rounded-full h-2 mb-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out" style={{ width: `${((step + 1) / loadingSteps.length) * 100}%` }} />
        </div>
        <ul className="space-y-3 text-left">
          {loadingSteps.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 text-sm transition-all duration-300 ${i <= step ? 'text-foreground' : 'text-muted-foreground/40'}`}>
              {i < step ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" /> : i === step ? <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />}
              {s}
            </li>
          ))}
        </ul>
        {step >= loadingSteps.length - 1 && (
          <p className="mt-6 text-lg font-bold text-success">✨ Analysis Complete!</p>
        )}
      </div>
    </div>
  );
}
