import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  UserPlus,
  Wrench,
  Download,
  Upload,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  Building2,
  MapPin,
  Laptop
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

export default function AssetsView({
  assets,
  categories,
  currency,
  settings,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  warrantyFilter,
  setWarrantyFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onOpenAddModal,
  onSelectAsset,
  onEditAsset,
  onDeleteAsset,
  onAssignAsset,
  onReturnAsset,
  onMaintenanceAsset,
  onExportExcel,
  onExportCsv,
  onOpenImportModal
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const showPrice = isPriceEnabled(settings);
  const showWarranty = isWarrantyEnabled(settings);

  const statuses = [
    'Available',
    'Assigned',
    'In Use',
    'Under Repair',
    'Lost',
    'Damaged',
    'Retired',
    'Sold',
    'Disposed'
  ];

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
    setWarrantyFilter('');
    setSortBy('created_at');
    setSortOrder('DESC');
  };

  const hasActiveFilters = Boolean(
    searchTerm || categoryFilter || statusFilter || warrantyFilter
  );

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Assets Inventory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Showing {assets.length} items cataloged
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Export & Import Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors shadow-sm"
              title="Upload and import asset data from Excel spreadsheet"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              title="Export complete inventory to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              title="Export complete inventory to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>

          {/* Add Asset Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, Name, Serial #, Brand, Custodian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.asset_count || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="">All Statuses</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Warranty Filter */}
          {showWarranty && (
            <div>
              <select
                value={warrantyFilter}
                onChange={(e) => setWarrantyFilter(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200 font-medium"
              >
                <option value="">All Warranties</option>
                <option value="active">Active Warranty</option>
                <option value="30">Expiring in ≤30 Days</option>
                <option value="60">Expiring in ≤60 Days</option>
                <option value="90">Expiring in ≤90 Days</option>
                <option value="expired">Expired Warranty</option>
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="created_at">Date Added</option>
              {showPrice && <option value="purchase_price">Price / Value</option>}
              <option value="purchase_date">Purchase Date</option>
              <option value="name">Asset Name</option>
              <option value="id">Asset ID</option>
              <option value="updated_at">Last Updated</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300"
              title="Toggle sort direction"
            >
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Filters applied • <span className="font-semibold">{assets.length}</span> matching
            </span>
            <button
              onClick={resetFilters}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Asset Content: Table or Grid */}
      {assets.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Laptop className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No assets found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Try adjusting your search criteria or add your first asset using the button below.
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
          >
            + Add New Asset
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Asset ID & Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Custodian</th>
                  <th className="py-3 px-3">Serial #</th>
                  <th className="py-3 px-3">Location</th>
                  {showPrice && <th className="py-3 px-3">Price</th>}
                  {showWarranty && <th className="py-3 px-3">Warranty</th>}
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* ID & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${asset.category_color || '#3b82f6'}15`,
                            color: asset.category_color || '#3b82f6'
                          }}
                        >
                          {renderCategoryIcon(asset.category_name, 'w-4 h-4')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                              {asset.id}
                            </span>
                            {asset.asset_tag && (
                              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                                {asset.asset_tag}
                              </span>
                            )}
                          </div>
                          <p
                            onClick={() => onSelectAsset(asset)}
                            className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {asset.name}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {[asset.brand, asset.model].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {asset.category_name || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">{getStatusBadge(asset.status)}</td>

                    {/* Custodian */}
                    <td className="py-3 px-3">
                      {asset.assigned_to ? (
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {asset.assigned_to}
                          </p>
                          {asset.department && (
                            <p className="text-[10px] text-slate-400">{asset.department}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">Unassigned</span>
                      )}
                    </td>

                    {/* Serial Number */}
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      {asset.serial_number || '—'}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {asset.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[120px]">{asset.location}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Price */}
                    {showPrice && (
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(asset.purchase_price, currency)}
                      </td>
                    )}

                    {/* Warranty */}
                    {showWarranty && (
                      <td className="py-3 px-3">
                        {getWarrantyBadge(asset.warranty_end_date)}
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Assign / Return Quick Action */}
                        {asset.status === 'Assigned' || asset.assigned_to ? (
                          <button
                            onClick={() => onReturnAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Return Asset"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onAssignAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Assign to Person"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Log Maintenance */}
                        <button
                          onClick={() => onMaintenanceAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Log Maintenance Ticket"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Edit Asset"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-150 p-4 flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {asset.id}
                    </span>
                    {asset.asset_tag && (
                      <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
                        {asset.asset_tag}
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(asset.status)}</div>
                </div>

                <div className="mt-2.5">
                  <h3
                    onClick={() => onSelectAsset(asset)}
                    className="font-bold text-slate-900 dark:text-white text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                  >
                    {asset.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {[asset.brand, asset.model].filter(Boolean).join(' • ') || asset.category_name}
                  </p>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Category</span>
                    <span className="font-medium">{asset.category_name || '—'}</span>
                  </div>
                  {showPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Value</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(asset.purchase_price, currency)}
                      </span>
                    </div>
                  )}
                  {asset.assigned_to && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Custodian</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {asset.assigned_to}
                      </span>
                    </div>
                  )}
                  {asset.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Location</span>
                      <span className="truncate max-w-[140px]">{asset.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {showWarranty ? (
                    getWarrantyBadge(asset.warranty_end_date)
                  ) : (
                    <span className="font-mono text-[11px] text-slate-400">
                      {asset.serial_number ? `SN: ${asset.serial_number}` : asset.id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectAsset(asset)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditAsset(asset)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteAsset(asset)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
