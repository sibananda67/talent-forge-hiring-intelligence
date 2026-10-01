import React, { useState, useMemo } from 'react';
import { Company } from '../types/talentForge';
import {
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  Building,
} from 'lucide-react';

interface CompaniesViewProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  initialFilter?: string;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  onSelectCompany,
  initialFilter,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter || 'ALL');

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.domain.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'QUALIFIED') return c.status === 'QC_PASSED' || c.status === 'READY_FOR_SALESHANDY' || c.status === 'EXPORTED' || c.status === 'SENT';
      if (statusFilter === 'REJECTED') return c.status === 'REJECTED' || c.status.endsWith('_FAILED') || c.status.endsWith('_REJECTED');
      return c.status === statusFilter;
    });
  }, [companies, search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company, domain, or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'QC_PASSED', 'SIGNALS_ANALYZED', 'QUALIFIED_FOR_CONTACT', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'QC_PASSED' ? 'QC Passed' : st === 'SIGNALS_ANALYZED' ? '3+ Signals' : st === 'QUALIFIED_FOR_CONTACT' ? 'Researched' : st === 'REJECTED' ? 'Rejected' : 'All Companies'}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Industry & Geography</th>
                <th className="py-3 px-4">Signals</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No companies match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((comp) => (
                  <tr
                    key={comp.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{comp.name}</div>
                      <a
                        href={comp.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-mono mt-0.5"
                      >
                        <span>{comp.domain}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div>{comp.industry}</div>
                      <div className="text-[11px] text-slate-500">{comp.geography} · {comp.employeeCount} staff</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {comp.signalCount !== undefined ? (
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          comp.signalCount >= 3
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
                            : 'bg-slate-900 text-slate-400'
                        }`}>
                          {comp.signalCount} / 5
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {comp.qualificationScore !== undefined ? (
                        <span className="font-bold text-white">
                          {comp.qualificationScore} <span className="text-[10px] text-slate-500">/ 35</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {comp.status === 'QC_PASSED' || comp.status === 'READY_FOR_SALESHANDY' || comp.status === 'EXPORTED' || comp.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          {comp.status === 'EXPORTED' ? 'Exported' : comp.status === 'SENT' ? 'Sent' : 'Saleshandy Ready'}
                        </span>
                      ) : comp.status === 'REJECTED' || comp.status.endsWith('_FAILED') || comp.status.endsWith('_REJECTED') ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/40 border border-rose-900/60 px-2 py-0.5 rounded" title={comp.rejectionReason}>
                          <AlertCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      ) : (
                        <span className="text-[11px] text-blue-400 font-medium">
                          {comp.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectCompany(comp)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>View Evidence</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
