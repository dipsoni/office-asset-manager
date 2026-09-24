import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, ArrowLeftRight, Building, User, Calendar, ShieldCheck } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function HandoverSlipModal({ isOpen, onClose, handover, settings }) {
  const printRef = useRef(null);
  if (!isOpen || !handover) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = settings?.company_name || 'Global Manikchand';
  const ownerName = settings?.owner_name || 'IT Support';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Actions */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            <span>Asset Transfer Slip • {handover.handover_id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 text-xs bg-white dark:bg-slate-900 print:p-0 print:m-0 print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Official Equipment Transfer Record
              </span>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase mt-0.5">
                ASSET TRANSFER CERTIFICATE
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {companyName} • Internal IT & Hardware Administration
              </p>
            </div>
            <div className="text-right font-mono text-[11px] space-y-0.5">
              <div className="font-bold text-slate-900 dark:text-white">SLIP #{handover.handover_id}</div>
              <div className="text-slate-500">Date: {formatDate(handover.handover_date || handover.return_date || handover.created_at)}</div>
              <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {handover.status || 'Handed Over'}
              </span>
            </div>
          </div>

          {/* Asset Identification Box */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              1. Hardware Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Asset ID</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{handover.asset_id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Equipment Name</span>
                <span className="font-semibold text-slate-900 dark:text-white">{handover.asset_name || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Brand & Model</span>
                <span className="text-slate-700 dark:text-slate-300">{[handover.asset_brand, handover.asset_model].filter(Boolean).join(' ') || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Serial Number</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{handover.serial_number || '—'}</span>
              </div>
            </div>
          </div>

          {/* Transfer Parties: From & To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Previous Holder */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">Previous Custodian</span>
                <span className="text-[10px] font-mono text-slate-400">Return</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{handover.from_employee_name}</div>
                {handover.from_employee_id && (
                  <div className="text-[11px] font-mono text-slate-500">ID: {handover.from_employee_id}</div>
                )}
                {handover.from_department && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Dept: {handover.from_department}</div>
                )}
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <strong>Return Date:</strong> {formatDate(handover.return_date)}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  <strong>Condition:</strong> {handover.condition_before || 'Good'}
                </div>
              </div>
            </div>

            {/* New Holder */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-900 pb-1.5">
                <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">New Custodian</span>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">Assignment</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {handover.to_employee_name || 'Returned to Company Stock'}
                </div>
                {handover.to_employee_id && (
                  <div className="text-[11px] font-mono text-slate-500">ID: {handover.to_employee_id}</div>
                )}
                {handover.to_department && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">Dept: {handover.to_department}</div>
                )}
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <strong>Handover Date:</strong> {formatDate(handover.handover_date || handover.return_date)}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  <strong>Condition:</strong> {handover.condition_after || 'Good'}
                </div>
              </div>
            </div>
          </div>

          {/* Reason, Accessories, Remarks */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 bg-slate-50/30 dark:bg-slate-800/10">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              2. Transfer Particulars & Accessories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Transfer Reason</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{handover.reason}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Accessories Transferred</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {handover.accessories_returned || handover.accessories_given || 'Complete Unit & Power Adapter'}
                </span>
              </div>
              {handover.missing_accessories && (
                <div>
                  <span className="text-[10px] text-amber-600 font-semibold block">Missing Accessories</span>
                  <span className="text-amber-700 dark:text-amber-400 font-medium">{handover.missing_accessories}</span>
                </div>
              )}
              {handover.damage_details && (
                <div>
                  <span className="text-[10px] text-rose-600 font-semibold block">Damage Inspection Notes</span>
                  <span className="text-rose-700 dark:text-rose-400 font-medium">{handover.damage_details}</span>
                </div>
              )}
              {handover.remarks && (
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-500 block">General Remarks</span>
                  <p className="text-slate-700 dark:text-slate-300 italic">{handover.remarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Signature Authorization Block */}
          <div className="pt-6 border-t-2 border-slate-300 dark:border-slate-700 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-6">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Acknowledged & Received By Custodian
              </div>
              <div className="border-b border-slate-400 dark:border-slate-600 pt-8" />
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {handover.to_employee_name || handover.from_employee_name}
                </div>
                <div className="text-[10px] text-slate-400">Employee Signature & Date</div>
              </div>
            </div>

            <div className="space-y-6 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Handed Over & Verified By IT/Admin
              </div>
              <div className="border-b border-slate-400 dark:border-slate-600 pt-8" />
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {handover.handed_over_by || handover.received_by || ownerName}
                </div>
                <div className="text-[10px] text-slate-400">IT / Asset Admin Signature & Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
