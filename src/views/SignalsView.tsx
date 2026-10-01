import React from 'react';
import { Company } from '../types/talentForge';
import { Activity, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface SignalsViewProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
}

export const SignalsView: React.FC<SignalsViewProps> = ({
  companies,
  onSelectCompany,
}) => {
  return (
    <div className="space-y-6">
      {/* Methodology Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            The 5-Signal Investigation Gate & Hiring Friction Logic
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          A company having open positions does <strong>not</strong> mean they have a recruiting problem. Talent Forge requires at least 3 positive signals as an investigation threshold, followed by evidence-backed verification of specific hiring friction triggers (T1-T12).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="font-bold text-slate-200">1. Hiring Volume</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Urgent multi-role headcount expansion</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="font-bold text-slate-200">2. Ad Inefficiency</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Repeated & refreshed job ads</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="font-bold text-slate-200">3. Limited Support</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Small internal TA team relative to size</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="font-bold text-slate-200">4. Hiring Recruiter</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active open requisition for TA/Recruiter</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="font-bold text-slate-200">5. Fresh / Aged Ads</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Stalled roles &gt;30 days alongside new reqs</div>
          </div>
        </div>
      </div>

      {/* Evaluated Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectCompany(c)}
            className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors cursor-pointer space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{c.name}</h3>
                <div className="text-xs text-slate-400">{c.industry} · {c.geography}</div>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                (c.signalCount || 0) >= 3
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-900/60'
              }`}>
                {c.signalCount || 0} / 5 Signals
              </span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/50 p-2 rounded border border-slate-800/60">
              {c.apifySearchResult?.snippet || 'Search evidence processed.'}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Status: <strong className="text-white">{c.status}</strong></span>
              <span className="text-blue-400 hover:underline flex items-center gap-1 font-semibold text-[11px]">
                Inspect Evidence <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
