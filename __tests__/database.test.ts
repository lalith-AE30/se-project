import { describe, it, expect, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { authenticate, getUser, getAllUsers, getUsersByRole } from '../lib/auth';

// Mock the db module to use test database
const testDbPath = path.join(process.cwd(), 'insurance.test.db');

describe('Database Initialization', () => {
  let db: Database.Database;

  beforeEach(() => {
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    db = new Database(testDbPath);
    
    // Initialize schema
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
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should create all required tables', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map((t: any) => t.name);
    
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('workflows');
    expect(tableNames).toContain('policies');
    expect(tableNames).toContain('claims');
    expect(tableNames).toContain('notifications');
    expect(tableNames).toContain('sla_tracking');
    expect(tableNames).toContain('audit_log');
  });

  it('should enforce role constraints on users table', () => {
    const hashedPassword = bcrypt.hashSync('test123', 10);
    
    // Valid roles should work
    const validRoles = ['customer', 'underwriter', 'adjuster', 'analyst', 'manager', 'admin'];
    validRoles.forEach((role, index) => {
      const result = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
        `test${index}@test.com`, hashedPassword, `Test ${role}`, role
      );
      expect(result.changes).toBe(1);
    });
    
    // Invalid role should fail
    expect(() => {
      db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
        'invalid@test.com', hashedPassword, 'Invalid Role', 'invalidrole'
      );
    }).toThrow();
  });

  it('should enforce unique email constraint', () => {
    const hashedPassword = bcrypt.hashSync('test123', 10);
    
    db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'test@test.com', hashedPassword, 'Test User', 'customer'
    );
    
    expect(() => {
      db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
        'test@test.com', hashedPassword, 'Duplicate User', 'customer'
      );
    }).toThrow();
  });

  it('should enforce policy status constraints', () => {
    const hashedPassword = bcrypt.hashSync('test123', 10);
    const userResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'customer@test.com', hashedPassword, 'Test Customer', 'customer'
    );
    
    // Valid status
    const result = db.prepare(
      'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('POL-001', userResult.lastInsertRowid, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
    
    expect(result.changes).toBe(1);
    
    // Invalid status should fail
    expect(() => {
      db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('POL-002', userResult.lastInsertRowid, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'invalidstatus');
    }).toThrow();
  });

  it('should enforce claim status constraints', () => {
    const hashedPassword = bcrypt.hashSync('test123', 10);
    const userResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'customer@test.com', hashedPassword, 'Test Customer', 'customer'
    );
    
    const policyResult = db.prepare(
      'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('POL-001', userResult.lastInsertRowid, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'active');
    
    // Valid status
    const result = db.prepare(
      'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('CLM-001', policyResult.lastInsertRowid, userResult.lastInsertRowid, 'accident', 5000, 'Test claim', 'submitted');
    
    expect(result.changes).toBe(1);
    
    // Invalid status should fail
    expect(() => {
      db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run('CLM-002', policyResult.lastInsertRowid, userResult.lastInsertRowid, 'accident', 5000, 'Test claim', 'invalidstatus');
    }).toThrow();
  });
});

describe('User Authentication', () => {
  let db: Database.Database;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    db = new Database(testDbPath);
    
    // Initialize schema
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should hash passwords correctly', () => {
    const password = 'testPassword123';
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    expect(hashedPassword).not.toBe(password);
    expect(bcrypt.compareSync(password, hashedPassword)).toBe(true);
    expect(bcrypt.compareSync('wrongPassword', hashedPassword)).toBe(false);
  });

  it('should create users with different roles', () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    const roles = ['customer', 'underwriter', 'adjuster', 'analyst', 'manager', 'admin'];
    
    roles.forEach((role, index) => {
      const result = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
        `${role}@test.com`, hashedPassword, `Test ${role}`, role
      );
      expect(result.changes).toBe(1);
    });
    
    const users = db.prepare('SELECT * FROM users').all();
    expect(users).toHaveLength(6);
  });

  it('should retrieve user by id', () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const result = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'test@test.com', hashedPassword, 'Test User', 'customer'
    );
    
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    expect(user).toBeDefined();
    expect((user as any).email).toBe('test@test.com');
    expect((user as any).name).toBe('Test User');
    expect((user as any).role).toBe('customer');
  });

  it('should filter users by role', () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'customer1@test.com', hashedPassword, 'Customer 1', 'customer'
    );
    db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'customer2@test.com', hashedPassword, 'Customer 2', 'customer'
    );
    db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'underwriter1@test.com', hashedPassword, 'Underwriter 1', 'underwriter'
    );
    
    const customers = db.prepare('SELECT * FROM users WHERE role = ?').all('customer');
    const underwriters = db.prepare('SELECT * FROM users WHERE role = ?').all('underwriter');
    
    expect(customers).toHaveLength(2);
    expect(underwriters).toHaveLength(1);
  });
});
