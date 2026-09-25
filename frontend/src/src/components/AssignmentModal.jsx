import React, { useState, useEffect } from 'react';
import { X, UserCheck, Calendar, Check, AlertTriangle, Search, Laptop, User } from 'lucide-react';
import { api } from '../api';

export default function AssignmentModal({
  isOpen,
  onClose,
  asset,
  availableAssets = [],
  employees = [],
  onSuccess
}) {
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [formData, setFormData] = useState({
    person_name: '',
    employee_id: '',
    department: 'IT / Engineering',
    assignment_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // When modal opens or initial asset changes, sync selection
  useEffect(() => {
    if (asset?.id) {
      setSelectedAssetId(asset.id);
    } else if (availableAssets.length > 0) {
      setSelectedAssetId(availableAssets[0].id);
    }
  }, [asset, availableAssets, isOpen]);

  if (!isOpen) return null;

  // Active target asset: either pre-selected prop or selected from dropdown
  const activeAsset =
    (asset?.id === selectedAssetId ? asset : null) ||
    availableAssets.find((a) => a.id === selectedAssetId) ||
    asset;

  // Handle selecting an existing employee from dropdown to auto-fill
  const handleEmployeeSelect = (empName) => {
    const matched = employees.find((e) => e.name === empName);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        person_name: matched.name,
        employee_id: matched.employee_id || prev.employee_id,
        department: matched.department || prev.department
      }));
    } else {
      setFormData((prev) => ({ ...prev, person_name: empName }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeAsset) {
      setError('Please select an asset to assign');
      return;
    }
    if (!formData.person_name.trim()) {
      setError('Custodian / Person Name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await api.createAssignment({
        asset_id: activeAsset.id,
        ...formData
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assign Asset to Employee
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Allocate company hardware with automatic custody tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if asset is pending return */}
        {activeAsset?.status === 'Pending Return' && (
          <div className="mx-5 mt-4 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Asset cannot be assigned yet</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300/90 pl-6">
              This asset is pending return from <span className="font-semibold underline">{activeAsset.assigned_to || 'former employee'}</span>. Please receive the asset in Asset Transfer first.
            </p>
          </div>
        )}

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Asset Selection (Dropdown or Pre-locked pill) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Select Equipment to Hand Over <span className="text-red-500">*</span></span>
              {availableAssets.length > 0 && (
                <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                  {availableAssets.length} items in stock
                </span>
              )}
            </label>

            {availableAssets.length > 0 ? (
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              >
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.id}] {a.name} — {a.category_name || 'Asset'} ({a.serial_number ? `SN: ${a.serial_number}` : 'No SN'})
                  </option>
                ))}
              </select>
            ) : activeAsset ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <Laptop className="w-5 h-5 text-blue-500" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {activeAsset.name} <span className="font-mono text-slate-400 font-normal">({activeAsset.id})</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Category: {activeAsset.category_name || 'General'} • Status: {activeAsset.status}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                No available assets currently in stock. Please add an asset first or return an existing one.
              </div>
            )}
          </div>

          {/* Custodian Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Employee / Custodian Name <span className="text-red-500">*</span></span>
              {employees.length > 0 && (
                <span className="text-[11px] font-normal text-slate-400">
                  Select existing staff or type new
                </span>
              )}
            </label>

            {employees.length > 0 && (
              <div className="mb-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) handleEmployeeSelect(e.target.value);
                  }}
                  defaultValue=""
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">⚡ Quick Pick Existing Employee ({employees.length} staff)...</option>
                  {employees.map((emp) => (
                    <option key={emp.id || emp.name} value={emp.name}>
                      {emp.name} ({emp.department || 'Staff'}{emp.employee_id ? ` - ${emp.employee_id}` : ''})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="text"
              required
              placeholder="e.g. John Doe / Deep"
              value={formData.person_name}
              onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. EMP-104"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                placeholder="e.g. IT, Engineering, Marketing"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Handover Date
              </label>
              <input
                type="date"
                value={formData.assignment_date}
                onChange={(e) => setFormData({ ...formData, assignment_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Return (Optional)
              </label>
              <input
                type="date"
                value={formData.expected_return_date}
                onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Handover Notes / Purpose
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Assigned for remote development workstation setup..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || activeAsset?.status === 'Pending Return'}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
