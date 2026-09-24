import React, { useState } from 'react';
import { UserCheck, Search, CheckCircle2, Calendar, User, Building } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function AssignmentsView({
  assignments,
  onReturnAsset,
  onOpenAssignModal,
  onSelectAsset
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'active', 'returned'

  const filtered = assignments.filter((asg) => {
    const q = search.toLowerCase();
    const matchesSearch =
      asg.person_name?.toLowerCase().includes(q) ||
      asg.asset_id?.toLowerCase().includes(q) ||
      asg.asset_name?.toLowerCase().includes(q) ||
      asg.department?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterType === 'active') return !asg.return_date;
    if (filterType === 'returned') return Boolean(asg.return_date);
    return true;
  });

  const activeCount = assignments.filter((a) => !a.return_date).length;

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Asset Assignments & Custodians
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track active asset holders and complete historical handover timeline
          </p>
        </div>

        <button
          onClick={onOpenAssignModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <UserCheck className="w-4 h-4" />
          <span>+ Assign Asset</span>
        </button>
      </div>

      {/* Filter and Stats */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search person, employee ID, asset ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Logs ({assignments.length})
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterType('returned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'returned'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Returned ({assignments.length - activeCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Custodian</th>
                <th className="py-3 px-3">Asset Assigned</th>
                <th className="py-3 px-3">Assignment Date</th>
                <th className="py-3 px-3">Expected Return</th>
                <th className="py-3 px-3">Status / Return Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-xs flex items-center justify-center">
                        {item.person_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.person_name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {[item.employee_id, item.department].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {item.asset_id}
                      </span>
                      <p className="font-medium text-slate-900 dark:text-slate-200">
                        {item.asset_name}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {formatDate(item.assignment_date)}
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {formatDate(item.expected_return_date)}
                  </td>

                  <td className="py-3 px-3">
                    {item.return_date ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Returned on {formatDate(item.return_date)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Currently Assigned
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {!item.return_date && (
                      <button
                        onClick={() =>
                          onReturnAsset({
                            id: item.asset_id,
                            name: item.asset_name,
                            assigned_to: item.person_name
                          })
                        }
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors"
                      >
                        Return Asset
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
