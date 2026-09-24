import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Building,
  Calendar,
  ArrowLeftRight
} from 'lucide-react';
import { api } from '../api';

const COMMON_ACCESSORIES = [
  'Power Adapter / Charger',
  'Laptop Bag',
  'Wireless Mouse',
  'HDMI / Display Cable',
  'USB Dongle / Hub',
  'Power Cable',
  'Original Box'
];

const REASONS = [
  'Employee Resignation',
  'Department Transfer',
  'Role Change',
  'Hardware Refresh / Upgrade',
  'Asset Redistribution',
  'End of Contract',
  'Other'
];

export default function BulkHandoverModal({
  isOpen,
  onClose,
  onSuccess,
  initialEmployee = '',
  employees = [],
  assets = [],
  onViewSlip
}) {
  const [selectedFromEmployee, setSelectedFromEmployee] = useState(initialEmployee || '');
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [assetConfigs, setAssetConfigs] = useState({});
  const [reason, setReason] = useState('Employee Resignation');
  const [customReason, setCustomReason] = useState('');
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [handoverDate, setHandoverDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState('IT Admin');
  const [handedOverBy, setHandedOverBy] = useState('');
  const [generalRemarks, setGeneralRemarks] = useState('');
  const [markResigned, setMarkResigned] = useState(true);

  // Uniform target options (for applying to all selected at once)
  const [bulkAction, setBulkAction] = useState('stock'); // 'stock' or 'reassign'
  const [bulkTargetEmployee, setBulkTargetEmployee] = useState('');
  const [bulkTargetDept, setBulkTargetDept] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState(null);

  // Filter employees who currently hold at least one asset
  const employeesWithAssets = useMemo(() => {
    const counts = {};
    assets.forEach((a) => {
      if (a.assigned_to && a.assigned_to.trim()) {
        counts[a.assigned_to.trim()] = (counts[a.assigned_to.trim()] || 0) + 1;
      }
    });

    const list = Object.entries(counts).map(([name, count]) => {
      const emp = employees.find((e) => e.name?.toLowerCase() === name.toLowerCase());
      return {
        name,
        count,
        department: emp?.department || '',
        employee_id: emp?.employee_id || '',
        status: emp?.status || 'Active'
      };
    });

    return list.sort((a, b) => b.count - a.count);
  }, [assets, employees]);

  // Assets currently assigned to the selected employee
  const heldAssets = useMemo(() => {
    if (!selectedFromEmployee) return [];
    return assets.filter(
      (a) => a.assigned_to && a.assigned_to.trim().toLowerCase() === selectedFromEmployee.trim().toLowerCase()
    );
  }, [assets, selectedFromEmployee]);

  // When initialEmployee changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialEmployee) {
        setSelectedFromEmployee(initialEmployee);
      } else if (employeesWithAssets.length > 0 && !selectedFromEmployee) {
        setSelectedFromEmployee(employeesWithAssets[0].name);
      }
      setError('');
      setResultData(null);
    }
  }, [isOpen, initialEmployee]);

  // When selectedFromEmployee changes, auto-select all their held assets & initialize config
  useEffect(() => {
    if (!selectedFromEmployee) {
      setSelectedAssetIds([]);
      setAssetConfigs({});
      return;
    }

    const currentHeld = assets.filter(
      (a) => a.assigned_to && a.assigned_to.trim().toLowerCase() === selectedFromEmployee.trim().toLowerCase()
    );

    const ids = currentHeld.map((a) => a.id);
    setSelectedAssetIds(ids);

    const initialMap = {};
    currentHeld.forEach((a) => {
      initialMap[a.id] = {
        action: 'stock', // 'stock' or 'reassign'
        targetEmployee: '',
        targetDept: '',
        condition: a.condition || 'Good',
        accessories: [],
        remarks: ''
      };
    });
    setAssetConfigs(initialMap);
  }, [selectedFromEmployee, assets]);

  if (!isOpen) return null;

  const toggleSelectAsset = (id) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedAssetIds.length === heldAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(heldAssets.map((a) => a.id));
    }
  };

  const updateAssetConfig = (assetId, updates) => {
    setAssetConfigs((prev) => ({
      ...prev,
      [assetId]: {
        ...(prev[assetId] || {
          action: 'stock',
          targetEmployee: '',
          targetDept: '',
          condition: 'Good',
          accessories: [],
          remarks: ''
        }),
        ...updates
      }
    }));
  };

  const applyBulkDestination = () => {
    if (selectedAssetIds.length === 0) return;
    setAssetConfigs((prev) => {
      const next = { ...prev };
      selectedAssetIds.forEach((id) => {
        next[id] = {
          ...(next[id] || {}),
          action: bulkAction,
          targetEmployee: bulkAction === 'reassign' ? bulkTargetEmployee : '',
          targetDept: bulkAction === 'reassign' ? bulkTargetDept : ''
        };
      });
      return next;
    });
  };

  const handleTargetEmployeeChange = (assetId, empName) => {
    const emp = employees.find((e) => e.name?.toLowerCase() === empName.toLowerCase());
    updateAssetConfig(assetId, {
      targetEmployee: empName,
      targetDept: emp?.department || ''
    });
  };

  const toggleAccessory = (assetId, acc) => {
    const curr = assetConfigs[assetId]?.accessories || [];
    const updated = curr.includes(acc) ? curr.filter((x) => x !== acc) : [...curr, acc];
    updateAssetConfig(assetId, { accessories: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedFromEmployee) {
      setError('Please select an employee holding assets.');
      return;
    }

    if (selectedAssetIds.length === 0) {
      setError('Please select at least one asset to return or handover.');
      return;
    }

    // Validation: if any selected asset is set to 'reassign', check that target employee is given
    for (const id of selectedAssetIds) {
      const cfg = assetConfigs[id] || {};
      if (cfg.action === 'reassign' && (!cfg.targetEmployee || !cfg.targetEmployee.trim())) {
        const asset = heldAssets.find((a) => a.id === id);
        setError(`Please select a recipient employee for asset ${asset?.asset_code || asset?.name || id}.`);
        return;
      }
    }

    const currentEmpRecord = employees.find(
      (e) => e.name?.toLowerCase() === selectedFromEmployee.toLowerCase()
    );

    const effectiveReason = reason === 'Other' ? customReason.trim() || 'Other' : reason;

    // Prepare items array
    const items = selectedAssetIds.map((id) => {
      const cfg = assetConfigs[id] || {};
      const targetEmpRecord = employees.find(
        (e) => e.name?.toLowerCase() === (cfg.targetEmployee || '').toLowerCase()
      );

      return {
        asset_id: id,
        action: cfg.action || 'stock',
        to_employee_name: cfg.action === 'reassign' ? (cfg.targetEmployee || '').trim() : '',
        to_employee_id: cfg.action === 'reassign' ? targetEmpRecord?.employee_id || '' : '',
        to_department: cfg.action === 'reassign' ? cfg.targetDept || targetEmpRecord?.department || '' : '',
        condition_before: cfg.condition || 'Good',
        condition_after: cfg.condition || 'Good',
        accessories_returned: (cfg.accessories || []).join(', '),
        accessories_given: (cfg.accessories || []).join(', '),
        remarks: cfg.remarks || generalRemarks || ''
      };
    });

    try {
      setLoading(true);
      const res = await api.createBulkHandover({
        items,
        from_employee_name: selectedFromEmployee,
        from_employee_id: currentEmpRecord?.employee_id || '',
        from_department: currentEmpRecord?.department || heldAssets[0]?.department || '',
        reason: effectiveReason,
        return_date: returnDate,
        handover_date: handoverDate,
        handed_over_by: handedOverBy || selectedFromEmployee,
        received_by: receivedBy || 'IT Admin',
        remarks: generalRemarks,
        mark_resigned: markResigned && reason === 'Employee Resignation'
      });

      setResultData(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to execute bulk handover.');
    } finally {
      setLoading(false);
    }
  };

  const fromEmpRecord = employees.find(
    (e) => e.name?.toLowerCase() === selectedFromEmployee.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Bulk Asset Handover & Clearance
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Resignation & Batch
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Process multiple assets from a single employee with per-asset routing to stock or new holders.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {resultData ? (
            /* Success State */
            <div className="py-8 px-4 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Bulk Handover Completed Successfully!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Processed <strong>{resultData.count}</strong> asset transfers from{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedFromEmployee}
                  </span>
                  . Complete audit trail & assignment logs have been updated permanently.
                </p>
              </div>

              {/* Handover List Summary */}
              <div className="max-w-xl mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-left divide-y divide-slate-200 dark:divide-slate-700">
                {resultData.handovers?.map((h) => {
                  const asset = assets.find((a) => a.id === h.asset_id);
                  return (
                    <div key={h.handover_id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {asset?.asset_code || `Asset #${h.asset_id}`}
                        </span>
                        <span className="text-slate-500 ml-2">({asset?.name || 'Hardware'})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            h.status === 'Handed Over'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          }`}
                        >
                          {h.status === 'Handed Over' ? 'Reassigned' : 'In Stock'}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">{h.handover_id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
                >
                  Close & View Ledger
                </button>
              </div>
            </div>
          ) : (
            /* Wizard / Configuration Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Outgoing Employee Selector */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Outgoing Employee (Returning Custodian)
                  </label>
                  {fromEmpRecord?.department && (
                    <span className="text-xs text-slate-500">
                      Dept: <strong className="text-slate-700 dark:text-slate-300">{fromEmpRecord.department}</strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={selectedFromEmployee}
                      onChange={(e) => setSelectedFromEmployee(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Employee With Held Assets --</option>
                      {employeesWithAssets.map((emp) => (
                        <option key={emp.name} value={emp.name}>
                          {emp.name} ({emp.count} {emp.count === 1 ? 'asset' : 'assets'})
                          {emp.department ? ` • ${emp.department}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
                    <span className="text-slate-500">
                      Total Assets Held:{' '}
                      <strong className="text-slate-900 dark:text-white font-mono text-sm">
                        {heldAssets.length}
                      </strong>
                    </span>
                    {heldAssets.length > 0 && (
                      <button
                        type="button"
                        onClick={selectAll}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        {selectedAssetIds.length === heldAssets.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Assets Held & Destination Routing */}
              {selectedFromEmployee && heldAssets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-600" />
                        Select Assets & Set Destination
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {selectedAssetIds.length} of {heldAssets.length} items selected for this operation
                      </p>
                    </div>

                    {/* Quick Batch Destination Toolbar */}
                    {selectedAssetIds.length > 1 && (
                      <div className="flex items-center gap-2 bg-indigo-50/60 dark:bg-indigo-900/20 p-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/40 text-xs">
                        <span className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium pl-1">
                          Apply to all selected:
                        </span>
                        <select
                          value={bulkAction}
                          onChange={(e) => setBulkAction(e.target.value)}
                          className="text-[11px] py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 font-medium"
                        >
                          <option value="stock">Return to Stock</option>
                          <option value="reassign">Reassign to Person</option>
                        </select>
                        {bulkAction === 'reassign' && (
                          <select
                            value={bulkTargetEmployee}
                            onChange={(e) => {
                              setBulkTargetEmployee(e.target.value);
                              const emp = employees.find((x) => x.name === e.target.value);
                              if (emp) setBulkTargetDept(emp.department || '');
                            }}
                            className="text-[11px] py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 font-medium max-w-[130px]"
                          >
                            <option value="">Recipient...</option>
                            {employees
                              .filter((e) => e.name !== selectedFromEmployee)
                              .map((e) => (
                                <option key={e.id || e.name} value={e.name}>
                                  {e.name}
                                </option>
                              ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={applyBulkDestination}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-semibold shadow-sm transition-all"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Asset Item Rows */}
                  <div className="space-y-3">
                    {heldAssets.map((asset) => {
                      const isSelected = selectedAssetIds.includes(asset.id);
                      const config = assetConfigs[asset.id] || {
                        action: 'stock',
                        targetEmployee: '',
                        targetDept: '',
                        condition: asset.condition || 'Good',
                        accessories: [],
                        remarks: ''
                      };

                      return (
                        <div
                          key={asset.id}
                          className={`rounded-xl border transition-all p-3.5 ${
                            isSelected
                              ? 'bg-white dark:bg-slate-850 border-indigo-300 dark:border-indigo-700 shadow-sm'
                              : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Checkbox & Basic Info */}
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectAsset(asset.id)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                    {asset.asset_code}
                                  </span>
                                  <span className="font-medium text-xs text-slate-700 dark:text-slate-300">
                                    {asset.name}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {asset.category_name || 'Hardware'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                                  <span>Serial: {asset.serial_number || 'N/A'}</span>
                                  <span>Location: {asset.location || 'Local'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Destination Control */}
                            {isSelected && (
                              <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                                {/* Mode toggle: Stock vs Reassign */}
                                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                                  <button
                                    type="button"
                                    onClick={() => updateAssetConfig(asset.id, { action: 'stock' })}
                                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                                      config.action === 'stock'
                                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Return to Stock
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateAssetConfig(asset.id, { action: 'reassign' })}
                                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                                      config.action === 'reassign'
                                        ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                    Reassign to Employee
                                  </button>
                                </div>

                                {/* If Reassign, show recipient selector */}
                                {config.action === 'reassign' && (
                                  <select
                                    value={config.targetEmployee || ''}
                                    onChange={(e) => handleTargetEmployeeChange(asset.id, e.target.value)}
                                    className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    <option value="">-- Choose Recipient --</option>
                                    {employees
                                      .filter((e) => e.name !== selectedFromEmployee)
                                      .map((e) => (
                                        <option key={e.id || e.name} value={e.name}>
                                          {e.name} {e.department ? `(${e.department})` : ''}
                                        </option>
                                      ))}
                                  </select>
                                )}

                                {/* Condition */}
                                <select
                                  value={config.condition}
                                  onChange={(e) => updateAssetConfig(asset.id, { condition: e.target.value })}
                                  className="text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-700 dark:text-slate-300"
                                >
                                  <option value="New">Condition: New</option>
                                  <option value="Good">Condition: Good</option>
                                  <option value="Fair">Condition: Fair</option>
                                  <option value="Poor">Condition: Poor</option>
                                  <option value="Damaged">Condition: Damaged</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Collapsible Accessory pills per asset if selected */}
                          {isSelected && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="text-slate-400 font-medium mr-1">Accessories Returned:</span>
                              {COMMON_ACCESSORIES.slice(0, 5).map((acc) => {
                                const checked = (config.accessories || []).includes(acc);
                                return (
                                  <button
                                    key={acc}
                                    type="button"
                                    onClick={() => toggleAccessory(asset.id, acc)}
                                    className={`px-2 py-0.5 rounded-full border transition-all ${
                                      checked
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                                    }`}
                                  >
                                    {checked ? '✓ ' : '+ '}
                                    {acc}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Shared Handover Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Handover Reason *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100"
                  >
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {reason === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="mt-2 w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Return / Handover Date *
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      setHandoverDate(e.target.value);
                    }}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IT Administrator / Received By
                  </label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder="e.g. IT Admin / Asset Manager"
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    General Remarks / Notes
                  </label>
                  <input
                    type="text"
                    value={generalRemarks}
                    onChange={(e) => setGeneralRemarks(e.target.value)}
                    placeholder="e.g. Clean hardware returned, exit clearance granted"
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Resignation clearance checkbox */}
              {reason === 'Employee Resignation' && selectedFromEmployee && (
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="markResignedCheck"
                    checked={markResigned}
                    onChange={(e) => setMarkResigned(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="markResignedCheck" className="text-xs text-amber-900 dark:text-amber-200 cursor-pointer">
                    <strong>Mark {selectedFromEmployee} as "Resigned"</strong> in the Employee Directory upon
                    successful completion. (Asset assignments will be cleanly closed with full audit history).
                  </label>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || selectedAssetIds.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {loading ? (
                    <span>Processing Transfers...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Execute Bulk Handover ({selectedAssetIds.length} Assets)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
