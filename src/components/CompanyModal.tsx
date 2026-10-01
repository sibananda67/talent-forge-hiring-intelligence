import React, { useState } from 'react';
import {
  Company,
  JobRecord,
  HiringSignals,
  HiringResearch,
  ContactRecord,
  QualificationRecord,
  OutreachRecord,
} from '../types/talentForge';
import {
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Copy,
  RefreshCw,
  Mail,
  User,
  Activity,
  Award,
  Send,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';

interface Company360Data {
  company: Company;
  jobs: JobRecord[];
  signals?: HiringSignals;
  research?: HiringResearch;
  contacts: ContactRecord[];
  qualification?: QualificationRecord;
  outreach?: OutreachRecord;
}

interface CompanyModalProps {
  data: Company360Data | null;
  onClose: () => void;
  onAction: (companyId: string, action: string, reason?: string) => Promise<void>;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  data,
  onClose,
  onAction,
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'outreach' | 'qualification' | 'jobs'>('evidence');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!data) return null;

  const { company, jobs, signals, research, contacts, qualification, outreach } = data;
  const primaryContact = contacts.find((c) => c.isVerifiedBusinessEmail) || contacts[0];

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = () => {
    if (company.status === 'QC_PASSED' || company.status === 'READY_FOR_SALESHANDY' || company.status === 'EXPORTED' || company.status === 'SENT') {
      return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {company.status === 'EXPORTED' ? 'Synced to Saleshandy' : company.status === 'SENT' ? 'Campaign Sent' : 'QC Passed · Saleshandy Ready'}
        </span>
      );
    }
    if (company.status === 'REJECTED' || company.status.endsWith('_FAILED')) {
      return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {company.rejectionReason ? `Rejected: ${company.rejectionReason.slice(0, 32)}...` : company.status}
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
        Pipeline: {company.status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {company.name}
              </h2>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <span>{company.domain}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span aria-hidden="true">·</span>
              <span>{company.industry}</span>
              <span aria-hidden="true">·</span>
              <span>{company.geography}</span>
              <span aria-hidden="true">·</span>
              <span>{company.employeeCount} staff</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction(company.id, 'RETRY_RESEARCH')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-blue-400" />
              <span>Rerun Research</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-slate-800 px-6 bg-slate-950/40 gap-2">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'evidence'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Friction & Evidence Vault</span>
          </button>
          <button
            onClick={() => setActiveTab('outreach')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'outreach'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>3-Touch Outreach & QC</span>
          </button>
          <button
            onClick={() => setActiveTab('qualification')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'qualification'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>35-Point Scorecard</span>
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'jobs'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Jobs ({jobs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FRICTION & EVIDENCE */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Friction Trigger Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                  Documented Hiring Friction
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Hiring Trigger</div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      {research?.hiringTrigger || 'Pending Research'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Why Now Event</div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      {research?.whyNow || 'Pending Research'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Specific Hiring Problem</div>
                    <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      {research?.specificHiringProblem || 'Evaluating specific bottlenecks...'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Internal Recruiting Capacity</div>
                    <div className="text-xs font-mono font-semibold text-amber-400 mt-0.5">
                      {research?.internalRecruitingCapacity || 'UNKNOWN'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Decision Maker (Hunter) */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    Hunter Verified Decision Maker
                  </div>
                  {primaryContact?.isVerifiedBusinessEmail && (
                    <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Email Verified ({primaryContact.hunterConfidence}% Confidence)
                    </span>
                  )}
                </div>

                {primaryContact ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Full Name</div>
                      <div className="text-sm font-bold text-white mt-0.5">{primaryContact.fullName}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Verified Title</div>
                      <div className="text-xs font-semibold text-slate-300 mt-0.5">{primaryContact.title}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Verified Business Email</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-emerald-400 font-bold">{primaryContact.email}</span>
                        <button
                          onClick={() => copyToClipboard(primaryContact.email, 'email')}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedField === 'email' && (
                          <span className="text-[10px] text-emerald-400">Copied!</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>No verified business email found yet. Hard gate prevents export without verified email.</span>
                  </div>
                )}
              </div>

              {/* 5-Signal Filter Audit */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    5-Signal Hiring Friction Filter
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {signals ? `${signals.positiveSignalCount}/5 Positive Signals` : 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${signals?.highVolumeHiring ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <span>1. High Hiring Volume</span>
                    <span className="font-bold">{signals?.highVolumeHiring ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${signals?.inefficientJobAdvertising ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <span>2. Inefficient Job Advertising</span>
                    <span className="font-bold">{signals?.inefficientJobAdvertising ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${signals?.limitedRecruitingSupport ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <span>3. Limited Visible Recruiting Support</span>
                    <span className="font-bold">{signals?.limitedRecruitingSupport ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${signals?.hiringRecruiter ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <span>4. Hiring a Recruiter</span>
                    <span className="font-bold">{signals?.hiringRecruiter ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between sm:col-span-2 ${signals?.freshOrAgedJobAds ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <span>5. Fresh / Aged Job Postings</span>
                    <span className="font-bold">{signals?.freshOrAgedJobAds ? 'YES' : 'NO'}</span>
                  </div>
                </div>

                {signals?.signalNotes && signals.signalNotes.length > 0 && (
                  <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                    {signals.signalNotes.map((note, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-400">·</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidence Vault */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Evidence Vault & Audit Trail
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Evidence URL:</span>
                    <a
                      href={research?.evidenceUrl || company.apifySearchResult?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px] max-w-md truncate"
                    >
                      <span>{research?.evidenceUrl || company.apifySearchResult?.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400">Evidence Summary:</span>
                    <p className="text-slate-200 mt-1 text-[11px] leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      {research?.evidenceSummary || company.apifySearchResult?.snippet}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Evidence Date: {research?.evidenceDate || company.apifySearchResult?.date || 'Current'}</span>
                    <span>Confidence: {research?.evidenceConfidence || 95}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OUTREACH & QC */}
          {activeTab === 'outreach' && (
            <div className="space-y-6">
              {outreach ? (
                <>
                  {/* Touch 1 */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Touch 1: Custom Subject & Body (70-120 words)</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(outreach.customBody, 'touch1')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'touch1' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      Subject: <span className="text-white">{outreach.customSubject}</span>
                    </div>
                    <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                      {outreach.customBody}
                    </pre>
                  </div>

                  {/* Follow Up 1 */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-white">Touch 2: Follow Up One</div>
                      <button
                        onClick={() => copyToClipboard(outreach.followUpOne, 'touch2')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'touch2' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                      {outreach.followUpOne}
                    </pre>
                  </div>

                  {/* Follow Up 2 */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-white">Touch 3: Follow Up Two</div>
                      <button
                        onClick={() => copyToClipboard(outreach.followUpTwo, 'touch3')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'touch3' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                      {outreach.followUpTwo}
                    </pre>
                  </div>

                  {/* QC Checklist */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        AI Quality Control Audit (21 Checkpoints)
                      </div>
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        {outreach.qcPassed ? 'PASSED' : 'ACTION REQUIRED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Object.entries(outreach.qcChecklist || {}).map(([rule, pass]) => (
                        <div key={rule} className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800/60">
                          <span className="text-slate-300 text-[11px]">{rule}</span>
                          <span className={`text-[10px] font-bold ${pass ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pass ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Outreach generation pending qualification gate passage.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUALIFICATION SCORECARD */}
          {activeTab === 'qualification' && (
            <div className="space-y-6">
              {qualification ? (
                <>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Overall Qualification Score</div>
                      <div className="text-3xl font-extrabold text-white font-mono mt-1">
                        {qualification.totalScore} <span className="text-sm font-normal text-slate-400">/ 35</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        {qualification.qualificationReason}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                        qualification.scoreRating === 'STRONG'
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : qualification.scoreRating === 'REVIEW'
                          ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                          : 'bg-rose-950/60 border-rose-800 text-rose-300'
                      }`}>
                        Rating: {qualification.scoreRating}
                      </span>
                    </div>
                  </div>

                  {/* 7 Breakdown Categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <span className="text-slate-300">A. Hiring Demand</span>
                      <span className="font-mono font-bold text-white">{qualification.scoreA_HiringDemand} / 5</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <span className="text-slate-300">B. Hiring Friction</span>
                      <span className="font-mono font-bold text-white">{qualification.scoreB_HiringFriction} / 5</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <span className="text-slate-300">C. Hiring Urgency</span>
                      <span className="font-mono font-bold text-white">{qualification.scoreC_HiringUrgency} / 5</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <span className="text-slate-300">D. Hiring Difficulty</span>
                      <span className="font-mono font-bold text-white">{qualification.scoreD_HiringDifficulty} / 5</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <span className="text-slate-300">E. Recruiting Capacity</span>
                      <span className="font-mono font-bold text-white">{qualification.scoreE_RecruitingCapacity} / 5</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <span className="text-slate-300">F. Economic Fit</span>
                      <span className="font-mono font-bold text-white">{qualification.scoreF_EconomicFit} / 5</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between sm:col-span-2">
                      <span className="text-slate-300">G. Evidence Quality</span>
                      <span className="font-mono font-bold text-white">{qualification.scoreG_EvidenceQuality} / 5</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Qualification scorecard pending research analysis.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CURRENT JOBS */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Extracted Job Openings ({jobs.length})</span>
                <span>Freshness: FRESH (0-14d), RECENT (15-30d), AGING (31-60d), OLD (61+d)</span>
              </div>

              {jobs.map((job) => (
                <div key={job.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{job.jobTitle}</h4>
                      <div className="text-xs text-slate-400 mt-0.5">{job.location} · Category: {job.category}</div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      job.freshness === 'FRESH'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        : job.freshness === 'RECENT'
                        ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                    }`}>
                      {job.freshness}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[10px] max-w-sm truncate"
                    >
                      <span>{job.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span>Posting Date: {job.postingDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Internal Company ID: <span className="font-mono text-slate-300">{company.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction(company.id, 'REJECT')}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Manual Reject
            </button>
            <button
              onClick={() => onAction(company.id, 'APPROVE')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Approve for Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
