import React, { useState } from 'react';
import { JobRecord, Company } from '../types/talentForge';
import { ExternalLink, Search, Briefcase, Filter } from 'lucide-react';

interface JobsViewProps {
  jobs: JobRecord[];
  companies: Company[];
}

export const JobsView: React.FC<JobsViewProps> = ({ jobs, companies }) => {
  const [search, setSearch] = useState('');
  const [freshnessFilter, setFreshnessFilter] = useState('ALL');

  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  const filteredJobs = jobs.filter((j) => {
    const companyName = companyMap.get(j.companyId) || '';
    const matchSearch =
      j.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      companyName.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (freshnessFilter === 'ALL') return true;
    return j.freshness === freshnessFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search job title, company, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['ALL', 'FRESH', 'RECENT', 'AGING'].map((f) => (
            <button
              key={f}
              onClick={() => setFreshnessFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                freshnessFilter === f
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f === 'ALL' ? 'All Jobs' : `${f} Openings`}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredJobs.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
            No job openings match your search filter.
          </div>
        ) : (
          filteredJobs.map((job) => {
            const companyName = companyMap.get(job.companyId) || 'Company';
            return (
              <div
                key={job.id}
                className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{job.jobTitle}</h3>
                    <div className="text-xs font-medium text-blue-400 mt-0.5">{companyName}</div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                    job.freshness === 'FRESH'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                      : job.freshness === 'RECENT'
                      ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                  }`}>
                    {job.freshness} (0-14d)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>{job.location}</span>
                  <span aria-hidden="true">·</span>
                  <span>Category: {job.category}</span>
                  {job.isRecruitingRole && (
                    <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-800 px-1.5 py-0.2 rounded font-bold">
                      Recruiter Role
                    </span>
                  )}
                  {job.isSpecialized && (
                    <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded">
                      Specialized
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[10px] max-w-xs truncate"
                  >
                    <span>{job.url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-500 font-mono text-[10px]">
                    Posted: {job.postingDate}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
