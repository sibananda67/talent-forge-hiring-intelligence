import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Activity,
  UserCheck,
  CheckCircle2,
  XCircle,
  Cpu,
  AlertTriangle,
  Coins,
  Settings,
  Flame,
  Plus,
  Download,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenNewCampaign: () => void;
  onDownloadCsv: () => void;
  qualifiedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenNewCampaign,
  onDownloadCsv,
  qualifiedCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Control Center', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'jobs', label: 'Current Jobs', icon: Briefcase },
    { id: 'signals', label: 'Friction Signals', icon: Activity },
    { id: 'contacts', label: 'Decision Makers', icon: UserCheck },
    { id: 'qualified', label: 'Outreach & Export', icon: CheckCircle2, badge: qualifiedCount },
    { id: 'rejected', label: 'Rejected Accounts', icon: XCircle },
    { id: 'automation', label: 'Automation Queue', icon: Cpu },
    { id: 'errors', label: 'Error Center', icon: AlertTriangle },
    { id: 'usage', label: 'API Meter & Costs', icon: Coins },
    { id: 'settings', label: 'Integrations & Keys', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              TALENT FORGE
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              Control Center
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-3.5 border-b border-slate-800/60">
        <button
          onClick={onOpenNewCampaign}
          className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Import & Start
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 tabular-nums">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick CSV Download Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
        <button
          onClick={onDownloadCsv}
          className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700/60 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
          <span className="text-[10px] bg-slate-900 text-slate-400 px-1 rounded tabular-nums">
            {qualifiedCount}
          </span>
        </button>
        <div className="mt-2 text-[10px] text-slate-500 text-center">
          Talent Forge v1.0 · Austin, TX
        </div>
      </div>
    </aside>
  );
};
