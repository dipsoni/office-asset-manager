import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  UserCheck,
  ArrowLeftRight,
  Upload,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Laptop
} from 'lucide-react';

export default function UserGuideModal({ isOpen, onClose, onQuickAction }) {
  const [activeTab, setActiveTab] = useState('quickstart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                How to Use AssetVault — Quick Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simple step-by-step instructions to manage your office hardware with ease.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'quickstart'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🚀 Quick Start (3 Steps)</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>📋 Common Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('resignation')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'resignation'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🔄 Resignations & Offboarding</span>
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tips'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>💡 Pro Tips & Shortcuts</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-600 dark:text-slate-300">
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  <strong>Welcome to AssetVault!</strong> You don't need any complex training. Managing company equipment boils down to 3 simple steps:
                </div>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Add or Import Equipment
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click <strong>Add Asset</strong> to log single devices, or click <strong>Import Excel</strong> to upload your entire spreadsheet at once.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onQuickAction && onQuickAction('add');
                    }}
                    className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    + Add New Asset <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Assign to Employees
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    When giving a laptop to someone, click <strong>Assign Asset</strong>. Select the item and pick or type the employee's name.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onQuickAction && onQuickAction('assign');
                    }}
                    className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Assign an Asset <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    3
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Track & Return
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Whenever equipment is returned or reassigned, record it in 1 click. When an employee leaves, recover all their items automatically.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onQuickAction && onQuickAction('handovers');
                    }}
                    className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    View Asset Transfers <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>How to Register a New Asset</span>
                </div>
                <ol className="list-decimal list-inside text-xs space-y-1 pl-1 text-slate-600 dark:text-slate-300">
                  <li>Click the blue <strong>+ Add Asset</strong> button located in the top navbar or dashboard.</li>
                  <li>Enter the asset name, brand, model, and category (e.g. Laptop, Monitor, Mobile).</li>
                  <li>Add optional serial numbers or warranty dates to get automatic expiry alerts.</li>
                  <li>Click <strong>Save Asset</strong>. It is immediately ready for deployment.</li>
                </ol>
              </div>

              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>How to Assign Equipment to a Team Member</span>
                </div>
                <ol className="list-decimal list-inside text-xs space-y-1 pl-1 text-slate-600 dark:text-slate-300">
                  <li>Click <strong>Assign Asset</strong> on the dashboard or top navbar.</li>
                  <li>Select an available device from the stock dropdown.</li>
                  <li>Select the employee name from the list (or type a new name).</li>
                  <li>Click <strong>Assign Asset</strong>. The device is now marked "Assigned" with the custodian linked.</li>
                </ol>
              </div>

              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>How to Bulk Import from Excel / CSV</span>
                </div>
                <ol className="list-decimal list-inside text-xs space-y-1 pl-1 text-slate-600 dark:text-slate-300">
                  <li>Go to <strong>Assets Inventory</strong> and click <strong>Import Excel</strong>.</li>
                  <li>Select or drag-and-drop your company `.xlsx` or `.csv` spreadsheet.</li>
                  <li>Preview the mapped columns and click <strong>Confirm Import</strong>.</li>
                  <li>All assets and assigned custodians will be populated automatically without manual typing!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'resignation' && (
            <div className="space-y-4">
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4">
                <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Zero Equipment Loss During Staff Offboarding
                </h4>
                <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                  When an employee leaves the company, AssetVault ensures no laptop, monitor, or charger is forgotten.
                </p>
              </div>

              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">How it works:</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Go to the <strong>Asset Transfer</strong> tab and select the <strong>Staff Custodians</strong> view.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>Click <strong>Mark Resigned</strong> next to any offboarding employee.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>The system automatically audits every piece of hardware assigned to them and flags them for recovery.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <span>Click <strong>Receive All</strong> to return items to available inventory, and print the official signed <strong>Clearance Slip</strong>.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <Search className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">Press / Anywhere to Search</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hit the forward slash key <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 text-[10px] font-mono">/</kbd> anytime to jump straight into global asset search.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">Click Any Dashboard Card to Filter</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Clicking cards like <strong>Available in Stock</strong> or <strong>Under Repair</strong> on the dashboard instantly opens the assets list filtered to those items.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">One-Click Excel Export</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Need an inventory report for management or audit? Click <strong>Excel</strong> in the Assets Inventory tab to download a clean, styled spreadsheet in seconds.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tip: You can re-open this guide anytime by clicking the <strong>Help (?)</strong> button in the top navbar.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
