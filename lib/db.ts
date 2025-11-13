import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'insurance.db'));

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'underwriter', 'adjuster', 'analyst', 'manager', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('issuance', 'renewal', 'endorsement', 'claim')),
      steps TEXT NOT NULL,
      sla_hours INTEGER NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      coverage_amount REAL NOT NULL,
      premium REAL NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'active', 'expired', 'cancelled')),
      assigned_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_number TEXT UNIQUE NOT NULL,
      policy_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      documents TEXT,
      status TEXT NOT NULL CHECK(status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid')),
      fraud_score REAL DEFAULT 0,
      is_flagged BOOLEAN DEFAULT 0,
      assigned_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (policy_id) REFERENCES policies(id),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sla_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('policy', 'claim')),
      entity_id INTEGER NOT NULL,
      sla_hours INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      is_breached BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed initial data
  const hashedPassword = bcrypt.hashSync('password123', 10);
  
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (existingUsers.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
    
    insertUser.run('admin@insurance.com', hashedPassword, 'Admin User', 'admin');
    insertUser.run('customer@test.com', hashedPassword, 'John Customer', 'customer');
    insertUser.run('underwriter@insurance.com', hashedPassword, 'Sarah Underwriter', 'underwriter');
    insertUser.run('adjuster@insurance.com', hashedPassword, 'Mike Adjuster', 'adjuster');
    insertUser.run('analyst@insurance.com', hashedPassword, 'Emily Analyst', 'analyst');
    insertUser.run('manager@insurance.com', hashedPassword, 'David Manager', 'manager');

    // Seed default workflows
    const insertWorkflow = db.prepare('INSERT INTO workflows (name, type, steps, sla_hours, created_by) VALUES (?, ?, ?, ?, ?)');
    insertWorkflow.run('Standard Policy Issuance', 'issuance', JSON.stringify(['Application', 'Underwriting', 'Approval', 'Activation']), 48, 1);
    insertWorkflow.run('Policy Renewal', 'renewal', JSON.stringify(['Renewal Notice', 'Payment', 'Activation']), 24, 1);
    insertWorkflow.run('Claim Processing', 'claim', JSON.stringify(['Submission', 'Validation', 'Review', 'Settlement']), 72, 1);
  }
}

export default db;
