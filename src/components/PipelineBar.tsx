import React from 'react';
import { PipelineSummary } from '../types/talentForge';
import {
  Search,
  CheckCircle,
  Briefcase,
  Activity,
  FileText,
  User,
  ShieldCheck,
  Award,
  Send,
  CheckCheck,
  Download,
} from 'lucide-react';

interface PipelineBarProps {
  summary: PipelineSummary;
  activeFilter?: string;
  onSelectStage?: (stage: string) => void;
}

export const PipelineBar: React.FC<PipelineBarProps> = ({
  summary,
  activeFilter,
  onSelectStage,
}) => {
  const stages = [
    { id: 'DISCOVERED', label: 'Discovered', count: summary.discovered, icon: Search, color: 'text-slate-400' },
    { id: 'VALIDATED', label: 'Validated', count: summary.validated, icon: CheckCircle, color: 'text-blue-400' },
    { id: 'SIGNALS', label: '3+ Signals', count: summary.signalsAnalyzed, icon: Activity, color: 'text-indigo-400' },
    { id: 'RESEARCHED', label: 'Friction', count: summary.researched, icon: FileText, color: 'text-cyan-400' },
    { id: 'CONTACT', label: 'Contact', count: summary.contactEnriched, icon: User, color: 'text-teal-400' },
    { id: 'EMAIL_VERIFIED', label: 'Verified', count: summary.emailVerified, icon: ShieldCheck, color: 'text-emerald-400' },
    { id: 'SCORED', label: 'Scored (35p)', count: summary.scored, icon: Award, color: 'text-amber-400' },
    { id: 'OUTREACH', label: 'Outreach', count: summary.outreachGenerated, icon: Send, color: 'text-violet-400' },
    { id: 'QC_PASSED', label: 'QC Passed', count: summary.qcPassed, icon: CheckCheck, color: 'text-emerald-400' },
    { id: 'READY_FOR_SALESHANDY', label: 'Saleshandy Ready', count: summary.readyForSaleshandy, icon: ShieldCheck, color: 'text-emerald-300' },
    { id: 'EXPORTED', label: 'Synced', count: summary.exportedToSaleshandy, icon: Download, color: 'text-sky-400' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Live Lead Pipeline Funnel</span>
        <span className="text-[11px] text-slate-500">Click any stage to filter candidate records</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {stages.map((st, i) => {
          const Icon = st.icon;
          const isSelected = activeFilter === st.id;
          return (
            <button
              key={st.id}
              onClick={() => onSelectStage && onSelectStage(st.id)}
              className={`p-2 rounded-lg text-left transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-3.5 h-3.5 ${st.color}`} />
                <span className="font-mono text-sm font-bold text-white tabular-nums">
                  {st.count}
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-400 truncate">
                {st.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
