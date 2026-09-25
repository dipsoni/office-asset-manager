import React, { useState } from 'react';
import {
  Layers,
  IndianRupee,
  CheckCircle2,
  Clock,
  UserCheck,
  Wrench,
  AlertOctagon,
  Archive,
  ShieldAlert,
  ArrowRight,
  Plus,
  ArrowLeftRight,
  Upload,
  BookOpen,
  HelpCircle,
  TrendingUp,
  MapPin,
  Calendar,
  UserX,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters';
import { isPriceEnabled, isWarrantyEnabled } from '../config/features';

const CHART_COLORS = [
  '#2563eb', // blue
  '#059669', // emerald
  '#7c3aed', // purple
  '#0891b2', // cyan
  '#d97706', // amber
  '#dc2626', // red
  '#4f46e5', // indigo
  '#db2777', // pink
  '#64748b'  // slate
];

export default function DashboardView({
  dashboardData,
  currency,
  settings,
  setCurrentTab,
  onNavigateToAssets,
  onSelectAsset,
  onOpenAddModal,
  onOpenAssignModal,
  onOpenImportModal,
  onOpenGuide
}) {
  const [showGuideBanner, setShowGuideBanner] = useState(() => {
    return localStorage.getItem('assetvault_hide_quickstart') !== 'true';
  });

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { summary, warrantySummary, charts, recentlyAdded, recentlyUpdated } = dashboardData;
  const showPrice = isPriceEnabled(settings);
  const showWarranty = isWarrantyEnabled(settings);

  const handleDismissBanner = () => {
    setShowGuideBanner(false);
    localStorage.setItem('assetvault_hide_quickstart', 'true');
  };

  // Primary Action Cards
  const quickActions = [
    {
      title: 'Add New Asset',
      desc: 'Register a laptop, monitor, or hardware',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      iconBg: 'bg-blue-500/30 text-white',
      onClick: onOpenAddModal,
      badge: 'Quick Add'
    },
    {
      title: 'Assign to Employee',
      desc: 'Hand over equipment to a team member',
      icon: UserCheck,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      iconBg: 'bg-indigo-500/30 text-white',
      onClick: () => (onOpenAssignModal ? onOpenAssignModal() : setCurrentTab('assignments')),
      badge: `${summary?.availableAssets || 0} in stock`
    },
    {
      title: 'Transfer & Return',
      desc: 'Recover equipment or clear resigned staff',
      icon: ArrowLeftRight,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      iconBg: 'bg-emerald-500/30 text-white',
      onClick: () => setCurrentTab('handovers'),
      badge: summary?.resignedEmployees > 0 ? `${summary.resignedEmployees} Resigned` : 'Offboarding'
    },
    {
      title: 'Import from Excel',
      desc: 'Upload company spreadsheet in seconds',
      icon: Upload,
      color: 'bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600',
      iconBg: 'bg-white/20 text-white',
      onClick: onOpenImportModal,
      badge: 'Auto-fill'
    }
  ];

  // Core Fleet Metrics
  const primaryMetrics = [
    {
      title: 'Total Assets',
      value: summary?.totalAssets || 0,
      sub: 'Total equipment recorded',
      icon: Layers,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/60',
      onClick: () => onNavigateToAssets({ status: '' }),
      tag: 'Full Inventory'
    },
    {
      title: 'Assigned / In Use',
      value: summary?.activeAssets || 0,
      sub: 'Currently with team members',
      icon: UserCheck,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-100 dark:border-indigo-900/60',
      onClick: () => onNavigateToAssets({ status: 'Assigned' }),
      tag: 'Deployed'
    },
    {
      title: 'Available in Stock',
      value: summary?.availableAssets || 0,
      sub: 'Ready for new assignment',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/60',
      onClick: () => onNavigateToAssets({ status: 'Available' }),
      tag: 'Ready to Deploy'
    },
    {
      title: 'Under Repair',
      value: summary?.underRepair || 0,
      sub: 'At vendor / maintenance',
      icon: Wrench,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/60',
      onClick: () => setCurrentTab('maintenance'),
      tag: 'Maintenance'
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-view-fade">
      {/* Header & Help Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Asset Dashboard
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Workspace
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your hardware inventory, assignments, transfers, and warranties in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>How to Use Guide</span>
          </button>
          <button
            onClick={() => onNavigateToAssets()}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            View All Assets ({summary?.totalAssets || 0})
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS HUB (4 Big Easy Buttons) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Quick Actions — What do you want to do?
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={action.onClick}
                className={`p-4 rounded-xl ${action.color} text-left transition-all duration-200 shadow-sm hover:shadow-md card-hover-effect flex flex-col justify-between group relative overflow-hidden`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className={`p-2.5 rounded-lg ${action.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {action.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white">
                      {action.badge}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-bold flex items-center gap-1 text-white">
                    {action.title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-200" />
                  </h4>
                  <p className="text-xs text-white/80 mt-0.5 line-clamp-1">
                    {action.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* GETTING STARTED BANNER (Easy Walkthrough) */}
      {showGuideBanner && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/30 rounded-xl border border-blue-200/80 dark:border-indigo-800/50 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                💡
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Quick Start in 3 Easy Steps
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>1. Add Equipment</strong> via "+ Add Asset" or "Import Excel" → <strong>2. Assign to Staff</strong> with 1 click → <strong>3. Recover Assets</strong> when employees leave or upgrade.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenGuide}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Read Quick Guide
              </button>
              <button
                onClick={handleDismissBanner}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 text-xs font-medium"
                title="Dismiss guide banner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE FLEET METRIC CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Inventory & Fleet Health
          </h3>
          <span className="text-xs text-slate-400">Click any card to view list</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {primaryMetrics.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={card.onClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && card.onClick && card.onClick()}
                className={`p-4 rounded-xl bg-white dark:bg-slate-900 border ${card.border} shadow-sm card-hover-effect cursor-pointer group flex flex-col justify-between select-none relative overflow-hidden`}
                title={`Click to view ${card.title}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    {card.title}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-blue-500" />
                  </span>
                  <div className={`p-2 rounded-lg ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {card.value}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {card.sub}
                    </div>
                  </div>
                  {card.tag && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-60 group-hover:opacity-100 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
                      {card.tag}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Quick Attention Alert (If Resigned Staff or Pending Returns) */}
      {(summary?.resignedEmployees > 0 || summary?.pendingReturns > 0) && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-lg">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Action Required: Resigned Staff Clearance ({summary.resignedEmployees})
              </h4>
              <p className="text-xs text-rose-800 dark:text-rose-300/80">
                There are hardware assets pending return from offboarded employees.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab('handovers')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0"
          >
            Review & Recover Assets →
          </button>
        </div>
      )}

      {/* Warranty Expiry Radar Alert */}
      {showWarranty && (warrantySummary?.expiring90 > 0 || warrantySummary?.expired > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Warranty Radar Alerts
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                  Track upcoming warranty dates so you never miss repair claims or extended service renewals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onNavigateToAssets({ warranty_filter: '30' })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950/60 dark:hover:bg-red-900/80 dark:text-red-300 border border-red-200 dark:border-red-800 transition-colors"
              >
                ≤30 Days ({warrantySummary?.expiring30 || 0})
              </button>
              <button
                onClick={() => onNavigateToAssets({ warranty_filter: '60' })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:hover:bg-amber-900/90 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition-colors"
              >
                ≤60 Days ({warrantySummary?.expiring60 || 0})
              </button>
              <button
                onClick={() => onNavigateToAssets({ warranty_filter: '90' })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-950/60 dark:hover:bg-yellow-900/80 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 transition-colors"
              >
                ≤90 Days ({warrantySummary?.expiring90 || 0})
              </button>
              <button
                onClick={() => onNavigateToAssets({ warranty_filter: 'expired' })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition-colors"
              >
                Expired ({warrantySummary?.expired || 0})
              </button>
            </div>
          </div>

          {/* Imminent items */}
          {warrantySummary?.expiringList && warrantySummary.expiringList.length > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-200/80 dark:border-amber-800/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {warrantySummary.expiringList.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectAsset(item)}
                  className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Expires: {formatDate(item.warranty_end_date)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 shrink-0">
                    {item.days_left}d left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Assets by Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribution across equipment types</p>
            </div>
            <button
              onClick={() => onNavigateToAssets()}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            {charts?.byCategory && charts.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.byCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                    formatter={(val, name, props) => [
                      showPrice && props.payload.total_value > 0
                        ? `${val} assets (${formatCurrency(props.payload.total_value, currency)})`
                        : `${val} assets`,
                      'Count'
                    ]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {charts.byCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No category data yet
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Assets by Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current deployment lifecycle state</p>
            </div>
          </div>

          <div className="h-64">
            {charts?.byStatus && charts.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                  >
                    {charts.byStatus.map((entry, index) => (
                      <Cell
                        key={`cell-status-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No status data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
