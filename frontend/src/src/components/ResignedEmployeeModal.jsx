import React, { useState } from 'react';
import {
  X,
  UserX,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  Package,
  Calendar,
  Building,
  Check,
  CheckSquare,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { api } from '../api';
import { formatDate } from '../utils/formatters';

export default function ResignedEmployeeModal({
  isOpen,
  onClose,
  employee,
  onRefresh,
  onSelectAsset
}) {
  const [activeReceivingAsset, setActiveReceivingAsset] = useState(null);
  const [isBulkReceiving, setIsBulkReceiving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Single receive form state
  const [receiveForm, setReceiveForm] = useState({
    return_date: new Date().toISOString().split('T')[0],
    condition: 'Good',
    accessories: 'Charger, Bag, Power Cable',
    remarks: ''
  });

  // Bulk receive form state
  const [bulkForm, setBulkForm] = useState({
    return_date: new Date().toISOString().split('T')[0],
    condition: 'Good',
    remarks: 'Bulk returned on resignation clearance'
  });

  if (!isOpen || !employee) return null;

  const pendingAssets = employee.pending_return_assets || [];
  const allHistory = employee.all_history_assets || [];
  const returnedAssets = allHistory.filter((a) => a.return_status === 'Returned');
  const isResigned = employee.status === 'Resigned';

  const handleOpenReceive = (asset) => {
    setActiveReceivingAsset(asset);
    setReceiveForm({
      return_date: new Date().toISOString().split('T')[0],
      condition: 'Good',
      accessories: 'Charger, Bag, Power Cable',
      remarks: ''
    });
    setError('');
    setSuccessMsg('');
  };

  const handleConfirmSingleReceive = async (e) => {
    e.preventDefault();
    if (!activeReceivingAsset) return;

    try {
      setIsSubmitting(true);
      setError('');
      await api.receiveEmployeeAsset(employee.id, {
        asset_id: activeReceivingAsset.id,
        return_date: receiveForm.return_date,
        condition: receiveForm.condition,
        accessories: receiveForm.accessories,
        remarks: receiveForm.remarks
      });

      setSuccessMsg(`Asset ${activeReceivingAsset.id} successfully received and marked Available!`);
      setActiveReceivingAsset(null);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to receive asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBulkReceive = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      const res = await api.receiveAllEmployeeAssets(employee.id, {
        return_date: bulkForm.return_date,
        condition: bulkForm.condition,
        remarks: bulkForm.remarks
      });

      setSuccessMsg(`All ${res.receivedCount || pendingAssets.length} assets successfully received and marked Available!`);
      setIsBulkReceiving(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to receive all assets');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-xl ${isResigned ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' : 'bg-blue-100 dark:bg-blue-950 text-blue-600'}`}>
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {employee.name}
                </h2>
                {employee.employee_id && (
                  <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-semibold">
                    {employee.employee_id}
                  </span>
                )}
                {/* Employee Status */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isResigned
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isResigned ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span>{isResigned ? '🔴 Resigned' : 'Active'}</span>
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                {employee.department && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    <span>{employee.department}</span>
                  </span>
                )}
                {employee.resignation_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Resigned: {formatDate(employee.resignation_date)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Pending Returns
                </span>
                <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono mt-0.5">
                  {pendingAssets.length}
                </div>
              </div>
              <Clock className="w-6 h-6 text-amber-500 opacity-80" />
            </div>

            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Returned & Cleared
                </span>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {returnedAssets.length}
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Total Allocated History
                </span>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                  {allHistory.length}
                </div>
              </div>
              <Layers className="w-6 h-6 text-slate-400 opacity-80" />
            </div>
          </div>

          {/* SECTION: PENDING ASSET RETURNS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pending Asset Returns
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  {pendingAssets.length} item{pendingAssets.length === 1 ? '' : 's'}
                </span>
              </div>

              {pendingAssets.length > 0 && (
                <button
                  onClick={() => setIsBulkReceiving(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Receive All Assets ({pendingAssets.length})</span>
                </button>
              )}
            </div>

            {pendingAssets.length === 0 ? (
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>All assets assigned to {employee.name} have been fully returned & accounted for. Custody is completely cleared.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/15 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                              {asset.id}
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                              Pending Return
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                            {asset.name}
                          </h4>
                          <p className="text-[11px] text-slate-500">{asset.category || 'Hardware'}</p>
                        </div>
                        <Package className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                      </div>

                      {asset.assignment_date && (
                        <div className="text-[10px] text-slate-400 mt-2 font-mono">
                          Assigned: {formatDate(asset.assignment_date)}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                      <button
                        onClick={() => onSelectAsset && onSelectAsset(asset)}
                        className="text-[11px] text-slate-500 hover:text-blue-600 underline font-medium"
                      >
                        Inspect Asset
                      </button>

                      <button
                        onClick={() => handleOpenReceive(asset)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Receive Asset</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: ASSET RETURN STATUS TABLE */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Asset Return Status Ledger</span>
              </h3>
              <span className="text-xs text-slate-400">
                Complete custody & return history
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                      <th className="py-2.5 px-3">Asset</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Assigned Date</th>
                      <th className="py-2.5 px-3">Return / Handover Status</th>
                      <th className="py-2.5 px-3">Return Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                          No asset assignment records found for this employee.
                        </td>
                      </tr>
                    ) : (
                      allHistory.map((item, idx) => {
                        const isPending = item.return_status === 'Pending Return';
                        return (
                          <tr
                            key={item.id ? `${item.id}-${idx}` : idx}
                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                              isPending ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {item.id}
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{item.category || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                              {formatDate(item.assignment_date)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <span>{item.return_status || (isPending ? 'Pending Return' : 'Returned')}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                              {item.return_date ? formatDate(item.return_date) : isPending ? 'Pending physical return' : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isPending ? (
                                <button
                                  onClick={() => handleOpenReceive(item)}
                                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded text-[11px] font-semibold transition-colors"
                                >
                                  Receive
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-medium">Returned</span>
                              )}
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <p className="text-xs text-slate-400">
            {pendingAssets.length > 0
              ? `${pendingAssets.length} asset(s) waiting for physical confirmation.`
              : 'All assets returned. Historical assignments preserved.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* SUB-MODAL 1: SINGLE ASSET RECEIVE CONFIRMATION */}
        {activeReceivingAsset && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Receive Asset Return
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Confirm physical return and mark Available
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveReceivingAsset(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmSingleReceive} className="p-4 space-y-3.5 text-xs">
                {/* Asset & Employee Details Summary */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Asset:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {activeReceivingAsset.id} • {activeReceivingAsset.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Employee:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {employee.name}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    required
                    value={receiveForm.return_date}
                    onChange={(e) => setReceiveForm({ ...receiveForm, return_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hardware Condition
                  </label>
                  <select
                    value={receiveForm.condition}
                    onChange={(e) => setReceiveForm({ ...receiveForm, condition: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Like New">Like New (Mint)</option>
                    <option value="Good">Good (Working normally)</option>
                    <option value="Fair">Fair (Minor cosmetic wear)</option>
                    <option value="Damaged">Damaged (Needs repair/inspection)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Returned Accessories
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Charger, Laptop Bag, Mouse, Dongle"
                    value={receiveForm.accessories}
                    onChange={(e) => setReceiveForm({ ...receiveForm, accessories: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks / Handover Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any notes on physical inspection or return..."
                    value={receiveForm.remarks}
                    onChange={(e) => setReceiveForm({ ...receiveForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReceivingAsset(null)}
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Confirming...' : 'Confirm Return'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 2: BULK RECEIVE CONFIRMATION */}
        {isBulkReceiving && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Receive All Assets ({pendingAssets.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bulk receive all hardware from {employee.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBulkReceiving(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmBulkReceive} className="p-4 space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <p className="text-slate-600 dark:text-slate-300">
                    You are receiving <strong className="font-bold text-slate-900 dark:text-white">{pendingAssets.length} assets</strong> from <strong className="font-bold text-slate-900 dark:text-white">{employee.name}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    All {pendingAssets.length} assets will become <strong>Available</strong>, custodians cleared to <strong>Unassigned</strong>, and active assignments closed.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkForm.return_date}
                    onChange={(e) => setBulkForm({ ...bulkForm, return_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    General Condition
                  </label>
                  <select
                    value={bulkForm.condition}
                    onChange={(e) => setBulkForm({ ...bulkForm, condition: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Good">Good (All functional)</option>
                    <option value="Like New">Like New</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={bulkForm.remarks}
                    onChange={(e) => setBulkForm({ ...bulkForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkReceiving(false)}
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 transition-all"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Receiving All...' : `Confirm Receive All (${pendingAssets.length})`}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
