import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Table,
  Layers,
  ShieldAlert,
  Wrench,
  UserCheck,
  CheckCircle2,
  IndianRupee,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { api } from '../api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { isPriceEnabled, isWarrantyEnabled } from '../config/features';

export default function ReportsView({ currency, settings }) {
  const [reportType, setReportType] = useState('all_assets');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const showPrice = isPriceEnabled(settings);
  const showWarranty = isWarrantyEnabled(settings);

  const reportPresets = [
    { id: 'all_assets', label: 'Complete Asset Inventory', icon: Layers },
    { id: 'by_category', label: 'Assets by Category', icon: Table },
    { id: 'by_status', label: 'Assets by Status', icon: CheckCircle2 },
    { id: 'assigned_assets', label: 'Assigned Assets Directory', icon: UserCheck },
    { id: 'available_assets', label: 'Available Assets in Stock', icon: Layers },
    { id: 'repair_history', label: 'Maintenance & Repair History', icon: Wrench },
    ...(showWarranty ? [{ id: 'warranty_expiry', label: 'Warranty Expiration Analysis', icon: ShieldAlert }] : []),
    ...(showPrice ? [{ id: 'valuation_summary', label: 'Valuation & Investment Summary', icon: IndianRupee }] : [])
  ];

  useEffect(() => {
    loadReport(reportType);
  }, [reportType]);

  const loadReport = async (type) => {
    try {
      setLoading(true);
      const res = await api.getReports(type);
      setReportData(res);
    } catch (err) {
      alert(`Error loading report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterKey = (k) => {
    const lower = k.toLowerCase();
    if (!showPrice && (lower.includes('price') || lower.includes('cost') || lower.includes('value') || lower.includes('investment'))) {
      return false;
    }
    if (!showWarranty && (lower.includes('warranty') || lower.includes('days_left'))) {
      return false;
    }
    return true;
  };

  const getCleanData = () => {
    if (!reportData?.data || reportData.data.length === 0) return [];
    return reportData.data.map((row) => {
      const clean = {};
      Object.keys(row).forEach((k) => {
        if (filterKey(k)) clean[k] = row[k];
      });
      return clean;
    });
  };

  // Export to Excel (.xlsx)
  const exportExcel = () => {
    const cleanData = getCleanData();
    if (cleanData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to CSV
  const exportCsv = () => {
    const cleanData = getCleanData();
    if (cleanData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to Clean PDF using jsPDF
  const exportPdf = () => {
    const cleanData = getCleanData();
    if (cleanData.length === 0) return;
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.text(`AssetVault: ${reportData.title}`, 14, 18);
    doc.setFontSize(9);
    doc.text(`Generated on ${new Date().toLocaleString()} • Personal Asset Management System`, 14, 24);

    const headers = Object.keys(cleanData[0]);
    const rows = cleanData.map((item) =>
      headers.map((h) => {
        const val = item[h];
        if (showPrice && typeof val === 'number' && (h.includes('price') || h.includes('cost') || h.includes('value') || h.includes('investment'))) {
          return formatCurrency(val, currency);
        }
        return val !== null && val !== undefined ? String(val) : '';
      })
    );

    doc.autoTable({
      head: [headers.map((h) => h.replace(/_/g, ' ').toUpperCase())],
      body: rows,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Reports & Exports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit inventory, track capital investment, and export in Excel, CSV, or PDF
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Preset Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {reportPresets.map((preset) => {
          const Icon = preset.icon;
          const isActive = reportType === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setReportType(preset.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Table Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {reportData?.title || 'Report Table'}
            </h3>
            <p className="text-xs text-slate-500">
              {reportData?.data?.length || 0} records in current report
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading report data...</div>
        ) : !getCleanData() || getCleanData().length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No records found for this report.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {Object.keys(getCleanData()[0]).map((key) => (
                    <th key={key} className="py-2.5 px-4 whitespace-nowrap">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                {getCleanData().map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {Object.entries(row).map(([k, val], cellIdx) => (
                      <td key={cellIdx} className="py-2.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {showPrice && typeof val === 'number' && (k.includes('price') || k.includes('cost') || k.includes('value') || k.includes('investment'))
                          ? formatCurrency(val, currency)
                          : val !== null && val !== undefined
                          ? String(val)
                          : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
