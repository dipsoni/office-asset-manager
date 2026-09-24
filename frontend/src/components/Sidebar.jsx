import React from 'react';
import {
  LayoutDashboard,
  Layers,
  UserCheck,
  Wrench,
  FolderTree,
  FileSpreadsheet,
  Database,
  Settings,
  ShieldCheck,
  HardDrive,
  Laptop,
  ArrowLeftRight
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, stats, settings }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Assets Inventory', icon: Layers, badge: stats?.totalAssets },
    { id: 'assignments', label: 'Assignments', icon: UserCheck, badge: stats?.assignedAssets },
    { id: 'handovers', label: 'Asset Transfer', icon: ArrowLeftRight, badge: stats?.pendingHandovers },
    { id: 'maintenance', label: 'Maintenance & Repairs', icon: Wrench, badge: stats?.underRepair },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none transition-colors duration-200">
      {/* Brand Header */}
      <div
        onClick={() => setCurrentTab('dashboard')}
        className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
        title="Go to Dashboard"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
          <Laptop className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            AssetVault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Asset Management</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    isActive
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Local System Status Card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Local & Offline
            </span>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
              v1.0.0
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <HardDrive className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate" title="SQLite: ./data/assets.db">SQLite: assets.db</span>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
              {(settings?.owner_name || 'Deep')[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {settings?.owner_name || 'Deep'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {settings?.company_name || 'Personal Workspace'}
              </p>
            </div>
          </div>
          <div title="Private single-user workspace">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>
    </aside>
  );
}
