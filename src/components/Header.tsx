import React from 'react';
import { Campaign } from '../types/talentForge';
import {
  Sparkles,
  Play,
  Pause,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  onSelectCampaign: (id: string) => void;
  onOpenNewCampaign: () => void;
  onStartCampaign: (id: string) => void;
  onPauseCampaign: (id: string) => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  campaigns,
  selectedCampaign,
  onSelectCampaign,
  onOpenNewCampaign,
  onStartCampaign,
  onPauseCampaign,
  isProcessing,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Campaign Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Campaign:</label>
          <select
            value={selectedCampaign?.id || ''}
            onChange={(e) => onSelectCampaign(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 max-w-xs truncate cursor-pointer"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.industry})
              </option>
            ))}
          </select>
        </div>

        {selectedCampaign && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>{selectedCampaign.geography}</span>
            <span aria-hidden="true">·</span>
            <span>Target: <strong className="text-white font-mono">{selectedCampaign.targetLeads}</strong> leads</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize text-slate-300 font-mono text-[11px]">
              Apify: {selectedCampaign.apifyInputId.slice(0, 16)}...
            </span>
          </div>
        )}
      </div>

      {/* Campaign Control & Action Buttons */}
      <div className="flex items-center gap-2.5">
        {selectedCampaign && (
          <>
            {selectedCampaign.status === 'running' || isProcessing ? (
              <button
                onClick={() => onPauseCampaign(selectedCampaign.id)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={() => onStartCampaign(selectedCampaign.id)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Pipeline</span>
              </button>
            )}
          </>
        )}

        <button
          onClick={onOpenNewCampaign}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>New Campaign</span>
        </button>
      </div>
    </header>
  );
};
