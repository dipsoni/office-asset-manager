import React from 'react';
import {
  Laptop,
  MonitorCheck,
  Monitor,
  Smartphone,
  Tablet,
  Printer,
  Keyboard,
  Mouse,
  Headphones,
  AudioLines,
  Network,
  HardDrive,
  AppWindow,
  KeyRound,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX
} from 'lucide-react';

export function formatCurrency(amount, currency = '₹') {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${currency}0`;
  }
  const num = Number(amount);
  // Format with Indian numbering system if currency is ₹, otherwise standard locale
  try {
    if (currency === '₹') {
      return `${currency}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    return `${currency}${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  } catch (_) {
    return `${currency}${num}`;
  }
}

export function formatDate(dateStr, format = 'DD/MM/YYYY') {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusBadge(status) {
  const s = (status || 'Available').toLowerCase();

  const map = {
    'pending return': {
      label: 'Pending Return',
      bg: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500'
    },
    available: {
      label: 'Available',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500'
    },
    assigned: {
      label: 'Assigned',
      bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      dot: 'bg-blue-500'
    },
    'in use': {
      label: 'In Use',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
      dot: 'bg-indigo-500'
    },
    'under repair': {
      label: 'Under Repair',
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500'
    },
    lost: {
      label: 'Lost',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-500'
    },
    damaged: {
      label: 'Damaged',
      bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
      dot: 'bg-orange-500'
    },
    retired: {
      label: 'Retired',
      bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400'
    },
    sold: {
      label: 'Sold',
      bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      dot: 'bg-purple-500'
    },
    disposed: {
      label: 'Disposed',
      bg: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
      dot: 'bg-zinc-400'
    }
  };

  const current = map[s] || map.available;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

export function getWarrantyBadge(endDate) {
  if (!endDate) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-normal text-slate-400 dark:text-slate-500">
        No Warranty
      </span>
    );
  }

  const days = getDaysUntil(endDate);
  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
        <ShieldX className="w-3.5 h-3.5" /> Expired
      </span>
    );
  }

  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> {days}d left
      </span>
    );
  }

  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        <ShieldAlert className="w-3.5 h-3.5" /> {days}d left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
      <ShieldCheck className="w-3.5 h-3.5" /> Active
    </span>
  );
}

export function getConditionBadge(condition) {
  const c = (condition || 'Good').toLowerCase();
  let color = 'bg-slate-100 text-slate-700';

  if (c === 'brand new' || c === 'new') color = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300';
  else if (c === 'good') color = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300';
  else if (c === 'fair') color = 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-300';
  else if (c === 'poor') color = 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300';

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {condition || 'Good'}
    </span>
  );
}

export function renderCategoryIcon(iconName, className = 'w-4 h-4') {
  const iconMap = {
    Laptop: Laptop,
    Desktop: MonitorCheck,
    Monitor: Monitor,
    Mobile: Smartphone,
    Tablet: Tablet,
    Printer: Printer,
    Keyboard: Keyboard,
    Mouse: Mouse,
    Headset: Headphones,
    Headphones: Headphones,
    Earbuds: AudioLines,
    Network: Network,
    'Network Equipment': Network,
    'Storage Device': HardDrive,
    HardDrive: HardDrive,
    Software: AppWindow,
    License: KeyRound,
    Other: Package,
    Package: Package
  };

  const IconComp = iconMap[iconName] || Package;
  return <IconComp className={className} />;
}
