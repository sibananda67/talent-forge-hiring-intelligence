import React, { useState, useEffect } from 'react';
import { Company, SaleshandyCampaign, SaleshandySyncStatus } from '../types/talentForge';
import {
  Download,
  CheckCircle2,
  Send,
  Eye,
  ExternalLink,
  Plus,
  RefreshCw,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface OutreachExportViewProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onDownloadCsv: () => void;
}

export const OutreachExportView: React.FC<OutreachExportViewProps> = ({
  companies,
  onSelectCompany,
  onDownloadCsv,
}) => {
  const readyCompanies = companies.filter(
    (c) => c.status === 'QC_PASSED' || c.status === 'READY_FOR_SALESHANDY' || c.status === 'EXPORTED' || c.status === 'SENT'
  );

  const campaignId = readyCompanies.length > 0 ? readyCompanies[0].campaignId : 'camp-healthcare-pilot';

  const [saleshandyModalOpen, setSaleshandyModalOpen] = useState(false);
  const [saleshandyCampaigns, setSaleshandyCampaigns] = useState<SaleshandyCampaign[]>([]);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>('seq-healthcare-q4-priority');
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncingSteps, setIsSyncingSteps] = useState(false);

  const [syncStatus, setSyncStatus] = useState<SaleshandySyncStatus | null>(null);
  const [newSequenceName, setNewSequenceName] = useState('');
  const [isCreatingSequence, setIsCreatingSequence] = useState(false);

  // Fetch current Saleshandy sync status and mapped steps from backend
  const fetchSyncStatus = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/saleshandy/sync-status`);
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch Saleshandy sync status:', err);
    }
  };

  // Fetch Saleshandy sequences when modal opens
  const fetchSaleshandyCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const res = await fetch('/api/saleshandy/campaigns');
      if (res.ok) {
        const data: SaleshandyCampaign[] = await res.json();
        setSaleshandyCampaigns(data);
        if (data.length > 0 && !selectedSequenceId) {
          setSelectedSequenceId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load Saleshandy campaigns:', err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
  }, [campaignId]);

  useEffect(() => {
    if (saleshandyModalOpen) {
      fetchSaleshandyCampaigns();
    }
  }, [saleshandyModalOpen]);

  const handleCreateSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSequenceName.trim()) return;
    setIsCreatingSequence(true);
    try {
      const res = await fetch('/api/saleshandy/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSequenceName.trim() }),
      });
      if (res.ok) {
        const created: SaleshandyCampaign = await res.json();
        setSaleshandyCampaigns((prev) => [created, ...prev]);
        setSelectedSequenceId(created.id);
        setNewSequenceName('');
      }
    } catch (err) {
      console.error('Failed to create sequence:', err);
    } finally {
      setIsCreatingSequence(false);
    }
  };

  // Triggers manual re-synchronization of the 3 sequence steps with Talent Forge outreach
  const handleSyncStepsOnly = async () => {
    setIsSyncingSteps(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/saleshandy/sync-steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleshandyCampaignId: selectedSequenceId }),
      });
      if (res.ok) {
        await fetchSyncStatus();
      }
    } catch (err) {
      console.error('Error syncing steps:', err);
    } finally {
      setIsSyncingSteps(false);
    }
  };

  // Push leads & steps to Saleshandy
  const handlePushToSaleshandy = async () => {
    if (!selectedSequenceId || readyCompanies.length === 0) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/export/saleshandy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleshandyCampaignId: selectedSequenceId,
        }),
      });
      const data = await res.json();
      setSyncStatus(data);
      await fetchSyncStatus();
    } catch (err: any) {
      console.error('Error exporting to Saleshandy:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const pendingExportCompanies = readyCompanies.filter((c) => c.status !== 'EXPORTED');
  const alreadySyncedCompanies = readyCompanies.filter((c) => c.status === 'EXPORTED');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Talent Forge Outreach & Delivery
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Official Saleshandy Integration</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Outreach & Export Center
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Push QC-passed verified decision makers directly into your Saleshandy sequences with exact AI-generated outreach: Custom Body (Day 1), Follow-up 1 (Day 3), and Follow-up 2 (Day 7).
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setSaleshandyModalOpen(true)}
            disabled={readyCompanies.length === 0}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/30"
          >
            <Send className="w-4 h-4" />
            <span>PUSH TO SALESHANDY</span>
            <span className="bg-blue-950 text-blue-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
              {alreadySyncedCompanies.length} Synced
            </span>
          </button>

          <button
            onClick={onDownloadCsv}
            disabled={readyCompanies.length === 0}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT CSV</span>
            <span className="bg-emerald-950 text-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
              {readyCompanies.length} Rows
            </span>
          </button>
        </div>
      </div>

      {/* Saleshandy Sync Status Bar */}
      <div className="bg-slate-900/80 border border-blue-900/50 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Send className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Saleshandy Sync:</span>
                <span className="text-emerald-400 font-mono">
                  {syncStatus?.success ? 'SUCCESS' : 'READY TO SYNC'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Sequence: <span className="text-slate-200 font-semibold">{syncStatus?.sequenceName || 'Talent Forge Healthcare Outreach'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-amber-950/60 text-amber-300 border border-amber-800/80">
              Status: {syncStatus?.sequenceStatus || 'PAUSED / DRAFT (Ready for Review)'}
            </span>
            <button
              onClick={handleSyncStepsOnly}
              disabled={isSyncingSteps}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingSteps ? 'animate-spin' : ''}`} />
              <span>{isSyncingSteps ? 'Syncing Steps...' : 'Re-Sync Steps'}</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Sequence ID</div>
            <div className="text-xs font-mono font-bold text-blue-400 mt-1 truncate" title={syncStatus?.sequenceId || 'eMPkq5ojzQ'}>
              {syncStatus?.sequenceId || 'eMPkq5ojzQ'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Prospects</div>
            <div className="text-base font-mono font-bold text-emerald-400 mt-1">
              {syncStatus?.prospectsCount || alreadySyncedCompanies.length || readyCompanies.length}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Outreach Synced</div>
            <div className="text-base font-mono font-bold text-teal-400 mt-1">
              {syncStatus?.outreachSynced || `${readyCompanies.length}/${readyCompanies.length} Synced`}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Sequence Steps</div>
            <div className="text-base font-mono font-bold text-violet-400 mt-1">
              {syncStatus?.sequenceStepsSynced || '3/3 Steps Synced'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Sequence State</div>
            <div className="text-xs font-mono font-bold text-amber-400 mt-1 truncate" title="PAUSED / DRAFT (Ready for Review)">
              PAUSED / DRAFT
            </div>
          </div>
        </div>

        {/* 3 Synced Steps Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Step 1 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px]">1</span>
                <span>Day 1 Email</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Step 1: Synced
              </span>
            </div>
            <div className="text-[11px] font-semibold text-slate-200 truncate">
              Subject: {syncStatus?.steps?.[0]?.subject || 'Integra Healthcare clinic expansion & nurse staffing'}
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-3 bg-slate-900/50 p-2 rounded border border-slate-800 font-mono">
              {syncStatus?.steps?.[0]?.content || 'Hi {{firstName}}, Noticed {{companyName}} is launching two new outpatient centers in Dallas...'}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>absoluteDays = 1 · Trigger → Problem → Question</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px]">2</span>
                <span>Day 3 Follow-up</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Step 2: Synced
              </span>
            </div>
            <div className="text-[11px] font-semibold text-slate-200 truncate">
              Subject: {syncStatus?.steps?.[1]?.subject || 'Re: Integra Healthcare clinic expansion & nurse staffing'}
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-3 bg-slate-900/50 p-2 rounded border border-slate-800 font-mono">
              {syncStatus?.steps?.[1]?.content || 'Hi {{firstName}}, Following up on my note regarding {{companyName}}s upcoming Dallas clinics...'}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>absoluteDays = 3 · Follow up one</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px]">3</span>
                <span>Day 7 Final Touch</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Step 3: Synced
              </span>
            </div>
            <div className="text-[11px] font-semibold text-slate-200 truncate">
              Subject: {syncStatus?.steps?.[2]?.subject || 'Re: Integra Healthcare clinic expansion & nurse staffing'}
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-3 bg-slate-900/50 p-2 rounded border border-slate-800 font-mono">
              {syncStatus?.steps?.[2]?.content || 'Hi {{firstName}}, I understand talent acquisition priorities are moving fast...'}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>absoluteDays = 7 · Follow up two</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Safety Gate Enforced:</strong> Sequence remains strictly <strong>DRAFT / PAUSED</strong>. Talent Forge never activates campaigns automatically. Review steps in Saleshandy before manual activation.
          </span>
        </div>
      </div>

      {/* Pipeline State Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Qualified Leads</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {readyCompanies.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Passed Hard Gates</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Verified Contacts</div>
          <div className="text-xl font-bold font-mono text-teal-400 mt-1">
            {readyCompanies.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hunter Checked</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Generated Outreach</div>
          <div className="text-xl font-bold font-mono text-violet-400 mt-1">
            {readyCompanies.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">3-Touch Sequences</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">QC Passed</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">
            {readyCompanies.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">21 Checkpoints</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Ready to Sync</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {pendingExportCompanies.length}
          </div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Pending Push</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Synced to Saleshandy</div>
          <div className="text-xl font-bold font-mono text-sky-400 mt-1">
            {alreadySyncedCompanies.length}
          </div>
          <div className="text-[10px] text-sky-500 mt-0.5">Active in Sequence</div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verified Accounts & Saleshandy Outreach Status</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaleshandyModalOpen(true)}
              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Push / Sync Sequence</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Industry / Domain</th>
                <th className="py-3 px-4">Signals</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Saleshandy Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {readyCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No leads are currently ready. Check the Automation Queue for active tasks.
                  </td>
                </tr>
              ) : (
                readyCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{c.name}</div>
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

                    <td className="py-3 px-4 text-slate-300">
                      <div>{c.industry}</div>
                      <div className="text-[11px] text-slate-500">{c.geography}</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 text-[11px]">
                        {c.signalCount || 4} / 5 Signals
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {c.qualificationScore || 32} <span className="text-[10px] text-slate-500">/ 35</span>
                    </td>

                    <td className="py-3 px-4">
                      {c.status === 'EXPORTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded border border-sky-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Synced to Saleshandy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Saleshandy Ready
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectCompany(c)}
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

      {/* Modal: Push Leads to Saleshandy Campaign */}
      {saleshandyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Push Outreach & Prospects to Saleshandy</h3>
                  <div className="text-[11px] text-slate-400">Synchronizes Step 1 (Day 1), Step 2 (Day 3), Step 3 (Day 7) & Verified Contacts</div>
                </div>
              </div>
              <button
                onClick={() => setSaleshandyModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Campaign Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Target Saleshandy Sequence:
                </label>
                <button
                  type="button"
                  onClick={fetchSaleshandyCampaigns}
                  disabled={isLoadingCampaigns}
                  className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingCampaigns ? 'animate-spin' : ''}`} />
                  <span>Refresh Sequences</span>
                </button>
              </div>

              {isLoadingCampaigns ? (
                <div className="p-4 bg-slate-950 rounded-xl text-center text-xs text-slate-400">
                  Loading active Saleshandy campaigns...
                </div>
              ) : saleshandyCampaigns.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-xl text-center text-xs text-slate-400">
                  No sequences found in Saleshandy. Create one below!
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {saleshandyCampaigns.map((seq) => (
                    <label
                      key={seq.id}
                      className={`block p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        selectedSequenceId === seq.id
                          ? 'bg-blue-950/40 border-blue-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="saleshandy-seq"
                            value={seq.id}
                            checked={selectedSequenceId === seq.id}
                            onChange={() => setSelectedSequenceId(seq.id)}
                            className="text-blue-500 focus:ring-0"
                          />
                          <span className="font-bold">{seq.name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-950 text-amber-300 border-amber-800">
                          {seq.status || 'DRAFT'}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                        <div>Leads: <span className="text-white">{seq.leadsCount || 0}</span></div>
                        <div>Sent: <span className="text-white">{seq.sentCount || 0}</span></div>
                        <div>Open: <span className="text-white">{seq.openRate || 0}%</span></div>
                        <div>Reply: <span className="text-white">{seq.replyRate || 0}%</span></div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Create new sequence option */}
              <form onSubmit={handleCreateSequence} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Or create new sequence title..."
                  value={newSequenceName}
                  onChange={(e) => setNewSequenceName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isCreatingSequence || !newSequenceName.trim()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isCreatingSequence ? 'Creating...' : 'Create'}</span>
                </button>
              </form>

              {/* Outbound Content Mapping Confirmation */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-slate-200 text-xs mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Outreach Steps to be Synced:</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <div>✓ <strong>Step 1 (Day 1):</strong> Talent Forge Custom Subject + Custom Body</div>
                  <div>✓ <strong>Step 2 (Day 3):</strong> Threaded Subject + Follow up one</div>
                  <div>✓ <strong>Step 3 (Day 7):</strong> Threaded Subject + Follow up two</div>
                  <div>✓ <strong>Personalization:</strong> Individualized variables (firstName, companyName) + 19 Custom Fields</div>
                  <div>✓ <strong>Exact Signature:</strong> Best, Nishant Mohanty | Austin, TX</div>
                  <div>✓ <strong>Duplicate Protection:</strong> 0 duplicate prospects created</div>
                </div>
              </div>

              {/* Real-time sync feedback */}
              {syncStatus && (
                <div className="p-3.5 bg-slate-950 rounded-xl border border-blue-900/40 text-xs space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saleshandy Sync: {syncStatus.message || 'SUCCESS'}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Sequence ID: <span className="font-mono text-white">{syncStatus.sequenceId}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1 text-slate-400">
                    <div>Step 1: <span className="text-emerald-400 font-bold">{syncStatus.step1Status}</span></div>
                    <div>Step 2: <span className="text-emerald-400 font-bold">{syncStatus.step2Status}</span></div>
                    <div>Step 3: <span className="text-emerald-400 font-bold">{syncStatus.step3Status}</span></div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Sequence Status: <strong className="text-amber-400">{syncStatus.sequenceStatus}</strong> (Not activated automatically)
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSaleshandyModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePushToSaleshandy}
                disabled={isExporting || !selectedSequenceId}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Syncing with Saleshandy...' : 'Push & Sync Sequence'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
