const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Ensure required local directories exist
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const BACKUPS_DIR = path.join(__dirname, 'backups');

[DATA_DIR, UPLOADS_DIR, BACKUPS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const DB_PATH = path.join(DATA_DIR, 'assets.db');
let db = new DatabaseSync(DB_PATH);

// Configure WAL mode for performance & concurrency
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  console.warn('SQLite PRAGMA setup warning:', e.message);
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT 'Box',
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      asset_tag TEXT,
      description TEXT,
      purchase_date TEXT,
      purchase_price REAL DEFAULT 0,
      vendor TEXT,
      invoice_number TEXT,
      warranty_start_date TEXT,
      warranty_end_date TEXT,
      status TEXT DEFAULT 'Available',
      location TEXT,
      assigned_to TEXT,
      department TEXT,
      condition TEXT DEFAULT 'Good',
      processor TEXT,
      ram TEXT,
      storage TEXT,
      operating_system TEXT,
      mac_address TEXT,
      ip_address TEXT,
      imei TEXT,
      phone_number TEXT,
      windows_license_key TEXT,
      notes TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS asset_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      person_name TEXT NOT NULL,
      employee_id TEXT,
      department TEXT,
      assignment_date TEXT NOT NULL,
      expected_return_date TEXT,
      return_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      issue TEXT NOT NULL,
      reported_date TEXT NOT NULL,
      repair_vendor TEXT,
      repair_cost REAL DEFAULT 0,
      repair_status TEXT DEFAULT 'Reported',
      sent_date TEXT,
      received_date TEXT,
      warranty_claim INTEGER DEFAULT 0,
      resolution TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
      maintenance_id INTEGER REFERENCES maintenance_records(id) ON DELETE CASCADE,
      document_type TEXT DEFAULT 'Other',
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      mime_type TEXT,
      upload_date TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS asset_handovers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handover_id TEXT UNIQUE NOT NULL,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      from_employee_name TEXT NOT NULL,
      from_employee_id TEXT,
      from_department TEXT,
      to_employee_name TEXT,
      to_employee_id TEXT,
      to_department TEXT,
      return_date TEXT,
      handover_date TEXT,
      reason TEXT NOT NULL,
      condition_before TEXT,
      condition_after TEXT,
      accessories_returned TEXT,
      accessories_given TEXT,
      missing_accessories TEXT,
      damage_details TEXT,
      handed_over_by TEXT,
      received_by TEXT,
      remarks TEXT,
      status TEXT DEFAULT 'Handed Over',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE,
      name TEXT NOT NULL,
      department TEXT,
      designation TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'Active',
      resignation_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Initial sync of distinct employees from existing assignments and assets
  try {
    // Clean up duplicate employee rows by name (keeping the row with employee_id if present)
    const allEmps = db.prepare('SELECT id, name, employee_id, department FROM employees ORDER BY id ASC').all();
    const seenNames = new Map();
    const toDeleteIds = [];

    allEmps.forEach((emp) => {
      const lower = emp.name.toLowerCase().trim();
      if (!seenNames.has(lower)) {
        seenNames.set(lower, emp);
      } else {
        const prev = seenNames.get(lower);
        if (!prev.employee_id && emp.employee_id) {
          toDeleteIds.push(prev.id);
          seenNames.set(lower, emp);
        } else {
          toDeleteIds.push(emp.id);
        }
      }
    });

    if (toDeleteIds.length > 0) {
      const delStmt = db.prepare('DELETE FROM employees WHERE id = ?');
      toDeleteIds.forEach((id) => delStmt.run(id));
    }

    const existingEmployees = db.prepare(`
      SELECT DISTINCT person_name, employee_id, department
      FROM asset_assignments
      WHERE person_name IS NOT NULL AND TRIM(person_name) != '' AND TRIM(person_name) != 'Need to check'
      UNION
      SELECT DISTINCT assigned_to as person_name, '' as employee_id, department
      FROM assets
      WHERE assigned_to IS NOT NULL AND TRIM(assigned_to) != '' AND TRIM(assigned_to) != 'Need to check'
    `).all();

    const insertEmployee = db.prepare(`
      INSERT INTO employees (name, employee_id, department, status)
      VALUES (?, ?, ?, 'Active')
    `);

    existingEmployees.forEach((emp) => {
      const cleanName = (emp.person_name || '').trim();
      if (cleanName) {
        const found = db.prepare('SELECT id, employee_id FROM employees WHERE LOWER(name) = LOWER(?)').get(cleanName);
        const empId = emp.employee_id && emp.employee_id.trim() ? emp.employee_id.trim() : null;
        if (!found) {
          let targetId = empId;
          if (targetId) {
            const conflict = db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(targetId);
            if (conflict) targetId = null;
          }
          insertEmployee.run(cleanName, targetId, emp.department?.trim() || '');
        } else if (empId && !found.employee_id) {
          const conflict = db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(empId);
          if (!conflict) {
            db.prepare('UPDATE employees SET employee_id = ? WHERE id = ?').run(empId, found.id);
          }
        }
      }
    });
  } catch (err) {
    console.warn('Employee initial sync note:', err.message);
  }

  // Ensure unused empty categories are removed so only imported/used categories remain
  try {
    db.prepare(`
      DELETE FROM categories 
      WHERE id NOT IN (SELECT DISTINCT category_id FROM assets WHERE category_id IS NOT NULL)
    `).run();
  } catch (_) {}

  // Default Settings
  const defaultSettings = {
    owner_name: 'IT Support',
    company_name: 'Global Manikchand',
    default_currency: '₹',
    date_format: 'DD/MM/YYYY',
    theme: 'light',
    pin_lock_enabled: 'false',
    pin_hash: '',
    show_price: 'false',
    show_warranty: 'false',
    resignation_asset_handling: 'Pending Return'
  };

  const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
  Object.entries(defaultSettings).forEach(([k, v]) => {
    insertSetting.run(k, v);
  });

  // Permanently purge any demo / fake assets entered by system (AST-10XX) and clean orphaned records
  try {
    db.exec(`
      DELETE FROM asset_assignments WHERE asset_id LIKE 'AST-%';
      DELETE FROM maintenance_records WHERE asset_id LIKE 'AST-%';
      DELETE FROM documents WHERE asset_id LIKE 'AST-%';
      DELETE FROM assets WHERE id LIKE 'AST-%';
      DELETE FROM asset_assignments WHERE asset_id NOT IN (SELECT id FROM assets);
      DELETE FROM maintenance_records WHERE asset_id NOT IN (SELECT id FROM assets);
      DELETE FROM documents WHERE asset_id NOT IN (SELECT id FROM assets);
    `);
    console.log('Successfully purged all fake/demo data from database.');
  } catch (err) {
    console.warn('Cleanup notice:', err.message);
  }
}

function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `assets_backup_${timestamp}.db`;
  const backupPath = path.join(BACKUPS_DIR, backupFileName);
  
  // Create an atomic backup copy
  fs.copyFileSync(DB_PATH, backupPath);
  return { fileName: backupFileName, filePath: backupPath };
}

function restoreDatabase(sourceFilePath) {
  if (!fs.existsSync(sourceFilePath)) {
    throw new Error('Backup file does not exist');
  }

  // First create a safety backup before overwriting
  backupDatabase();

  // Close existing db connection
  try {
    db.close();
  } catch (e) {
    console.warn('Error closing db before restore:', e.message);
  }

  // Copy restored file to DB_PATH
  fs.copyFileSync(sourceFilePath, DB_PATH);

  // Re-open db connection
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  return true;
}

// Initialize on module load
initSchema();

module.exports = {
  getDb: () => db,
  DATA_DIR,
  UPLOADS_DIR,
  BACKUPS_DIR,
  DB_PATH,
  backupDatabase,
  restoreDatabase
};
