import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { api } from '../api';

export default function BackupRestoreView({ onDatabaseRestored, onOpenImportModal }) {
  const [restoring, setRestoring] = useState(false);
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // 1. Download SQLite Database Backup (.db)
  const handleDownloadDbBackup = () => {
    window.location.href = api.getBackupDownloadUrl();
    setStatusMessage({
      text: 'Database backup snapshot generated and downloaded to your local Downloads folder!',
      type: 'success'
    });
  };

  // 2. Restore Database from .db file
  const handleRestoreDbFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite')) {
      alert('Please select a valid SQLite database backup file (.db extension).');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to restore "${file.name}"?\n\nA safety copy of your current database will be archived automatically before restoring.`
      )
    ) {
      e.target.value = '';
      return;
    }

    try {
      setRestoring(true);
      setStatusMessage({ text: 'Restoring database from backup file...', type: 'info' });

      const formData = new FormData();
      formData.append('backup_file', file);

      const res = await api.restoreDatabase(formData);
      setStatusMessage({ text: res.message || 'Database restored successfully!', type: 'success' });
      if (onDatabaseRestored) onDatabaseRestored();
    } catch (err) {
      setStatusMessage({ text: `Restore failed: ${err.message}`, type: 'error' });
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  // 3. Export to CSV & Excel
  const handleExportCsv = () => {
    window.location.href = api.getExportCsvUrl();
  };

  const handleExportExcel = () => {
    window.location.href = api.getExportExcelUrl();
  };

  // 4. Import from CSV / Excel
  const handleImportAssets = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setStatusMessage({ text: 'Importing asset records into SQLite database...', type: 'info' });

      const formData = new FormData();
      formData.append('import_file', file);

      const res = await api.importAssets(formData);
      setStatusMessage({ text: res.message, type: 'success' });
      if (onDatabaseRestored) onDatabaseRestored();
    } catch (err) {
      setStatusMessage({ text: `Import failed: ${err.message}`, type: 'error' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Local Backup & Data Portability
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Take offline snapshots of your SQLite database, restore previous points in time, or import/export via Excel & CSV
        </p>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
              : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: Database Backup & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: 1-Click Database Backup */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Backup Database
                </h3>
                <p className="text-xs text-slate-500">Full SQLite Database Snapshot (.db)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Creates an atomic snapshot of your entire database file (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-blue-600">assets.db</code>) containing all assets, assignments, maintenance records, categories, and settings.
            </p>

            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] text-slate-500 font-mono">
              Output format: assets_backup_YYYY-MM-DD_HHMMSS.db
            </div>
          </div>

          <button
            onClick={handleDownloadDbBackup}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Database Backup File (.db)</span>
          </button>
        </div>

        {/* Card 2: Restore Database from File */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Restore Database
                </h3>
                <p className="text-xs text-slate-500">Revert from a previous .db snapshot</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Select a previously downloaded <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-indigo-600">.db</code> file. A safety copy of your current active data is automatically generated before replacing.
            </p>

            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-[11px] text-amber-800 dark:text-amber-300">
              Note: Restoring replaces current database tables with the selected backup file.
            </div>
          </div>

          <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm">
            <Upload className="w-4 h-4" />
            <span>{restoring ? 'Restoring Database...' : 'Select .db File & Restore'}</span>
            <input
              type="file"
              accept=".db,.sqlite"
              className="hidden"
              onChange={handleRestoreDbFile}
              disabled={restoring}
            />
          </label>
        </div>
      </div>

      {/* Grid: Excel / CSV Bulk Export & Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 3: Export Excel / CSV */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Export to Excel / CSV
                </h3>
                <p className="text-xs text-slate-500">Spreadsheet formatted dumps</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Export all asset records into a multi-tab Microsoft Excel workbook (.xlsx) with dedicated sheets for Assets, Custodians, and Maintenance, or as a lightweight CSV file.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Card 4: Import Excel / CSV */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bulk Import Assets
                </h3>
                <p className="text-xs text-slate-500">Import multiple rows from Excel or CSV</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Upload an existing spreadsheet containing asset columns (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-purple-600">Name, Category, Brand, Model, Serial, Price</code>). Categories are mapped or created automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={api.getTemplateUrl()}
              download="AssetVault_Import_Template.xlsx"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold text-purple-700 dark:text-purple-300 transition-all text-center"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </a>

            <button
              type="button"
              onClick={onOpenImportModal}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Excel File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
