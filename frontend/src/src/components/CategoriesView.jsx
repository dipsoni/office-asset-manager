import React, { useState } from 'react';
import { FolderTree, Plus, Trash2, Edit2, X, Check, Laptop } from 'lucide-react';
import { formatCurrency, renderCategoryIcon } from '../utils/formatters';
import { isPriceEnabled } from '../config/features';
import { api } from '../api';

export default function CategoriesView({
  categories,
  currency,
  settings,
  onRefresh,
  onSelectCategory
}) {
  const showPrice = isPriceEnabled(settings);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('Box');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const colorPalette = [
    '#2563eb', // blue
    '#059669', // emerald
    '#7c3aed', // purple
    '#0891b2', // cyan
    '#d97706', // amber
    '#dc2626', // red
    '#4f46e5', // indigo
    '#ea580c', // orange
    '#64748b'  // slate
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category Name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await api.createCategory({
        name: name.trim(),
        description: description.trim(),
        color,
        icon
      });
      setName('');
      setDescription('');
      setIsAddModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if (cat.asset_count > 0) {
      alert(`Cannot remove category "${cat.name}" because it still has ${cat.asset_count} assets assigned to it. Please reassign those assets first.`);
      return;
    }
    if (confirm(`Remove unused category "${cat.name}"?`)) {
      try {
        await api.deleteCategory(cat.id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Asset Categories
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize assets into hardware types, peripherals, and software licenses
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Custom Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    backgroundColor: `${cat.color || '#3b82f6'}15`,
                    color: cat.color || '#3b82f6'
                  }}
                >
                  {renderCategoryIcon(cat.name, 'w-5 h-5')}
                </div>

                <div className="flex items-center gap-1">
                  {cat.asset_count === 0 && (
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Remove Unused Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  {cat.description || 'Hardware and equipment grouping'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {cat.asset_count || 0} Assets
              </span>
              {showPrice ? (
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(cat.total_value || 0, currency)}
                </span>
              ) : (
                <span className="text-slate-400 font-medium text-[11px]">
                  {cat.is_default ? 'Standard' : 'Custom'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Custom Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Custom Category
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Watch, Camera, Drone"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Wearables and smart health devices..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Badge Color
                </label>
                <div className="flex items-center gap-2">
                  {colorPalette.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        color === c ? 'scale-110 border-slate-900 dark:border-white shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
