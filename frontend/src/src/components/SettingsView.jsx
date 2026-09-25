import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Building,
  IndianRupee,
  Calendar,
  Lock,
  HardDrive,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  DollarSign,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { api } from '../api';

export default function SettingsView({ settings, onRefresh, theme, setTheme }) {
  const [formData, setFormData] = useState({
    owner_name: settings?.owner_name || 'Deep',
    company_name: settings?.company_name || 'Personal Workspace',
    default_currency: settings?.default_currency || '₹',
    date_format: settings?.date_format || 'DD/MM/YYYY',
    theme: settings?.theme || 'light',
    pin_lock_enabled: settings?.pin_lock_enabled || 'false',
    show_price: settings?.show_price ?? 'false',
    show_warranty: settings?.show_warranty ?? 'false',
    resignation_asset_handling: settings?.resignation_asset_handling || 'Pending Return'
  });

  const [pinData, setPinData] = useState({
    current_pin: '',
    new_pin: '',
    confirm_pin: ''
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (settings) {
      setFormData({
        owner_name: settings.owner_name || 'Deep',
        company_name: settings.company_name || 'Personal Workspace',
        default_currency: settings.default_currency || '₹',
        date_format: settings.date_format || 'DD/MM/YYYY',
        theme: settings.theme || 'light',
        pin_lock_enabled: settings.pin_lock_enabled || 'false',
        show_price: settings.show_price ?? 'false',
        show_warranty: settings.show_warranty ?? 'false',
        resignation_asset_handling: settings.resignation_asset_handling || 'Pending Return'
      });
    }
  }, [settings]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await api.updateSettings(formData);
      setMsg({ text: 'Preferences saved successfully!', type: 'success' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (pinData.new_pin !== pinData.confirm_pin) {
      setMsg({ text: 'New PIN and Confirm PIN do not match', type: 'error' });
      return;
    }
    if (pinData.new_pin.length < 4) {
      setMsg({ text: 'PIN must be at least 4 digits', type: 'error' });
      return;
    }

    try {
      setSavingPin(true);
      await api.setPin({
        current_pin: pinData.current_pin,
        new_pin: pinData.new_pin
      });
      setMsg({ text: 'PIN lock enabled successfully!', type: 'success' });
      setPinData({ current_pin: '', new_pin: '', confirm_pin: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSavingPin(false);
    }
  };

  const handleDisablePin = async () => {
    const pin = prompt('Enter your current PIN to disable app lock:');
    if (!pin) return;

    try {
      await api.setPin({ current_pin: pin, disable: true });
      setMsg({ text: 'PIN lock disabled', type: 'success' });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          System Preferences & Diagnostics
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure profile localization, default currency, and local workspace security
        </p>
      </div>

      {msg.text && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* General Settings */}
      <form
        onSubmit={handleSavePreferences}
        className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-slate-400">
          Personal Information & Formatting
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Your Name / Primary Owner
            </label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company / Workspace Name
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Default Currency
            </label>
            <select
              value={formData.default_currency}
              onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
            >
              <option value="₹">₹ - Indian Rupee (INR)</option>
              <option value="$">$ - US Dollar (USD)</option>
              <option value="€">€ - Euro (EUR)</option>
              <option value="£">£ - British Pound (GBP)</option>
              <option value="¥">¥ - Japanese Yen (JPY)</option>
              <option value="A$">A$ - Australian Dollar (AUD)</option>
              <option value="C$">C$ - Canadian Dollar (CAD)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date Format
            </label>
            <select
              value={formData.date_format}
              onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 23/09/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/23/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-23)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Color Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>
        </div>

        {/* Feature Visibility / Optional Modules */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Feature Visibility (Modular Toggle)</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Control whether Price & Valuation and Warranty tracking features are visible in the interface. Your underlying data in SQLite is always preserved.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Toggle */}
            <div className={`p-4 rounded-xl border transition-all ${
              formData.show_price === 'true'
                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                    <span>Price & Cost Valuation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Show purchase price, total valuation KPI card, inventory price column, and financial filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      show_price: formData.show_price === 'true' ? 'false' : 'true'
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.show_price === 'true' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.show_price === 'true' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold">
                <span className={formData.show_price === 'true' ? 'text-blue-600' : 'text-slate-400'}>
                  {formData.show_price === 'true' ? '● Currently Visible' : '○ Currently Hidden (Default)'}
                </span>
              </div>
            </div>

            {/* Warranty Toggle */}
            <div className={`p-4 rounded-xl border transition-all ${
              formData.show_warranty === 'true'
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Warranty & Expiration Tracking</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Show warranty radar alerts, expiration countdowns, warranty status badges, and RMA claims.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      show_warranty: formData.show_warranty === 'true' ? 'false' : 'true'
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.show_warranty === 'true' ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.show_warranty === 'true' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold">
                <span className={formData.show_warranty === 'true' ? 'text-amber-600' : 'text-slate-400'}>
                  {formData.show_warranty === 'true' ? '● Currently Visible' : '○ Currently Hidden (Default)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Resignation Asset Handling Setting */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Employee Resignation Asset Handling</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Determine the automatic lifecycle status assigned to assets when an employee's status changes to "Resigned".
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 2: Pending Return (Default) */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                formData.resignation_asset_handling === 'Pending Return'
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <input
                type="radio"
                name="resignation_asset_handling"
                value="Pending Return"
                checked={formData.resignation_asset_handling === 'Pending Return'}
                onChange={(e) =>
                  setFormData({ ...formData, resignation_asset_handling: e.target.value })
                }
                className="mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Mark assets as Pending Return
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    Default • Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Assets enter <strong>Pending Return</strong> state while retaining custodian info. Reassignment is blocked until physical asset return is received & verified. Safer for real-world audits.
                </p>
              </div>
            </label>

            {/* Option 1: Automatically mark assets as Available */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                formData.resignation_asset_handling === 'Available'
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 ring-1 ring-blue-400/40'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <input
                type="radio"
                name="resignation_asset_handling"
                value="Available"
                checked={formData.resignation_asset_handling === 'Available'}
                onChange={(e) =>
                  setFormData({ ...formData, resignation_asset_handling: e.target.value })
                }
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="space-y-1">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Automatically mark assets as Available
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Assignments are closed immediately, custodian is set to <strong>Unassigned</strong>, and assets instantly return to the pool as <strong>Available</strong> for immediate reassignment.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={savingSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            {savingSettings ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>

      {/* Local PIN Security */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Local Computer Screen Lock (Optional PIN)
              </h3>
              <p className="text-xs text-slate-500">
                Prevents other people using your Windows PC from casually seeing your private financial asset data
              </p>
            </div>
          </div>

          {settings?.pin_lock_enabled === 'true' && (
            <button
              onClick={handleDisablePin}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
            >
              Disable PIN Lock
            </button>
          )}
        </div>

        {settings?.pin_lock_enabled === 'true' ? (
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PIN lock is currently ACTIVE. You can lock anytime using the lock icon in the top navbar.</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSavePin} className="pt-2 space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Set a 4 to 6 digit numeric PIN to lock your personal asset dashboard:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <input
                type="password"
                placeholder="New 4-digit PIN"
                value={pinData.new_pin}
                onChange={(e) => setPinData({ ...pinData, new_pin: e.target.value })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                type="password"
                placeholder="Confirm PIN"
                value={pinData.confirm_pin}
                onChange={(e) => setPinData({ ...pinData, confirm_pin: e.target.value })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={savingPin}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
            >
              {savingPin ? 'Activating...' : 'Enable Local PIN Lock'}
            </button>
          </form>
        )}
      </div>

      {/* Local Storage Diagnostics & Audit */}
      <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Local Storage Transparency
        </h4>
        <div className="space-y-2 text-xs font-mono text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0">SQLite DB:</span>
            <span className="truncate bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
              {settings?.storageInfo?.databasePath || './data/assets.db'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0">Uploads Vault:</span>
            <span className="truncate bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
              {settings?.storageInfo?.uploadsPath || './uploads'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0">Backups Folder:</span>
            <span className="truncate bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
              {settings?.storageInfo?.backupsPath || './backups'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
