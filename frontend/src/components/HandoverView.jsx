import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Printer,
  ChevronRight,
  UserCheck,
  Building,
  Calendar,
  Layers,
  FileText,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../api';
import { formatDate } from '../utils/formatters';
import ResignationConfirmModal from './ResignationConfirmModal';
import ResignedEmployeeModal from './ResignedEmployeeModal';

export default function HandoverView({
  onOpenNewHandover,
  onOpenBulkHandover,
  onOpenImportHandover,
  onViewSlip,
  onSelectAsset,
  settings,
  onDataChange
}) {
  const VALID_SUBTABS = ['history', 'pending', 'employees'];

  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hashParts = window.location.hash.replace(/^#\/?/, '').split('/');
      if (hashParts[0] === 'handovers' && hashParts[1] && VALID_SUBTABS.includes(hashParts[1].toLowerCase())) {
        return hashParts[1].toLowerCase();
      }
      const stored = localStorage.getItem('assetvault_handover_subtab');
      if (stored && VALID_SUBTABS.includes(stored)) {
        return stored;
      }
    }
    return 'history';
  });

  useEffect(() => {
    localStorage.setItem('assetvault_handover_subtab', activeSubTab);
    const hashParts = window.location.hash.replace(/^#\/?/, '').split('/');
    if (hashParts[0] === 'handovers' && hashParts[1] !== activeSubTab) {
      window.location.hash = `#/handovers/${activeSubTab}`;
    }
  }, [activeSubTab]);
  const [handovers, setHandovers] = useState([]);
  const [stats, setStats] = useState({
    pendingReturns: 0,
    returnedToday: 0,
    pendingHandovers: 0,
    handoversThisMonth: 0,
    totalReassigned: 0,
    withResigned: 0
  });
  const [employees, setEmployees] = useState([]);
  const [resignationTargetEmployee, setResignationTargetEmployee] = useState(null);
  const [selectedResignedEmployee, setSelectedResignedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [handoversRes, statsRes, employeesRes] = await Promise.all([
        api.getHandovers(),
        api.getHandoverStats(),
        api.getEmployees()
      ]);
      setHandovers(handoversRes || []);
      setStats(statsRes || {});
      setEmployees(employeesRes || []);

      // If resigned employee modal is open, keep its state in sync with fresh data
      setSelectedResignedEmployee((prev) => {
        if (!prev) return null;
        return (employeesRes || []).find((e) => e.id === prev.id || e.name === prev.name) || prev;
      });

      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      console.error('Error fetching handover data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Handovers
  const filteredHandovers = useMemo(() => {
    return handovers.filter((h) => {
      const q = search.toLowerCase();
      const matchesSearch =
        h.handover_id?.toLowerCase().includes(q) ||
        h.asset_code?.toLowerCase().includes(q) ||
        h.asset_name?.toLowerCase().includes(q) ||
        h.from_employee_name?.toLowerCase().includes(q) ||
        h.to_employee_name?.toLowerCase().includes(q) ||
        h.reason?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      if (reasonFilter !== 'all' && h.reason !== reasonFilter) return false;

      return true;
    });
  }, [handovers, search, statusFilter, reasonFilter]);

  // Pending Actions (Returns or Handovers)
  const pendingActions = useMemo(() => {
    return handovers.filter(
      (h) => h.status === 'Pending Return' || h.status === 'Pending Handover'
    );
  }, [handovers]);

  // Quick Action Handler (e.g. mark pending return as Returned or complete pending handover)
  const handleQuickStatusUpdate = async (handoverId, newStatus) => {
    try {
      setActionLoadingId(handoverId);
      await api.updateHandover(handoverId, { status: newStatus });
      await fetchData();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenResignationModal = (emp) => {
    setResignationTargetEmployee(emp);
  };

  const handleConfirmResignation = async (assetAction) => {
    if (!resignationTargetEmployee) return;
    const emp = resignationTargetEmployee;
    await api.updateEmployeeStatus(emp.id, {
      status: 'Resigned',
      resignation_date: new Date().toISOString().split('T')[0],
      asset_action: assetAction
    });
    
    // Fetch fresh data and immediately open the resigned employee clearance modal
    const freshEmployees = await api.getEmployees();
    setEmployees(freshEmployees || []);
    const updatedEmp = (freshEmployees || []).find((e) => e.id === emp.id || e.name === emp.name);
    if (updatedEmp) {
      setSelectedResignedEmployee(updatedEmp);
    }
    await fetchData();
  };

  const handleReactivateEmployee = async (emp) => {
    if (!window.confirm(`Re-activate ${emp.name} to Active status?`)) return;
    try {
      await api.updateEmployeeStatus(emp.id, {
        status: 'Active',
        resignation_date: null
      });
      await fetchData();
    } catch (err) {
      alert(`Failed to update employee status: ${err.message}`);
    }
  };

  const handleOpenEmployeeClearance = (emp) => {
    setSelectedResignedEmployee(emp);
  };

  const reasonsList = useMemo(() => {
    const set = new Set();
    handovers.forEach((h) => {
      if (h.reason) set.add(h.reason);
    });
    return Array.from(set);
  }, [handovers]);

  return (
    <div className="space-y-6 pb-14">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Asset Handover & Reassignment Hub
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              Module Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain complete chronological custody history, manage employee resignation handovers, and print slips.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {onOpenImportHandover && (
            <button
              onClick={onOpenImportHandover}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Handover Sheet</span>
            </button>
          )}

          <button
            onClick={() => onOpenBulkHandover()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Bulk Handover (Resignation)</span>
          </button>

          <button
            onClick={onOpenNewHandover}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Handover</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Pending Returns */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Returns
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.pendingReturns || 0}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Awaiting check-in</span>
          </div>
        </div>

        {/* 2. Returned Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Returned Today
            </span>
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.returnedToday || 0}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Back in stock</span>
          </div>
        </div>

        {/* 3. Pending Handovers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Handovers
            </span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.pendingHandovers || 0}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Ready to issue</span>
          </div>
        </div>

        {/* 4. Handovers This Month */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Month
            </span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.handoversThisMonth || 0}
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Transfers</span>
          </div>
        </div>

        {/* 5. Assets Reassigned */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reassigned
            </span>
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.totalReassigned || 0}
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">All time</span>
          </div>
        </div>

        {/* 6. With Resigned Staff */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resigned Custody
            </span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {stats.withResigned || 0}
            </span>
            <span className="text-[10px] text-rose-500 font-medium">Needs return</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/10 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Handover History & Ledger</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
            {handovers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('pending')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'pending'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-900/10 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Action Queue</span>
          {pendingActions.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold">
              {pendingActions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('employees')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'employees'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-900/10 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory & Clearance</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
            {employees.length}
          </span>
        </button>
      </div>

      {/* TAB 1: HANDOVER HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Slip #, Asset code, employee or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="Handed Over">Handed Over</option>
                <option value="Returned">Returned</option>
                <option value="Pending Return">Pending Return</option>
                <option value="Pending Handover">Pending Handover</option>
              </select>

              {/* Reason Filter */}
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Reasons</option>
                {reasonsList.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchData}
                title="Refresh ledger"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Slip ID / Date</th>
                    <th className="py-3 px-4">Asset Code & Item</th>
                    <th className="py-3 px-4">Transfer Details (From → To)</th>
                    <th className="py-3 px-4">Reason & Condition</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredHandovers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-medium">No handover records found matching your filters.</p>
                        <p className="text-[11px] mt-0.5 text-slate-400">
                          Click "+ New Handover" to record your first asset transfer.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredHandovers.map((h) => {
                      const isHandedOver = h.status === 'Handed Over';
                      const isReturned = h.status === 'Returned';
                      const isPendingReturn = h.status === 'Pending Return';
                      const isPendingHandover = h.status === 'Pending Handover';

                      return (
                        <tr
                          key={h.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Slip ID & Date */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {h.handover_id}
                            </span>
                            <div className="text-[11px] text-slate-400">
                              {formatDate(h.handover_date || h.return_date || h.created_at)}
                            </div>
                          </td>

                          {/* Asset */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectAsset({ id: h.asset_id, asset_code: h.asset_code, name: h.asset_name })
                              }
                              className="text-left group"
                            >
                              <div className="font-mono font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                                {h.asset_code || `Asset #${h.asset_id}`}
                              </div>
                              <div className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[180px]">
                                {h.asset_name || 'Hardware Asset'}
                              </div>
                            </button>
                          </td>

                          {/* Custody Route */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {h.from_employee_name || 'Company Stock'}
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                              <span
                                className={`font-semibold ${
                                  h.to_employee_name
                                    ? 'text-blue-700 dark:text-blue-400'
                                    : 'text-emerald-700 dark:text-emerald-400 italic'
                                }`}
                              >
                                {h.to_employee_name || 'Returned to Stock'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {h.from_department && <span>Dept: {h.from_department}</span>}
                              {h.to_department && <span> → {h.to_department}</span>}
                            </div>
                          </td>

                          {/* Reason & Condition */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-700 dark:text-slate-300">
                              {h.reason || 'General Handover'}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Cond: {h.condition_after || h.condition_before || 'Good'}</span>
                              {h.accessories_returned && (
                                <span className="truncate max-w-[120px]" title={h.accessories_returned}>
                                  • Acc: {h.accessories_returned}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                isHandedOver
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : isReturned
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : isPendingReturn
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              }`}
                            >
                              {isHandedOver && <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                              {isReturned && <RotateCcw className="w-3 h-3 text-emerald-600" />}
                              {isPendingReturn && <Clock className="w-3 h-3 text-amber-600" />}
                              {isPendingHandover && <ArrowRight className="w-3 h-3 text-purple-600" />}
                              <span>{h.status}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => onViewSlip(h)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Slip</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING ACTIONS QUEUE */}
      {activeSubTab === 'pending' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>
                These items are currently scheduled for return or awaiting new custodian handover. Complete them with
                1-click below.
              </span>
            </div>
            <span className="font-bold text-amber-700 dark:text-amber-300">
              {pendingActions.length} Pending Actions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingActions.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">All queues are clear!</p>
                <p className="text-xs text-slate-400">There are no pending returns or handovers awaiting action.</p>
              </div>
            ) : (
              pendingActions.map((item) => {
                const isPendingReturn = item.status === 'Pending Return';
                const isLoading = actionLoadingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {item.handover_id}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            isPendingReturn
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-2">
                        <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {item.asset_code} • {item.asset_name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>Held by: <strong>{item.from_employee_name}</strong></span>
                          {item.to_employee_name && (
                            <>
                              <span>→</span>
                              <span>To: <strong>{item.to_employee_name}</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] space-y-1">
                        <div>
                          Reason: <strong className="text-slate-700 dark:text-slate-300">{item.reason}</strong>
                        </div>
                        {item.remarks && (
                          <div className="text-slate-500 italic">Notes: "{item.remarks}"</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => onViewSlip(item)}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Slip</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {isPendingReturn && (
                          <button
                            disabled={isLoading}
                            onClick={() => handleQuickStatusUpdate(item.id, 'Returned')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Mark Returned</span>
                          </button>
                        )}

                        <button
                          disabled={isLoading}
                          onClick={() => handleQuickStatusUpdate(item.id, 'Handed Over')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete Handover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEE DIRECTORY & RESIGNATION WORKFLOW */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>
                Employee Hardware Custody Directory. Employees marked as "Resigned" who still hold assets are
                flagged for clearance.
              </span>
            </div>
            <button
              onClick={() => onOpenBulkHandover()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all whitespace-nowrap self-start sm:self-auto"
            >
              + Bulk Clearance Wizard
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Employee Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Active Assets Held</th>
                    <th className="py-3 px-4">Historical Assets</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Clearance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employees.map((emp) => {
                    const isResigned = emp.status === 'Resigned';
                    const hasActiveAssets = ((emp.current_assets_count ?? emp.active_asset_count) || 0) > 0;
                    const pendingReturnsCount = emp.pending_return_count || (emp.pending_return_assets?.length) || 0;
                    const isAtRisk = isResigned && (hasActiveAssets || pendingReturnsCount > 0);

                    return (
                      <tr
                        key={emp.id || emp.name}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isAtRisk ? 'bg-amber-50/30 dark:bg-amber-950/15' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenEmployeeClearance(emp)}
                            className="flex items-center gap-2 text-left group"
                          >
                            <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {emp.name}
                            </span>
                            {emp.employee_id && (
                              <span className="font-mono text-[10px] text-slate-400">
                                ({emp.employee_id})
                              </span>
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {emp.department || '—'}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                              hasActiveAssets
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {emp.current_assets_count ?? emp.active_asset_count ?? 0}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {emp.previous_assets_count ?? emp.total_history_count ?? (emp.all_history_assets?.length) ?? 0}
                        </td>

                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (isResigned) {
                                handleOpenEmployeeClearance(emp);
                              } else {
                                handleOpenResignationModal(emp);
                              }
                            }}
                            title={isResigned ? "Click to view clearance details" : "Click to mark employee as Resigned"}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                              isResigned
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isResigned ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            <span>{isResigned ? '🔴 Resigned' : 'Active'}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isResigned ? (
                              <>
                                <button
                                  onClick={() => handleOpenEmployeeClearance(emp)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                                    pendingReturnsCount > 0
                                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 hover:bg-amber-200'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                  }`}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>
                                    {pendingReturnsCount > 0
                                      ? `Receive Assets (${pendingReturnsCount})`
                                      : 'View Clearance'}
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleReactivateEmployee(emp)}
                                  className="text-[10px] text-slate-400 hover:text-emerald-600 underline font-medium"
                                  title="Re-activate employee"
                                >
                                  Reactivate
                                </button>
                              </>
                            ) : (
                              <>
                                {hasActiveAssets && (
                                  <button
                                    onClick={() => onOpenBulkHandover(emp.name)}
                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-semibold transition-colors"
                                  >
                                    Process Handover ({emp.active_asset_count})
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenResignationModal(emp)}
                                  className="px-2 py-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] font-semibold rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                >
                                  Mark Resigned
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Resignation Confirmation Modal */}
      {resignationTargetEmployee && (
        <ResignationConfirmModal
          isOpen={!!resignationTargetEmployee}
          onClose={() => setResignationTargetEmployee(null)}
          employee={resignationTargetEmployee}
          defaultHandling={settings?.resignation_asset_handling || 'Pending Return'}
          onConfirm={handleConfirmResignation}
        />
      )}

      {/* Resigned Employee Clearance & Return Modal */}
      {selectedResignedEmployee && (
        <ResignedEmployeeModal
          isOpen={!!selectedResignedEmployee}
          onClose={() => setSelectedResignedEmployee(null)}
          employee={selectedResignedEmployee}
          onRefresh={fetchData}
          onSelectAsset={onSelectAsset}
        />
      )}
    </div>
  );
}
