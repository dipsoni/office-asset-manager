import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AssetsView from './components/AssetsView';
import AssignmentsView from './components/AssignmentsView';
import MaintenanceView from './components/MaintenanceView';
import CategoriesView from './components/CategoriesView';
import ReportsView from './components/ReportsView';
import BackupRestoreView from './components/BackupRestoreView';
import SettingsView from './components/SettingsView';
import HandoverView from './components/HandoverView';
import AssetDetailModal from './components/AssetDetailModal';
import AssetFormModal from './components/AssetFormModal';
import AssignmentModal from './components/AssignmentModal';
import ReturnModal from './components/ReturnModal';
import MaintenanceModal from './components/MaintenanceModal';
import HandoverModal from './components/HandoverModal';
import BulkHandoverModal from './components/BulkHandoverModal';
import HandoverSlipModal from './components/HandoverSlipModal';
import HandoverImportModal from './components/HandoverImportModal';
import PinLockModal from './components/PinLockModal';
import ExcelImportModal from './components/ExcelImportModal';
import UserGuideModal from './components/UserGuideModal';
import ErrorBoundary from './components/ErrorBoundary';
import { api } from './api';

const VALID_TABS = [
  'dashboard',
  'assets',
  'assignments',
  'handovers',
  'maintenance',
  'categories',
  'reports',
  'backup',
  'settings'
];

function getInitialTab() {
  if (typeof window !== 'undefined') {
    // 1. Try URL hash first (e.g. #/handovers or #handovers)
    if (window.location.hash) {
      const hashTab = window.location.hash.replace(/^#\/?/, '').split('/')[0].toLowerCase();
      if (VALID_TABS.includes(hashTab)) {
        return hashTab;
      }
    }
    // 2. Try localStorage saved tab
    const storedTab = localStorage.getItem('assetvault_active_tab');
    if (storedTab && VALID_TABS.includes(storedTab)) {
      return storedTab;
    }
  }
  return 'dashboard';
}

export default function App() {
  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [theme, setTheme] = useState(localStorage.getItem('assetvault_theme') || 'light');
  const [isLocked, setIsLocked] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Core Data
  const [dashboardData, setDashboardData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);

  // Filters & Sorting for AssetsView
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warrantyFilter, setWarrantyFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
  const [assignModalAsset, setAssignModalAsset] = useState(null);
  const [returnModalAsset, setReturnModalAsset] = useState(null);
  const [maintenanceModalAsset, setMaintenanceModalAsset] = useState(null);

  const openAssignModal = (asset = null) => {
    setAssignModalAsset(asset);
    setIsAssignModalOpen(true);
  };

  // Handover Modals
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverInitialAsset, setHandoverInitialAsset] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInitialEmployee, setBulkInitialEmployee] = useState('');
  const [selectedSlipHandover, setSelectedSlipHandover] = useState(null);
  const [isHandoverImportModalOpen, setIsHandoverImportModalOpen] = useState(false);

  // Handle Theme switching
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('assetvault_theme', theme);
  }, [theme]);

  // Synchronize currentTab with localStorage and URL hash
  useEffect(() => {
    localStorage.setItem('assetvault_active_tab', currentTab);
    const existingHash = window.location.hash.replace(/^#\/?/, '').split('/')[0].toLowerCase();
    if (existingHash !== currentTab) {
      window.location.hash = `#/${currentTab}`;
    }
  }, [currentTab]);

  // Handle browser back/forward and hash change events
  useEffect(() => {
    const handleHashChange = () => {
      const hashTab = window.location.hash.replace(/^#\/?/, '').split('/')[0].toLowerCase();
      if (VALID_TABS.includes(hashTab) && hashTab !== currentTab) {
        setCurrentTab(hashTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentTab]);

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  // Sync assets list whenever filters or search change
  useEffect(() => {
    loadAssets();
  }, [searchTerm, categoryFilter, statusFilter, warrantyFilter, sortBy, sortOrder]);

  const loadAllData = async () => {
    try {
      const [dash, cats, asgs, maint, setts, emps] = await Promise.all([
        api.getDashboard(),
        api.getCategories(),
        api.getAssignments(),
        api.getMaintenance(),
        api.getSettings(),
        api.getEmployees()
      ]);

      setDashboardData(dash);
      setCategories(cats);
      setAssignments(asgs);
      setMaintenanceRecords(maint);
      setSettings(setts);
      setEmployees(emps || []);

      // Check PIN lock
      if (setts?.pin_lock_enabled === 'true' && !sessionStorage.getItem('assetvault_unlocked')) {
        setIsLocked(true);
      }

      await loadAssets();
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const loadAssets = async () => {
    try {
      const data = await api.getAssets({
        q: searchTerm,
        category_id: categoryFilter,
        status: statusFilter,
        warranty_filter: warrantyFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setAssets(data);
    } catch (err) {
      console.error('Error loading assets:', err);
    }
  };

  const refreshDashboard = async () => {
    try {
      const dash = await api.getDashboard();
      setDashboardData(dash);
    } catch (_) {}
  };

  const handleAssetDetailRefresh = async (assetId) => {
    try {
      const updated = await api.getAsset(assetId);
      setSelectedAssetDetail(updated);
      loadAssets();
      refreshDashboard();
    } catch (_) {}
  };

  const handleDeleteAsset = async (asset) => {
    if (confirm(`Are you sure you want to delete asset "${asset.name}" (${asset.id})?\n\nThis will also remove its associated assignment logs, maintenance tickets, and local files.`)) {
      try {
        await api.deleteAsset(asset.id);
        loadAllData();
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleUnlock = () => {
    sessionStorage.setItem('assetvault_unlocked', 'true');
    setIsLocked(false);
  };

  const handleLock = () => {
    sessionStorage.removeItem('assetvault_unlocked');
    setIsLocked(true);
  };

  const currency = settings?.default_currency || '₹';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Local Lock Screen */}
      <PinLockModal
        isLocked={isLocked}
        onUnlock={handleUnlock}
        ownerName={settings?.owner_name}
      />

      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        stats={dashboardData?.summary}
        settings={settings}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onOpenAddModal={() => {
            setAssetToEdit(null);
            setIsAddModalOpen(true);
          }}
          onOpenAssignModal={() => openAssignModal()}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onSelectAsset={async (a) => {
            try {
              const full = await api.getAsset(a.id);
              setSelectedAssetDetail(full);
            } catch (_) {
              setSelectedAssetDetail(a);
            }
          }}
          currency={currency}
          theme={theme}
          setTheme={setTheme}
          settings={settings}
          onLockApp={handleLock}
          assets={assets}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-6 animate-view-fade">
          <ErrorBoundary key={currentTab} onReset={loadAllData}>
          {currentTab === 'dashboard' && (
            <DashboardView
              dashboardData={dashboardData}
              currency={currency}
              settings={settings}
              setCurrentTab={setCurrentTab}
              onNavigateToAssets={(filters = {}) => {
                setStatusFilter(filters.status !== undefined ? filters.status : '');
                setCategoryFilter(filters.category !== undefined ? filters.category : '');
                setSearchTerm(filters.search !== undefined ? filters.search : '');
                if (filters.warranty_filter) setWarrantyFilter(filters.warranty_filter);
                else setWarrantyFilter('');
                if (filters.sort_by) setSortBy(filters.sort_by);
                if (filters.sort_order) setSortOrder(filters.sort_order);
                setCurrentTab('assets');
              }}
              onSelectAsset={async (a) => {
                const full = await api.getAsset(a.id);
                setSelectedAssetDetail(full);
              }}
              onOpenAddModal={() => {
                setAssetToEdit(null);
                setIsAddModalOpen(true);
              }}
              onOpenAssignModal={() => openAssignModal()}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenGuide={() => setIsGuideOpen(true)}
            />
          )}

          {currentTab === 'assets' && (
            <AssetsView
              assets={assets}
              categories={categories}
              currency={currency}
              settings={settings}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              warrantyFilter={warrantyFilter}
              setWarrantyFilter={setWarrantyFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              onOpenAddModal={() => {
                setAssetToEdit(null);
                setIsAddModalOpen(true);
              }}
              onSelectAsset={async (a) => {
                const full = await api.getAsset(a.id);
                setSelectedAssetDetail(full);
              }}
              onEditAsset={(a) => {
                setAssetToEdit(a);
                setIsAddModalOpen(true);
              }}
              onDeleteAsset={handleDeleteAsset}
              onAssignAsset={(a) => openAssignModal(a)}
              onReturnAsset={(a) => setReturnModalAsset(a)}
              onMaintenanceAsset={(a) => setMaintenanceModalAsset(a)}
              onExportExcel={() => (window.location.href = api.getExportExcelUrl())}
              onExportCsv={() => (window.location.href = api.getExportCsvUrl())}
              onOpenImportModal={() => setIsImportModalOpen(true)}
            />
          )}

          {currentTab === 'assignments' && (
            <AssignmentsView
              assignments={assignments}
              onReturnAsset={(a) => setReturnModalAsset(a)}
              onOpenAssignModal={() => openAssignModal()}
              onSelectAsset={async (a) => {
                const full = await api.getAsset(a.id);
                setSelectedAssetDetail(full);
              }}
            />
          )}

          {currentTab === 'handovers' && (
            <HandoverView
              onOpenNewHandover={(asset = null) => {
                setHandoverInitialAsset(asset);
                setIsHandoverModalOpen(true);
              }}
              onOpenBulkHandover={(employeeName = '') => {
                setBulkInitialEmployee(employeeName);
                setIsBulkModalOpen(true);
              }}
              onOpenImportHandover={() => setIsHandoverImportModalOpen(true)}
              onViewSlip={(handover) => {
                setSelectedSlipHandover(handover);
              }}
              onSelectAsset={async (a) => {
                const full = await api.getAsset(a.id);
                setSelectedAssetDetail(full);
              }}
              settings={settings}
              onDataChange={loadAllData}
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceView
              records={maintenanceRecords}
              currency={currency}
              settings={settings}
              onOpenLogModal={() => setMaintenanceModalAsset(assets[0] || null)}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'categories' && (
            <CategoriesView
              categories={categories}
              currency={currency}
              settings={settings}
              onRefresh={loadAllData}
              onSelectCategory={(catId) => {
                setCategoryFilter(catId);
                setCurrentTab('assets');
              }}
            />
          )}

          {currentTab === 'reports' && <ReportsView currency={currency} settings={settings} />}

          {currentTab === 'backup' && (
            <BackupRestoreView
              onDatabaseRestored={loadAllData}
              onOpenImportModal={() => setIsImportModalOpen(true)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onRefresh={loadAllData}
              theme={theme}
              setTheme={setTheme}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Modals Container */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        settings={settings}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadAllData}
      />

      <AssetDetailModal
        asset={selectedAssetDetail}
        currency={currency}
        settings={settings}
        onClose={() => setSelectedAssetDetail(null)}
        onEdit={(a) => {
          setSelectedAssetDetail(null);
          setAssetToEdit(a);
          setIsAddModalOpen(true);
        }}
        onAssign={(a) => openAssignModal(a)}
        onReturn={(a) => setReturnModalAsset(a)}
        onMaintenance={(a) => setMaintenanceModalAsset(a)}
        onHandover={(a) => {
          setHandoverInitialAsset(a);
          setIsHandoverModalOpen(true);
        }}
        onViewSlip={(h) => setSelectedSlipHandover(h)}
        onRefresh={handleAssetDetailRefresh}
      />

      <AssetFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAssetToEdit(null);
        }}
        assetToEdit={assetToEdit}
        categories={categories}
        currency={currency}
        settings={settings}
        onSuccess={() => {
          loadAllData();
        }}
      />

      <AssignmentModal
        isOpen={isAssignModalOpen}
        asset={assignModalAsset}
        availableAssets={assets.filter((a) => a.status === 'Available')}
        employees={employees}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignModalAsset(null);
        }}
        onSuccess={loadAllData}
      />

      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onQuickAction={(action) => {
          if (action === 'add') {
            setAssetToEdit(null);
            setIsAddModalOpen(true);
          } else if (action === 'assign') {
            openAssignModal();
          } else if (action === 'handovers') {
            setCurrentTab('handovers');
          }
        }}
      />

      <ReturnModal
        isOpen={Boolean(returnModalAsset)}
        asset={returnModalAsset}
        onClose={() => setReturnModalAsset(null)}
        onSuccess={loadAllData}
      />

      <MaintenanceModal
        isOpen={Boolean(maintenanceModalAsset)}
        asset={maintenanceModalAsset}
        assets={assets}
        currency={currency}
        onClose={() => setMaintenanceModalAsset(null)}
        onSuccess={loadAllData}
      />

      <HandoverModal
        isOpen={isHandoverModalOpen}
        initialAsset={handoverInitialAsset}
        assets={assets}
        employees={employees}
        onClose={() => {
          setIsHandoverModalOpen(false);
          setHandoverInitialAsset(null);
        }}
        onSuccess={loadAllData}
        onViewSlip={(h) => setSelectedSlipHandover(h)}
      />

      <BulkHandoverModal
        isOpen={isBulkModalOpen}
        initialEmployee={bulkInitialEmployee}
        assets={assets}
        employees={employees}
        onClose={() => {
          setIsBulkModalOpen(false);
          setBulkInitialEmployee('');
        }}
        onSuccess={loadAllData}
        onViewSlip={(h) => setSelectedSlipHandover(h)}
      />

      <HandoverSlipModal
        isOpen={Boolean(selectedSlipHandover)}
        handover={selectedSlipHandover}
        settings={settings}
        onClose={() => setSelectedSlipHandover(null)}
      />

      {isHandoverImportModalOpen && (
        <HandoverImportModal
          isOpen={isHandoverImportModalOpen}
          assets={assets}
          employees={employees}
          onClose={() => setIsHandoverImportModalOpen(false)}
          onSuccess={loadAllData}
        />
      )}
    </div>
  );
}
