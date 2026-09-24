import React from 'react';
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
  TrendingUp,
  MapPin,
  Calendar,
  UserX,
  RotateCcw
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
  onOpenAddModal
}) {
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

  const metricCards = [
    {
      title: 'Total Assets',
      value: summary?.totalAssets || 0,
      sub: 'All recorded equipment',
      icon: Layers,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/60',
      onClick: () => onNavigateToAssets({ status: '' }),
      tag: 'View All'
    },
    ...(showPrice
      ? [
          {
            title: 'Total Asset Value',
            value: formatCurrency(summary?.totalAssetValue || 0, currency),
            sub: 'Cumulative purchase valuation',
            icon: IndianRupee,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            border: 'border-emerald-100 dark:border-emerald-900/60',
            onClick: () => onNavigateToAssets({ status: '' }),
            tag: 'Valuation'
          }
        ]
      : [
          {
            title: 'Available in Stock',
            value: summary?.availableAssets || 0,
            sub: 'Ready for allocation',
            icon: Clock,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            border: 'border-emerald-100 dark:border-emerald-900/60',
            onClick: () => onNavigateToAssets({ status: 'Available' }),
            tag: 'Available'
          }
        ]),
    {
      title: 'Active Assets',
      value: summary?.activeAssets || 0,
      sub: 'In use or deployed',
      icon: CheckCircle2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-100 dark:border-indigo-900/60',
      onClick: () => onNavigateToAssets({ status: 'Assigned' }),
      tag: 'Deployed'
    },
    {
      title: 'Assigned Assets',
      value: summary?.assignedAssets || 0,
      sub: 'Allocated to custodians',
      icon: UserCheck,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      border: 'border-sky-100 dark:border-sky-900/60',
      onClick: () => setCurrentTab ? setCurrentTab('assignments') : onNavigateToAssets({ status: 'Assigned' }),
      tag: 'Assignments'
    },
    {
      title: 'Under Repair',
      value: summary?.underRepair || 0,
      sub: 'At service / maintenance',
      icon: Wrench,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/60',
      onClick: () => setCurrentTab ? setCurrentTab('maintenance') : onNavigateToAssets({ status: 'Need to check' }),
      tag: 'Repairs'
    },
    {
      title: 'Lost / Damaged',
      value: summary?.lostAssets || 0,
      sub: 'Requiring review or write-off',
      icon: AlertOctagon,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-100 dark:border-rose-900/60',
      onClick: () => onNavigateToAssets({ status: 'Need to check' }),
      tag: 'Review'
    },
    {
      title: 'Pending Returns',
      value: summary?.pendingReturns || 0,
      sub: 'Awaiting check-in / resignation',
      icon: RotateCcw,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/60',
      onClick: () => setCurrentTab ? setCurrentTab('handovers') : onNavigateToAssets(),
      tag: 'Transfers'
    },
    {
      title: 'Resigned Staff',
      value: summary?.resignedEmployees || 0,
      sub: 'Offboarded clearance roster',
      icon: UserX,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-100 dark:border-rose-900/60',
      onClick: () => setCurrentTab ? setCurrentTab('handovers') : onNavigateToAssets(),
      tag: 'Clearance'
    },
    {
      title: 'Retired Assets',
      value: summary?.retiredAssets || 0,
      sub: 'Sold, scrapped or disposed',
      icon: Archive,
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-50 dark:bg-slate-800/40',
      border: 'border-slate-200 dark:border-slate-700',
      onClick: () => onNavigateToAssets({ status: 'Disposed' }),
      tag: 'Disposed'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Asset Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview of equipment, assignments, warranty tracking, and asset status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToAssets()}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          >
            View All Assets
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
          >
            + Add New Asset
          </button>
        </div>
      </div>

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

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => {
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

        {/* Location Distribution */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" /> Assets by Location
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Physical placement & desk allocation</p>
            </div>
          </div>

          <div className="h-64">
            {charts?.byLocation && charts.byLocation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.byLocation}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No location data yet
              </div>
            )}
          </div>
        </div>

        {/* Purchase Year Trends */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" /> Assets by Purchase Year
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Acquisition timeline & capital expenditure</p>
            </div>
          </div>

          <div className="h-64">
            {charts?.byPurchaseYear && charts.byPurchaseYear.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.byPurchaseYear} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
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
                      'Purchased'
                    ]}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No purchase timeline recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables: Recently Added & Recently Updated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recently Added Assets</h3>
            <button
              onClick={() => onNavigateToAssets({ sort_by: 'created_at', sort_order: 'DESC' })}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentlyAdded?.length > 0 ? (
              recentlyAdded.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectAsset(item)}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {item.id}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{item.category_name}</span>
                      {item.brand && (
                        <>
                          <span>•</span>
                          <span>{item.brand}</span>
                        </>
                      )}
                      {showPrice && item.purchase_price > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatCurrency(item.purchase_price, currency)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No assets recorded yet</p>
            )}
          </div>
        </div>

        {/* Recently Updated */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recently Updated Assets</h3>
            <button
              onClick={() => onNavigateToAssets({ sort_by: 'updated_at', sort_order: 'DESC' })}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentlyUpdated?.length > 0 ? (
              recentlyUpdated.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectAsset(item)}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {item.id}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{item.category_name}</span>
                      {item.assigned_to && (
                        <>
                          <span>•</span>
                          <span>Assigned: {item.assigned_to}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recent updates</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
