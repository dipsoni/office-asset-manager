const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const xlsx = require('xlsx');
const crypto = require('node:crypto');

const {
  getDb,
  DATA_DIR,
  UPLOADS_DIR,
  BACKUPS_DIR,
  DB_PATH,
  backupDatabase,
  restoreDatabase
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for local and LAN office clients
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files locally
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// Multer for DB restore (.db files)
const dbRestoreStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BACKUPS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `temp_restore_${Date.now()}.db`);
  }
});
const uploadDb = multer({ storage: dbRestoreStorage });

// Helper to calculate days between dates
function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// -------------------------------------------------------------
// Health Check
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'local-offline',
    timestamp: new Date().toISOString(),
    dbPath: DB_PATH
  });
});

// -------------------------------------------------------------
// DASHBOARD ENDPOINT
// -------------------------------------------------------------
app.get('/api/dashboard', (req, res) => {
  try {
    const db = getDb();

    const assets = db.prepare(`
      SELECT a.*, c.name as category_name, c.color as category_color
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
    `).all();

    let totalAssetValue = 0;
    let totalAssets = assets.length;
    let activeAssets = 0;
    let availableAssets = 0;
    let assignedAssets = 0;
    let underRepair = 0;
    let lostAssets = 0;
    let retiredAssets = 0;
    let pendingReturns = 0;

    let warrantyExpiring30 = 0;
    let warrantyExpiring60 = 0;
    let warrantyExpiring90 = 0;
    let warrantyExpired = 0;
    let warrantyActive = 0;

    const expiringList = [];

    assets.forEach((a) => {
      totalAssetValue += Number(a.purchase_price) || 0;

      const st = (a.status || '').toLowerCase();
      if (st === 'in use' || st === 'assigned') activeAssets++;
      if (st === 'available') availableAssets++;
      if (st === 'assigned') assignedAssets++;
      if (st === 'under repair') underRepair++;
      if (st === 'lost' || st === 'damaged') lostAssets++;
      if (st === 'retired' || st === 'sold' || st === 'disposed') retiredAssets++;
      if (st === 'pending return') pendingReturns++;

      // Warranty calculation
      if (a.warranty_end_date) {
        const daysLeft = getDaysUntil(a.warranty_end_date);
        if (daysLeft !== null) {
          if (daysLeft < 0) {
            warrantyExpired++;
          } else {
            warrantyActive++;
            if (daysLeft <= 30) warrantyExpiring30++;
            if (daysLeft <= 60) warrantyExpiring60++;
            if (daysLeft <= 90) warrantyExpiring90++;

            if (daysLeft <= 90) {
              expiringList.push({
                id: a.id,
                name: a.name,
                category_name: a.category_name,
                warranty_end_date: a.warranty_end_date,
                days_left: daysLeft
              });
            }
          }
        }
      }
    });

    expiringList.sort((a, b) => a.days_left - b.days_left);

    // Distribution by Category
    const byCategory = db.prepare(`
      SELECT c.name, c.color, COUNT(a.id) as count, COALESCE(SUM(a.purchase_price), 0) as total_value
      FROM categories c
      LEFT JOIN assets a ON a.category_id = c.id
      GROUP BY c.id
      HAVING count > 0
      ORDER BY count DESC
    `).all();

    // Distribution by Status
    const byStatus = db.prepare(`
      SELECT status as name, COUNT(id) as count
      FROM assets
      GROUP BY status
      ORDER BY count DESC
    `).all();

    // Distribution by Location
    const byLocation = db.prepare(`
      SELECT COALESCE(NULLIF(location, ''), 'Unassigned') as name, COUNT(id) as count
      FROM assets
      GROUP BY location
      ORDER BY count DESC
      LIMIT 8
    `).all();

    // Distribution by Purchase Year
    const byPurchaseYear = db.prepare(`
      SELECT 
        CASE 
          WHEN purchase_date IS NOT NULL AND length(purchase_date) >= 4 THEN substr(purchase_date, 1, 4)
          ELSE 'Unknown'
        END as year,
        COUNT(id) as count,
        COALESCE(SUM(purchase_price), 0) as total_value
      FROM assets
      GROUP BY year
      ORDER BY year ASC
    `).all();

    // Recently added assets (last 6)
    const recentlyAdded = db.prepare(`
      SELECT a.id, a.name, a.brand, a.model, a.status, a.purchase_price, a.created_at, c.name as category_name, c.color as category_color
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 6
    `).all();

    // Recently updated assets (last 6)
    const recentlyUpdated = db.prepare(`
      SELECT a.id, a.name, a.brand, a.model, a.status, a.updated_at, a.assigned_to, c.name as category_name, c.color as category_color
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.updated_at DESC
      LIMIT 6
    `).all();

    const resignedEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status = 'Resigned'").get().count;

    res.json({
      summary: {
        totalAssets,
        totalAssetValue,
        activeAssets,
        availableAssets,
        assignedAssets,
        underRepair,
        lostAssets,
        retiredAssets,
        pendingReturns,
        resignedEmployees
      },
      warrantySummary: {
        active: warrantyActive,
        expired: warrantyExpired,
        expiring30: warrantyExpiring30,
        expiring60: warrantyExpiring60,
        expiring90: warrantyExpiring90,
        expiringList: expiringList.slice(0, 10)
      },
      charts: {
        byCategory,
        byStatus,
        byLocation,
        byPurchaseYear
      },
      recentlyAdded,
      recentlyUpdated
    });
  } catch (err) {
    console.error('Dashboard API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ASSETS CRUD & FILTERING
// -------------------------------------------------------------
app.get('/api/assets', (req, res) => {
  try {
    const db = getDb();
    const {
      q,
      category_id,
      status,
      location,
      condition,
      warranty_filter,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT a.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      query += ` AND (
        a.id LIKE ? OR
        a.name LIKE ? OR
        a.brand LIKE ? OR
        a.model LIKE ? OR
        a.serial_number LIKE ? OR
        a.asset_tag LIKE ? OR
        a.assigned_to LIKE ? OR
        c.name LIKE ? OR
        a.location LIKE ?
      )`;
      for (let i = 0; i < 9; i++) params.push(searchTerm);
    }

    if (category_id) {
      query += ` AND a.category_id = ?`;
      params.push(Number(category_id));
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (location) {
      query += ` AND a.location = ?`;
      params.push(location);
    }

    if (condition) {
      query += ` AND a.condition = ?`;
      params.push(condition);
    }

    // Allowed sort columns
    const allowedSortCols = ['id', 'name', 'purchase_date', 'purchase_price', 'status', 'created_at', 'updated_at'];
    const sortCol = allowedSortCols.includes(sort_by) ? `a.${sort_by}` : 'a.created_at';
    const sortDir = (sort_order || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortCol} ${sortDir}`;

    let assets = db.prepare(query).all(...params);

    // Filter by warranty client-side for dynamic date boundaries
    if (warranty_filter) {
      assets = assets.filter((a) => {
        if (!a.warranty_end_date) return false;
        const days = getDaysUntil(a.warranty_end_date);
        if (days === null) return false;
        if (warranty_filter === 'expired') return days < 0;
        if (warranty_filter === 'active') return days >= 0;
        if (warranty_filter === '30') return days >= 0 && days <= 30;
        if (warranty_filter === '60') return days >= 0 && days <= 60;
        if (warranty_filter === '90') return days >= 0 && days <= 90;
        return true;
      });
    }

    res.json(assets);
  } catch (err) {
    console.error('Get Assets Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Single Asset with full relationships
app.get('/api/assets/:id', (req, res) => {
  try {
    const db = getDb();
    const asset = db.prepare(`
      SELECT a.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const assignments = db.prepare(`
      SELECT * FROM asset_assignments
      WHERE asset_id = ?
      ORDER BY id DESC
    `).all(req.params.id);

    const maintenance = db.prepare(`
      SELECT * FROM maintenance_records
      WHERE asset_id = ?
      ORDER BY id DESC
    `).all(req.params.id);

    const documents = db.prepare(`
      SELECT * FROM documents
      WHERE asset_id = ?
      ORDER BY id DESC
    `).all(req.params.id);

    res.json({
      ...asset,
      assignments,
      maintenance,
      documents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new Asset
app.post('/api/assets', (req, res) => {
  try {
    const db = getDb();
    const data = req.body;

    let assetId = data.id && data.id.trim() ? data.id.trim() : null;
    if (!assetId) {
      // Auto-generate AST-XXXX
      const lastRow = db.prepare(`SELECT id FROM assets WHERE id LIKE 'AST-%' ORDER BY rowid DESC LIMIT 1`).get();
      let nextNum = 1001;
      if (lastRow && lastRow.id) {
        const match = lastRow.id.match(/AST-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      assetId = `AST-${nextNum}`;
    }

    // Check collision
    const existing = db.prepare('SELECT id FROM assets WHERE id = ?').get(assetId);
    if (existing) {
      return res.status(400).json({ error: `Asset ID ${assetId} already exists.` });
    }

    const stmt = db.prepare(`
      INSERT INTO assets (
        id, name, category_id, brand, model, serial_number, asset_tag, description,
        purchase_date, purchase_price, vendor, invoice_number, warranty_start_date, warranty_end_date,
        status, location, assigned_to, department, condition,
        processor, ram, storage, operating_system, mac_address, ip_address, imei, phone_number, windows_license_key,
        notes, image_url, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime')
      )
    `);

    stmt.run(
      assetId,
      data.name || 'Unnamed Asset',
      data.category_id ? Number(data.category_id) : null,
      data.brand || '',
      data.model || '',
      data.serial_number || '',
      data.asset_tag || '',
      data.description || '',
      data.purchase_date || '',
      Number(data.purchase_price) || 0,
      data.vendor || '',
      data.invoice_number || '',
      data.warranty_start_date || '',
      data.warranty_end_date || '',
      data.status || 'Available',
      data.location || '',
      data.assigned_to || '',
      data.department || '',
      data.condition || 'Good',
      data.processor || '',
      data.ram || '',
      data.storage || '',
      data.operating_system || '',
      data.mac_address || '',
      data.ip_address || '',
      data.imei || '',
      data.phone_number || '',
      data.windows_license_key || '',
      data.notes || '',
      data.image_url || ''
    );

    // If an initial custodian is assigned, create the assignment record
    if (data.assigned_to && data.assigned_to.trim()) {
      db.prepare(`
        INSERT INTO asset_assignments (asset_id, person_name, department, assignment_date, notes)
        VALUES (?, ?, ?, COALESCE(NULLIF(?, ''), date('now', 'localtime')), ?)
      `).run(
        assetId,
        data.assigned_to.trim(),
        data.department || '',
        data.purchase_date || '',
        'Initial assignment upon asset creation'
      );
    }

    const created = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create Asset Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Asset
app.put('/api/assets/:id', (req, res) => {
  try {
    const db = getDb();
    const data = req.body;
    const assetId = req.params.id;

    const existing = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const stmt = db.prepare(`
      UPDATE assets SET
        name = ?,
        category_id = ?,
        brand = ?,
        model = ?,
        serial_number = ?,
        asset_tag = ?,
        description = ?,
        purchase_date = ?,
        purchase_price = ?,
        vendor = ?,
        invoice_number = ?,
        warranty_start_date = ?,
        warranty_end_date = ?,
        status = ?,
        location = ?,
        assigned_to = ?,
        department = ?,
        condition = ?,
        processor = ?,
        ram = ?,
        storage = ?,
        operating_system = ?,
        mac_address = ?,
        ip_address = ?,
        imei = ?,
        phone_number = ?,
        windows_license_key = ?,
        notes = ?,
        image_url = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    stmt.run(
      data.name !== undefined ? data.name : existing.name,
      data.category_id !== undefined ? (data.category_id ? Number(data.category_id) : null) : existing.category_id,
      data.brand !== undefined ? data.brand : existing.brand,
      data.model !== undefined ? data.model : existing.model,
      data.serial_number !== undefined ? data.serial_number : existing.serial_number,
      data.asset_tag !== undefined ? data.asset_tag : existing.asset_tag,
      data.description !== undefined ? data.description : existing.description,
      data.purchase_date !== undefined ? data.purchase_date : existing.purchase_date,
      data.purchase_price !== undefined ? Number(data.purchase_price) : existing.purchase_price,
      data.vendor !== undefined ? data.vendor : existing.vendor,
      data.invoice_number !== undefined ? data.invoice_number : existing.invoice_number,
      data.warranty_start_date !== undefined ? data.warranty_start_date : existing.warranty_start_date,
      data.warranty_end_date !== undefined ? data.warranty_end_date : existing.warranty_end_date,
      data.status !== undefined ? data.status : existing.status,
      data.location !== undefined ? data.location : existing.location,
      data.assigned_to !== undefined ? data.assigned_to : existing.assigned_to,
      data.department !== undefined ? data.department : existing.department,
      data.condition !== undefined ? data.condition : existing.condition,
      data.processor !== undefined ? data.processor : existing.processor,
      data.ram !== undefined ? data.ram : existing.ram,
      data.storage !== undefined ? data.storage : existing.storage,
      data.operating_system !== undefined ? data.operating_system : existing.operating_system,
      data.mac_address !== undefined ? data.mac_address : existing.mac_address,
      data.ip_address !== undefined ? data.ip_address : existing.ip_address,
      data.imei !== undefined ? data.imei : existing.imei,
      data.phone_number !== undefined ? data.phone_number : existing.phone_number,
      data.windows_license_key !== undefined ? data.windows_license_key : existing.windows_license_key,
      data.notes !== undefined ? data.notes : existing.notes,
      data.image_url !== undefined ? data.image_url : existing.image_url,
      assetId
    );

    const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
    res.json(updated);
  } catch (err) {
    console.error('Update Asset Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Asset
app.delete('/api/assets/:id', (req, res) => {
  try {
    const db = getDb();
    // Also delete any associated files
    const docs = db.prepare('SELECT file_name FROM documents WHERE asset_id = ?').all(req.params.id);
    docs.forEach((doc) => {
      const p = path.join(UPLOADS_DIR, doc.file_name);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: `Asset ${req.params.id} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// CATEGORIES
// -------------------------------------------------------------
app.get('/api/categories', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT c.*, COUNT(a.id) as asset_count, COALESCE(SUM(a.purchase_price), 0) as total_value
      FROM categories c
      LEFT JOIN assets a ON a.category_id = c.id
      GROUP BY c.id
      ORDER BY c.is_default DESC, c.name ASC
    `).all();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const db = getDb();
    const { name, description, color = '#3b82f6', icon = 'Box' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO categories (name, description, color, icon, is_default)
      VALUES (?, ?, ?, ?, 0)
    `);
    const info = stmt.run(name.trim(), description || '', color, icon);
    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A category with this name already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const db = getDb();
    const { name, description, color, icon } = req.body;
    db.prepare(`
      UPDATE categories
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          color = COALESCE(?, color),
          icon = COALESCE(?, icon)
      WHERE id = ?
    `).run(name, description, color, icon, req.params.id);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    const db = getDb();
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const assetCount = db.prepare('SELECT COUNT(*) as count FROM assets WHERE category_id = ?').get(req.params.id).count;
    if (assetCount > 0) {
      return res.status(400).json({ error: `Cannot remove category "${cat.name}" because it still has ${assetCount} assets assigned to it. Reassign or remove the assets first.` });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Category removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ASSIGNMENT & CUSTODIAN WORKFLOW
// -------------------------------------------------------------
app.get('/api/assignments', (req, res) => {
  try {
    const db = getDb();
    const assignments = db.prepare(`
      SELECT asg.*, 
             CASE WHEN asg.return_date IS NOT NULL AND asg.return_date != '' THEN 'Returned' ELSE 'Active' END as status,
             a.name as asset_name, a.brand as asset_brand, a.model as asset_model, c.name as category_name
      FROM asset_assignments asg
      JOIN assets a ON asg.asset_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY asg.id DESC
    `).all();
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assignments', (req, res) => {
  try {
    const db = getDb();
    const {
      asset_id,
      person_name,
      employee_id,
      department,
      assignment_date,
      expected_return_date,
      notes
    } = req.body;

    if (!asset_id || !person_name) {
      return res.status(400).json({ error: 'Asset ID and Person Name are required.' });
    }

    const targetAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id);
    if (!targetAsset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    // Prevent new assignment if asset is pending return from a previous employee
    if (targetAsset.status === 'Pending Return') {
      const custodian = targetAsset.assigned_to || 'the resigned employee';
      return res.status(400).json({
        error: `Asset cannot be assigned yet. Reason: Asset is pending return from ${custodian}. First complete: Receive Asset.`
      });
    }

    const assignDate = assignment_date || new Date().toISOString().split('T')[0];

    // Create assignment record
    const stmt = db.prepare(`
      INSERT INTO asset_assignments (asset_id, person_name, employee_id, department, assignment_date, expected_return_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(asset_id, person_name, employee_id || '', department || '', assignDate, expected_return_date || null, notes || '');

    // Update asset status
    db.prepare(`
      UPDATE assets
      SET status = 'Assigned',
          assigned_to = ?,
          department = ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(person_name, department || '', asset_id);

    // Auto-sync into employees table safely
    const cleanEmpName = person_name.trim();
    const cleanEmpId = (employee_id && String(employee_id).trim()) || null;
    const existingEmp = db.prepare('SELECT id, employee_id FROM employees WHERE LOWER(name) = LOWER(?)').get(cleanEmpName);
    if (!existingEmp) {
      let targetEmpId = cleanEmpId;
      if (targetEmpId) {
        const conflict = db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(targetEmpId);
        if (conflict) targetEmpId = null;
      }
      db.prepare(`
        INSERT INTO employees (name, employee_id, department, status)
        VALUES (?, ?, ?, 'Active')
      `).run(cleanEmpName, targetEmpId, department || '');
    } else if (cleanEmpId && !existingEmp.employee_id) {
      const conflict = db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(cleanEmpId);
      if (!conflict) {
        db.prepare('UPDATE employees SET employee_id = ?, department = COALESCE(?, department) WHERE id = ?')
          .run(cleanEmpId, department || null, existingEmp.id);
      }
    }

    const created = db.prepare('SELECT * FROM asset_assignments WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return Asset
app.put('/api/assignments/:id/return', (req, res) => {
  try {
    const db = getDb();
    const { return_date, condition, notes } = req.body;
    const assignment = db.prepare('SELECT * FROM asset_assignments WHERE id = ?').get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment record not found' });
    }

    const finalReturnDate = return_date || new Date().toISOString().split('T')[0];

    db.prepare(`
      UPDATE asset_assignments
      SET return_date = ?,
          notes = CASE WHEN ? != '' THEN notes || ' | Return note: ' || ? ELSE notes END
      WHERE id = ?
    `).run(finalReturnDate, notes || '', notes || '', req.params.id);

    // Update asset status back to Available and clear assigned_to
    db.prepare(`
      UPDATE assets
      SET status = 'Available',
          assigned_to = '',
          condition = COALESCE(?, condition),
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(condition || null, assignment.asset_id);

    res.json({ success: true, message: 'Asset successfully marked as returned and available.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ASSET HANDOVER & REASSIGNMENT WORKFLOW
// -------------------------------------------------------------

// List Handovers
app.get('/api/handovers', (req, res) => {
  try {
    const db = getDb();
    const { search, status, asset_id, employee } = req.query;

    let query = `
      SELECT h.*, 
             a.id as asset_code,
             a.name as asset_name, a.brand as asset_brand, a.model as asset_model, a.serial_number,
             c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM asset_handovers h
      JOIN assets a ON h.asset_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (asset_id) {
      query += ` AND h.asset_id = ?`;
      params.push(asset_id);
    }
    if (status && status !== 'all') {
      query += ` AND h.status = ?`;
      params.push(status);
    }
    if (employee) {
      query += ` AND (h.from_employee_name = ? OR h.to_employee_name = ?)`;
      params.push(employee, employee);
    }
    if (search) {
      const q = `%${search.trim()}%`;
      query += ` AND (
        h.handover_id LIKE ? OR 
        h.asset_id LIKE ? OR 
        a.name LIKE ? OR 
        a.serial_number LIKE ? OR 
        h.from_employee_name LIKE ? OR 
        h.to_employee_name LIKE ? OR 
        h.from_employee_id LIKE ? OR 
        h.to_employee_id LIKE ? OR 
        h.reason LIKE ?
      )`;
      params.push(q, q, q, q, q, q, q, q, q);
    }

    query += ` ORDER BY h.id DESC`;
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handover Statistics / Dashboard KPIs
app.get('/api/handovers/stats', (req, res) => {
  try {
    const db = getDb();

    // 1. Pending Returns
    const pendingReturns = db.prepare(`SELECT COUNT(*) as count FROM asset_handovers WHERE status = 'Pending Return'`).get().count;

    // 2. Returned Today
    const returnedToday = db.prepare(`
      SELECT COUNT(*) as count FROM asset_handovers 
      WHERE return_date = date('now', 'localtime')
    `).get().count;

    // 3. Pending Handovers
    const pendingHandovers = db.prepare(`SELECT COUNT(*) as count FROM asset_handovers WHERE status = 'Pending Handover'`).get().count;

    // 4. Handovers This Month
    const handoversThisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM asset_handovers 
      WHERE status = 'Handed Over' 
      AND (
        strftime('%Y-%m', handover_date) = strftime('%Y-%m', 'now', 'localtime') 
        OR strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
      )
    `).get().count;

    // 5. Total Reassigned
    const totalReassigned = db.prepare(`SELECT COUNT(*) as count FROM asset_handovers WHERE status = 'Handed Over'`).get().count;

    // 6. Assets with Resigned Employees
    const resignedEmployees = db.prepare(`SELECT name FROM employees WHERE status = 'Resigned'`).all().map(e => e.name);
    let withResignedCount = 0;
    if (resignedEmployees.length > 0) {
      const placeholders = resignedEmployees.map(() => '?').join(',');
      withResignedCount = db.prepare(`
        SELECT COUNT(*) as count FROM assets 
        WHERE assigned_to IN (${placeholders})
      `).get(...resignedEmployees).count;
    }

    res.json({
      pendingReturns,
      returnedToday,
      pendingHandovers,
      handoversThisMonth,
      totalReassigned,
      withResigned: withResignedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to generate next Handover ID
function getNextHandoverId(db) {
  const last = db.prepare(`SELECT handover_id FROM asset_handovers WHERE handover_id LIKE 'HND-%' ORDER BY id DESC LIMIT 1`).get();
  let nextNum = 1001;
  if (last && last.handover_id) {
    const match = last.handover_id.match(/HND-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  while (db.prepare('SELECT id FROM asset_handovers WHERE handover_id = ?').get(`HND-${nextNum}`)) {
    nextNum++;
  }
  return `HND-${nextNum}`;
}

// Single Asset Handover
app.post('/api/handovers', (req, res) => {
  try {
    const db = getDb();
    const {
      asset_id,
      reason,
      from_employee_name,
      from_employee_id,
      from_department,
      return_date,
      received_by,
      condition_before,
      accessories_returned,
      missing_accessories,
      damage_details,
      to_employee_name,
      to_employee_id,
      to_department,
      handover_date,
      handed_over_by,
      condition_after,
      accessories_given,
      remarks,
      status: requestedStatus
    } = req.body;

    if (!asset_id) {
      return res.status(400).json({ error: 'Asset ID is required.' });
    }
    if (!reason) {
      return res.status(400).json({ error: 'Reason for handover is required.' });
    }

    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id);
    if (!asset) {
      return res.status(404).json({ error: `Asset "${asset_id}" not found.` });
    }

    // Auto-detect previous holder if not provided
    const fromName = from_employee_name || asset.assigned_to || 'Company Stock';
    const fromId = from_employee_id || '';
    const fromDept = from_department || asset.department || '';

    const effectiveStatus = requestedStatus || (to_employee_name ? 'Handed Over' : 'Returned');
    const finalReturnDate = return_date || new Date().toISOString().split('T')[0];
    const finalHandoverDate = handover_date || finalReturnDate;
    const handoverId = getNextHandoverId(db);

    // 1. If previous holder existed, close active assignment in asset_assignments
    if (fromName && fromName !== 'Company Stock') {
      db.prepare(`
        UPDATE asset_assignments
        SET return_date = ?,
            notes = CASE 
              WHEN notes != '' THEN notes || ' | Returned on ' || ? || ' (' || ? || ')'
              ELSE 'Returned on ' || ? || ' (' || ? || ')'
            END
        WHERE asset_id = ? AND return_date IS NULL
      `).run(finalReturnDate, finalReturnDate, reason, finalReturnDate, reason, asset_id);
    }

    // 2. If status is 'Handed Over' and to_employee_name provided, create new assignment
    if (effectiveStatus === 'Handed Over' && to_employee_name) {
      db.prepare(`
        INSERT INTO asset_assignments (asset_id, person_name, employee_id, department, assignment_date, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        asset_id,
        to_employee_name,
        to_employee_id || '',
        to_department || '',
        finalHandoverDate,
        `Handover from ${fromName} (${reason}). ${remarks || ''}`.trim()
      );

      // Update asset holder
      db.prepare(`
        UPDATE assets
        SET status = 'Assigned',
            assigned_to = ?,
            department = ?,
            condition = COALESCE(?, condition),
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(to_employee_name, to_department || '', condition_after || condition_before || null, asset_id);

      // Ensure new employee exists in employees directory
      db.prepare(`
        INSERT OR IGNORE INTO employees (name, employee_id, department, status)
        VALUES (?, ?, ?, 'Active')
      `).run(to_employee_name, to_employee_id || null, to_department || '');
    } else if (effectiveStatus === 'Returned') {
      // Returned to stock
      db.prepare(`
        UPDATE assets
        SET status = 'Available',
            assigned_to = '',
            department = '',
            condition = COALESCE(?, condition),
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(condition_before || null, asset_id);
    } else if (effectiveStatus === 'Pending Return') {
      // Mark as Pending Return
      db.prepare(`
        UPDATE assets
        SET status = 'Pending Return',
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(asset_id);
    }

    // 3. Log handover record
    const insertStmt = db.prepare(`
      INSERT INTO asset_handovers (
        handover_id, asset_id, from_employee_name, from_employee_id, from_department,
        to_employee_name, to_employee_id, to_department, return_date, handover_date,
        reason, condition_before, condition_after, accessories_returned, accessories_given,
        missing_accessories, damage_details, handed_over_by, received_by, remarks, status
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    const info = insertStmt.run(
      handoverId,
      asset_id,
      fromName,
      fromId,
      fromDept,
      to_employee_name || '',
      to_employee_id || '',
      to_department || '',
      finalReturnDate,
      effectiveStatus === 'Handed Over' ? finalHandoverDate : null,
      reason,
      condition_before || 'Good',
      condition_after || condition_before || 'Good',
      accessories_returned || '',
      accessories_given || '',
      missing_accessories || '',
      damage_details || '',
      handed_over_by || '',
      received_by || '',
      remarks || '',
      effectiveStatus
    );

    const created = db.prepare(`SELECT * FROM asset_handovers WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Handover (Multiple assets from same employee)
app.post('/api/handovers/bulk', (req, res) => {
  try {
    const db = getDb();
    const {
      asset_ids,
      items, // optional array of { asset_id, action, to_employee_name, to_employee_id, to_department, condition_before, condition_after, accessories_returned, accessories_given, remarks }
      from_employee_name,
      from_employee_id,
      from_department,
      to_employee_name,
      to_employee_id,
      to_department,
      reason = 'Employee Resignation',
      return_date,
      handover_date,
      condition_before,
      condition_after,
      accessories_returned,
      accessories_given,
      received_by,
      handed_over_by,
      remarks,
      status: requestedStatus,
      mark_resigned = false
    } = req.body;

    const listToProcess = Array.isArray(items) && items.length > 0
      ? items
      : (Array.isArray(asset_ids) ? asset_ids.map(id => ({ asset_id: id })) : []);

    if (listToProcess.length === 0) {
      return res.status(400).json({ error: 'At least one asset must be selected.' });
    }
    if (!reason) {
      return res.status(400).json({ error: 'Handover reason is required.' });
    }

    const finalReturnDate = return_date || new Date().toISOString().split('T')[0];
    const finalHandoverDate = handover_date || finalReturnDate;
    const results = [];

    listToProcess.forEach((item) => {
      const assetId = item.asset_id;
      const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
      if (!asset) return;

      const fromName = from_employee_name || asset.assigned_to || 'Company Stock';
      const fromId = from_employee_id || '';
      const fromDept = from_department || asset.department || '';

      const itemTargetName = item.to_employee_name !== undefined ? item.to_employee_name : to_employee_name;
      const itemTargetId = item.to_employee_id !== undefined ? item.to_employee_id : to_employee_id;
      const itemTargetDept = item.to_department !== undefined ? item.to_department : to_department;
      const itemAction = item.action || (itemTargetName ? 'reassign' : 'return');
      
      const effectiveStatus = itemAction === 'reassign' && itemTargetName ? 'Handed Over' : 'Returned';
      const itemCondBefore = item.condition_before || condition_before || asset.condition || 'Good';
      const itemCondAfter = item.condition_after || condition_after || itemCondBefore;
      const itemAccRet = item.accessories_returned !== undefined ? item.accessories_returned : accessories_returned;
      const itemAccGiv = item.accessories_given !== undefined ? item.accessories_given : accessories_given;
      const itemRemarks = item.remarks || remarks || '';

      const handoverId = getNextHandoverId(db);

      // Close previous active assignment
      if (fromName && fromName !== 'Company Stock') {
        db.prepare(`
          UPDATE asset_assignments
          SET return_date = ?,
              notes = notes || ' | Bulk Handover: ' || ?
          WHERE asset_id = ? AND return_date IS NULL
        `).run(finalReturnDate, reason, assetId);
      }

      // Assign to new holder if reassigning
      if (effectiveStatus === 'Handed Over' && itemTargetName) {
        db.prepare(`
          INSERT INTO asset_assignments (asset_id, person_name, employee_id, department, assignment_date, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          assetId,
          itemTargetName,
          itemTargetId || '',
          itemTargetDept || '',
          finalHandoverDate,
          `Bulk handover from ${fromName} (${reason}). ${itemRemarks}`.trim()
        );

        db.prepare(`
          UPDATE assets
          SET status = 'Assigned',
              assigned_to = ?,
              department = ?,
              condition = COALESCE(?, condition),
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(itemTargetName, itemTargetDept || '', itemCondAfter, assetId);

        db.prepare(`
          INSERT OR IGNORE INTO employees (name, employee_id, department, status)
          VALUES (?, ?, ?, 'Active')
        `).run(itemTargetName, itemTargetId || null, itemTargetDept || '');
      } else {
        // Return to stock
        db.prepare(`
          UPDATE assets
          SET status = 'Available',
              assigned_to = '',
              department = '',
              condition = COALESCE(?, condition),
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(itemCondBefore, assetId);
      }

      // Log handover record
      db.prepare(`
        INSERT INTO asset_handovers (
          handover_id, asset_id, from_employee_name, from_employee_id, from_department,
          to_employee_name, to_employee_id, to_department, return_date, handover_date,
          reason, condition_before, condition_after, accessories_returned, accessories_given,
          handed_over_by, received_by, remarks, status
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `).run(
        handoverId,
        assetId,
        fromName,
        fromId,
        fromDept,
        effectiveStatus === 'Handed Over' ? itemTargetName : '',
        effectiveStatus === 'Handed Over' ? (itemTargetId || '') : '',
        effectiveStatus === 'Handed Over' ? (itemTargetDept || '') : '',
        finalReturnDate,
        effectiveStatus === 'Handed Over' ? finalHandoverDate : null,
        reason,
        itemCondBefore,
        effectiveStatus === 'Handed Over' ? itemCondAfter : itemCondBefore,
        itemAccRet || '',
        effectiveStatus === 'Handed Over' ? (itemAccGiv || '') : '',
        handed_over_by || '',
        received_by || '',
        itemRemarks,
        effectiveStatus
      );

      results.push({ handover_id: handoverId, asset_id: assetId, status: effectiveStatus });
    });

    if (mark_resigned && from_employee_name) {
      db.prepare(`
        UPDATE employees
        SET status = 'Resigned',
            resignation_date = COALESCE(resignation_date, ?)
        WHERE name = ?
      `).run(finalReturnDate, from_employee_name);
    }

    res.json({ success: true, count: results.length, handovers: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Handover Status (e.g. from Pending Return -> Returned -> Handed Over)
app.put('/api/handovers/:id', (req, res) => {
  try {
    const db = getDb();
    const { status, to_employee_name, to_employee_id, to_department, handover_date, condition_after, remarks } = req.body;
    const handover = db.prepare('SELECT * FROM asset_handovers WHERE id = ?').get(req.params.id);

    if (!handover) {
      return res.status(404).json({ error: 'Handover record not found.' });
    }

    if (status === 'Returned') {
      db.prepare(`
        UPDATE asset_handovers
        SET status = 'Returned',
            return_date = COALESCE(return_date, date('now', 'localtime'))
        WHERE id = ?
      `).run(req.params.id);

      db.prepare(`
        UPDATE assets
        SET status = 'Available',
            assigned_to = '',
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(handover.asset_id);
    } else if (status === 'Handed Over' && (to_employee_name || handover.to_employee_name)) {
      const targetName = to_employee_name || handover.to_employee_name;
      const targetId = to_employee_id || handover.to_employee_id;
      const targetDept = to_department || handover.to_department;
      const finalHDate = handover_date || new Date().toISOString().split('T')[0];

      db.prepare(`
        UPDATE asset_handovers
        SET status = 'Handed Over',
            to_employee_name = ?,
            to_employee_id = ?,
            to_department = ?,
            handover_date = ?,
            condition_after = COALESCE(?, condition_after)
        WHERE id = ?
      `).run(targetName, targetId || '', targetDept || '', finalHDate, condition_after || null, req.params.id);

      // Create assignment
      db.prepare(`
        INSERT INTO asset_assignments (asset_id, person_name, employee_id, department, assignment_date, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(handover.asset_id, targetName, targetId || '', targetDept || '', finalHDate, `Handover completed (${handover.reason})`);

      db.prepare(`
        UPDATE assets
        SET status = 'Assigned',
            assigned_to = ?,
            department = ?,
            condition = COALESCE(?, condition),
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(targetName, targetDept || '', condition_after || null, handover.asset_id);
    } else if (status) {
      db.prepare(`UPDATE asset_handovers SET status = ? WHERE id = ?`).run(status, req.params.id);
    }

    const updated = db.prepare('SELECT * FROM asset_handovers WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete Handover History & Timeline for Asset
app.get('/api/assets/:id/handovers', (req, res) => {
  try {
    const db = getDb();
    const assetId = req.params.id;

    const handovers = db.prepare(`
      SELECT * FROM asset_handovers
      WHERE asset_id = ?
      ORDER BY id DESC
    `).all(assetId);

    const assignments = db.prepare(`
      SELECT * FROM asset_assignments
      WHERE asset_id = ?
      ORDER BY id ASC
    `).all(assetId);

    // Build unified chronological timeline
    const timeline = [];
    assignments.forEach((asg) => {
      timeline.push({
        type: 'assignment',
        date: asg.assignment_date,
        person_name: asg.person_name,
        employee_id: asg.employee_id,
        department: asg.department,
        notes: asg.notes
      });
      if (asg.return_date) {
        timeline.push({
          type: 'return',
          date: asg.return_date,
          person_name: asg.person_name,
          employee_id: asg.employee_id,
          department: asg.department,
          notes: asg.notes
        });
      }
    });

    timeline.sort((a, b) => (a.date > b.date ? 1 : -1));

    res.json({ handovers, assignments, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import Handover Sheet Records
app.post('/api/handovers/import', (req, res) => {
  try {
    const db = getDb();
    const { handovers, auto_create_assets = true, default_reason = 'Asset Handover' } = req.body;

    if (!Array.isArray(handovers) || handovers.length === 0) {
      return res.status(400).json({ error: 'No handover records provided to import.' });
    }

    let importedCount = 0;
    let updatedAssetsCount = 0;
    let createdAssetsCount = 0;

    db.exec('BEGIN TRANSACTION;');
    try {
      for (let i = 0; i < handovers.length; i++) {
        const item = handovers[i];
        const rawCode = (item.asset_id || item.asset_code || item.serial_number || '').toString().trim();
        const fromName = (item.from_employee_name || item.from_person || '').toString().trim();
        const toName = (item.to_employee_name || item.to_person || '').toString().trim();

        if (!rawCode && !fromName && !toName) {
          continue; // skip empty rows
        }

        // Match existing asset by ID, serial_number, or asset_tag
        let matchedAsset = null;
        if (rawCode) {
          matchedAsset = db.prepare('SELECT * FROM assets WHERE LOWER(id) = LOWER(?)').get(rawCode);
          if (!matchedAsset) {
            matchedAsset = db.prepare("SELECT * FROM assets WHERE LOWER(serial_number) = LOWER(?) AND serial_number IS NOT NULL AND serial_number != ''").get(rawCode);
          }
          if (!matchedAsset) {
            matchedAsset = db.prepare("SELECT * FROM assets WHERE LOWER(asset_tag) = LOWER(?) AND asset_tag IS NOT NULL AND asset_tag != ''").get(rawCode);
          }
        }

        let assetId = matchedAsset ? matchedAsset.id : rawCode;

        // Auto-create asset if requested and not found
        if (!matchedAsset && auto_create_assets && rawCode) {
          const catName = item.category || 'Hardware';
          let cat = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)').get(catName);
          if (!cat) {
            const catIns = db.prepare('INSERT INTO categories (name, color, icon, is_default) VALUES (?, ?, ?, 0)').run(catName, '#3b82f6', 'Box');
            cat = { id: catIns.lastInsertRowid };
          }

          db.prepare(`
            INSERT INTO assets (
              id, name, category_id, brand, model, serial_number,
              status, assigned_to, department, condition, location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            assetId,
            item.asset_name || `${item.brand || ''} ${catName}`.trim() || assetId,
            cat.id,
            item.brand || '',
            item.model || '',
            item.serial_number || '',
            toName ? 'Assigned' : 'Available',
            toName || '',
            item.to_department || item.from_department || '',
            item.condition_after || item.condition_before || 'Good',
            item.location || 'Local'
          );
          createdAssetsCount++;
        } else if (matchedAsset) {
          updatedAssetsCount++;
        }

        const rawReturn = item.return_date || item.handover_date || '';
        const parsedReturn = parseExcelDate(rawReturn);
        const returnDate = parsedReturn || new Date().toISOString().split('T')[0];

        const rawHandover = item.handover_date || rawReturn || '';
        const parsedHandover = parseExcelDate(rawHandover);
        const handoverDate = parsedHandover || returnDate;

        const reason = item.reason || default_reason;
        const effectiveStatus = item.status || (toName ? 'Handed Over' : 'Returned');

        // Close previous assignment if fromName was assigned
        if (fromName && assetId) {
          db.prepare(`
            UPDATE asset_assignments
            SET return_date = COALESCE(return_date, ?),
                notes = notes || ' | Handover to ' || ? || ' (' || ? || ')'
            WHERE asset_id = ? AND (LOWER(person_name) = LOWER(?) OR return_date IS NULL)
          `).run(returnDate, toName || 'Stock', reason, assetId, fromName);

          const existingFrom = db.prepare('SELECT id FROM employees WHERE LOWER(name) = LOWER(?)').get(fromName);
          if (!existingFrom) {
            const cleanFromId = (item.from_employee_id && String(item.from_employee_id).trim()) || null;
            db.prepare(`
              INSERT OR IGNORE INTO employees (name, employee_id, department, status)
              VALUES (?, ?, ?, 'Active')
            `).run(fromName, cleanFromId, item.from_department || '');
          }
        }

        // Open new assignment if toName is present
        if (toName && assetId) {
          db.prepare(`
            INSERT INTO asset_assignments (
              asset_id, person_name, employee_id, department, assignment_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            assetId,
            toName,
            item.to_employee_id || '',
            item.to_department || '',
            handoverDate,
            `Handover from ${fromName || 'Previous Custodian'} (${reason}). ${item.remarks || ''}`.trim()
          );

          db.prepare(`
            UPDATE assets
            SET status = 'Assigned',
                assigned_to = ?,
                department = COALESCE(?, department),
                condition = COALESCE(?, condition),
                updated_at = datetime('now', 'localtime')
            WHERE id = ?
          `).run(toName, item.to_department || null, item.condition_after || null, assetId);

          const existingTo = db.prepare('SELECT id FROM employees WHERE LOWER(name) = LOWER(?)').get(toName);
          if (!existingTo) {
            const cleanToId = (item.to_employee_id && String(item.to_employee_id).trim()) || null;
            db.prepare(`
              INSERT OR IGNORE INTO employees (name, employee_id, department, status)
              VALUES (?, ?, ?, 'Active')
            `).run(toName, cleanToId, item.to_department || '');
          }
        } else if (assetId && !toName) {
          // Returned to stock
          db.prepare(`
            UPDATE assets
            SET status = 'Available',
                assigned_to = '',
                condition = COALESCE(?, condition),
                updated_at = datetime('now', 'localtime')
            WHERE id = ?
          `).run(item.condition_before || null, assetId);
        }

        // Insert into asset_handovers
        let handoverId = item.handover_id && item.handover_id.toString().trim();
        if (!handoverId) {
          handoverId = getNextHandoverId(db);
        } else {
          const existingH = db.prepare('SELECT id FROM asset_handovers WHERE handover_id = ?').get(handoverId);
          if (existingH) {
            handoverId = getNextHandoverId(db);
          }
        }

        db.prepare(`
          INSERT INTO asset_handovers (
            handover_id, asset_id, from_employee_name, from_employee_id, from_department,
            to_employee_name, to_employee_id, to_department, return_date, handover_date,
            reason, condition_before, condition_after, accessories_returned, accessories_given,
            handed_over_by, received_by, remarks, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          handoverId,
          assetId || 'N/A',
          fromName || '',
          item.from_employee_id || '',
          item.from_department || '',
          toName || '',
          item.to_employee_id || '',
          item.to_department || '',
          returnDate,
          toName ? handoverDate : null,
          reason,
          item.condition_before || 'Good',
          item.condition_after || item.condition_before || 'Good',
          item.accessories_returned || '',
          item.accessories_given || item.accessories_returned || '',
          item.handed_over_by || fromName || '',
          item.received_by || toName || 'IT Admin',
          item.remarks || '',
          effectiveStatus
        );

        importedCount++;
      }
      db.exec('COMMIT;');
    } catch (e) {
      try { db.exec('ROLLBACK;'); } catch (_) {}
      throw e;
    }

    res.json({
      success: true,
      importedCount,
      updatedAssetsCount,
      createdAssetsCount,
      totalProcessed: handovers.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parse Excel from local file path for handovers
app.post('/api/handovers/import-local-path', (req, res) => {
  try {
    const { file_path } = req.body;
    if (!file_path || !fs.existsSync(file_path)) {
      return res.status(400).json({ error: 'File path does not exist on this machine.' });
    }
    const wb = xlsx.readFile(file_path);
    const sheetNames = wb.SheetNames;
    const sheetData = {};
    sheetNames.forEach((name) => {
      sheetData[name] = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
    });
    res.json({ success: true, sheetNames, sheetData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// EMPLOYEE DIRECTORY & RESIGNATION WORKFLOW
// -------------------------------------------------------------
app.get('/api/employees', (req, res) => {
  try {
    const db = getDb();

    // Auto-sync any custodians from assignments or assets who do not have an employee entry yet
    const custodians = db.prepare(`
      SELECT DISTINCT person_name as name, employee_id, department FROM asset_assignments WHERE person_name IS NOT NULL AND person_name != ''
      UNION
      SELECT DISTINCT assigned_to as name, '' as employee_id, department FROM assets WHERE assigned_to IS NOT NULL AND assigned_to != ''
    `).all();

    const insertEmp = db.prepare(`
      INSERT OR IGNORE INTO employees (name, employee_id, department, status)
      VALUES (?, ?, ?, 'Active')
    `);

    custodians.forEach((c) => {
      const cleanName = (c.name || '').trim();
      if (cleanName) {
        const exists = db.prepare('SELECT id FROM employees WHERE LOWER(name) = LOWER(?)').get(cleanName);
        if (!exists) {
          insertEmp.run(cleanName, c.employee_id || null, c.department || '');
        }
      }
    });

    const rawEmployees = db.prepare(`SELECT * FROM employees ORDER BY name ASC`).all();

    // Deduplicate by name (prefer entry with valid employee_id)
    const empMap = new Map();
    rawEmployees.forEach((emp) => {
      const existing = empMap.get(emp.name);
      if (!existing) {
        empMap.set(emp.name, emp);
      } else if (!existing.employee_id && emp.employee_id) {
        empMap.set(emp.name, { ...existing, employee_id: emp.employee_id, department: emp.department || existing.department });
      }
    });
    const employees = Array.from(empMap.values());

    // Enrich each employee with current active assets, pending return assets, and complete history
    const enriched = employees.map((emp) => {
      // Active assigned assets (excluding Pending Return)
      const currentAssets = db.prepare(`
        SELECT a.id, a.name, a.brand, a.model, a.serial_number, a.status, a.condition, c.name as category_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'Assigned' AND LOWER(a.assigned_to) = LOWER(?)
      `).all(emp.name);

      // Assets currently pending return from this employee
      const pendingReturnAssets = db.prepare(`
        SELECT a.id, a.name, a.brand, a.model, a.serial_number, a.status, a.condition, c.name as category_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'Pending Return' AND LOWER(a.assigned_to) = LOWER(?)
      `).all(emp.name);

      // Previously returned assets
      const previousAssets = db.prepare(`
        SELECT DISTINCT a.id, a.name, a.brand, a.model, asg.assignment_date, asg.return_date, c.name as category_name
        FROM asset_assignments asg
        JOIN assets a ON asg.asset_id = a.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE LOWER(asg.person_name) = LOWER(?) AND asg.return_date IS NOT NULL
        ORDER BY asg.id DESC
      `).all(emp.name);

      // Comprehensive list of all assets ever held by this employee with individual return status
      const allHistoryAssets = db.prepare(`
        SELECT DISTINCT a.id, a.name, a.brand, a.model, a.serial_number, asg.assignment_date, asg.return_date, 
               c.name as category_name, a.status as asset_current_status,
               CASE 
                 WHEN a.status = 'Pending Return' AND LOWER(a.assigned_to) = LOWER(?) THEN 'Pending Return'
                 WHEN asg.return_date IS NOT NULL THEN 'Returned'
                 ELSE a.status
               END as return_status
        FROM asset_assignments asg
        JOIN assets a ON asg.asset_id = a.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE LOWER(asg.person_name) = LOWER(?)
        ORDER BY asg.id DESC
      `).all(emp.name, emp.name);

      return {
        ...emp,
        current_assets_count: currentAssets.length,
        pending_return_count: pendingReturnAssets.length,
        previous_assets_count: previousAssets.length,
        current_assets: currentAssets,
        pending_return_assets: pendingReturnAssets,
        previous_assets: previousAssets,
        all_history_assets: allHistoryAssets
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Employee Status (with automatic asset release upon Resignation)
app.put('/api/employees/:id/status', (req, res) => {
  const db = getDb();
  const { status, resignation_date, notes, asset_action } = req.body;

  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const resDate = status === 'Resigned' ? (resignation_date || new Date().toISOString().split('T')[0]) : null;

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Update employee record
      db.prepare(`
        UPDATE employees
        SET status = ?,
            resignation_date = ?,
            notes = COALESCE(?, notes)
        WHERE id = ?
      `).run(status || 'Active', resDate, notes || null, req.params.id);

      let assignedAssets = [];
      let effectiveAction = asset_action;

      if (status === 'Resigned') {
        // Read global default setting if asset_action is not provided
        if (!effectiveAction) {
          const settingRow = db.prepare("SELECT value FROM settings WHERE key = 'resignation_asset_handling'").get();
          effectiveAction = settingRow?.value === 'Available' ? 'Available' : 'Pending Return';
        }

        // Find ALL assets currently assigned to this employee (case-insensitive)
        assignedAssets = db.prepare(`
          SELECT a.*, c.name as category_name
          FROM assets a
          LEFT JOIN categories c ON a.category_id = c.id
          WHERE LOWER(a.assigned_to) = LOWER(?)
        `).all(employee.name);

        for (const asset of assignedAssets) {
          // Close active assignment in asset_assignments
          db.prepare(`
            UPDATE asset_assignments
            SET return_date = COALESCE(return_date, ?),
                notes = CASE 
                  WHEN notes IS NOT NULL AND length(trim(notes)) > 0 
                  THEN notes || ' | Returned upon employee resignation' 
                  ELSE 'Returned upon employee resignation' 
                END
            WHERE asset_id = ? AND (LOWER(person_name) = LOWER(?) OR return_date IS NULL)
          `).run(resDate, asset.id, employee.name);

          const handoverId = getNextHandoverId(db);

          if (effectiveAction === 'Available') {
            // Option 1: Immediately mark as Available and unassigned
            db.prepare(`
              UPDATE assets
              SET status = 'Available',
                  assigned_to = '',
                  updated_at = datetime('now', 'localtime')
              WHERE id = ?
            `).run(asset.id);

            db.prepare(`
              INSERT INTO asset_handovers (
                handover_id, asset_id, from_employee_name, from_employee_id, from_department,
                to_employee_name, to_employee_id, to_department, return_date, handover_date,
                reason, condition_before, condition_after, accessories_returned, accessories_given,
                handed_over_by, received_by, remarks, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              handoverId,
              asset.id,
              employee.name,
              employee.employee_id || '',
              employee.department || '',
              'Stock',
              '',
              '',
              resDate,
              resDate,
              'Employee Resigned',
              asset.condition || 'Good',
              asset.condition || 'Good',
              '',
              '',
              employee.name,
              'IT Admin',
              'Automatically released to stock upon employee resignation',
              'Returned'
            );
          } else {
            // Option 2 (Default): Mark as Pending Return, keep custodian tracked until physical check-in
            db.prepare(`
              UPDATE assets
              SET status = 'Pending Return',
                  updated_at = datetime('now', 'localtime')
              WHERE id = ?
            `).run(asset.id);

            db.prepare(`
              INSERT INTO asset_handovers (
                handover_id, asset_id, from_employee_name, from_employee_id, from_department,
                to_employee_name, to_employee_id, to_department, return_date, handover_date,
                reason, condition_before, condition_after, accessories_returned, accessories_given,
                handed_over_by, received_by, remarks, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              handoverId,
              asset.id,
              employee.name,
              employee.employee_id || '',
              employee.department || '',
              'Stock',
              '',
              '',
              resDate,
              null,
              'Employee Resigned',
              asset.condition || 'Good',
              asset.condition || 'Good',
              '',
              '',
              employee.name,
              'Pending Return',
              'Asset pending physical check-in from resigned employee',
              'Pending Return'
            );
          }
        }

        // Record Audit Log
        db.prepare(`
          INSERT INTO audit_logs (action, entity_type, entity_id, details)
          VALUES (?, ?, ?, ?)
        `).run(
          'Employee marked as Resigned',
          'employee',
          employee.id.toString(),
          JSON.stringify({
            employee_name: employee.name,
            employee_id: employee.employee_id,
            assets_affected_count: assignedAssets.length,
            assets: assignedAssets.map(a => a.id),
            asset_action: effectiveAction,
            date: resDate
          })
        );
      } else {
        // Re-activating employee
        db.prepare(`
          INSERT INTO audit_logs (action, entity_type, entity_id, details)
          VALUES (?, ?, ?, ?)
        `).run(
          'Employee marked as Active',
          'employee',
          employee.id.toString(),
          JSON.stringify({
            employee_name: employee.name,
            employee_id: employee.employee_id,
            date: new Date().toISOString().split('T')[0]
          })
        );
      }

      db.exec('COMMIT;');

      const updatedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);

      res.json({
        success: true,
        message: `Employee status updated to ${status}.`,
        employee: updatedEmployee,
        affected_assets_count: assignedAssets.length,
        assigned_assets: assignedAssets,
        asset_action: effectiveAction
      });
    } catch (txErr) {
      try { db.exec('ROLLBACK;'); } catch (_) {}
      throw txErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Receive Single Asset from Resigned / Pending Return Employee
app.post('/api/employees/:id/receive-asset', (req, res) => {
  const db = getDb();
  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const { asset_id, return_date, condition, accessories_returned, remarks } = req.body;
    if (!asset_id) {
      return res.status(400).json({ error: 'Asset ID is required.' });
    }

    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    const finalReturnDate = return_date || new Date().toISOString().split('T')[0];
    const finalCondition = condition || asset.condition || 'Good';
    const accStr = Array.isArray(accessories_returned) ? accessories_returned.join(', ') : (accessories_returned || '');

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Update asset to Available and clear assigned_to
      db.prepare(`
        UPDATE assets
        SET status = 'Available',
            assigned_to = '',
            condition = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(finalCondition, asset.id);

      // 2. Close any remaining open assignment for this asset
      db.prepare(`
        UPDATE asset_assignments
        SET return_date = COALESCE(return_date, ?),
            notes = CASE 
              WHEN notes IS NOT NULL AND length(trim(notes)) > 0 
              THEN notes || ' | Physically received in stock' 
              ELSE 'Physically received in stock' 
            END
        WHERE asset_id = ? AND (LOWER(person_name) = LOWER(?) OR return_date IS NULL)
      `).run(finalReturnDate, asset.id, employee.name);

      // 3. Update existing Pending Return handover record, or create new Returned record
      const pendingHandover = db.prepare(`
        SELECT * FROM asset_handovers
        WHERE asset_id = ? AND LOWER(from_employee_name) = LOWER(?) AND status = 'Pending Return'
        ORDER BY id DESC LIMIT 1
      `).get(asset.id, employee.name);

      if (pendingHandover) {
        db.prepare(`
          UPDATE asset_handovers
          SET status = 'Returned',
              handover_date = ?,
              condition_after = ?,
              accessories_returned = CASE WHEN ? != '' THEN ? ELSE accessories_returned END,
              remarks = CASE 
                WHEN ? != '' THEN remarks || ' | ' || ? 
                ELSE remarks 
              END
          WHERE id = ?
        `).run(
          finalReturnDate,
          finalCondition,
          accStr,
          accStr,
          remarks || '',
          remarks || '',
          pendingHandover.id
        );
      } else {
        const handoverId = getNextHandoverId(db);
        db.prepare(`
          INSERT INTO asset_handovers (
            handover_id, asset_id, from_employee_name, from_employee_id, from_department,
            to_employee_name, to_employee_id, to_department, return_date, handover_date,
            reason, condition_before, condition_after, accessories_returned, accessories_given,
            handed_over_by, received_by, remarks, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          handoverId,
          asset.id,
          employee.name,
          employee.employee_id || '',
          employee.department || '',
          'Stock',
          '',
          '',
          finalReturnDate,
          finalReturnDate,
          'Physical Return Received',
          asset.condition || 'Good',
          finalCondition,
          accStr,
          '',
          employee.name,
          'IT Admin',
          remarks || 'Physically received in stock after resignation',
          'Returned'
        );
      }

      // 4. Audit Log
      db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?)
      `).run(
        'Asset Received from Resigned Employee',
        'asset',
        asset.id,
        JSON.stringify({
          asset_id: asset.id,
          employee_name: employee.name,
          return_date: finalReturnDate,
          condition: finalCondition,
          accessories: accStr,
          remarks: remarks || ''
        })
      );

      db.exec('COMMIT;');
      res.json({
        success: true,
        message: `Asset ${asset.id} has been physically received and marked Available in stock.`
      });
    } catch (txErr) {
      try { db.exec('ROLLBACK;'); } catch (_) {}
      throw txErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Receive ALL Pending Return Assets from Resigned Employee
app.post('/api/employees/:id/receive-all-assets', (req, res) => {
  const db = getDb();
  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const { return_date, condition, remarks } = req.body;
    const finalReturnDate = return_date || new Date().toISOString().split('T')[0];
    const finalCondition = condition || 'Good';

    // Find all pending assets for this employee
    const pendingAssets = db.prepare(`
      SELECT * FROM assets
      WHERE LOWER(assigned_to) = LOWER(?) AND (status = 'Pending Return' OR status = 'Assigned')
    `).all(employee.name);

    if (pendingAssets.length === 0) {
      return res.json({ success: true, count: 0, message: 'No pending assets found for this employee.' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const asset of pendingAssets) {
        // 1. Update asset to Available and clear assigned_to
        db.prepare(`
          UPDATE assets
          SET status = 'Available',
              assigned_to = '',
              condition = ?,
              updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(finalCondition, asset.id);

        // 2. Close active assignment
        db.prepare(`
          UPDATE asset_assignments
          SET return_date = COALESCE(return_date, ?),
              notes = CASE 
                WHEN notes IS NOT NULL AND length(trim(notes)) > 0 
                THEN notes || ' | Bulk received in stock' 
                ELSE 'Bulk received in stock' 
              END
          WHERE asset_id = ? AND (LOWER(person_name) = LOWER(?) OR return_date IS NULL)
        `).run(finalReturnDate, asset.id, employee.name);

        // 3. Update existing Pending Return handover record, or create new Returned record
        const pendingHandover = db.prepare(`
          SELECT * FROM asset_handovers
          WHERE asset_id = ? AND LOWER(from_employee_name) = LOWER(?) AND status = 'Pending Return'
          ORDER BY id DESC LIMIT 1
        `).get(asset.id, employee.name);

        if (pendingHandover) {
          db.prepare(`
            UPDATE asset_handovers
            SET status = 'Returned',
                handover_date = ?,
                condition_after = ?,
                remarks = remarks || ' | Bulk received in stock'
            WHERE id = ?
          `).run(finalReturnDate, finalCondition, pendingHandover.id);
        } else {
          const handoverId = getNextHandoverId(db);
          db.prepare(`
            INSERT INTO asset_handovers (
              handover_id, asset_id, from_employee_name, from_employee_id, from_department,
              to_employee_name, to_employee_id, to_department, return_date, handover_date,
              reason, condition_before, condition_after, accessories_returned, accessories_given,
              handed_over_by, received_by, remarks, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            handoverId,
            asset.id,
            employee.name,
            employee.employee_id || '',
            employee.department || '',
            'Stock',
            '',
            '',
            finalReturnDate,
            finalReturnDate,
            'Physical Return Received (Bulk)',
            asset.condition || 'Good',
            finalCondition,
            '',
            '',
            employee.name,
            'IT Admin',
            remarks || 'Bulk received in stock after resignation',
            'Returned'
          );
        }
      }

      // 4. Audit Log
      db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?)
      `).run(
        'Bulk Assets Received from Resigned Employee',
        'employee',
        employee.id.toString(),
        JSON.stringify({
          employee_name: employee.name,
          employee_id: employee.employee_id,
          received_count: pendingAssets.length,
          assets: pendingAssets.map(a => a.id),
          return_date: finalReturnDate,
          remarks: remarks || ''
        })
      );

      db.exec('COMMIT;');
      res.json({
        success: true,
        count: pendingAssets.length,
        message: `Successfully received ${pendingAssets.length} assets and marked them as Available.`
      });
    } catch (txErr) {
      try { db.exec('ROLLBACK;'); } catch (_) {}
      throw txErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// MAINTENANCE / REPAIR LOGS
// -------------------------------------------------------------
app.get('/api/maintenance', (req, res) => {
  try {
    const db = getDb();
    const records = db.prepare(`
      SELECT m.*, a.name as asset_name, a.brand as asset_brand, a.model as asset_model, a.serial_number, c.name as category_name
      FROM maintenance_records m
      JOIN assets a ON m.asset_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY m.id DESC
    `).all();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance', (req, res) => {
  try {
    const db = getDb();
    const {
      asset_id,
      issue,
      reported_date,
      repair_vendor,
      repair_cost,
      repair_status = 'Reported',
      sent_date,
      received_date,
      warranty_claim = 0,
      resolution,
      notes,
      set_asset_under_repair = true
    } = req.body;

    if (!asset_id || !issue) {
      return res.status(400).json({ error: 'Asset ID and Issue description are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO maintenance_records (
        asset_id, issue, reported_date, repair_vendor, repair_cost, repair_status,
        sent_date, received_date, warranty_claim, resolution, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      asset_id,
      issue,
      reported_date || new Date().toISOString().split('T')[0],
      repair_vendor || '',
      Number(repair_cost) || 0,
      repair_status,
      sent_date || null,
      received_date || null,
      warranty_claim ? 1 : 0,
      resolution || '',
      notes || ''
    );

    // If set_asset_under_repair is checked and status is not Completed
    if (set_asset_under_repair && repair_status !== 'Completed') {
      db.prepare(`
        UPDATE assets
        SET status = 'Under Repair',
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(asset_id);
    }

    const created = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/maintenance/:id', (req, res) => {
  try {
    const db = getDb();
    const data = req.body;
    const existing = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    db.prepare(`
      UPDATE maintenance_records SET
        issue = COALESCE(?, issue),
        reported_date = COALESCE(?, reported_date),
        repair_vendor = COALESCE(?, repair_vendor),
        repair_cost = COALESCE(?, repair_cost),
        repair_status = COALESCE(?, repair_status),
        sent_date = COALESCE(?, sent_date),
        received_date = COALESCE(?, received_date),
        warranty_claim = COALESCE(?, warranty_claim),
        resolution = COALESCE(?, resolution),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      data.issue,
      data.reported_date,
      data.repair_vendor,
      data.repair_cost !== undefined ? Number(data.repair_cost) : undefined,
      data.repair_status,
      data.sent_date,
      data.received_date,
      data.warranty_claim !== undefined ? (data.warranty_claim ? 1 : 0) : undefined,
      data.resolution,
      data.notes,
      req.params.id
    );

    // If marked Completed, and asset was Under Repair, prompt or set to In Use / Available
    if (data.repair_status === 'Completed' && data.revert_asset_status) {
      const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(existing.asset_id);
      if (asset && asset.status === 'Under Repair') {
        const nextStatus = asset.assigned_to ? 'Assigned' : 'Available';
        db.prepare(`
          UPDATE assets SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?
        `).run(nextStatus, existing.asset_id);
      }
    }

    const updated = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/maintenance/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM maintenance_records WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Maintenance record deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// DOCUMENTS & ATTACHMENTS (LOCAL ONLY)
// -------------------------------------------------------------
app.post('/api/documents/upload', upload.single('file'), (req, res) => {
  try {
    const db = getDb();
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { asset_id, maintenance_id, document_type = 'Other' } = req.body;
    const stmt = db.prepare(`
      INSERT INTO documents (asset_id, maintenance_id, document_type, file_name, original_name, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      asset_id || null,
      maintenance_id ? Number(maintenance_id) : null,
      document_type,
      req.file.filename,
      req.file.originalname,
      req.file.size,
      req.file.mimetype
    );

    const created = db.prepare('SELECT * FROM documents WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  try {
    const db = getDb();
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const filePath = path.join(UPLOADS_DIR, doc.file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Document removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// REPORTS ENDPOINT
// -------------------------------------------------------------
app.get('/api/reports', (req, res) => {
  try {
    const db = getDb();
    const { report_type = 'all_assets' } = req.query;

    let data = [];
    let title = 'Asset Report';

    switch (report_type) {
      case 'all_assets':
        title = 'Complete Asset Inventory';
        data = db.prepare(`
          SELECT a.id, a.name, c.name as category, a.brand, a.model, a.serial_number, a.asset_tag,
                 a.status, a.location, a.assigned_to, a.department, a.condition,
                 a.purchase_date, a.purchase_price, a.vendor, a.warranty_end_date
          FROM assets a
          LEFT JOIN categories c ON a.category_id = c.id
          ORDER BY a.id ASC
        `).all();
        break;

      case 'by_category':
        title = 'Assets Grouped by Category';
        data = db.prepare(`
          SELECT c.name as category, COUNT(a.id) as total_items,
                 COALESCE(SUM(a.purchase_price), 0) as total_value,
                 COALESCE(AVG(a.purchase_price), 0) as avg_price
          FROM categories c
          LEFT JOIN assets a ON a.category_id = c.id
          GROUP BY c.id
          ORDER BY total_items DESC
        `).all();
        break;

      case 'by_status':
        title = 'Assets Grouped by Status';
        data = db.prepare(`
          SELECT a.status, COUNT(a.id) as count, COALESCE(SUM(a.purchase_price), 0) as total_value
          FROM assets a
          GROUP BY a.status
          ORDER BY count DESC
        `).all();
        break;

      case 'assigned_assets':
        title = 'Assigned Assets Directory';
        data = db.prepare(`
          SELECT a.id, a.name, c.name as category, a.brand, a.model, a.assigned_to, a.department, a.location, a.status
          FROM assets a
          LEFT JOIN categories c ON a.category_id = c.id
          WHERE a.assigned_to IS NOT NULL AND a.assigned_to != ''
          ORDER BY a.assigned_to ASC
        `).all();
        break;

      case 'available_assets':
        title = 'Available Assets in Stock';
        data = db.prepare(`
          SELECT a.id, a.name, c.name as category, a.brand, a.model, a.location, a.condition, a.purchase_price
          FROM assets a
          LEFT JOIN categories c ON a.category_id = c.id
          WHERE a.status = 'Available'
          ORDER BY a.id ASC
        `).all();
        break;

      case 'repair_history':
        title = 'Complete Maintenance & Repair History';
        data = db.prepare(`
          SELECT m.id, m.asset_id, a.name as asset_name, m.issue, m.reported_date, m.repair_vendor,
                 m.repair_cost, m.repair_status, m.sent_date, m.received_date, m.warranty_claim, m.resolution
          FROM maintenance_records m
          JOIN assets a ON m.asset_id = a.id
          ORDER BY m.reported_date DESC
        `).all();
        break;

      case 'warranty_expiry':
        title = 'Warranty Expiration Analysis';
        data = db.prepare(`
          SELECT a.id, a.name, c.name as category, a.brand, a.model, a.serial_number,
                 a.warranty_start_date, a.warranty_end_date, a.vendor
          FROM assets a
          LEFT JOIN categories c ON a.category_id = c.id
          WHERE a.warranty_end_date IS NOT NULL AND a.warranty_end_date != ''
          ORDER BY a.warranty_end_date ASC
        `).all().map((item) => ({
          ...item,
          days_left: getDaysUntil(item.warranty_end_date)
        }));
        break;

      case 'valuation_summary':
        title = 'Asset Value and Investment Summary';
        data = db.prepare(`
          SELECT 
            c.name as category,
            COUNT(a.id) as quantity,
            COALESCE(SUM(a.purchase_price), 0) as total_investment,
            MIN(a.purchase_price) as min_price,
            MAX(a.purchase_price) as max_price
          FROM categories c
          JOIN assets a ON a.category_id = c.id
          GROUP BY c.id
          ORDER BY total_investment DESC
        `).all();
        break;

      default:
        data = [];
    }

    res.json({ title, report_type, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// BACKUP & RESTORE / EXCEL / CSV
// -------------------------------------------------------------
// 1. Download Local SQLite DB Backup
app.get('/api/backup/database', (req, res) => {
  try {
    const { fileName, filePath } = backupDatabase();
    res.download(filePath, fileName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Restore SQLite DB from file
app.post('/api/backup/restore', uploadDb.single('backup_file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No SQLite backup file provided' });
    }

    restoreDatabase(req.file.path);
    // Cleanup temporary upload
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Database successfully restored from backup! All tables and records refreshed.'
    });
  } catch (err) {
    console.error('Restore Error:', err);
    res.status(500).json({ error: `Restore failed: ${err.message}` });
  }
});

// 3. Export all assets to CSV
app.get('/api/backup/export-csv', (req, res) => {
  try {
    const db = getDb();
    const assets = db.prepare(`
      SELECT a.*, c.name as category_name
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
    `).all();

    const ws = xlsx.utils.json_to_sheet(assets);
    const csv = xlsx.utils.sheet_to_csv(ws);

    res.header('Content-Type', 'text/csv');
    res.attachment(`assets_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Export all assets, assignments & maintenance to multi-sheet Excel
app.get('/api/backup/export-excel', (req, res) => {
  try {
    const db = getDb();
    const assets = db.prepare(`
      SELECT a.*, c.name as category_name
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
    `).all();

    const assignments = db.prepare(`SELECT * FROM asset_assignments`).all();
    const maintenance = db.prepare(`SELECT * FROM maintenance_records`).all();
    const categories = db.prepare(`SELECT * FROM categories`).all();

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(assets), 'Assets');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(assignments), 'Assignments');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(maintenance), 'Maintenance');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(categories), 'Categories');

    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`assets_master_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to parse dates from Excel (both serial numbers and standard date strings)
function parseExcelDate(val) {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') {
    // Excel date serial number
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
    // Format check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // Format check DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return trimmed;
  }
  return '';
}

// 4.5. Download Excel Sample Template
app.get('/api/backup/template', (req, res) => {
  try {
    const templateData = [
      {
        'Asset ID': 'AST-1020',
        'Asset Name': 'MacBook Pro 16" M3 Max',
        'Category': 'Laptop',
        'Brand': 'Apple',
        'Model': 'MacBook Pro 16 (2024)',
        'Serial Number': 'C02G8012MD6R',
        'Asset Tag': 'TAG-AP-1020',
        'Description': 'Primary workstation laptop for development and design',
        'Purchase Date': '2024-03-15',
        'Purchase Price': 289900,
        'Vendor': 'Apple Store India',
        'Invoice Number': 'APL-INV-2024-88',
        'Warranty Start Date': '2024-03-15',
        'Warranty End Date': '2027-03-14',
        'Status': 'Assigned',
        'Location': 'Home Office - Desk A',
        'Assigned To': 'Deep',
        'Department': 'IT / Engineering',
        'Condition': 'Good',
        'Processor': 'Apple M3 Max (16-core CPU, 40-core GPU)',
        'RAM': '64 GB Unified Memory',
        'Storage': '2 TB PCIe NVMe SSD',
        'Operating System': 'macOS Sequoia 15.0',
        'MAC Address': '3C:06:30:1A:2B:3C',
        'IP Address': '192.168.1.115',
        'IMEI': '',
        'Phone Number': '',
        'Windows License Key': '',
        'Notes': 'Includes AppleCare+ warranty valid until 2027.'
      },
      {
        'Asset ID': 'AST-1021',
        'Asset Name': 'Dell UltraSharp 32" 6K Monitor',
        'Category': 'Monitor',
        'Brand': 'Dell',
        'Model': 'U3224KB',
        'Serial Number': 'CN-0U32KB-99120',
        'Asset Tag': 'TAG-DL-1021',
        'Description': '32-inch 6K IPS display with built-in 4K webcam',
        'Purchase Date': '2024-06-01',
        'Purchase Price': 185000,
        'Vendor': 'Dell India Official Store',
        'Invoice Number': 'INV-DEL-2024-11',
        'Warranty Start Date': '2024-06-01',
        'Warranty End Date': '2027-05-31',
        'Status': 'Available',
        'Location': 'Storage Cabinet A - Shelf 1',
        'Assigned To': '',
        'Department': '',
        'Condition': 'Brand New',
        'Processor': '',
        'RAM': '',
        'Storage': '',
        'Operating System': '',
        'MAC Address': '',
        'IP Address': '',
        'IMEI': '',
        'Phone Number': '',
        'Windows License Key': '',
        'Notes': 'Factory sealed backup display.'
      }
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);
    xlsx.utils.book_append_sheet(wb, ws, 'Asset_Import_Template');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('AssetVault_Import_Template.xlsx');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Enhanced Import assets from Excel or CSV
function executeAssetImport(db, rows, mapping = {}, fallbackCategory = 'Other', fallbackStatus = 'Available') {
  // Helper to find value from row with flexible key matching
  function getVal(row, fieldKey, fallbackKeys = []) {
    // 1. Try explicit custom mapping if defined by user
    if (mapping && mapping[fieldKey] && row[mapping[fieldKey]] !== undefined && row[mapping[fieldKey]] !== null) {
      return row[mapping[fieldKey]];
    }

    // 2. Try direct or case-insensitive matching
    const allKeys = [fieldKey, ...fallbackKeys];
    const rowKeys = Object.keys(row);
    for (const k of allKeys) {
      if (row[k] !== undefined && row[k] !== null) return row[k];
      const normalizedTarget = k.toLowerCase().replace(/[\s_\-]/g, '');
      const foundKey = rowKeys.find(
        (rk) => rk.toLowerCase().replace(/[\s_\-]/g, '') === normalizedTarget
      );
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        return row[foundKey];
      }
    }
    return '';
  }

  // Categories map
  const existingCats = db.prepare('SELECT id, name FROM categories').all();
  const catMap = {};
  existingCats.forEach((c) => {
    catMap[c.name.toLowerCase().trim()] = c.id;
  });

  // Determine current max AST-XXXX number for auto-generating missing IDs
  const lastRow = db.prepare(`SELECT id FROM assets WHERE id LIKE 'AST-%' ORDER BY rowid DESC LIMIT 1`).get();
  let nextNum = 1010;
  if (lastRow && lastRow.id) {
    const match = lastRow.id.match(/AST-(\d+)/);
    if (match) nextNum = Math.max(nextNum, parseInt(match[1], 10));
  }

  let importedCount = 0;
  let skippedCount = 0;

  const insertAsset = db.prepare(`
    INSERT OR REPLACE INTO assets (
      id, name, category_id, brand, model, serial_number, asset_tag, description,
      purchase_date, purchase_price, vendor, invoice_number, warranty_start_date, warranty_end_date,
      status, location, assigned_to, department, condition,
      processor, ram, storage, operating_system, mac_address, ip_address, imei, phone_number, windows_license_key,
      notes, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, datetime('now', 'localtime')
    )
  `);

  const insertAssignment = db.prepare(`
    INSERT INTO asset_assignments (asset_id, person_name, employee_id, department, assignment_date, notes)
    VALUES (?, ?, ?, ?, COALESCE(NULLIF(?, ''), date('now', 'localtime')), ?)
  `);

  rows.forEach((row) => {
    // Brand, Model, Category first for smart synthesis
    const brand = String(getVal(row, 'brand', ['Brand', 'Manufacturer', 'Make', 'Company', 'COMPANY'])).trim();
    const rawCategory = String(getVal(row, 'category', ['Category', 'Category Name', 'Type', 'Device Type', 'Asset Type'])).trim() || fallbackCategory;
    const model = String(getVal(row, 'model', ['Model', 'Model No', 'Model Number'])).trim();

    let id = String(getVal(row, 'id', ['Asset ID', 'AssetID', 'Tag ID', 'Tag No', 'Machine No', 'Asset Code'])).trim();
    if (!id) {
      // Check if there is a Sr No
      const sr = getVal(row, 'sr_no', ['Sr No.', 'Sr No', 'Serial No', 'Item No']);
      if (sr && typeof sr === 'number') {
        id = `AST-${sr + 1000}`;
      } else {
        nextNum++;
        id = `AST-${nextNum}`;
      }
    }

    // Name resolution with intelligent fallbacks
    let name = String(getVal(row, 'name', [
      'Asset Name', 'AssetName', 'Title', 'Device Name', 'Item Name', 'Item',
      'Equipment', 'Product', 'Description', 'COMPANY', 'Asset Type'
    ])).trim();

    if (!name || name === rawCategory) {
      if (brand && rawCategory && rawCategory !== fallbackCategory) {
        name = `${brand} ${rawCategory}`;
      } else if (rawCategory && rawCategory !== fallbackCategory) {
        name = rawCategory;
      } else if (brand) {
        name = `${brand} Asset`;
      } else if (model) {
        name = model;
      } else if (id) {
        name = `Asset ${id}`;
      } else {
        name = 'Hardware Asset';
      }
    }

    let catId = catMap[rawCategory.toLowerCase()];
    if (!catId) {
      const ins = db.prepare(`INSERT INTO categories (name, description, is_default) VALUES (?, '', 0)`).run(rawCategory);
      catId = ins.lastInsertRowid;
      catMap[rawCategory.toLowerCase()] = catId;
    }

    const serialNumber = String(getVal(row, 'serial_number', ['Serial Number', 'SerialNumber', 'Serial', 'SN', 'S/N', 'Service Tag', 'Machine S/N'])).trim();
    const assetTag = String(getVal(row, 'asset_tag', ['Asset Tag', 'AssetTag', 'Tag', 'Barcode', 'QR Code'])).trim();
    const description = String(getVal(row, 'description', ['Description', 'Desc', 'Details', 'Specification'])).trim();

    const purchaseDate = parseExcelDate(getVal(row, 'purchase_date', ['Purchase Date', 'PurchaseDate', 'Date', 'Purchased On', 'Invoice Date', 'Bill Date', 'Assigned Date']));
    const rawPrice = getVal(row, 'purchase_price', ['Purchase Price', 'PurchasePrice', 'Price', 'Cost', 'Amount', 'Value', 'Rate', 'Total Bill Amount']);
    const purchasePrice = Number(String(rawPrice).replace(/[^0-9.-]+/g, '')) || 0;

    const vendor = String(getVal(row, 'vendor', ['Vendor', 'Supplier', 'Seller', 'Shop', 'Dealer', 'Source'])).trim();
    const invoiceNumber = String(getVal(row, 'invoice_number', ['Invoice Number', 'InvoiceNumber', 'Invoice', 'Bill No', 'Bill Number'])).trim();
    const warrantyStartDate = parseExcelDate(getVal(row, 'warranty_start_date', ['Warranty Start Date', 'WarrantyStartDate', 'Warranty Start']));
    const warrantyEndDate = parseExcelDate(getVal(row, 'warranty_end_date', ['Warranty End Date', 'WarrantyEndDate', 'Warranty Expiry', 'Expiry Date', 'Warranty Till', 'Warranty Valid Till']));

    const status = String(getVal(row, 'status', ['Status', 'State', 'Current Status', 'Asset Status', 'Mobile Status', 'SIM Status'])).trim() || fallbackStatus;
    const location = String(getVal(row, 'location', ['Location', 'Place', 'Sitting Place', 'Desk', 'Room', 'Branch', 'Office'])).trim();
    const assignedTo = String(getVal(row, 'assigned_to', ['Assigned To', 'AssignedTo', 'Current Employee', 'Currently Assigned to', 'Custodian', 'User', 'Owner', 'Emp Name', 'Employee', 'Holder', 'Given To'])).trim();
    const employeeId = String(getVal(row, 'employee_id', ['Employee ID', 'Emp ID', 'Employee Code', 'Emp No'])).trim();
    const department = String(getVal(row, 'department', ['Department', 'Dept', 'Team', 'Cost Center'])).trim();
    const condition = String(getVal(row, 'condition', ['Condition', 'Physical Condition', 'Working Condition'])).trim() || 'Good';

    const processor = String(getVal(row, 'processor', ['Processor', 'CPU'])).trim();
    const ram = String(getVal(row, 'ram', ['RAM', 'Memory'])).trim();
    const storage = String(getVal(row, 'storage', ['Storage', 'Disk', 'SSD', 'HDD', 'Hard Drive'])).trim();
    const operatingSystem = String(getVal(row, 'operating_system', ['Operating System', 'OS', 'Windows'])).trim();
    const macAddress = String(getVal(row, 'mac_address', ['MAC Address', 'MAC', 'Ethernet MAC', 'WiFi MAC'])).trim();
    const ipAddress = String(getVal(row, 'ip_address', ['IP Address', 'IP', 'Local IP'])).trim();
    const imei = String(getVal(row, 'imei', ['IMEI', 'IMEI 1', 'IMEI Number', 'IEMI/SIM', 'IMEI NUMBER'])).trim();
    const phoneNumber = String(getVal(row, 'phone_number', ['Phone Number', 'Phone', 'Mobile No', 'SIM Number'])).trim();
    const windowsLicenseKey = String(getVal(row, 'windows_license_key', ['Windows License Key', 'License Key', 'Product Key', 'LicenseKey', 'Key'])).trim();

    // Extra fields into notes
    const extraNotes = [];
    const rawNotes = getVal(row, 'notes', ['Notes', 'Remarks', 'Comment', 'Extra', 'REMARKS (Sim Card)', 'Assigned By']);
    if (rawNotes) extraNotes.push(String(rawNotes).trim());
    const graphicsCard = getVal(row, 'graphics_card', ['Graphics Card', 'GPU']);
    if (graphicsCard) extraNotes.push(`GPU: ${graphicsCard}`);
    const charger = getVal(row, 'charger', ['CHARGER']);
    if (charger) extraNotes.push(`Charger: ${charger}`);
    const battery = getVal(row, 'battery', ['Battery']);
    if (battery) extraNotes.push(`Battery: ${battery}`);
    const finalNotes = extraNotes.join(' | ');

    insertAsset.run(
      id,
      name,
      catId,
      brand,
      model,
      serialNumber,
      assetTag,
      description,
      purchaseDate,
      purchasePrice,
      vendor,
      invoiceNumber,
      warrantyStartDate,
      warrantyEndDate,
      status,
      location,
      assignedTo,
      department,
      condition,
      processor,
      ram,
      storage,
      operatingSystem,
      macAddress,
      ipAddress,
      imei,
      phoneNumber,
      windowsLicenseKey,
      finalNotes
    );

    // If an assigned custodian is present, also record assignment
    if (assignedTo && assignedTo.toLowerCase() !== 'n/a' && assignedTo.toLowerCase() !== 'none') {
      insertAssignment.run(
        id,
        assignedTo,
        employeeId,
        department,
        purchaseDate || new Date().toISOString().split('T')[0],
        'Imported from Excel spreadsheet'
      );
    }

    importedCount++;
  });

  return { importedCount, skippedCount };
}

app.post('/api/backup/import', upload.single('import_file'), (req, res) => {
  try {
    const db = getDb();
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel or CSV file uploaded for import' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const targetSheet = req.body.sheet_name && workbook.Sheets[req.body.sheet_name]
      ? req.body.sheet_name
      : workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[targetSheet]);

    if (!rawRows || rawRows.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: `The sheet "${targetSheet}" contains no data rows.` });
    }

    let mapping = {};
    if (req.body.column_mapping) {
      try {
        mapping = typeof req.body.column_mapping === 'string'
          ? JSON.parse(req.body.column_mapping)
          : req.body.column_mapping;
      } catch (_) {}
    }
    const fallbackCategory = req.body.default_category || 'Other';
    const fallbackStatus = req.body.default_status || 'Available';

    const result = executeAssetImport(db, rawRows, mapping, fallbackCategory, fallbackStatus);

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      sheetUsed: targetSheet,
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
      message: `Successfully imported ${result.importedCount} assets from sheet "${targetSheet}" into your local database!`
    });
  } catch (err) {
    console.error('Import Error:', err);
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

// Direct import by local filepath on this machine
app.post('/api/backup/import-local-path', (req, res) => {
  try {
    const db = getDb();
    const { filePath, sheetName, column_mapping, default_category, default_status } = req.body;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: `File not found at: ${filePath}` });
    }

    const workbook = xlsx.readFile(filePath);
    const targetSheet = sheetName && workbook.Sheets[sheetName] ? sheetName : workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[targetSheet]);

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ error: `Sheet "${targetSheet}" contains no data rows.` });
    }

    let mapping = column_mapping || {};
    const result = executeAssetImport(db, rawRows, mapping, default_category || 'Other', default_status || 'Available');

    res.json({
      success: true,
      sheetUsed: targetSheet,
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
      message: `Successfully imported ${result.importedCount} assets from "${targetSheet}" into your local database!`
    });
  } catch (err) {
    console.error('Local File Import Error:', err);
    res.status(500).json({ error: `Local file import failed: ${err.message}` });
  }
});

// -------------------------------------------------------------
// SETTINGS & LOCAL PIN LOCK
// -------------------------------------------------------------
app.get('/api/settings', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach((r) => {
      // Do not leak pin hash
      if (r.key === 'pin_hash') {
        settings.has_pin_configured = Boolean(r.value && r.value.length > 0);
      } else {
        settings[r.key] = r.value;
      }
    });

    settings.storageInfo = {
      databasePath: DB_PATH,
      uploadsPath: UPLOADS_DIR,
      backupsPath: BACKUPS_DIR
    };

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const db = getDb();
    const updatableKeys = [
      'owner_name',
      'company_name',
      'default_currency',
      'date_format',
      'theme',
      'pin_lock_enabled',
      'show_price',
      'show_warranty'
    ];

    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    Object.entries(req.body).forEach(([k, v]) => {
      if (updatableKeys.includes(k)) {
        stmt.run(k, String(v));
      }
    });

    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set or update local PIN
app.post('/api/settings/pin', (req, res) => {
  try {
    const db = getDb();
    const { current_pin, new_pin, disable } = req.body;

    const row = db.prepare(`SELECT value FROM settings WHERE key = 'pin_hash'`).get();
    const currentHash = row ? row.value : '';

    if (currentHash) {
      const hashedCurrent = crypto.createHash('sha256').update(String(current_pin || '')).digest('hex');
      if (hashedCurrent !== currentHash) {
        return res.status(403).json({ error: 'Incorrect current PIN' });
      }
    }

    if (disable) {
      db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('pin_hash', '')`).run();
      db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('pin_lock_enabled', 'false')`).run();
      return res.json({ success: true, message: 'PIN lock disabled' });
    }

    if (!new_pin || String(new_pin).length < 4) {
      return res.status(400).json({ error: 'New PIN must be at least 4 digits' });
    }

    const newHash = crypto.createHash('sha256').update(String(new_pin)).digest('hex');
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('pin_hash', ?)`).run(newHash);
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('pin_lock_enabled', 'true')`).run();

    res.json({ success: true, message: 'PIN lock enabled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify local PIN on frontend unlock
app.post('/api/settings/verify-pin', (req, res) => {
  try {
    const db = getDb();
    const { pin } = req.body;
    const row = db.prepare(`SELECT value FROM settings WHERE key = 'pin_hash'`).get();
    const currentHash = row ? row.value : '';

    if (!currentHash) {
      return res.json({ valid: true });
    }

    const hashed = crypto.createHash('sha256').update(String(pin || '')).digest('hex');
    if (hashed === currentHash) {
      return res.json({ valid: true });
    } else {
      return res.status(401).json({ valid: false, error: 'Incorrect PIN' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve compiled frontend in production or hosted mode
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`Personal Asset Manager Backend`);
  console.log(`Status:  ONLINE (Local only, offline-ready)`);
  console.log(`URL:     http://localhost:${PORT}`);
  console.log(`DB File: ${DB_PATH}`);
  console.log(`Uploads: ${UPLOADS_DIR}`);
  console.log(`Backups: ${BACKUPS_DIR}`);
  console.log(`====================================================`);
});
