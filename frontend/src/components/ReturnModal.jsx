import React, { useState } from 'react';
import { X, CheckCircle2, Check } from 'lucide-react';
import { api } from '../api';

export default function ReturnModal({ isOpen, onClose, asset, onSuccess }) {
  const [returnData, setReturnData] = useState({
    return_date: new Date().toISOString().split('T')[0],
    condition: asset?.condition || 'Good',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');

      // Find active assignment for this asset
      const assignments = await api.getAssignments();
      const activeAsg = assignments.find(
        (a) => a.asset_id === asset.id && !a.return_date
      );

      if (activeAsg) {
        await api.returnAssignment(activeAsg.id, returnData);
      } else {
        // Fallback: update asset directly back to Available
        await api.updateAsset(asset.id, {
          status: 'Available',
          assigned_to: '',
          department: '',
          condition: returnData.condition,
          notes: returnData.notes ? `${asset.notes || ''} | Returned: ${returnData.notes}` : asset.notes
        });
      }

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
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Return Asset to Inventory
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {asset.id} • Assigned to {asset.assigned_to || 'Custodian'}
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
          <div className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Return Date
            </label>
            <input
              type="date"
              value={returnData.return_date}
              onChange={(e) => setReturnData({ ...returnData, return_date: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Return Condition Check
            </label>
            <select
              value={returnData.condition}
              onChange={(e) => setReturnData({ ...returnData, condition: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Brand New">Brand New (Unused)</option>
              <option value="Good">Good (Working fine)</option>
              <option value="Fair">Fair (Minor wear & tear)</option>
              <option value="Poor">Poor (Requires inspection)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Return Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Returned with original charger, cables, and packaging..."
              value={returnData.notes}
              onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : 'Confirm Return'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
