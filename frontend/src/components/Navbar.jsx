import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Moon,
  Sun,
  Lock,
  X,
  ExternalLink,
  Laptop,
  HelpCircle,
  ChevronDown,
  UserCheck,
  Upload,
  ArrowLeftRight
} from 'lucide-react';
import { getStatusBadge } from '../utils/formatters';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  onOpenAddModal,
  onOpenAssignModal,
  onOpenImportModal,
  onOpenGuide,
  onSelectAsset,
  currency,
  theme,
  setTheme,
  settings,
  onLockApp,
  assets = []
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const quickMenuRef = useRef(null);

  // Keyboard shortcut: Press / to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === '/' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
          setIsSearchOpen(true);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search popover & quick menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target)) {
        setIsQuickMenuOpen(false);
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
            ref={inputRef}
            type="text"
            placeholder="Search assets (ID, Name, Serial #, Custodian)... Press / to search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-10 pr-16 py-2 bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all duration-150"
          />
          <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setIsSearchOpen(false);
                }}
                className="pointer-events-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded">
                /
              </kbd>
            )}
          </div>
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
                            • Custodian: {asset.assigned_to}
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
      <div className="flex items-center gap-2.5">
        {/* Help & Guide Button */}
        <button
          onClick={onOpenGuide}
          className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Open User Guide & Help"
        >
          <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="hidden md:inline">Help Guide</span>
        </button>

        {/* Currency Pill */}
        <div className="hidden sm:flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300">
          Currency: <span className="ml-1 text-blue-600 dark:text-blue-400 font-bold">{currency || '₹'}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Lock Screen Button */}
        {settings?.pin_lock_enabled === 'true' && (
          <button
            onClick={onLockApp}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Lock workspace"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Quick Add Asset & Dropdown */}
        <div className="relative" ref={quickMenuRef}>
          <div className="flex items-center">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-l-xl text-xs font-semibold shadow-sm hover:shadow transition-all duration-150 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Asset</span>
            </button>
            <button
              onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
              className="px-2 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-r-xl border-l border-blue-500 text-xs transition-colors"
              title="More actions"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Menu Dropdown */}
          {isQuickMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-100 text-xs">
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenAddModal();
                }}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left font-medium"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Single Asset</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenAssignModal && onOpenAssignModal();
                }}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left font-medium"
              >
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Assign to Staff</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenImportModal && onOpenImportModal();
                }}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left font-medium"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Import Excel Sheet</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
