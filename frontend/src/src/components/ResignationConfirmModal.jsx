import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  UserX,
  Clock,
  CheckCircle,
  Package,
  Layers,
  Info
} from 'lucide-react';

export default function ResignationConfirmModal({
  isOpen,
  onClose,
  employee,
  defaultHandling = 'Pending Return',
  onConfirm
}) {
  const [selectedAction, setSelectedAction] = useState(defaultHandling || 'Pending Return');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !employee) return null;

  const activeAssets = employee.current_assets || [];
  const assetCount = activeAssets.length || employee.current_assets_count || employee.active_asset_count || 0;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await onConfirm(selectedAction);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process employee resignation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Employee Resignation
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Automatic Asset Release & Custody Transition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-5 space-y-4 text-xs">
          {/* Employee summary notice */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <p className="text-slate-600 dark:text-slate-300">
              You are marking <strong className="text-slate-900 dark:text-white font-bold text-sm">{employee.name}</strong>
              {employee.employee_id && (
                <span className="font-mono text-slate-500 ml-1">({employee.employee_id})</span>
              )}{' '}
              as <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">Resigned</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              This employee currently has{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{assetCount} assigned asset{assetCount === 1 ? '' : 's'}</strong>.
            </p>
          </div>

          {/* Asset list preview if any */}
          {activeAssets.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Currently Assigned Assets ({activeAssets.length}):
              </label>
              <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                {activeAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-md border border-slate-200/60 dark:border-slate-700/40 font-mono"
                  >
                    <span className="font-bold text-blue-600 dark:text-blue-400">{asset.id}</span>
                    <span className="text-slate-700 dark:text-slate-200 font-sans truncate max-w-[200px]">{asset.name}</span>
                    <span className="text-slate-400 font-sans text-[10px]">{asset.category || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Option selection */}
          <div className="space-y-2 pt-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              What should happen to these assets?
            </label>

            <div className="space-y-2.5">
              {/* Option 2: Pending Return (Default) */}
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  selectedAction === 'Pending Return'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/50'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="resignation_action"
                  value="Pending Return"
                  checked={selectedAction === 'Pending Return'}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Mark assets as Pending Return
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      Default • Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Assets stay flagged as <em>Pending Return</em> with {employee.name} as custodian until physically received. Prevents accidental reassignment.
                  </p>
                </div>
              </label>

              {/* Option 1: Available */}
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  selectedAction === 'Available'
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 ring-1 ring-blue-400/50'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="resignation_action"
                  value="Available"
                  checked={selectedAction === 'Available'}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Automatically mark as Available
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Assignment closed immediately, custodian set to <em>Unassigned</em>, and assets marked <em>Available</em> right away.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 transition-all"
          >
            <UserX className="w-4 h-4" />
            <span>{isSubmitting ? 'Processing Resignation...' : 'Confirm Resignation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
