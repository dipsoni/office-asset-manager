import React, { useState, useEffect } from 'react';
import { X, Plus, Info, Laptop, IndianRupee, Cpu, Check, Layers } from 'lucide-react';
import { api } from '../api';
import { isPriceEnabled, isWarrantyEnabled } from '../config/features';

export default function AssetFormModal({
  isOpen,
  onClose,
  assetToEdit,
  categories,
  currency,
  settings,
  onSuccess
}) {
  const [activeSection, setActiveSection] = useState('basic'); // 'basic', 'purchase', 'status', 'tech', 'notes'
  const showPrice = isPriceEnabled(settings);
  const showWarranty = isWarrantyEnabled(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category_id: '',
    brand: '',
    model: '',
    serial_number: '',
    asset_tag: '',
    description: '',
    purchase_date: '',
    purchase_price: '',
    vendor: '',
    invoice_number: '',
    warranty_start_date: '',
    warranty_end_date: '',
    status: 'Available',
    location: '',
    assigned_to: '',
    department: '',
    condition: 'Good',
    processor: '',
    ram: '',
    storage: '',
    operating_system: '',
    mac_address: '',
    ip_address: '',
    imei: '',
    phone_number: '',
    windows_license_key: '',
    notes: '',
    image_url: ''
  });

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        id: assetToEdit.id || '',
        name: assetToEdit.name || '',
        category_id: assetToEdit.category_id || (categories[0]?.id || ''),
        brand: assetToEdit.brand || '',
        model: assetToEdit.model || '',
        serial_number: assetToEdit.serial_number || '',
        asset_tag: assetToEdit.asset_tag || '',
        description: assetToEdit.description || '',
        purchase_date: assetToEdit.purchase_date || '',
        purchase_price: assetToEdit.purchase_price !== undefined ? assetToEdit.purchase_price : '',
        vendor: assetToEdit.vendor || '',
        invoice_number: assetToEdit.invoice_number || '',
        warranty_start_date: assetToEdit.warranty_start_date || '',
        warranty_end_date: assetToEdit.warranty_end_date || '',
        status: assetToEdit.status || 'Available',
        location: assetToEdit.location || '',
        assigned_to: assetToEdit.assigned_to || '',
        department: assetToEdit.department || '',
        condition: assetToEdit.condition || 'Good',
        processor: assetToEdit.processor || '',
        ram: assetToEdit.ram || '',
        storage: assetToEdit.storage || '',
        operating_system: assetToEdit.operating_system || '',
        mac_address: assetToEdit.mac_address || '',
        ip_address: assetToEdit.ip_address || '',
        imei: assetToEdit.imei || '',
        phone_number: assetToEdit.phone_number || '',
        windows_license_key: assetToEdit.windows_license_key || '',
        notes: assetToEdit.notes || '',
        image_url: assetToEdit.image_url || ''
      });
    } else {
      // Auto-assign default category
      setFormData({
        id: '',
        name: '',
        category_id: categories[0]?.id || '',
        brand: '',
        model: '',
        serial_number: '',
        asset_tag: '',
        description: '',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_price: '',
        vendor: '',
        invoice_number: '',
        warranty_start_date: '',
        warranty_end_date: '',
        status: 'Available',
        location: 'Home Office',
        assigned_to: '',
        department: '',
        condition: 'Good',
        processor: '',
        ram: '',
        storage: '',
        operating_system: '',
        mac_address: '',
        ip_address: '',
        imei: '',
        phone_number: '',
        windows_license_key: '',
        notes: '',
        image_url: ''
      });
    }
    setError('');
    setActiveSection('basic');
  }, [assetToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Asset Name is required');
      setActiveSection('basic');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (assetToEdit) {
        await api.updateAsset(assetToEdit.id, formData);
      } else {
        await api.createAsset(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {assetToEdit ? `Edit Asset: ${assetToEdit.name}` : 'Add New Asset to Vault'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record hardware details, financial info, custodian, and IT specifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold overflow-x-auto bg-slate-50/60 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => setActiveSection('basic')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'basic'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            1. Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('purchase')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'purchase'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            2. {showPrice || showWarranty ? 'Purchase & Warranty' : 'Vendor & Acquisition'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('status')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'status'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            3. Custody & Status
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('tech')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'tech'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            4. IT Specs (Optional)
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('notes')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'notes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            5. Notes & Extras
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg text-xs font-medium text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* SECTION 1: BASIC INFORMATION */}
          {activeSection === 'basic' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asset Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Dell XPS 15 9530"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asset ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="id"
                    placeholder="Auto-generated if blank (e.g. AST-1011)"
                    disabled={Boolean(assetToEdit)}
                    value={formData.id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    name="brand"
                    placeholder="e.g. Dell, Apple, LG"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    placeholder="e.g. XPS 15 9530"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    placeholder="Hardware SN on chassis or box"
                    value={formData.serial_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asset Tag / Barcode
                  </label>
                  <input
                    type="text"
                    name="asset_tag"
                    placeholder="e.g. TAG-DL-1001"
                    value={formData.asset_tag}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Primary hardware role, configuration, or purpose..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* SECTION 2: PURCHASE & WARRANTY */}
          {activeSection === 'purchase' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Date / Acquisition Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {showPrice && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Price ({currency})
                    </label>
                    <input
                      type="number"
                      name="purchase_price"
                      step="any"
                      placeholder="0.00"
                      value={formData.purchase_price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor / Supplier
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    placeholder="e.g. Amazon, Dell Store, Croma"
                    value={formData.vendor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    name="invoice_number"
                    placeholder="e.g. INV-2024-9982"
                    value={formData.invoice_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {showWarranty && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Warranty Start Date
                    </label>
                    <input
                      type="date"
                      name="warranty_start_date"
                      value={formData.warranty_start_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Warranty End Date
                    </label>
                    <input
                      type="date"
                      name="warranty_end_date"
                      value={formData.warranty_end_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: CUSTODY & STATUS */}
          {activeSection === 'status' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asset Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Use">In Use</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Lost">Lost</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Retired">Retired</option>
                    <option value="Sold">Sold</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Physical Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Home Office Desk A, Cabinet B, Personal Carry"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Custodian (Person Name)
                  </label>
                  <input
                    type="text"
                    name="assigned_to"
                    placeholder="e.g. Deep"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. IT, Engineering, Design"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: TECHNICAL IT SPECIFICATIONS */}
          {activeSection === 'tech' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  These technical fields are optional, tailored for laptops, servers, smartphones, and IT gear.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Processor (CPU)
                  </label>
                  <input
                    type="text"
                    name="processor"
                    placeholder="e.g. Intel Core i9-13900H / Apple M3 Pro"
                    value={formData.processor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    RAM / Memory
                  </label>
                  <input
                    type="text"
                    name="ram"
                    placeholder="e.g. 32 GB DDR5 4800MHz"
                    value={formData.ram}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Storage Capacity & Type
                  </label>
                  <input
                    type="text"
                    name="storage"
                    placeholder="e.g. 1 TB NVMe SSD"
                    value={formData.storage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operating System
                  </label>
                  <input
                    type="text"
                    name="operating_system"
                    placeholder="e.g. Windows 11 Pro 64-bit / macOS Sonoma"
                    value={formData.operating_system}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    name="mac_address"
                    placeholder="e.g. 00:1A:2B:3C:4D:5E"
                    value={formData.mac_address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    name="ip_address"
                    placeholder="e.g. 192.168.1.105"
                    value={formData.ip_address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IMEI (Mobile / Cellular)
                  </label>
                  <input
                    type="text"
                    name="imei"
                    placeholder="15-digit IMEI number"
                    value={formData.imei}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number / SIM
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Windows / Product License Key
                </label>
                <input
                  type="text"
                  name="windows_license_key"
                  placeholder="e.g. XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                  value={formData.windows_license_key}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* SECTION 5: NOTES & EXTRAS */}
          {activeSection === 'notes' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Personal Notes / Remarks
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Any maintenance tips, accessories included, box location, or reminder..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeSection !== 'basic' && (
              <button
                type="button"
                onClick={() => {
                  const sections = ['basic', 'purchase', 'status', 'tech', 'notes'];
                  const idx = sections.indexOf(activeSection);
                  if (idx > 0) setActiveSection(sections[idx - 1]);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Previous
              </button>
            )}
            {activeSection !== 'notes' && (
              <button
                type="button"
                onClick={() => {
                  const sections = ['basic', 'purchase', 'status', 'tech', 'notes'];
                  const idx = sections.indexOf(activeSection);
                  if (idx < sections.length - 1) setActiveSection(sections[idx + 1]);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
              >
                Next Section →
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : assetToEdit ? 'Save Changes' : 'Create Asset'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
