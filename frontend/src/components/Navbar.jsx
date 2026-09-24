import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Moon,
  Sun,
  Lock,
  X,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { getStatusBadge } from '../utils/formatters';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  onOpenAddModal,
  onSelectAsset,
  currency,
  theme,
  setTheme,
  settings,
  onLockApp,
  assets = []
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Close search popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter assets for global search popover
  const filteredQuickResults = searchTerm.trim()
    ? assets
        .filter((a) => {
          const q = searchTerm.toLowerCase();
          return (
            (a.id && a.id.toLowerCase().includes(q)) ||
            (a.name && a.name.toLowerCase().includes(q)) ||
            (a.brand && a.brand.toLowerCase().includes(q)) ||
            (a.model && a.model.toLowerCase().includes(q)) ||
            (a.serial_number && a.serial_number.toLowerCase().includes(q)) ||
            (a.asset_tag && a.asset_tag.toLowerCase().includes(q)) ||
            (a.assigned_to && a.assigned_to.toLowerCase().includes(q)) ||
            (a.category_name && a.category_name.toLowerCase().includes(q))
          );
        })
        .slice(0, 6)
    : [];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Global Search Bar */}
      <div className="relative flex-1 max-w-xl" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Global search (Asset ID, Name, Serial #, Tag, Custodian, Category)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-10 pr-9 py-2 bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all duration-150"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Instant Search Results Dropdown */}
        {isSearchOpen && searchTerm.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Matching Assets ({filteredQuickResults.length})
              </span>
              <span className="text-[11px] text-slate-400">Click to view details</span>
            </div>

            {filteredQuickResults.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No asset records found matching "{searchTerm}"
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {filteredQuickResults.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      onSelectAsset(asset);
                      setIsSearchOpen(false);
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {asset.id}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {asset.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span>{asset.category_name || 'General'}</span>
                        {asset.serial_number && <span>SN: {asset.serial_number}</span>}
                        {asset.assigned_to && (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            • {asset.assigned_to}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(asset.status)}
                      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Currency Pill */}
        <div className="hidden sm:flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300">
          Currency: <span className="ml-1 text-blue-600 dark:text-blue-400 font-bold">{currency || '₹'}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Lock Screen Button */}
        {settings?.pin_lock_enabled === 'true' && (
          <button
            onClick={onLockApp}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Lock workspace"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Quick Add Asset Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all duration-150 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset</span>
        </button>
      </div>
    </header>
  );
}
