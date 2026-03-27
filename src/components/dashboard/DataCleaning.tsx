import { useState } from 'react';
import { Wand2, Trash2, AlertTriangle, CheckCircle2, Loader2, PartyPopper } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AnalysisResult } from '@/lib/analyzeData';

interface Props {
  result: AnalysisResult;
  onFixMissing: () => void;
  onRemoveDuplicates: () => void;
  onFlagOutliers: () => void;
  // Expose controlled state so Dashboard can sync KPI cards
  cleaningState: CleaningState;
  setCleaningState: React.Dispatch<React.SetStateAction<CleaningState>>;
}

export interface CleaningState {
  missingFixed: boolean;
  duplicatesRemoved: boolean;
  outliersFlagged: boolean;
}

export const defaultCleaningState: CleaningState = {
  missingFixed: false,
  duplicatesRemoved: false,
  outliersFlagged: false,
};

export default function DataCleaning({
  result,
  onFixMissing,
  onRemoveDuplicates,
  onFlagOutliers,
  cleaningState,
  setCleaningState,
}: Props) {
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [loadingDupes, setLoadingDupes] = useState(false);
  const [loadingOutliers, setLoadingOutliers] = useState(false);

  const totalMissing = result.missing.reduce((s, m) => s + m.missing, 0);
  const totalOutliers = result.outliers.reduce((s, o) => s + o.count, 0);
  const allDone = cleaningState.missingFixed && cleaningState.duplicatesRemoved && cleaningState.outliersFlagged;

  const handleFixMissing = () => {
    if (cleaningState.missingFixed) return;
    setLoadingMissing(true);
    setTimeout(() => {
      onFixMissing();
      setCleaningState(s => ({ ...s, missingFixed: true }));
      setLoadingMissing(false);
      toast({
        title: '✅ Missing values fixed!',
        description: `${totalMissing} missing values filled with median/mode.`,
      });
    }, 1000);
  };

  const handleRemoveDuplicates = () => {
    if (cleaningState.duplicatesRemoved) return;
    setLoadingDupes(true);
    setTimeout(() => {
      onRemoveDuplicates();
      setCleaningState(s => ({ ...s, duplicatesRemoved: true }));
      setLoadingDupes(false);
      toast({
        title: '✅ Duplicates removed!',
        description: `${result.duplicates} duplicate rows removed from dataset.`,
      });
    }, 1000);
  };

  const handleFlagOutliers = () => {
    if (cleaningState.outliersFlagged) return;
    setLoadingOutliers(true);
    setTimeout(() => {
      onFlagOutliers();
      setCleaningState(s => ({ ...s, outliersFlagged: true }));
      setLoadingOutliers(false);
      toast({
        title: '⚠️ Outliers flagged!',
        description: `${totalOutliers} outlier rows highlighted in the Overview tab.`,
      });
    }, 1000);
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          🧹 One-Click Data Cleaning
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Fix common data issues automatically</p>
      </div>

      {/* Action Buttons */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {/* Fix Missing Values */}
        <button
          onClick={handleFixMissing}
          disabled={cleaningState.missingFixed || loadingMissing}
          className={`flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl font-semibold text-sm transition-all
            ${cleaningState.missingFixed
              ? 'bg-success/15 text-success border border-success/30 cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95 glow-blue disabled:opacity-70 disabled:hover:scale-100'
            }`}
        >
          {loadingMissing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : cleaningState.missingFixed ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {cleaningState.missingFixed ? '✓ Missing Values Fixed' : loadingMissing ? 'Fixing...' : 'Fix Missing Values'}
        </button>

        {/* Remove Duplicates */}
        <button
          onClick={handleRemoveDuplicates}
          disabled={cleaningState.duplicatesRemoved || loadingDupes}
          className={`flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl font-semibold text-sm transition-all
            ${cleaningState.duplicatesRemoved
              ? 'bg-success/15 text-success border border-success/30 cursor-not-allowed'
              : 'bg-[hsl(25_95%_50%)] text-white hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100'
            }`}
          style={!cleaningState.duplicatesRemoved ? { boxShadow: '0 0 20px hsl(25 95% 50% / 0.3)' } : undefined}
        >
          {loadingDupes ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : cleaningState.duplicatesRemoved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {cleaningState.duplicatesRemoved ? '✓ Duplicates Removed' : loadingDupes ? 'Removing...' : 'Remove Duplicates'}
        </button>

        {/* Flag Outliers */}
        <button
          onClick={handleFlagOutliers}
          disabled={cleaningState.outliersFlagged || loadingOutliers}
          className={`flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl font-semibold text-sm transition-all border-2
            ${cleaningState.outliersFlagged
              ? 'bg-success/15 text-success border-success/30 cursor-not-allowed'
              : 'bg-transparent border-destructive text-destructive hover:bg-destructive/10 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100'
            }`}
        >
          {loadingOutliers ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : cleaningState.outliersFlagged ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {cleaningState.outliersFlagged
            ? '✓ Outliers Flagged'
            : loadingOutliers
            ? 'Flagging...'
            : 'Flag Outliers'}
        </button>
      </div>

      {/* Progress Section */}
      <div
        className={`rounded-xl p-5 border transition-all duration-500 ${
          allDone
            ? 'border-success/50 bg-success/5 celebration-glow'
            : 'border-border/50 bg-secondary/20'
        }`}
      >
        <h3 className="text-sm font-bold text-foreground mb-4">Cleaning Progress</h3>
        <div className="space-y-3">
          <ProgressItem done={cleaningState.missingFixed} label="Missing Values Fixed" />
          <ProgressItem done={cleaningState.duplicatesRemoved} label="Duplicates Removed" />
          <ProgressItem done={cleaningState.outliersFlagged} label="Outliers Flagged" />
        </div>

        {allDone && (
          <div className="mt-5 flex items-center gap-3 pt-4 border-t border-success/20">
            <PartyPopper className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-sm font-bold text-success">🎉 Dataset is clean and ML-ready!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-all duration-300 ${
          done
            ? 'bg-success border-success'
            : 'bg-transparent border-border'
        }`}
      >
        {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={`text-sm transition-colors duration-300 ${done ? 'text-success font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
