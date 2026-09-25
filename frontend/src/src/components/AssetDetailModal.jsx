import React, { useState, useEffect } from 'react';
import {
  X,
  Laptop,
  Calendar,
  IndianRupee,
  MapPin,
  User,
  ShieldCheck,
  Cpu,
  HardDrive,
  FileText,
  Clock,
  Wrench,
  Paperclip,
  Copy,
  Check,
  Upload,
  Trash2,
  Download,
  ExternalLink,
  Edit2,
  ArrowLeftRight,
  RotateCcw,
  ArrowRight,
  Printer,
  CheckCircle2
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getStatusBadge,
  getWarrantyBadge,
  getConditionBadge,
  renderCategoryIcon
} from '../utils/formatters';
import { isPriceEnabled, isWarrantyEnabled } from '../config/features';
import { api, getUploadUrl } from '../api';

export default function AssetDetailModal({
  asset,
  onClose,
  onEdit,
  onAssign,
  onReturn,
  onMaintenance,
  currency,
  settings,
  onRefresh,
  onHandover,
  onViewSlip
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tech', 'assignments', 'handovers', 'maintenance', 'docs'
  const showPrice = isPriceEnabled(settings);
  const showWarranty = isWarrantyEnabled(settings);
  const [copiedKey, setCopiedKey] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('Purchase Invoice');
  const [handoversData, setHandoversData] = useState(null);
  const [loadingHandovers, setLoadingHandovers] = useState(false);

  useEffect(() => {
    if (asset?.id) {
      setLoadingHandovers(true);
      api
        .getAssetHandovers(asset.id)
        .then((data) => setHandoversData(data))
        .catch((err) => console.error('Error fetching asset handovers:', err))
        .finally(() => setLoadingHandovers(false));
    }
  }, [asset?.id]);

  if (!asset) return null;

  const copyLicenseKey = () => {
    if (asset.windows_license_key) {
      navigator.clipboard.writeText(asset.windows_license_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('asset_id', asset.id);
      formData.append('document_type', docType);

      await api.uploadDocument(formData);
      if (onRefresh) onRefresh(asset.id);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (confirm('Are you sure you want to remove this attached file?')) {
      try {
        await api.deleteDocument(docId);
        if (onRefresh) onRefresh(asset.id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const hasTechSpecs = Boolean(
    asset.processor ||
      asset.ram ||
      asset.storage ||
      asset.operating_system ||
      asset.mac_address ||
      asset.ip_address ||
      asset.imei ||
      asset.phone_number ||
      asset.windows_license_key
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{
                backgroundColor: `${asset.category_color || '#3b82f6'}20`,
                color: asset.category_color || '#3b82f6'
              }}
            >
              {renderCategoryIcon(asset.category_name, 'w-6 h-6')}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                  {asset.id}
                </span>
                {asset.asset_tag && (
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {asset.asset_tag}
                  </span>
                )}
                {getStatusBadge(asset.status)}
                {getConditionBadge(asset.condition)}
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {asset.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {[asset.brand, asset.model, asset.category_name].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onHandover && (
              <button
                onClick={() => {
                  onClose();
                  onHandover(asset);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Handover / Transfer</span>
              </button>
            )}
            <button
              onClick={() => onEdit(asset)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold overflow-x-auto bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Overview & Financials
          </button>
          <button
            onClick={() => setActiveTab('tech')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tech'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Technical Specs
            {hasTechSpecs && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'assignments'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Assignment History
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px]">
              {asset.assignments?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('handovers')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'handovers'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Handover Timeline</span>
            {handoversData?.handovers?.length > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                {handoversData.handovers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'maintenance'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Maintenance & Repairs
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px]">
              {asset.maintenance?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Documents & Receipts
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px]">
              {asset.documents?.length || 0}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Highlights Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {showPrice && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Purchase Value</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {formatCurrency(asset.purchase_price, currency)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Purchased on {formatDate(asset.purchase_date)}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Current Custodian</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {asset.assigned_to || 'Unassigned'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {asset.department || (asset.assigned_to ? 'Active Custody' : 'In Stock')}
                  </p>
                </div>

                {showWarranty ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Warranty Coverage</p>
                    <div className="mt-1 flex items-center gap-2">
                      {getWarrantyBadge(asset.warranty_end_date)}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Valid until {formatDate(asset.warranty_end_date)}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Location</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {asset.location || 'Not Specified'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Condition: {asset.condition || 'Good'}
                    </p>
                  </div>
                )}

                {!showPrice && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Hardware Tag / SN</p>
                    <p className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 truncate">
                      {asset.serial_number || asset.id}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {asset.asset_tag ? `Tag: ${asset.asset_tag}` : `Asset ID: ${asset.id}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Purchase & Acquisition Info */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {showWarranty ? 'Acquisition & Warranty Information' : 'Acquisition & Identification Details'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <span className="text-slate-400">Vendor / Supplier</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {asset.vendor || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Invoice Number</span>
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {asset.invoice_number || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Serial Number</span>
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {asset.serial_number || '—'}
                    </p>
                  </div>
                  {showWarranty && (
                    <>
                      <div>
                        <span className="text-slate-400">Warranty Start Date</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                          {formatDate(asset.warranty_start_date)}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Warranty End Date</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                          {formatDate(asset.warranty_end_date)}
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-slate-400">Current Location</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {asset.location || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description & Notes */}
              {(asset.description || asset.notes) && (
                <div className="space-y-3">
                  {asset.description && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Description
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {asset.description}
                      </p>
                    </div>
                  )}

                  {asset.notes && (
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-xs">
                      <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                        Personal Notes
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {asset.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TECHNICAL SPECIFICATIONS */}
          {activeTab === 'tech' && (
            <div className="space-y-6">
              {!hasTechSpecs ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No technical specifications recorded for this asset yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Hardware & OS Grid */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Hardware & Compute Specs
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-slate-400">Processor / CPU</span>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">
                          {asset.processor || '—'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-slate-400">RAM / Memory</span>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">
                          {asset.ram || '—'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-slate-400">Storage / Disk</span>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">
                          {asset.storage || '—'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-slate-400">Operating System</span>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">
                          {asset.operating_system || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Network & Identity Grid */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Network & Device Identity
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-slate-400">MAC Address</span>
                        <p className="font-mono font-semibold text-slate-900 dark:text-white mt-1">
                          {asset.mac_address || '—'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-slate-400">IP Address</span>
                        <p className="font-mono font-semibold text-slate-900 dark:text-white mt-1">
                          {asset.ip_address || '—'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-slate-400">IMEI</span>
                        <p className="font-mono font-semibold text-slate-900 dark:text-white mt-1">
                          {asset.imei || '—'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <span className="text-slate-400">Phone Number / SIM</span>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">
                          {asset.phone_number || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Software License Key with Copy Button */}
                  {asset.windows_license_key && (
                    <div className="border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                          Product / Windows License Key
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white select-all">
                          {asset.windows_license_key}
                        </span>
                      </div>
                      <button
                        onClick={copyLicenseKey}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Key</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSIGNMENT HISTORY */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Custodian & Allocation History
                </h4>
                {asset.status === 'Assigned' || asset.assigned_to ? (
                  <button
                    onClick={() => {
                      onClose();
                      onReturn(asset);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Return Asset
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      onAssign(asset);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    + Assign Custodian
                  </button>
                )}
              </div>

              {asset.assignments?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No assignment logs recorded for this asset yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 py-2">
                  {asset.assignments.map((asg) => (
                    <div key={asg.id} className="relative pl-6">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                          asg.return_date ? 'bg-slate-300 dark:bg-slate-600' : 'bg-blue-600 animate-pulse'
                        }`}
                      />

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {asg.person_name}
                            </span>
                            {asg.employee_id && (
                              <span className="font-mono text-xs text-slate-500">
                                ({asg.employee_id})
                              </span>
                            )}
                            {!asg.return_date && (
                              <span className="px-2 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">
                                Current Custodian
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            Assigned on {formatDate(asg.assignment_date)}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-4">
                          {asg.department && <span>Department: {asg.department}</span>}
                          {asg.expected_return_date && (
                            <span>Due Date: {formatDate(asg.expected_return_date)}</span>
                          )}
                          {asg.return_date && (
                            <span className="text-emerald-600 font-medium">
                              Returned on: {formatDate(asg.return_date)}
                            </span>
                          )}
                        </div>

                        {asg.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            {asg.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: HANDOVER TIMELINE */}
          {activeTab === 'handovers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                    Custody Chain & Handover History
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Chronological lifecycle: From Employee X → Returned → Reassigned to Employee Y.
                  </p>
                </div>
                {onHandover && (
                  <button
                    onClick={() => {
                      onClose();
                      onHandover(asset);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>+ New Handover</span>
                  </button>
                )}
              </div>

              {/* Visual Unified Timeline Flow */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
                  Visual Custody Path
                </h5>

                {handoversData?.timeline && handoversData.timeline.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                    {handoversData.timeline.map((event, idx) => {
                      const isReturn = event.type === 'return';
                      return (
                        <div key={idx} className="relative flex items-start gap-3">
                          <div
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${
                              isReturn
                                ? 'bg-emerald-500 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {isReturn ? (
                              <RotateCcw className="w-2.5 h-2.5" />
                            ) : (
                              <User className="w-2.5 h-2.5" />
                            )}
                          </div>
                          <div className="flex-1 bg-white dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`font-bold ${
                                  isReturn
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-blue-700 dark:text-blue-400'
                                }`}
                              >
                                {isReturn ? 'Returned to Stock' : `Assigned to ${event.person_name}`}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {formatDate(event.date)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                              {event.department && <span>Department: {event.department}</span>}
                              {event.employee_id && <span>ID: {event.employee_id}</span>}
                            </div>
                            {event.notes && (
                              <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 italic">
                                {event.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No custody changes recorded yet. Currently in initial state.
                  </div>
                )}
              </div>

              {/* Handover Slips Ledger */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Handover Slips & Official Audit Records
                </h5>

                {handoversData?.handovers && handoversData.handovers.length > 0 ? (
                  <div className="space-y-2.5">
                    {handoversData.handovers.map((h) => (
                      <div
                        key={h.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {h.handover_id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                h.status === 'Handed Over'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                              }`}
                            >
                              {h.status}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {formatDate(h.handover_date || h.return_date)}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                            <span>{h.from_employee_name || 'Stock'}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span>{h.to_employee_name || 'Returned to Stock'}</span>
                            <span className="text-slate-400 font-normal">({h.reason})</span>
                          </div>

                          {h.accessories_returned && (
                            <div className="mt-1 text-[11px] text-slate-400">
                              Accessories: {h.accessories_returned}
                            </div>
                          )}
                        </div>

                        {onViewSlip && (
                          <button
                            onClick={() => onViewSlip(h)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Slip</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No formal handover slips created for this asset yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MAINTENANCE & REPAIRS */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Maintenance & Service Records
                </h4>
                <button
                  onClick={() => {
                    onClose();
                    onMaintenance(asset);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                >
                  + Log Repair Ticket
                </button>
              </div>

              {asset.maintenance?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No repair or maintenance tickets recorded for this asset.
                </div>
              ) : (
                <div className="space-y-3">
                  {asset.maintenance.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {m.issue}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                              m.repair_status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m.repair_status}
                          </span>
                          {m.warranty_claim === 1 && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800">
                              Warranty Claim
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {formatCurrency(m.repair_cost, currency)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Reported Date</span>
                          {formatDate(m.reported_date)}
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Vendor / Service</span>
                          {m.repair_vendor || '—'}
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Sent Date</span>
                          {formatDate(m.sent_date)}
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Received Date</span>
                          {formatDate(m.received_date)}
                        </div>
                      </div>

                      {m.resolution && (
                        <div className="text-xs bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Resolution:{' '}
                          </span>
                          {m.resolution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOCUMENTS & RECEIPTS */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              {/* Upload Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Attach Local Document
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Store invoices, warranty receipts, and licenses locally in your computer
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="py-1 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium"
                  >
                    <option value="Purchase Invoice">Purchase Invoice</option>
                    <option value="Warranty Card">Warranty Card</option>
                    <option value="Repair Invoice">Repair Invoice</option>
                    <option value="License Document">License Document</option>
                    <option value="Other">Other Document</option>
                  </select>

                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingDoc ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingDoc}
                    />
                  </label>
                </div>
              </div>

              {/* Document List */}
              {asset.documents?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No documents attached to this asset.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {asset.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {doc.original_name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {doc.document_type} • {Math.round((doc.file_size || 0) / 1024)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={getUploadUrl(doc.file_name)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                          title="Open locally"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
