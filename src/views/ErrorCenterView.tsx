import React from 'react';
import { AutomationTask, Company } from '../types/talentForge';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorCenterViewProps {
  tasks: AutomationTask[];
  companies: Company[];
  onRetryTask: (taskId: string) => Promise<void>;
}

export const ErrorCenterView: React.FC<ErrorCenterViewProps> = ({
  tasks,
  companies,
  onRetryTask,
}) => {
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));
  const failedTasks = tasks.filter((t) => t.status === 'FAILED' || t.status === 'RETRYING');

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Automation Error & Retry Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Temporary rate limits, network timeouts, or schema mismatches are captured here. You can manually inspect errors and re-trigger queue workers.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-900">
          {failedTasks.length} Active Issues
        </span>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {failedTasks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="w-10 h-10 rounded-full bg-emerald-950/60 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-800">
              ✓
            </div>
            All automation tasks are running cleanly with zero errors.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {failedTasks.map((t) => {
              const compName = companyMap.get(t.companyId) || t.companyId;
              return (
                <div key={t.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{t.taskType}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-xs font-semibold text-blue-400">{compName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                        Attempt {t.attempts}/{t.maxAttempts}
                      </span>
                    </div>
                    <div className="text-xs text-rose-300 font-mono bg-slate-950/80 p-2 rounded border border-slate-800">
                      {t.error || 'Temporary timeout or network backoff in progress.'}
                    </div>
                  </div>

                  <button
                    onClick={() => onRetryTask(t.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Task</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
