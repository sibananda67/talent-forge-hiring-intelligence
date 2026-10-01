import React, { useState } from 'react';
import { X, Play, Sparkles, Check, Info } from 'lucide-react';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (campaignData: any) => Promise<void>;
}

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('US Healthcare — Surgical & Specialty Centers');
  const [industry, setIndustry] = useState('Healthcare');
  const [geography, setGeography] = useState('United States');
  const [targetLeads, setTargetLeads] = useState(30);
  const [candidateMultiplier, setCandidateMultiplier] = useState(5);
  const [minSignalCount, setMinSignalCount] = useState(3);
  const [employeeFilter, setEmployeeFilter] = useState('NO_RESTRICTION');
  const [apifyInputId, setApifyInputId] = useState('PUxiS5H5qX5p6FG4Q');
  const [isTestMode, setIsTestMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        industry,
        geography,
        targetLeads: isTestMode ? 3 : Number(targetLeads),
        candidateMultiplier: Number(candidateMultiplier),
        minSignalCount: Number(minSignalCount),
        employeeFilter,
        apifyInputId,
        isTestMode,
        startImmediately: true,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPreset = (preset: 'healthcare' | 'tech' | 'logistics') => {
    if (preset === 'healthcare') {
      setName('US Healthcare — Specialized Clinics & Surgical Centers');
      setIndustry('Healthcare');
      setApifyInputId('PUxiS5H5qX5p6FG4Q');
    } else if (preset === 'tech') {
      setName('Enterprise Cloud & Infrastructure Scaleups');
      setIndustry('Technology');
      setApifyInputId('sample-apify-google-scraper-tech');
    } else if (preset === 'logistics') {
      setName('Regional Freight & Supply Chain Hubs');
      setIndustry('Logistics & Supply Chain');
      setApifyInputId('sample-apify-google-scraper-logistics');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Launch Hiring Friction Campaign
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your campaign parameters and Apify Dataset / Run ID once. The central automation engine executes all downstream stages automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => loadPreset('healthcare')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors cursor-pointer"
          >
            Healthcare Pilot
          </button>
          <button
            type="button"
            onClick={() => loadPreset('tech')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors cursor-pointer"
          >
            Tech Infrastructure
          </button>
          <button
            type="button"
            onClick={() => loadPreset('logistics')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors cursor-pointer"
          >
            Logistics & Freight
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              placeholder="e.g. US Healthcare — Specialized Surgical Centers"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="Healthcare">Healthcare</option>
                <option value="Technology">Technology & Software</option>
                <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                <option value="Manufacturing">Manufacturing & Engineering</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Energy & Cleantech">Energy & Cleantech</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Geography
              </label>
              <input
                type="text"
                required
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Apify Input ID */}
          <div className="bg-slate-950/70 border border-blue-900/40 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <span>Apify Dataset ID or Run ID</span>
                <span className="text-[10px] font-normal text-slate-400">(from apify/google-search-scraper)</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                Primary Discovery Input
              </span>
            </div>
            <input
              type="text"
              required
              value={apifyInputId}
              onChange={(e) => setApifyInputId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
              placeholder="e.g. PUxiS5H5qX5p6FG4Q or 23V8k9wLmqP"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Paste the Dataset ID from your Apify Google search run. The system reads the candidate organic search results, filters out aggregators, and extracts company domains automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Target Leads
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={targetLeads}
                onChange={(e) => setTargetLeads(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Candidate Multiplier
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={candidateMultiplier}
                onChange={(e) => setCandidateMultiplier(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Min Signals
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={minSignalCount}
                onChange={(e) => setMinSignalCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Employee Filter
              </label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="NO_RESTRICTION">No Restriction</option>
                <option value="50-500">50 - 500</option>
                <option value="100-1000">100 - 1000</option>
              </select>
            </div>
          </div>

          {/* Test Campaign Mode Toggle */}
          <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="testMode"
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0 focus:outline-none bg-slate-900 border-slate-700 cursor-pointer"
              />
              <label htmlFor="testMode" className="text-xs text-slate-200 font-medium cursor-pointer">
                <strong>Test Mode</strong> (Process 3 qualified leads for rapid pipeline verification)
              </label>
            </div>
            <span className="text-[10px] text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded font-mono">
              Recommended
            </span>
          </div>

          {/* Rules Summary */}
          <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
            <div className="text-slate-300 font-semibold mb-1">Hard Gates Enforced Automatically:</div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Direct US employer validation (rejects aggregators & job boards)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Minimum 3 supported hiring friction signals (Volume, Ads, Capacity, etc.)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Hunter verified business email (strictly no guessed emails, no export without verification)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> 3-Touch personalized outreach with exact Nishant Mohanty signature & AI QC audit
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {isSubmitting ? 'Starting Orchestration...' : 'Import Apify Data & Start Automation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
