import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Home, ChevronRight, Plus, Upload as UploadIcon, CloudUpload, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { generateDataset, DataRow } from '@/lib/generateData';
import KPICards from '@/components/dashboard/KPICards';
import TabOverview from '@/components/dashboard/TabOverview';
import TabStatistics from '@/components/dashboard/TabStatistics';
import TabMissing from '@/components/dashboard/TabMissing';
import TabCharts from '@/components/dashboard/TabCharts';
import TabCorrelation from '@/components/dashboard/TabCorrelation';
import TabReport from '@/components/dashboard/TabReport';

const tabs = ['Overview', 'Statistics', 'Missing Values', 'Charts', 'Correlation', 'Report'] as const;
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

export default function Dashboard() {
  const [phase, setPhase] = useState<'upload' | 'loading' | 'ready'>('upload');
  const [loadStep, setLoadStep] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [clock, setClock] = useState('');

  const data = useMemo(() => generateDataset(), []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const startAnalysis = () => {
    setPhase('loading');
    setLoadStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= loadingSteps.length) {
        clearInterval(interval);
        setTimeout(() => setPhase('ready'), 600);
      } else {
        setLoadStep(step);
      }
    }, 500);
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
              <button onClick={() => { setPhase('upload'); setActiveTab('Overview'); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:scale-105 active:scale-95 transition-transform">
                <Plus className="w-4 h-4" /> New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {phase === 'upload' && <UploadZone onUpload={startAnalysis} />}
        {phase === 'loading' && <LoadingOverlay step={loadStep} />}
        {phase === 'ready' && (
          <div className="animate-fade-in">
            <KPICards data={data} />
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
              {activeTab === 'Overview' && <TabOverview data={data} />}
              {activeTab === 'Statistics' && <TabStatistics data={data} />}
              {activeTab === 'Missing Values' && <TabMissing data={data} />}
              {activeTab === 'Charts' && <TabCharts data={data} />}
              {activeTab === 'Correlation' && <TabCorrelation data={data} />}
              {activeTab === 'Report' && <TabReport data={data} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function UploadZone({ onUpload }: { onUpload: () => void }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div
        className={`glass-card p-16 text-center max-w-xl w-full border-2 border-dashed transition-colors cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
        onClick={onUpload}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); onUpload(); }}
      >
        <CloudUpload className="w-16 h-16 text-primary mx-auto mb-6 animate-float" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Drag & Drop your CSV or Excel file here</h2>
        <p className="text-muted-foreground mb-4">or <span className="text-primary font-semibold cursor-pointer">Browse Files</span></p>
        <p className="text-xs text-muted-foreground">Supported: CSV, XLSX, XLS · Max size: 50MB</p>
      </div>
    </div>
  );
}

function LoadingOverlay({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass-card p-12 max-w-md w-full text-center">
        <Sparkles className="w-12 h-12 text-accent mx-auto mb-6 animate-pulse" />
        <h2 className="text-xl font-bold text-foreground mb-6">Running EDA...</h2>
        {/* Progress bar */}
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
          <p className="mt-6 text-lg font-bold text-success animate-scale-in">✨ Analysis Complete!</p>
        )}
      </div>
    </div>
  );
}
