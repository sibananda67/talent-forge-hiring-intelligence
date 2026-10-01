import React from 'react';
import { ApiUsage } from '../types/talentForge';
import { Coins, Zap, Shield, Sparkles } from 'lucide-react';

interface ApiUsageViewProps {
  usage: ApiUsage;
}

export const ApiUsageView: React.FC<ApiUsageViewProps> = ({ usage }) => {
  return (
    <div className="space-y-6">
      {/* Total Cost Card */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Campaign Cost & Consumption Meter
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            ${usage.totalEstimatedCost.toFixed(3)}{' '}
            <span className="text-xs font-normal text-slate-400">USD Estimated</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            Tracks real consumption across Apify SERP scrapers, Gemini reasoning models, and Hunter verification requests.
          </p>
        </div>

        <div className="text-right text-xs text-slate-400">
          Last Synced: <span className="font-mono text-slate-300">{new Date(usage.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 3 Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Apify */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Apify Search Engine
            </span>
            <span className="text-[10px] font-mono text-slate-400">apify/google-search</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {usage.apifyRuns} <span className="text-xs font-normal text-slate-400">Runs / Datasets</span>
          </div>
          <div className="text-xs text-slate-400">
            Estimated Spend: <strong className="text-white font-mono">${usage.apifyEstimatedCost.toFixed(3)}</strong>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            Max concurrency limited to 5 to protect Apify plan quotas.
          </div>
        </div>

        {/* Gemini */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Gemini Reasoning API
            </span>
            <span className="text-[10px] font-mono text-slate-400">gemini-3.8-flash</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {usage.geminiCalls} <span className="text-xs font-normal text-slate-400">Model Calls</span>
          </div>
          <div className="text-xs text-slate-400">
            Estimated Spend: <strong className="text-white font-mono">${usage.geminiEstimatedCost.toFixed(3)}</strong>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            Structured JSON schemas for zero-hallucination audits.
          </div>
        </div>

        {/* Hunter */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Hunter Email Verifier
            </span>
            <span className="text-[10px] font-mono text-slate-400">api.hunter.io/v2</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {usage.hunterRequests} <span className="text-xs font-normal text-slate-400">Queries / Verifications</span>
          </div>
          <div className="text-xs text-slate-400">
            Estimated Spend: <strong className="text-white font-mono">${usage.hunterEstimatedCost.toFixed(3)}</strong>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            Strict hard gate: only delivers verified professional mailboxes.
          </div>
        </div>
      </div>
    </div>
  );
};
