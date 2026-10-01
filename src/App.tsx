import React, { useState, useEffect, useCallback } from 'react';
import {
  Campaign,
  Company,
  JobRecord,
  AutomationTask,
  ExecutionLog,
  PipelineSummary,
  ApiUsage,
  IntegrationSettings,
} from './types/talentForge';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CompanyModal } from './components/CompanyModal';
import { NewCampaignModal } from './components/NewCampaignModal';
import { DashboardView } from './views/DashboardView';
import { CompaniesView } from './views/CompaniesView';
import { JobsView } from './views/JobsView';
import { SignalsView } from './views/SignalsView';
import { ContactsView } from './views/ContactsView';
import { OutreachExportView } from './views/OutreachExportView';
import { RejectedView } from './views/RejectedView';
import { AutomationView } from './views/AutomationView';
import { ErrorCenterView } from './views/ErrorCenterView';
import { ApiUsageView } from './views/ApiUsageView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [summary, setSummary] = useState<PipelineSummary>({
    discovered: 0,
    validated: 0,
    signalsAnalyzed: 0,
    researched: 0,
    qualifiedForContact: 0,
    contactEnriched: 0,
    emailVerified: 0,
    scored: 0,
    outreachGenerated: 0,
    qcPassed: 0,
    readyForSaleshandy: 0,
    exportedToSaleshandy: 0,
    sent: 0,
    bounced: 0,
    replied: 0,
    rejected: 0,
    failed: 0,
  });

  const [usage, setUsage] = useState<ApiUsage>({
    apifyRuns: 0,
    apifyEstimatedCost: 0,
    geminiCalls: 0,
    geminiEstimatedCost: 0,
    hunterRequests: 0,
    hunterEstimatedCost: 0,
    totalEstimatedCost: 0,
    lastUpdated: new Date().toISOString(),
  });

  const [settings, setSettings] = useState<IntegrationSettings>({
    hasApifyToken: false,
    hasGeminiKey: false,
    hasHunterKey: false,
    hasSaleshandyKey: false,
    saleshandyApiBaseUrl: 'https://open-api.saleshandy.com/v1',
    defaultGeography: 'United States',
    defaultEmployeeFilter: 'NO_RESTRICTION',
    defaultCandidateMultiplier: 5,
    defaultMinSignals: 3,
    maxApifyConcurrency: 5,
    maxHunterConcurrency: 5,
    retryLimit: 3,
    testModeDefault: true,
  });

  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [selectedCompanyData, setSelectedCompanyData] = useState<any | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // 1. Load initial campaigns and settings
  const fetchInitialData = useCallback(async () => {
    try {
      const [cRes, sRes, uRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/settings'),
        fetch('/api/usage'),
      ]);

      if (cRes.ok) {
        const camps: Campaign[] = await cRes.json();
        setCampaigns(camps);
        if (camps.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(camps[0].id);
        }
      }

      if (sRes.ok) {
        const sett = await sRes.json();
        setSettings(sett);
      }

      if (uRes.ok) {
        const u = await uRes.json();
        setUsage(u);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // 2. Poll campaign details, companies, summary, tasks, and logs
  const fetchCampaignDetails = useCallback(async () => {
    if (!selectedCampaignId) return;

    try {
      const [compRes, sumRes, logsRes, tasksRes] = await Promise.all([
        fetch(`/api/campaigns/${selectedCampaignId}/companies`),
        fetch(`/api/campaigns/${selectedCampaignId}/pipeline-summary`),
        fetch(`/api/automation/logs?campaignId=${selectedCampaignId}`),
        fetch(`/api/automation/tasks?campaignId=${selectedCampaignId}`),
      ]);

      if (compRes.ok) {
        const comps: Company[] = await compRes.json();
        setCompanies(comps);
      }

      if (sumRes.ok) {
        const s = await sumRes.json();
        setSummary(s);
      }

      if (logsRes.ok) {
        const l = await logsRes.json();
        setLogs(l);
      }

      if (tasksRes.ok) {
        const t = await tasksRes.json();
        setTasks(t);
      }
    } catch (err) {
      console.warn('Poll error:', err);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    fetchCampaignDetails();
    const interval = setInterval(fetchCampaignDetails, 2500);
    return () => clearInterval(interval);
  }, [fetchCampaignDetails]);

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId) || null;

  // Actions
  const handleCreateCampaign = async (campaignData: any) => {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData),
    });

    if (res.ok) {
      const created: Campaign = await res.json();
      setCampaigns((prev) => [created, ...prev]);
      setSelectedCampaignId(created.id);
      setCurrentTab('dashboard');
    }
  };

  const handleStartCampaign = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}/start`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
      fetchCampaignDetails();
    }
  };

  const handlePauseCampaign = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}/pause`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  };

  const handleDownloadCsv = () => {
    if (!selectedCampaignId) return;
    const url = `/api/campaigns/${selectedCampaignId}/export/csv`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenCompanyDetail = async (company: Company) => {
    try {
      const res = await fetch(`/api/companies/${company.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setSelectedCompanyData(fullData);
        setIsCompanyModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load company detail:', err);
    }
  };

  const handleCompanyAction = async (companyId: string, action: string, reason?: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        await fetchCampaignDetails();
        // Refresh detail view
        const refreshed = await fetch(`/api/companies/${companyId}`);
        if (refreshed.ok) {
          const full = await refreshed.json();
          setSelectedCompanyData(full);
        }
      }
    } catch (err) {
      console.error('Failed company action:', err);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    await fetch(`/api/automation/tasks/${taskId}/retry`, { method: 'POST' });
    fetchCampaignDetails();
  };

  const handleSaveSettings = async (updates: any) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setSettings(updated);
    }
  };

  const handleTestConnection = async (service: string) => {
    const res = await fetch('/api/settings/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
    });
    return await res.json();
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
        onDownloadCsv={handleDownloadCsv}
        qualifiedCount={summary.qcPassed}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          campaigns={campaigns}
          selectedCampaign={activeCampaign}
          onSelectCampaign={setSelectedCampaignId}
          onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
          onStartCampaign={handleStartCampaign}
          onPauseCampaign={handlePauseCampaign}
          isProcessing={tasks.some((t) => t.status === 'RUNNING')}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {currentTab === 'dashboard' && (
            <DashboardView
              campaign={activeCampaign}
              summary={summary}
              logs={logs}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
              onDownloadCsv={handleDownloadCsv}
              onSelectStage={(stage) => {
                if (stage === 'QC_PASSED') setCurrentTab('qualified');
                else if (stage === 'CONTACT' || stage === 'EMAIL_VERIFIED') setCurrentTab('contacts');
                else if (stage === 'SIGNALS' || stage === 'RESEARCHED') setCurrentTab('signals');
                else setCurrentTab('companies');
              }}
            />
          )}

          {currentTab === 'companies' && (
            <CompaniesView
              companies={companies}
              onSelectCompany={handleOpenCompanyDetail}
            />
          )}

          {currentTab === 'jobs' && (
            <JobsView jobs={jobs} companies={companies} />
          )}

          {currentTab === 'signals' && (
            <SignalsView
              companies={companies}
              onSelectCompany={handleOpenCompanyDetail}
            />
          )}

          {currentTab === 'contacts' && (
            <ContactsView
              contacts={companies
                .map((c) => selectedCompanyData?.contacts?.find((ct: any) => ct.companyId === c.id))
                .filter(Boolean)}
              companies={companies}
            />
          )}

          {currentTab === 'qualified' && (
            <OutreachExportView
              companies={companies}
              onSelectCompany={handleOpenCompanyDetail}
              onDownloadCsv={handleDownloadCsv}
            />
          )}

          {currentTab === 'rejected' && (
            <RejectedView
              companies={companies}
              onSelectCompany={handleOpenCompanyDetail}
              onRerun={(id) => handleCompanyAction(id, 'RETRY_RESEARCH')}
            />
          )}

          {currentTab === 'automation' && (
            <AutomationView
              tasks={tasks}
              companies={companies}
              onRetryTask={handleRetryTask}
            />
          )}

          {currentTab === 'errors' && (
            <ErrorCenterView
              tasks={tasks}
              companies={companies}
              onRetryTask={handleRetryTask}
            />
          )}

          {currentTab === 'usage' && <ApiUsageView usage={usage} />}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onTestConnection={handleTestConnection}
            />
          )}
        </main>
      </div>

      {/* New Campaign Ingestion Modal */}
      <NewCampaignModal
        isOpen={isNewCampaignOpen}
        onClose={() => setIsNewCampaignOpen(false)}
        onSubmit={handleCreateCampaign}
      />

      {/* Company 360 Detail & Evidence Vault Modal */}
      <CompanyModal
        data={selectedCompanyData}
        onClose={() => {
          setIsCompanyModalOpen(false);
          setSelectedCompanyData(null);
        }}
        onAction={handleCompanyAction}
      />
    </div>
  );
}

export default App;
