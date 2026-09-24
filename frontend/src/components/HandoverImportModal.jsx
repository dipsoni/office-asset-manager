import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  HelpCircle,
  FileText,
  Search,
  RotateCcw,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../api';
import { formatDate } from '../utils/formatters';

export default function HandoverImportModal({
  isOpen,
  onClose,
  onSuccess,
  assets = [],
  employees = []
}) {
  const [step, setStep] = useState(1); // 1 = Upload, 2 = Mapping & Preview, 3 = Completed
  const [selectedFile, setSelectedFile] = useState(null);
  const [localFilePath, setLocalFilePath] = useState('');
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheetName, setActiveSheetName] = useState('');
  const [parsedWorkbook, setParsedWorkbook] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);

  // Column Mapping Dictionary
  const [columnMapping, setColumnMapping] = useState({
    asset_id: '',
    asset_name: '',
    category: '',
    from_employee_name: '',
    from_department: '',
    from_employee_id: '',
    to_employee_name: '',
    to_department: '',
    to_employee_id: '',
    handover_date: '',
    return_date: '',
    reason: '',
    condition: '',
    accessories: '',
    remarks: '',
    handover_id: ''
  });

  const [autoCreateAssets, setAutoCreateAssets] = useState(true);
  const [defaultReason, setDefaultReason] = useState('Asset Handover');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Helper to parse dates from Excel (serial numbers, DD/MM/YYYY, or ISO)
  const formatExcelDate = (val) => {
    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'number') {
      try {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (_) {}
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      return trimmed;
    }
    return String(val);
  };

  // Smart Header Guesser
  const guessMatchingHeader = (headers, synonyms) => {
    const cleanSynonyms = synonyms.map((s) => s.toLowerCase().replace(/[\s_\-./]/g, ''));
    for (const h of headers) {
      const cleanH = String(h).toLowerCase().replace(/[\s_\-./]/g, '');
      if (cleanSynonyms.includes(cleanH)) return h;
    }
    // Partial substring match
    for (const h of headers) {
      const cleanH = String(h).toLowerCase().replace(/[\s_\-./]/g, '');
      for (const syn of cleanSynonyms) {
        if (cleanH.includes(syn) || (syn.length > 3 && cleanH.length > 3 && syn.includes(cleanH))) return h;
      }
    }
    return '';
  };

  const computeAutoMapping = (headers) => {
    return {
      asset_id: guessMatchingHeader(headers, [
        'asset id', 'asset code', 'machine id', 'machine no', 'tag id', 'asset tag', 'laptop id', 'sr no', 'serial number', 'code'
      ]),
      asset_name: guessMatchingHeader(headers, [
        'asset name', 'name', 'item', 'item name', 'model', 'equipment', 'description', 'device'
      ]),
      category: guessMatchingHeader(headers, [
        'category', 'asset type', 'type', 'device type', 'group'
      ]),
      from_employee_name: guessMatchingHeader(headers, [
        'from employee', 'from person', 'from', 'handed over by', 'returned by', 'previous owner', 'outgoing employee', 'old employee', 'resigned employee'
      ]),
      from_department: guessMatchingHeader(headers, [
        'from department', 'from dept', 'old department'
      ]),
      from_employee_id: guessMatchingHeader(headers, [
        'from employee id', 'from emp id', 'outgoing emp id'
      ]),
      to_employee_name: guessMatchingHeader(headers, [
        'to employee', 'to person', 'to', 'handed over to', 'received by', 'new owner', 'incoming employee', 'new employee', 'assigned to', 'recipient'
      ]),
      to_department: guessMatchingHeader(headers, [
        'to department', 'to dept', 'new department', 'department'
      ]),
      to_employee_id: guessMatchingHeader(headers, [
        'to employee id', 'to emp id', 'incoming emp id', 'employee id'
      ]),
      handover_date: guessMatchingHeader(headers, [
        'handover date', 'issue date', 'assigned date', 'date', 'transfer date', 'allocation date'
      ]),
      return_date: guessMatchingHeader(headers, [
        'return date', 'returned date', 'returned on'
      ]),
      reason: guessMatchingHeader(headers, [
        'reason', 'transfer reason', 'handover reason', 'cause', 'remarks', 'purpose'
      ]),
      condition: guessMatchingHeader(headers, [
        'condition', 'status condition', 'physical condition', 'state'
      ]),
      accessories: guessMatchingHeader(headers, [
        'accessories', 'accessories given', 'accessories returned', 'items given', 'peripherals'
      ]),
      remarks: guessMatchingHeader(headers, [
        'remarks', 'notes', 'comments', 'note'
      ]),
      handover_id: guessMatchingHeader(headers, [
        'slip no', 'slip id', 'handover id', 'ref no', 'voucher no'
      ])
    };
  };

  const processWorkbookData = (wb, preferredSheet = null) => {
    try {
      const names = wb.SheetNames;
      setSheetNames(names);
      const targetSheet = preferredSheet && names.includes(preferredSheet) ? preferredSheet : names[0];
      setActiveSheetName(targetSheet);

      const worksheet = wb.Sheets[targetSheet];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (jsonRows.length === 0) {
        setError('Selected sheet is empty.');
        return;
      }

      // Find the header row (row with most non-empty string cells)
      let bestHeaderIndex = 0;
      let maxNonEmpty = 0;
      for (let i = 0; i < Math.min(10, jsonRows.length); i++) {
        const row = jsonRows[i];
        if (Array.isArray(row)) {
          const nonEmpty = row.filter((c) => c !== null && String(c).trim() !== '').length;
          if (nonEmpty > maxNonEmpty) {
            maxNonEmpty = nonEmpty;
            bestHeaderIndex = i;
          }
        }
      }

      const headers = jsonRows[bestHeaderIndex].map((h) => String(h).trim()).filter(Boolean);
      setFileHeaders(headers);

      // Data rows following header
      const dataRows = [];
      for (let r = bestHeaderIndex + 1; r < jsonRows.length; r++) {
        const rowArr = jsonRows[r];
        if (!Array.isArray(rowArr)) continue;
        const rowObj = {};
        let hasAnyVal = false;
        headers.forEach((h, colIdx) => {
          const val = rowArr[colIdx];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            hasAnyVal = true;
          }
          rowObj[h] = val !== undefined && val !== null ? String(val).trim() : '';
        });
        if (hasAnyVal) {
          dataRows.push(rowObj);
        }
      }

      setRawRows(dataRows);
      setColumnMapping(computeAutoMapping(headers));
      setStep(2);
      setError('');
    } catch (err) {
      setError(`Failed to read sheet data: ${err.message}`);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setError('Please choose a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setSelectedFile(file);
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        setParsedWorkbook(wb);
        processWorkbookData(wb);
      } catch (err) {
        setError(`Unable to parse Excel file: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleLoadFromPath = async () => {
    if (!localFilePath || !localFilePath.trim()) {
      setError('Please enter a valid Windows file path.');
      return;
    }
    try {
      setError('');
      setIsImporting(true);
      const res = await api.importHandoversLocalPath({ file_path: localFilePath.trim() });
      if (!res.sheetNames || res.sheetNames.length === 0) {
        setError('No sheets found in specified workbook.');
        return;
      }

      // Convert sheets to XLSX workbook structure
      const wb = XLSX.utils.book_new();
      res.sheetNames.forEach((sName) => {
        const ws = XLSX.utils.aoa_to_sheet(res.sheetData[sName] || []);
        XLSX.utils.book_append_sheet(wb, ws, sName);
      });

      setParsedWorkbook(wb);
      processWorkbookData(wb);
    } catch (err) {
      setError(err.message || 'Failed to load local file.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSheetSwitch = (sName) => {
    if (!parsedWorkbook) return;
    setActiveSheetName(sName);
    processWorkbookData(parsedWorkbook, sName);
  };

  // Convert raw rows to mapped handover objects
  const mappedRows = useMemo(() => {
    return rawRows.map((row) => {
      const getVal = (field) => {
        const col = columnMapping[field];
        return col && row[col] !== undefined ? row[col] : '';
      };

      const rawCode = getVal('asset_id');
      const fromName = getVal('from_employee_name');
      const toName = getVal('to_employee_name');

      // Check if matches an existing asset
      let matched = null;
      if (rawCode) {
        matched = assets.find(
          (a) =>
            a.id?.toLowerCase() === rawCode.toLowerCase() ||
            (a.serial_number && a.serial_number.toLowerCase() === rawCode.toLowerCase()) ||
            (a.asset_tag && a.asset_tag.toLowerCase() === rawCode.toLowerCase())
        );
      }

      return {
        asset_id: rawCode,
        asset_name: getVal('asset_name'),
        category: getVal('category'),
        from_employee_name: fromName,
        from_department: getVal('from_department'),
        from_employee_id: getVal('from_employee_id'),
        to_employee_name: toName,
        to_department: getVal('to_department'),
        to_employee_id: getVal('to_employee_id'),
        handover_date: formatExcelDate(getVal('handover_date')),
        return_date: formatExcelDate(getVal('return_date')),
        reason: getVal('reason') || defaultReason,
        condition: getVal('condition') || 'Good',
        accessories: getVal('accessories'),
        remarks: getVal('remarks'),
        handover_id: getVal('handover_id'),
        matched_existing: Boolean(matched),
        matched_asset: matched
      };
    });
  }, [rawRows, columnMapping, assets, defaultReason]);

  const handleExecuteImport = async () => {
    if (mappedRows.length === 0) {
      setError('No valid rows found to import.');
      return;
    }

    try {
      setIsImporting(true);
      setError('');

      const res = await api.importHandovers({
        handovers: mappedRows,
        auto_create_assets: autoCreateAssets,
        default_reason: defaultReason
      });

      setImportResult(res);
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Import execution failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setSelectedFile(null);
    setLocalFilePath('');
    setSheetNames([]);
    setActiveSheetName('');
    setParsedWorkbook(null);
    setFileHeaders([]);
    setRawRows([]);
    setImportResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const targetFieldSpecs = [
    { key: 'asset_id', label: 'Asset Code / Serial No *', required: true, hint: 'e.g. LAP-001, CPU-014, or Serial #' },
    { key: 'from_employee_name', label: 'From Employee (Outgoing) *', required: true, hint: 'Employee giving or returning asset' },
    { key: 'to_employee_name', label: 'To Employee (Recipient)', required: false, hint: 'Leave empty if returned to stock' },
    { key: 'handover_date', label: 'Handover / Transfer Date', required: false, hint: 'Defaults to today if empty' },
    { key: 'reason', label: 'Handover Reason', required: false, hint: 'e.g. Resignation, Transfer, Upgrade' },
    { key: 'condition', label: 'Condition', required: false, hint: 'Good, Fair, Poor, Damaged' },
    { key: 'accessories', label: 'Accessories (Charger, Bag, etc.)', required: false, hint: 'Accessories checklist' },
    { key: 'asset_name', label: 'Asset Name / Model (Optional)', required: false, hint: 'e.g. Dell Latitude 5420' },
    { key: 'from_department', label: 'From Department', required: false, hint: 'e.g. IT, Sales' },
    { key: 'to_department', label: 'To Department', required: false, hint: 'e.g. Reception, HR' },
    { key: 'remarks', label: 'Remarks / Notes', required: false, hint: 'Transfer notes' },
    { key: 'handover_id', label: 'Slip # / Ref ID (Optional)', required: false, hint: 'Custom voucher code if any' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Import Handover Sheet
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Smart Excel Mapping
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload any Excel or CSV sheet to import historical and current asset handover records.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD / LOCAL PATH */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Drag & Drop Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all group ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-850 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-4">
                  Select or Drop your Handover Excel Sheet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Supports <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong>. Works with any
                  column layout or custom spreadsheet format.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all">
                  <span>Browse File</span>
                </div>
              </div>

              {/* Local File Path Alternative */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Or Enter Windows File Path Directly
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. C:\Users\deepd\Downloads\Handover_Sheet.xlsx"
                    value={localFilePath}
                    onChange={(e) => setLocalFilePath(e.target.value)}
                    className="flex-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleLoadFromPath}
                    disabled={isImporting || !localFilePath.trim()}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isImporting ? 'Reading...' : 'Load File'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & LIVE PREVIEW */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Sheet Selector (if multiple sheets) */}
              {sheetNames.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Choose Sheet:</span>
                  {sheetNames.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSheetSwitch(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        activeSheetName === s
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Column Mapping Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Column Header Mapping
                  </h3>
                  <span className="text-xs text-slate-500">
                    Detected {rawRows.length} rows in sheet "{activeSheetName}"
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {targetFieldSpecs.map((f) => (
                    <div
                      key={f.key}
                      className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {f.label}
                        </span>
                        {f.required && (
                          <span className="text-[10px] text-blue-600 font-bold">Required</span>
                        )}
                      </div>
                      <select
                        value={columnMapping[f.key] || ''}
                        onChange={(e) =>
                          setColumnMapping((prev) => ({ ...prev, [f.key]: e.target.value }))
                        }
                        className={`w-full text-xs rounded-lg border px-2 py-1.5 font-medium transition-colors ${
                          columnMapping[f.key]
                            ? 'border-blue-500 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'
                        }`}
                      >
                        <option value="">-- Unmapped / Skip --</option>
                        {fileHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 truncate">{f.hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Options */}
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoCreateAssetsCheck"
                    checked={autoCreateAssets}
                    onChange={(e) => setAutoCreateAssets(e.target.checked)}
                    className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="autoCreateAssetsCheck" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                    <strong>Auto-create assets</strong> in inventory if the asset code does not already exist.
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Default Reason:</span>
                  <select
                    value={defaultReason}
                    onChange={(e) => setDefaultReason(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-medium"
                  >
                    <option value="Asset Handover">Asset Handover</option>
                    <option value="Employee Resignation">Employee Resignation</option>
                    <option value="Department Transfer">Department Transfer</option>
                    <option value="Hardware Refresh">Hardware Refresh</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Live Preview (First 5 Rows to be Imported)
                </h4>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Asset Code</th>
                        <th className="py-2.5 px-3">From Custodian</th>
                        <th className="py-2.5 px-3">To Recipient</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3">Inventory Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {mappedRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            {row.asset_id || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                            {row.from_employee_name || '—'}
                          </td>
                          <td className="py-2 px-3">
                            <span className={row.to_employee_name ? 'text-blue-600 font-semibold' : 'text-emerald-600 italic'}>
                              {row.to_employee_name || 'Return to Stock'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {formatDate(row.handover_date || new Date().toISOString())}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                            {row.reason}
                          </td>
                          <td className="py-2 px-3">
                            {row.matched_existing ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                ✓ Exists in DB
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                + Will Create
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting || mappedRows.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {isImporting ? (
                    <span>Importing {mappedRows.length} Records...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Execute Import ({mappedRows.length} Handovers)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COMPLETED SUMMARY */}
          {step === 3 && importResult && (
            <div className="py-8 px-4 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Handover Sheet Imported Successfully!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Processed <strong>{importResult.importedCount}</strong> handover entries into your local database.
                  Full chronological custody chains and assignment records have been saved permanently.
                </p>
              </div>

              {/* Stats Box */}
              <div className="max-w-md mx-auto grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <div>
                  <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                    {importResult.importedCount}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Handovers Logged</div>
                </div>
                <div>
                  <div className="text-xl font-black font-mono text-purple-600 dark:text-purple-400">
                    {importResult.updatedAssetsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Assets Updated</div>
                </div>
                <div>
                  <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {importResult.createdAssetsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">New Assets Created</div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Close & View Handover Hub
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
