import React from 'react';
import { AutomationTask, Company } from '../types/talentForge';
import { Cpu, RefreshCw, Clock, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface AutomationViewProps {
  tasks: AutomationTask[];
  companies: Company[];
  onRetryTask: (taskId: string) => Promise<void>;
}

export const AutomationView: React.FC<AutomationViewProps> = ({
  tasks,
  companies,
  onRetryTask,
}) => {
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  const activeCount = tasks.filter((t) => t.status === 'RUNNING').length;
  const queuedCount = tasks.filter((t) => t.status === 'QUEUED' || t.status === 'RETRYING').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const failedCount = tasks.filter((t) => t.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Concurrency & Queue Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Running Workers</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1 flex items-center gap-2">
            <span>{activeCount}</span>
            <span className="text-xs font-normal text-slate-500">/ 5 concurrency</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Queued in Pipeline</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {queuedCount}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Completed Stages</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {completedCount}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Failed / Retrying</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {failedCount}
          </div>
        </div>
      </div>

      {/* Task Queue Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Persistent Background Task Queue</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Auto-managed state machine with exponential backoff
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Task Type</th>
                <th className="py-3 px-4">Target Company</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Next Run / Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Queue is currently idle. All pipeline tasks processed.
                  </td>
                </tr>
              ) : (
                tasks.slice(0, 100).map((t) => {
                  const companyName = companyMap.get(t.companyId) || t.companyId;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white text-[11px]">
                        {t.taskType}
                      </td>

                      <td className="py-3 px-4 text-blue-400 font-medium">
                        {companyName}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.status === 'RUNNING'
                            ? 'bg-blue-950/60 text-blue-400 border border-blue-800 animate-pulse'
                            : t.status === 'COMPLETED'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : t.status === 'RETRYING'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                            : t.status === 'FAILED'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400">
                        {t.attempts} / {t.maxAttempts}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(t.updatedAt).toLocaleTimeString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {t.status === 'FAILED' || t.status === 'RETRYING' ? (
                          <button
                            onClick={() => onRetryTask(t.id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 text-blue-400" />
                            <span>Retry Now</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
