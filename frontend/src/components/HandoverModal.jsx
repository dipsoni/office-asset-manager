import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  Building,
  Calendar,
  ShieldCheck,
  Package,
  FileText,
  Printer,
  Sparkles,
  Layers,
  Check,
  HelpCircle,
  ArrowLeftRight
} from 'lucide-react';
import { api } from '../api';
import { formatDate } from '../utils/formatters';

const HANDOVER_REASONS = [
  'Employee Resigned',
  'Employee Transferred',
  'Employee Promoted',
  'Employee Changed Department',
  'Asset Replacement',
  'Temporary Handover',
  'New Employee Joining',
  'Repair/Replacement',
  'Other'
];

const STANDARD_ACCESSORIES = [
  'Power Adapter / Charger',
  'Carrying Bag / Sleeve',
  'Wireless Mouse',
  'HDMI / DisplayPort Cable',
  'Original Box',
  'Keyboard'
];

export default function HandoverModal({ isOpen, onClose, initialAsset, onSuccess, settings }) {
  const [step, setStep] = useState(1); // 1 = Select Asset & From, 2 = Reason & Return, 3 = New Holder, 4 = Confirm, 5 = Done
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdHandover, setCreatedHandover] = useState(null);

  // Form State
  const [reason, setReason] = useState('Employee Resigned');
  const [customReason, setCustomReason] = useState('');
  
  // Return Details
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState(settings?.owner_name || 'IT Support');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [selectedAccessories, setSelectedAccessories] = useState(['Power Adapter / Charger']);
  const [customAccessories, setCustomAccessories] = useState('');
  const [missingAccessories, setMissingAccessories] = useState('');
  const [damageDetails, setDamageDetails] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');

  // Target Action: 'reassign' or 'stock_only'
  const [targetAction, setTargetAction] = useState('reassign');

  // New Holder Details
  const [selectedNewEmployee, setSelectedNewEmployee] = useState(null);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);
  const [handedOverBy, setHandedOverBy] = useState(settings?.owner_name || 'IT Support');
  const [handoverCondition, setHandoverCondition] = useState('Good');
  const [accessoriesGiven, setAccessoriesGiven] = useState('Power Adapter / Charger');
  const [handoverRemarks, setHandoverRemarks] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAssetsAndEmployees();
      if (initialAsset) {
        selectAsset(initialAsset);
      }
    } else {
      resetForm();
    }
  }, [isOpen, initialAsset]);

  const loadAssetsAndEmployees = async () => {
    try {
      const [allAssets, allEmployees] = await Promise.all([
        api.getAssets(),
        api.getEmployees()
      ]);
      setAssets(allAssets || []);
      setEmployees(allEmployees || []);
    } catch (err) {
      console.error('Error loading handover dependencies:', err);
    }
  };

  const selectAsset = (asset) => {
    setSelectedAsset(asset);
    setReturnCondition(asset.condition || 'Good');
    setHandoverCondition(asset.condition || 'Good');
    setError('');
  };

  const selectNewEmployee = (emp) => {
    setSelectedNewEmployee(emp);
    setNewEmployeeName(emp.name);
    setNewEmployeeId(emp.employee_id || '');
    setNewDepartment(emp.department || '');
    setNewDesignation(emp.designation || '');
  };

  const toggleAccessory = (acc) => {
    setSelectedAccessories((prev) =>
      prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc]
    );
  };

  const resetForm = () => {
    setStep(1);
    setSelectedAsset(null);
    setSelectedNewEmployee(null);
    setAssetSearch('');
    setEmployeeSearch('');
    setReason('Employee Resigned');
    setCustomReason('');
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReceivedBy(settings?.owner_name || 'IT Support');
    setReturnCondition('Good');
    setSelectedAccessories(['Power Adapter / Charger']);
    setCustomAccessories('');
    setMissingAccessories('');
    setDamageDetails('');
    setReturnRemarks('');
    setTargetAction('reassign');
    setNewEmployeeName('');
    setNewEmployeeId('');
    setNewDepartment('');
    setNewDesignation('');
    setHandoverDate(new Date().toISOString().split('T')[0]);
    setHandedOverBy(settings?.owner_name || 'IT Support');
    setHandoverCondition('Good');
    setAccessoriesGiven('Power Adapter / Charger');
    setHandoverRemarks('');
    setError('');
    setIsSubmitting(false);
    setCreatedHandover(null);
  };

  if (!isOpen) return null;

  // Filtered Assets for Step 1
  const filteredAssets = assets.filter((a) => {
    const q = assetSearch.toLowerCase();
    return (
      a.id.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.serial_number && a.serial_number.toLowerCase().includes(q)) ||
      (a.assigned_to && a.assigned_to.toLowerCase().includes(q)) ||
      (a.category_name && a.category_name.toLowerCase().includes(q))
    );
  });

  // Filtered Employees for Step 3
  const filteredEmployees = employees.filter((e) => {
    const q = employeeSearch.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.employee_id && e.employee_id.toLowerCase().includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q))
    );
  });

  // Effective reason
  const finalReason = reason === 'Other' ? (customReason || 'Other Reason') : reason;

  // Combined accessories
  const allAccessoriesString = [
    ...selectedAccessories,
    customAccessories.trim()
  ]
    .filter(Boolean)
    .join(', ');

  const handleNextFromStep1 = () => {
    if (!selectedAsset) {
      setError('Please select an asset to process handover.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!finalReason) {
      setError('Please specify a handover reason.');
      return;
    }
    setError('');
    if (targetAction === 'stock_only') {
      setStep(4); // Skip to confirmation for return to stock
    } else {
      setStep(3);
    }
  };

  const handleNextFromStep3 = () => {
    if (targetAction === 'reassign' && !newEmployeeName.trim()) {
      setError('Please select or enter the new employee name.');
      return;
    }
    setError('');
    setStep(4);
  };

  const handleSubmitHandover = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        asset_id: selectedAsset.id,
        reason: finalReason,
        from_employee_name: selectedAsset.assigned_to || 'Company Stock',
        from_employee_id: selectedAsset.employee_id || '',
        from_department: selectedAsset.department || '',
        return_date: returnDate,
        received_by: receivedBy,
        condition_before: returnCondition,
        accessories_returned: allAccessoriesString,
        missing_accessories: missingAccessories,
        damage_details: damageDetails,
        to_employee_name: targetAction === 'reassign' ? newEmployeeName.trim() : '',
        to_employee_id: targetAction === 'reassign' ? newEmployeeId.trim() : '',
        to_department: targetAction === 'reassign' ? newDepartment.trim() : '',
        handover_date: targetAction === 'reassign' ? handoverDate : null,
        handed_over_by: handedOverBy,
        condition_after: targetAction === 'reassign' ? handoverCondition : returnCondition,
        accessories_given: targetAction === 'reassign' ? accessoriesGiven : '',
        remarks: [returnRemarks, handoverRemarks].filter(Boolean).join(' | '),
        status: targetAction === 'reassign' ? 'Handed Over' : 'Returned'
      };

      const result = await api.createHandover(payload);
      setCreatedHandover(result);
      setStep(5);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to record handover.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Asset Handover & Reassignment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 1 && 'Step 1: Select Asset & Identify Current Holder'}
                {step === 2 && 'Step 2: Return Details & Transfer Reason'}
                {step === 3 && 'Step 3: New Custodian & Handover Details'}
                {step === 4 && 'Step 4: Review Summary & Confirm Handover'}
                {step === 5 && 'Handover Complete!'}
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

        {/* Wizard Step Progress Bar */}
        {step < 5 && (
          <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold overflow-x-auto gap-2">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-300 dark:bg-slate-700'}`}>1</span>
              <span>Asset</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 dark:bg-slate-700'}`}>2</span>
              <span>Return & Reason</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 dark:bg-slate-700'}`}>3</span>
              <span>New Holder</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
            <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-blue-600 text-white' : 'bg-slate-300 dark:bg-slate-700'}`}>4</span>
              <span>Confirmation</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Select Asset & Identify Current Holder */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Search & Select Asset to Hand Over:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by Asset ID (e.g. LAP-001), Serial Number, Name, or Current Employee..."
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Asset Select List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                {filteredAssets.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching assets found.
                  </div>
                ) : (
                  filteredAssets.slice(0, 10).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectAsset(a)}
                      className={`w-full text-left p-3 flex items-center justify-between text-xs transition-colors ${
                        selectedAsset?.id === a.id
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{a.id}</span>
                        <div>
                          <span className="font-medium text-slate-900 dark:text-white">{a.name}</span>
                          <span className="text-[11px] text-slate-400 ml-2">
                            {[a.brand, a.category_name].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          {a.assigned_to ? `Held by: ${a.assigned_to}` : 'Available in Stock'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Selected Asset & Read-Only Current Holder Details */}
              {selectedAsset && (
                <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-900 pb-2">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Hardware & Current Custodian Profile
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {selectedAsset.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Asset Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAsset.category_name || 'Hardware'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Brand & Model</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{[selectedAsset.brand, selectedAsset.model].filter(Boolean).join(' ') || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Serial Number</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{selectedAsset.serial_number || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Status</span>
                      <span className="font-bold text-emerald-600">{selectedAsset.status}</span>
                    </div>
                  </div>

                  {/* Read-Only Current Holder Box */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-200/80 dark:border-blue-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Current Holder (Read-Only)
                      </span>
                      <span className="text-[10px] text-slate-400 italic">Identified automatically</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Employee Name:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedAsset.assigned_to || 'None (Available in Stock)'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Department:</span>
                        <span className="text-slate-700 dark:text-slate-300">{selectedAsset.department || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Condition:</span>
                        <span className="text-slate-700 dark:text-slate-300">{selectedAsset.condition || 'Good'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Reason for Handover & Return Details */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Handover Reason */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Select Reason for Handover: <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {HANDOVER_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                        reason === r
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {reason === 'Other' && (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Specify custom reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Return Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Return Inspection Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Return Date:</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Received By (Admin):</label>
                    <input
                      type="text"
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Return Condition:</label>
                    <select
                      value={returnCondition}
                      onChange={(e) => setReturnCondition(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Damaged">Damaged / Defective</option>
                    </select>
                  </div>
                </div>

                {/* Accessories Checkboxes */}
                <div>
                  <label className="block text-slate-500 mb-1.5 text-[11px]">Accessories Returned:</label>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_ACCESSORIES.map((acc) => {
                      const isChecked = selectedAccessories.includes(acc);
                      return (
                        <button
                          key={acc}
                          type="button"
                          onClick={() => toggleAccessory(acc)}
                          className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                            isChecked
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Check className={`w-3 h-3 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                          <span>{acc}</span>
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Other accessory notes..."
                    value={customAccessories}
                    onChange={(e) => setCustomAccessories(e.target.value)}
                    className="w-full mt-2 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Damage & Missing Accessories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Missing Accessories (if any):</label>
                    <input
                      type="text"
                      placeholder="e.g. Missing USB-C cable"
                      value={missingAccessories}
                      onChange={(e) => setMissingAccessories(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Damage Inspection Details:</label>
                    <input
                      type="text"
                      placeholder="e.g. Scratches on lid, working fine"
                      value={damageDetails}
                      onChange={(e) => setDamageDetails(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Next Destination Toggle */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Next Destination for this Asset:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetAction('reassign')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                        targetAction === 'reassign'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Reassign to New Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetAction('stock_only')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                        targetAction === 'stock_only'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Keep in Available Stock
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: New Custodian & Handover Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Search & Select New Employee:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search existing staff by name, ID (e.g. HR-EMP-00178), or department..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Employee Quick Pick List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                {filteredEmployees.slice(0, 8).map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => selectNewEmployee(emp)}
                    className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors ${
                      selectedNewEmployee?.id === emp.id
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{emp.name}</span>
                      {emp.employee_id && (
                        <span className="ml-2 font-mono text-[10px] text-slate-400">ID: {emp.employee_id}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">{emp.department || '—'}</span>
                  </button>
                ))}
              </div>

              {/* New Holder Form Fields */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  New Holder Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Employee Name: *</label>
                    <input
                      type="text"
                      placeholder="e.g. Amit Patel"
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Employee ID:</label>
                    <input
                      type="text"
                      placeholder="e.g. HR-EMP-00501"
                      value={newEmployeeId}
                      onChange={(e) => setNewEmployeeId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Department:</label>
                    <input
                      type="text"
                      placeholder="e.g. IT / Engineering"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Designation:</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      value={newDesignation}
                      onChange={(e) => setNewDesignation(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Handover Date:</label>
                    <input
                      type="date"
                      value={handoverDate}
                      onChange={(e) => setHandoverDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Assigned By (Admin):</label>
                    <input
                      type="text"
                      value={handedOverBy}
                      onChange={(e) => setHandedOverBy(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Handover Condition:</label>
                    <select
                      value={handoverCondition}
                      onChange={(e) => setHandoverCondition(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    >
                      <option value="Good">Good</option>
                      <option value="Brand New">Brand New</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 text-[11px]">Accessories Given to New Holder:</label>
                  <input
                    type="text"
                    value={accessoriesGiven}
                    onChange={(e) => setAccessoriesGiven(e.target.value)}
                    placeholder="e.g. Laptop + Charger + Bag"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review Summary & Confirmation */}
          {step === 4 && selectedAsset && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Asset Handover Summary
                  </h3>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {selectedAsset.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Asset:</span>
                    <strong className="text-slate-900 dark:text-white">{selectedAsset.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Serial Number:</span>
                    <span className="font-mono">{selectedAsset.serial_number || '—'}</span>
                  </div>
                </div>

                {/* Transfer Pipeline Card */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Previous Custodian</span>
                    <div className="font-bold text-slate-900 dark:text-white">{selectedAsset.assigned_to || 'Company Stock'}</div>
                    <div className="text-[11px] text-slate-500">Return Date: {formatDate(returnDate)}</div>
                    <div className="text-[11px] text-slate-500">Return Condition: {returnCondition}</div>
                  </div>

                  <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 sm:pl-4">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">New Custodian</span>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {targetAction === 'reassign' ? newEmployeeName : 'Returned to Available Stock'}
                    </div>
                    {targetAction === 'reassign' && (
                      <>
                        <div className="text-[11px] text-slate-500">Handover Date: {formatDate(handoverDate)}</div>
                        <div className="text-[11px] text-slate-500">New Condition: {handoverCondition}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-1">
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Reason:</strong> {finalReason}
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Accessories:</strong> {allAccessoriesString || 'Standard unit'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Strict Audit Guarantee:</strong> Previous employee assignment history will be permanently saved. The asset will automatically update to show <strong>{targetAction === 'reassign' ? newEmployeeName : 'Available (In Stock)'}</strong>.
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Success & Handover Complete */}
          {step === 5 && createdHandover && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Handover Recorded Successfully!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Slip #{createdHandover.handover_id} has been permanently saved to the handover ledger.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close & Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 5 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(step - 1);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>

              {step === 1 && (
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleNextFromStep3}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <span>Review Summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === 4 && (
                <button
                  type="button"
                  onClick={handleSubmitHandover}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording Handover...' : 'Confirm Handover'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
