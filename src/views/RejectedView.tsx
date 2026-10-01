import React from 'react';
import { Company } from '../types/talentForge';
import { AlertCircle, RefreshCw, ExternalLink, Eye } from 'lucide-react';

interface RejectedViewProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onRerun: (companyId: string) => void;
}

export const RejectedView: React.FC<RejectedViewProps> = ({
  companies,
  onSelectCompany,
  onRerun,
}) => {
  const rejected = companies.filter(
    (c) => c.status === 'REJECTED' || c.status.endsWith('_FAILED')
  );

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Rejected Accounts & Failed Gate Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hard gates protect campaign deliverability and brand reputation. Accounts that fail mandatory gates are segregated here with documented causes.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded border border-rose-900">
          {rejected.length} Rejected
        </span>
      </div>

      {/* Rejected Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Industry / Domain</th>
              <th className="py-3 px-4">Rejection Reason & Gate Failed</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rejected.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                  No accounts have been rejected in this campaign.
                </td>
              </tr>
            ) : (
              rejected.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{c.geography}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-300">{c.industry}</div>
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-mono mt-0.5"
                    >
                      <span>{c.domain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>

                  <td className="py-3 px-4 max-w-md">
                    <div className="text-xs text-rose-300 font-medium leading-relaxed bg-rose-950/30 p-2 rounded border border-rose-900/40">
                      {c.rejectionReason || 'Failed verification checks.'}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onSelectCompany(c)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() => onRerun(c.id)}
                      className="px-2.5 py-1 bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
