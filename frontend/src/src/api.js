const API_BASE = typeof window !== 'undefined'
  ? (window.location.port === '5173'
      ? `${window.location.protocol}//${window.location.hostname}:5000/api`
      : '/api')
  : 'http://localhost:5000/api';

export const getUploadUrl = (fileName) => {
  if (!fileName) return '';
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) return fileName;
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return `${window.location.protocol}//${window.location.hostname}:5000/uploads/${fileName}`;
  }
  return `/uploads/${fileName}`;
};

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let errMessage = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        errMessage = errData.error;
      }
    } catch (_) {}
    throw new Error(errMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.blob();
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Assets
  getAssets: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/assets${qs}`);
  },
  getAsset: (id) => request(`/assets/${encodeURIComponent(id)}`),
  createAsset: (data) =>
    request('/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  updateAsset: (id, data) =>
    request(`/assets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  deleteAsset: (id) =>
    request(`/assets/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) =>
    request('/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  updateCategory: (id, data) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, {
      method: 'DELETE'
    }),

  // Assignments
  getAssignments: () => request('/assignments'),
  createAssignment: (data) =>
    request('/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  returnAssignment: (id, data) =>
    request(`/assignments/${id}/return`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Maintenance
  getMaintenance: () => request('/maintenance'),
  createMaintenance: (data) =>
    request('/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  updateMaintenance: (id, data) =>
    request(`/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  deleteMaintenance: (id) =>
    request(`/maintenance/${id}`, {
      method: 'DELETE'
    }),

  // Documents
  uploadDocument: (formData) =>
    request('/documents/upload', {
      method: 'POST',
      body: formData
    }),
  deleteDocument: (id) =>
    request(`/documents/${id}`, {
      method: 'DELETE'
    }),

  // Reports
  getReports: (reportType) => request(`/reports?report_type=${encodeURIComponent(reportType)}`),

  // Backup & Restore
  getBackupDownloadUrl: () => `${API_BASE}/backup/database`,
  getExportCsvUrl: () => `${API_BASE}/backup/export-csv`,
  getExportExcelUrl: () => `${API_BASE}/backup/export-excel`,
  getTemplateUrl: () => `${API_BASE}/backup/template`,
  restoreDatabase: (formData) =>
    request('/backup/restore', {
      method: 'POST',
      body: formData
    }),
  importAssets: (formData) =>
    request('/backup/import', {
      method: 'POST',
      body: formData
    }),
  importLocalPath: (data) =>
    request('/backup/import-local-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) =>
    request('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  setPin: (data) =>
    request('/settings/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  verifyPin: (pin) =>
    request('/settings/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    }),

  // Handovers & Reassignments
  getHandovers: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/handovers${qs}`);
  },
  getHandoverStats: () => request('/handovers/stats'),
  createHandover: (data) =>
    request('/handovers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  createBulkHandover: (data) =>
    request('/handovers/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  updateHandover: (id, data) =>
    request(`/handovers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  getAssetHandovers: (assetId) => request(`/assets/${encodeURIComponent(assetId)}/handovers`),
  importHandovers: (data) =>
    request('/handovers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  importHandoversLocalPath: (data) =>
    request('/handovers/import-local-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Employees & Custodians
  getEmployees: () => request('/employees'),
  updateEmployeeStatus: (id, data) =>
    request(`/employees/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  receiveEmployeeAsset: (employeeId, data) =>
    request(`/employees/${employeeId}/receive-asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  receiveAllEmployeeAssets: (employeeId, data = {}) =>
    request(`/employees/${employeeId}/receive-all-assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
};

