import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Table,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Settings2,
  HelpCircle,
  Check,
  Layers,
  Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../api';
import { isPriceEnabled, isWarrantyEnabled } from '../config/features';

export default function ExcelImportModal({ isOpen, onClose, onSuccess, settings }) {
  const showPrice = isPriceEnabled(settings);
  const showWarranty = isWarrantyEnabled(settings);
  const [step, setStep] = useState(1); // 1 = Upload, 2 = Map Columns & Preview, 3 = Done
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheetName, setActiveSheetName] = useState('');
  const [parsedWorkbook, setParsedWorkbook] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [categories, setCategories] = useState([]);

  // Column Mapping Dictionary: targetField -> userExcelHeader
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    category: '',
    id: '',
    brand: '',
    model: '',
    serial_number: '',
    asset_tag: '',
    purchase_price: '',
    purchase_date: '',
    vendor: '',
    invoice_number: '',
    warranty_start_date: '',
    warranty_end_date: '',
    status: '',
    location: '',
    assigned_to: '',
    employee_id: '',
    department: '',
    condition: '',
    processor: '',
    ram: '',
    storage: '',
    notes: ''
  });

  const [defaultCategory, setDefaultCategory] = useState('Laptop');
  const [defaultStatus, setDefaultStatus] = useState('Available');

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      api.getCategories().then(setCategories).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Smart Header Guesser
  const guessMatchingHeader = (headers, synonyms) => {
    const cleanSynonyms = synonyms.map((s) => s.toLowerCase().replace(/[\s_\-]/g, ''));
    for (const h of headers) {
      const cleanH = String(h).toLowerCase().replace(/[\s_\-]/g, '');
      if (cleanSynonyms.includes(cleanH)) return h;
    }
    // Partial substring match
    for (const h of headers) {
      const cleanH = String(h).toLowerCase().replace(/[\s_\-]/g, '');
      for (const syn of cleanSynonyms) {
        if (cleanH.includes(syn) || syn.includes(cleanH)) return h;
      }
    }
    return '';
  };

  const computeAutoMapping = (headers) => {
    return {
      name: guessMatchingHeader(headers, ['asset name', 'name', 'item', 'device', 'title', 'equipment', 'product', 'laptop name']),
      category: guessMatchingHeader(headers, ['asset type', 'category', 'type', 'device type', 'asset group', 'group']),
      id: guessMatchingHeader(headers, ['asset id', 'id', 'tag id', 'machine no', 'code', 'asset code', 'sr no.']),
      brand: guessMatchingHeader(headers, ['brand', 'make', 'manufacturer', 'company']),
      model: guessMatchingHeader(headers, ['model', 'model no', 'model number']),
      serial_number: guessMatchingHeader(headers, ['serial number', 'serial', 'sn', 's/n', 'service tag', 'machine s/n', 'imei number']),
      asset_tag: guessMatchingHeader(headers, ['asset tag', 'tag', 'barcode', 'tag no']),
      purchase_price: guessMatchingHeader(headers, ['purchase price', 'price', 'cost', 'amount', 'total bill amount', 'value', 'rate']),
      purchase_date: guessMatchingHeader(headers, ['purchase date', 'date', 'purchased on', 'invoice date', 'bill date', 'assigned date']),
      vendor: guessMatchingHeader(headers, ['vendor', 'supplier', 'seller', 'shop', 'source']),
      invoice_number: guessMatchingHeader(headers, ['invoice number', 'invoice', 'bill no', 'bill number']),
      warranty_start_date: guessMatchingHeader(headers, ['warranty start date', 'warranty start']),
      warranty_end_date: guessMatchingHeader(headers, ['warranty end date', 'warranty expiry', 'expiry date', 'warranty till', 'warranty valid till']),
      status: guessMatchingHeader(headers, ['status', 'state', 'current status', 'mobile status', 'sim status']),
      location: guessMatchingHeader(headers, ['location', 'place', 'sitting place', 'desk', 'room', 'office', 'branch']),
      assigned_to: guessMatchingHeader(headers, ['current employee', 'currently assigned to', 'assigned to', 'custodian', 'user', 'owner', 'emp name', 'employee', 'holder', 'given to', 'person']),
      employee_id: guessMatchingHeader(headers, ['employee id', 'emp id', 'employee code', 'emp no']),
      department: guessMatchingHeader(headers, ['department', 'dept', 'team', 'cost center']),
      condition: guessMatchingHeader(headers, ['condition', 'physical condition', 'working condition']),
      processor: guessMatchingHeader(headers, ['processor', 'cpu']),
      ram: guessMatchingHeader(headers, ['ram', 'memory']),
      storage: guessMatchingHeader(headers, ['storage', 'disk', 'ssd', 'hdd']),
      notes: guessMatchingHeader(headers, ['notes', 'remarks', 'comment', 'description', 'remarks (sim card)', 'assigned by'])
    };
  };

  const loadSheetData = (sheetName, workbook) => {
    try {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      if (!rows || rows.length === 0) {
        setError(`Sheet "${sheetName}" contains no data rows.`);
        return false;
      }
      const headers = Object.keys(rows[0]);
      setFileHeaders(headers);
      setRawRows(rows);
      setActiveSheetName(sheetName);
      setColumnMapping(computeAutoMapping(headers));
      setError('');
      return true;
    } catch (err) {
      setError(`Failed to read sheet: ${err.message}`);
      return false;
    }
  };

  const processFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setError('Please choose a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setSelectedFile(file);
    setError('');
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        setParsedWorkbook(workbook);
        setSheetNames(workbook.SheetNames);

        // Pick preferred sheet: "Updated Current Asset" or first sheet
        let initialSheet = workbook.SheetNames[0];
        if (workbook.SheetNames.includes('Updated Current Asset')) {
          initialSheet = 'Updated Current Asset';
        }

        const ok = loadSheetData(initialSheet, workbook);
        if (ok) {
          setStep(2); // Advance to mapping
        }
      } catch (err) {
        setError(`Failed to read Excel file: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSheetChange = (newSheetName) => {
    if (!parsedWorkbook) return;
    loadSheetData(newSheetName, parsedWorkbook);
  };

  // Direct 1-click import from Downloads/Asset.xlsx
  const handleDirectDownloadsImport = async () => {
    try {
      setIsImporting(true);
      setError('');
      const res = await api.importLocalPath({
        filePath: 'C:\\Users\\deepd\\Downloads\\Asset.xlsx',
        sheetName: 'Updated Current Asset'
      });
      setImportResult(res);
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Direct import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) return;

    try {
      setIsImporting(true);
      setError('');

      const formData = new FormData();
      formData.append('import_file', selectedFile);
      formData.append('sheet_name', activeSheetName);
      formData.append('column_mapping', JSON.stringify(columnMapping));
      formData.append('default_category', defaultCategory);
      formData.append('default_status', defaultStatus);

      const res = await api.importAssets(formData);
      setImportResult(res);
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Import failed. Please check your column mappings.');
    } finally {
      setIsImporting(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setSelectedFile(null);
    setSheetNames([]);
    setActiveSheetName('');
    setParsedWorkbook(null);
    setFileHeaders([]);
    setRawRows([]);
    setImportResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Target schema field options for user mapping
  const targetFields = [
    { key: 'category', label: 'Asset Type / Category', hint: 'e.g. CPU, Monitor, Laptop, Phone' },
    { key: 'name', label: 'Asset Name (Optional)', hint: 'Auto-synthesized as "Brand + Category" if unmapped' },
    { key: 'id', label: 'Asset ID / Machine ID', hint: 'e.g. CPU-001, DESK-001 (auto-generated if empty)' },
    { key: 'brand', label: 'Brand / Make', hint: 'e.g. Dell, HP, Apple, Logitech' },
    { key: 'model', label: 'Model', hint: 'e.g. XPS 15, Latitude 5440, ThinkPad' },
    { key: 'serial_number', label: 'Serial Number / S/N', hint: 'Hardware serial tag' },
    { key: 'assigned_to', label: 'Current Employee / Custodian', hint: 'Person currently assigned' },
    { key: 'employee_id', label: 'Employee ID', hint: 'e.g. HR-EMP-00178' },
    { key: 'department', label: 'Department', hint: 'e.g. IT, Sales, Admin' },
    { key: 'location', label: 'Location / Sitting Place', hint: 'e.g. Ahmedabad, Desk A' },
    { key: 'status', label: 'Status Column', hint: 'Available, Assigned, In Use' },
    { key: 'condition', label: 'Condition', hint: 'Good Condition, New, Fair' },
    ...(showPrice ? [{ key: 'purchase_price', label: 'Purchase Price / Bill Amount', hint: 'Price or cost number' }] : []),
    { key: 'purchase_date', label: 'Purchase / Assigned Date', hint: 'DD/MM/YYYY or YYYY-MM-DD or Excel date' },
    { key: 'processor', label: 'Processor / CPU', hint: 'e.g. Intel i7, Apple M3' },
    { key: 'ram', label: 'RAM / Memory', hint: 'e.g. 16GB, 32GB' },
    { key: 'storage', label: 'Storage / SSD', hint: 'e.g. 512GB SSD, 1TB' },
    ...(showWarranty ? [{ key: 'warranty_end_date', label: 'Warranty Expiry Date', hint: 'Warranty valid date' }] : []),
    { key: 'notes', label: 'Notes / Remarks', hint: 'Extra remarks, IMEI, or accessories' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Any Excel File to Database
              </h2>
              <p className="text-xs text-slate-500">
                {step === 1 && 'No template needed! Select any Excel sheet to import your records'}
                {step === 2 && `Mapped ${rawRows.length} rows from sheet "${activeSheetName}"`}
                {step === 3 && 'Import Completed'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetAll();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
          <span className={`flex items-center gap-1.5 ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
            Select File
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={`flex items-center gap-1.5 ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'}`}>2</span>
            Match Columns & Preview
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={`flex items-center gap-1.5 ${step === 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'}`}>3</span>
            Done
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload Any File */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Highlight card for detected Asset.xlsx */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                      <span>Detected "Asset.xlsx" on your PC</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase">Instant</span>
                    </h3>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Your spreadsheet with <strong>140 assets</strong> (CPUs, Monitors, Laptops, Custodians) is ready in your Downloads folder!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDirectDownloadsImport}
                  disabled={isImporting}
                  className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Importing...' : '1-Click Import (140 Items)'}</span>
                </button>
              </div>

              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Your Excel file does NOT need to match any specific format!</span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                  You do not need to rename or reformat your columns. Our smart mapper automatically recognizes <em>"Asset Type"</em>, <em>"Current Employee"</em>, <em>"Employee ID"</em>, <em>"Serial Number"</em>, <em>"Location"</em>, etc., and lets you adjust anything before importing.
                </p>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl p-8 text-center cursor-pointer transition-all duration-150"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) processFile(e.target.files[0]);
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center mb-2.5 shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>

                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Or select/drop any other Excel file (.xlsx, .xls, .csv)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Click to browse your computer
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Looking for a sample blank template?</span>
                <a
                  href={api.getTemplateUrl()}
                  download="AssetVault_Import_Template.xlsx"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </a>
              </div>
            </div>
          )}

          {/* STEP 2: Match Your Columns & Sheet */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400">File: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFile?.name}</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 text-[10px] font-bold">
                    {rawRows.length} rows
                  </span>
                </div>

                {/* Sheet Selector if multiple sheets exist */}
                {sheetNames.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      Sheet:
                    </span>
                    <select
                      value={activeSheetName}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="py-1 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {sheetNames.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={resetAll}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-semibold"
                >
                  Change file
                </button>
              </div>

              {/* Column Mapping Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4 text-blue-600" />
                    Match Excel Columns to Database Fields
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    ✓ Columns auto-matched from your sheet
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {targetFields.map((field) => (
                    <div
                      key={field.key}
                      className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {field.label}
                        </label>
                      </div>
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                        }
                        className={`w-full py-1.5 px-2.5 text-xs rounded-lg border font-medium focus:outline-none focus:border-blue-500 ${
                          columnMapping[field.key]
                            ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <option value="">-- Do Not Import / Not in Excel --</option>
                        {fileHeaders.map((header) => (
                          <option key={header} value={header}>
                            Excel Column: "{header}"
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 truncate">{field.hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fallback Defaults */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Default Fallbacks (Used if Column is Blank or Unmapped)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">
                      Fallback Category:
                    </label>
                    <select
                      value={defaultCategory}
                      onChange={(e) => setDefaultCategory(e.target.value)}
                      className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop / PC">Desktop / PC</option>
                      <option value="CPU">CPU</option>
                      <option value="Monitor">Monitor</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">
                      Fallback Status:
                    </label>
                    <select
                      value={defaultStatus}
                      onChange={(e) => setDefaultStatus(e.target.value)}
                      className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    >
                      <option value="Available">Available (In Stock)</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Use">In Use</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Preview of Mapped Data */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-600" />
                  Live Preview: How records from "{activeSheetName}" will be stored
                </span>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-40">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-slate-600 dark:text-slate-300">
                        <th className="py-2 px-3">Asset ID</th>
                        <th className="py-2 px-3">Asset / Category</th>
                        <th className="py-2 px-3">Brand</th>
                        <th className="py-2 px-3">Custodian</th>
                        <th className="py-2 px-3">Serial #</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rawRows.slice(0, 4).map((r, i) => {
                        const idVal = columnMapping.id ? r[columnMapping.id] : (r['Asset ID'] || `Auto AST-${1000 + i}`);
                        const brandVal = columnMapping.brand ? r[columnMapping.brand] : (r['Brand'] || '');
                        const catVal = columnMapping.category ? r[columnMapping.category] : (r['Asset Type'] || defaultCategory);
                        const assignedVal = columnMapping.assigned_to ? r[columnMapping.assigned_to] : (r['Current Employee'] || r['Assigned To'] || '—');
                        const snVal = columnMapping.serial_number ? r[columnMapping.serial_number] : (r['Serial Number'] || '—');
                        const statusVal = columnMapping.status ? r[columnMapping.status] : (r['Status'] || defaultStatus);

                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono font-bold text-blue-600">
                              {String(idVal || '—')}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                              {brandVal ? `${brandVal} ${catVal}` : catVal}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                              {String(brandVal || '—')}
                            </td>
                            <td className="py-2 px-3 text-indigo-600 font-medium">
                              {String(assignedVal || '—')}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500">
                              {String(snVal || '—')}
                            </td>
                            <td className="py-2 px-3 text-emerald-600 font-semibold">
                              {String(statusVal || 'Available')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Done */}
          {step === 3 && importResult && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Data Successfully Imported!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {importResult.message}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Database File:</span>
                <span className="font-mono text-blue-600">./backend/data/assets.db</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Upload</span>
            </button>
          )}
          {step !== 2 && <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetAll();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {step === 3 ? 'Close' : 'Cancel'}
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={isImporting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isImporting ? 'Saving to Database...' : `Import ${rawRows.length} Assets from "${activeSheetName}"`}
                </span>
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  onClose();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10"
              >
                Done & View Assets
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
