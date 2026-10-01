import React, { useState } from 'react';
import { IntegrationSettings } from '../types/talentForge';
import {
  Settings,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  Key,
  Sliders,
  Shield,
  Zap,
  Sparkles,
  Send,
  Info,
  ExternalLink,
} from 'lucide-react';

interface SettingsViewProps {
  settings: IntegrationSettings;
  onSaveSettings: (updates: Partial<IntegrationSettings & { apifyToken?: string; hunterApiKey?: string; saleshandyApiKey?: string; saleshandyApiBaseUrl?: string }>) => Promise<void>;
  onTestConnection: (service: string) => Promise<{ connected: boolean; message: string; diagnostics?: any }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onTestConnection,
}) => {
  const [apifyToken, setApifyToken] = useState('');
  const [hunterApiKey, setHunterApiKey] = useState('');
  const [saleshandyApiKey, setSaleshandyApiKey] = useState('');
  const [saleshandyApiBaseUrl, setSaleshandyApiBaseUrl] = useState(settings.saleshandyApiBaseUrl || 'https://open-api.saleshandy.com/v1');

  const [maxApifyConcurrency, setMaxApifyConcurrency] = useState(settings.maxApifyConcurrency || 5);
  const [maxHunterConcurrency, setMaxHunterConcurrency] = useState(settings.maxHunterConcurrency || 5);
  const [retryLimit, setRetryLimit] = useState(settings.retryLimit || 3);
  const [defaultGeography, setDefaultGeography] = useState(settings.defaultGeography || 'United States');
  const [defaultCandidateMultiplier, setDefaultCandidateMultiplier] = useState(settings.defaultCandidateMultiplier || 5);
  const [defaultMinSignals, setDefaultMinSignals] = useState(settings.defaultMinSignals || 3);

  const [testResults, setTestResults] = useState<Record<string, { testing: boolean; result?: { connected: boolean; message: string; diagnostics?: any } }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaleshandyKeyInput, setShowSaleshandyKeyInput] = useState(false);

  const runTest = async (service: string) => {
    setTestResults((prev) => ({ ...prev, [service]: { testing: true } }));
    try {
      const res = await onTestConnection(service);
      setTestResults((prev) => ({ ...prev, [service]: { testing: false, result: res } }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [service]: { testing: false, result: { connected: false, message: err.message } },
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        maxApifyConcurrency,
        maxHunterConcurrency,
        retryLimit,
        defaultGeography,
        defaultCandidateMultiplier,
        defaultMinSignals,
      };
      if (apifyToken.trim()) payload.apifyToken = apifyToken.trim();
      if (hunterApiKey.trim()) payload.hunterApiKey = hunterApiKey.trim();
      if (saleshandyApiKey.trim()) payload.saleshandyApiKey = saleshandyApiKey.trim();
      if (saleshandyApiBaseUrl.trim()) payload.saleshandyApiBaseUrl = saleshandyApiBaseUrl.trim();

      await onSaveSettings(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setApifyToken('');
      setHunterApiKey('');
      setSaleshandyApiKey('');
      setShowSaleshandyKeyInput(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Determine Saleshandy connection status badge
  const saleshandyTest = testResults['saleshandy'];
  const saleshandyStatus = saleshandyTest?.result
    ? saleshandyTest.result.connected
      ? 'CONNECTED'
      : 'ERROR'
    : settings.hasSaleshandyKey
    ? 'CONNECTED'
    : 'KEY PENDING';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Integrations Header */}
      <div>
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-400" />
          <span>Integrations & Keys</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Credentials are read only on the server, trimmed of accidental whitespace, and never exposed to browser client code.
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Apify */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Apify Integration</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              settings.hasApifyToken
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              {settings.hasApifyToken ? 'CONFIGURED' : 'TOKEN PENDING'}
            </span>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            Ingests Google Search Scraper datasets and runs. When unconfigured, realistic test datasets are provided for instant evaluation.
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Update Apify Token:
            </label>
            <input
              type="password"
              placeholder={settings.apifyTokenMasked ? `Current: ${settings.apifyTokenMasked}` : 'Enter Apify API token (apify_api_...)'}
              value={apifyToken}
              onChange={(e) => setApifyToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => runTest('apify')}
              disabled={testResults['apify']?.testing}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${testResults['apify']?.testing ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
            {testResults['apify']?.result && (
              <span className={`text-[11px] font-medium ${testResults['apify'].result.connected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testResults['apify'].result.message}
              </span>
            )}
          </div>
        </div>

        {/* Gemini */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-white">Gemini Intelligence</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
              ACTIVE
            </span>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            Powers hiring friction reasoning, decision-maker identification, qualification scoring (35p), and 3-touch personalized outreach copy generation.
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            Model: <span className="font-mono text-white">gemini-2.5-flash</span> (Server-Side Proxy via @google/genai)
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => runTest('gemini')}
              disabled={testResults['gemini']?.testing}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${testResults['gemini']?.testing ? 'animate-spin' : ''}`} />
              <span>Verify AI Status</span>
            </button>
            {testResults['gemini']?.result && (
              <span className="text-[11px] font-medium text-emerald-400">
                {testResults['gemini'].result.message}
              </span>
            )}
          </div>
        </div>

        {/* Hunter */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-white">Hunter (Enrichment & Verification)</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              settings.hasHunterKey
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              {settings.hasHunterKey ? 'CONFIGURED' : 'KEY PENDING'}
            </span>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            Identifies relevant pain owners (Talent Acquisition Directors, Recruiting Leaders) and enforces the hard verified-email gate.
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Update Hunter Key:
            </label>
            <input
              type="password"
              placeholder={settings.hunterKeyMasked ? `Current: ${settings.hunterKeyMasked}` : 'Enter Hunter API key...'}
              value={hunterApiKey}
              onChange={(e) => setHunterApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => runTest('hunter')}
              disabled={testResults['hunter']?.testing}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${testResults['hunter']?.testing ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
            {testResults['hunter']?.result && (
              <span className={`text-[11px] font-medium ${testResults['hunter'].result.connected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testResults['hunter'].result.message}
              </span>
            )}
          </div>
        </div>

        {/* Saleshandy - Official Outreach & Campaign Delivery Integration Card */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white">Saleshandy</span>
                <div className="text-[10px] text-slate-400">Email Outreach & Campaign Delivery</div>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              saleshandyStatus === 'CONNECTED'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : saleshandyStatus === 'ERROR'
                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                : 'bg-amber-950/60 text-amber-300 border-amber-800'
            }`}>
              Connection Status: {saleshandyStatus}
            </span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed">
            Delivers verified 3-touch outreach sequences directly into your active Saleshandy campaigns with all 19 hiring friction custom fields mapped.
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">API Key:</span>
              <span className="font-mono text-slate-200">
                {settings.saleshandyKeyMasked ? `******** (${settings.saleshandyKeyMasked})` : '********'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Base URL:</span>
              <span className="font-mono text-slate-400 truncate max-w-[200px]">
                {settings.saleshandyApiBaseUrl || 'https://open-api.saleshandy.com/v1'}
              </span>
            </div>
          </div>

          {/* Key input dropdown toggle */}
          {showSaleshandyKeyInput && (
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Saleshandy API Key (from Saleshandy Settings → API):
                </label>
                <input
                  type="password"
                  placeholder="Enter Saleshandy API key..."
                  value={saleshandyApiKey}
                  onChange={(e) => setSaleshandyApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  API Base URL (optional override):
                </label>
                <input
                  type="text"
                  placeholder="https://open-api.saleshandy.com/v1"
                  value={saleshandyApiBaseUrl}
                  onChange={(e) => setSaleshandyApiBaseUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Action Buttons as requested */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSaleshandyKeyInput(!showSaleshandyKeyInput)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>Update Saleshandy API Key</span>
            </button>

            <button
              type="button"
              onClick={() => runTest('saleshandy')}
              disabled={testResults['saleshandy']?.testing}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testResults['saleshandy']?.testing ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
              <span>Test Saleshandy Connection</span>
            </button>
          </div>

          {/* Safe Diagnostics Output */}
          {testResults['saleshandy']?.result && (
            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              testResults['saleshandy'].result.connected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/80'
            }`}>
              <div className="font-semibold flex items-center gap-1.5">
                {testResults['saleshandy'].result.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{testResults['saleshandy'].result.message}</span>
              </div>
              {testResults['saleshandy'].result.diagnostics && (
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60 mt-1">
                  <div>Key Present: <span className="text-white">{testResults['saleshandy'].result.diagnostics.keyExists ? 'Yes' : 'No'}</span></div>
                  <div>Length: <span className="text-white">{testResults['saleshandy'].result.diagnostics.keyLength} chars</span></div>
                  <div>Masked Pattern: <span className="text-white">{testResults['saleshandy'].result.diagnostics.firstFourChars}...{testResults['saleshandy'].result.diagnostics.lastFourChars}</span></div>
                  <div>HTTP Status: <span className="text-white">{testResults['saleshandy'].result.diagnostics.httpStatus || '200'}</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Orchestrator Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Pipeline Orchestration & Concurrency Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Max Apify Concurrency
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxApifyConcurrency}
              onChange={(e) => setMaxApifyConcurrency(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <span className="text-[10px] text-slate-500">Max concurrent scraper runs</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Max Hunter Concurrency
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxHunterConcurrency}
              onChange={(e) => setMaxHunterConcurrency(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <span className="text-[10px] text-slate-500">Hunter API rate throttle</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Task Retry Limit
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={retryLimit}
              onChange={(e) => setRetryLimit(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <span className="text-[10px] text-slate-500">Attempts before failing task</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Default Geography
            </label>
            <input
              type="text"
              value={defaultGeography}
              onChange={(e) => setDefaultGeography(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Candidate Multiplier
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={defaultCandidateMultiplier}
              onChange={(e) => setDefaultCandidateMultiplier(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <span className="text-[10px] text-slate-500">Raw discovery pool ratio</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Minimum Hiring Friction Signals
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={defaultMinSignals}
              onChange={(e) => setDefaultMinSignals(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <span className="text-[10px] text-slate-500">Default gate: 3 of 5 signals</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs">
            {saveSuccess && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved successfully!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
