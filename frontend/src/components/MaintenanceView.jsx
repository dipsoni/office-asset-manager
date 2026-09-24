import React, { useState } from 'react';
import {
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { isPriceEnabled, isWarrantyEnabled } from '../config/features';
import { api } from '../api';

export default function MaintenanceView({
  records,
  onOpenLogModal,
  currency,
  settings,
  onRefresh
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const showPrice = isPriceEnabled(settings);
  const showWarranty = isWarrantyEnabled(settings);

  const filtered = records.filter((rec) => {
    const q = search.toLowerCase();
    const matchesSearch =
      rec.issue?.toLowerCase().includes(q) ||
      rec.asset_id?.toLowerCase().includes(q) ||
      rec.asset_name?.toLowerCase().includes(q) ||
      rec.repair_vendor?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && rec.repair_status !== statusFilter) return false;
    return true;
  });

  const totalCost = records.reduce((acc, curr) => acc + (Number(curr.repair_cost) || 0), 0);
  const inProgressCount = records.filter(
    (r) => r.repair_status === 'In Progress' || r.repair_status === 'Reported' || r.repair_status === 'Awaiting Parts'
  ).length;
  const warrantyClaimsCount = records.filter((r) => r.warranty_claim === 1).length;

  const handleMarkCompleted = async (rec) => {
    if (confirm(`Mark repair ticket for ${rec.asset_name} as Completed?`)) {
      try {
        await api.updateMaintenance(rec.id, {
          repair_status: 'Completed',
          received_date: new Date().toISOString().split('T')[0],
          revert_asset_status: true
        });
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Maintenance & Repair Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log hardware defects, vendor servicing, RMA claims, and repair expenditure
          </p>
        </div>

        <button
          onClick={onOpenLogModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Repair Ticket</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${showPrice && showWarranty ? 'md:grid-cols-4' : (showPrice || showWarranty ? 'md:grid-cols-3' : 'md:grid-cols-2')} gap-4`}>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Repair Tickets</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {records.length}
            </p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Servicing</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {inProgressCount}
            </p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {showPrice && (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Repair Spend</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalCost, currency)}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        )}

        {showWarranty && (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Warranty RMA Claims</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {warrantyClaimsCount}
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search issue, asset name, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'In Progress', 'Reported', 'Awaiting Parts', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {st === 'all' ? 'All Tickets' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Asset & Issue</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Service Vendor</th>
                <th className="py-3 px-3">Reported / Sent Date</th>
                {showPrice && <th className="py-3 px-3">Cost</th>}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={showPrice ? 6 : 5} className="py-8 text-center text-slate-400">
                    No maintenance records found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                            {item.asset_id}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.asset_name}
                          </span>
                          {showWarranty && item.warranty_claim === 1 && (
                            <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded">
                              RMA Claim
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                          {item.issue}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.repair_status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.repair_status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {item.repair_status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                      {item.repair_vendor || '—'}
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div>
                        <span>{formatDate(item.reported_date)}</span>
                        {item.received_date && (
                          <span className="block text-[10px] text-emerald-600">
                            Received: {formatDate(item.received_date)}
                          </span>
                        )}
                      </div>
                    </td>

                    {showPrice && (
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(item.repair_cost, currency)}
                      </td>
                    )}

                    <td className="py-3 px-4 text-right">
                      {item.repair_status !== 'Completed' && (
                        <button
                          onClick={() => handleMarkCompleted(item)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
