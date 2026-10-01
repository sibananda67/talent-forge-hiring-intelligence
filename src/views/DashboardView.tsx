import React from 'react';
import { Campaign, PipelineSummary, ExecutionLog } from '../types/talentForge';
import { PipelineBar } from '../components/PipelineBar';
import {
  Users,
  Building2,
  CheckCircle,
  Activity,
  FileText,
  UserCheck,
  ShieldCheck,
  Award,
  Send,
  Download,
  Terminal,
  Play,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface DashboardViewProps {
  campaign: Campaign | null;
  summary: PipelineSummary;
  logs: ExecutionLog[];
  onOpenNewCampaign: () => void;
  onDownloadCsv: () => void;
  onSelectStage: (stage: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  campaign,
  summary,
  logs,
  onOpenNewCampaign,
  onDownloadCsv,
  onSelectStage,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Control Status Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Talent Forge Solution
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">Autonomous Lead Intelligence</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {campaign?.name || 'Hiring Friction Intelligence Control Center'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Consolidated operational pipeline: Ingests Apify Google Search candidate pool, validates direct employers, detects hiring friction triggers (T1-T12), enriches Hunter verified emails, generates 3-touch outreach, exports standardized CSV, and delivers outreach via Saleshandy campaigns.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onDownloadCsv}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
              <span className="bg-emerald-950/80 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded font-mono">
                {summary.readyForSaleshandy || summary.qcPassed} Leads
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Pipeline Funnel Bar */}
      <PipelineBar summary={summary} onSelectStage={onSelectStage} />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Ready for Saleshandy</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {summary.readyForSaleshandy || summary.qcPassed}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified & Outreach Ready</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Verified Emails</div>
          <div className="text-2xl font-bold font-mono text-teal-400 mt-1">
            {summary.emailVerified}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hunter Verified Mailboxes</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">QC Passed</div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
            {summary.qcPassed}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">21 Checkpoints Verified</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Rejected</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {summary.rejected}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Failed Mandatory Gates</div>
        </div>
      </div>

      {/* Main Two-Column Row: Execution Log Terminal & Quick Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Execution Log Terminal */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[420px]">
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Autonomous Execution Log Terminal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400">Worker Active</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-center py-12">No execution events logged yet.</div>
            ) : (
              logs.map((log) => {
                const timeStr = log.timestamp ? log.timestamp.split('T')[1].slice(0, 8) : '';
                return (
                  <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-slate-500 text-[10px] shrink-0 tabular-nums">
                      [{timeStr}]
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                      log.level === 'success'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50'
                        : log.level === 'warn'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-900/50'
                        : log.level === 'error'
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-900/50'
                        : 'bg-blue-950/60 text-blue-400 border border-blue-900/50'
                    }`}>
                      {log.stage}
                    </span>
                    <span className="text-slate-300 break-words flex-1 text-[11px]">
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Quality Rules & Readiness */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight mb-2">
              TALENT FORGE QUALITY GATES
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Strict automated qualification gates enforced before any lead enters the ready queue:
            </p>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Verified business email</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>3+ hiring signals</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Current hiring evidence</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Specific hiring friction</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Relevant decision maker</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Evidence URL</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>No duplicate company</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>No guessed emails</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Outreach QC passed</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Ready for Saleshandy:</span>
              <span className="font-mono text-emerald-400 font-bold">{summary.readyForSaleshandy || summary.qcPassed} Leads</span>
            </div>
            <button
              onClick={onDownloadCsv}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
