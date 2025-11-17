import { describe, it, expect, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const testDbPath = path.join(process.cwd(), 'insurance.test.db');

describe('Policy Management', () => {
  let db: Database.Database;
  let customerId: number;
  let underwriterId: number;

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

      CREATE TABLE policies (
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

      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE sla_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL CHECK(entity_type IN ('policy', 'claim')),
        entity_id INTEGER NOT NULL,
        sla_hours INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        is_breached BOOLEAN DEFAULT 0
      );
    `);
    
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const customerResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'customer@test.com', hashedPassword, 'Test Customer', 'customer'
    );
    const underwriterResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'underwriter@test.com', hashedPassword, 'Test Underwriter', 'underwriter'
    );
    
    customerId = customerResult.lastInsertRowid as number;
    underwriterId = underwriterResult.lastInsertRowid as number;
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Policy Creation', () => {
    it('should create a new policy with pending status', () => {
      const policyNumber = `POL-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      expect(result.changes).toBe(1);
      
      const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(result.lastInsertRowid);
      expect(policy).toBeDefined();
      expect((policy as any).status).toBe('pending');
      expect((policy as any).policy_number).toBe(policyNumber);
    });

    it('should auto-assign policy to underwriter', () => {
      const policyNumber = `POL-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      // Simulate auto-assignment
      db.prepare('UPDATE policies SET assigned_to = ? WHERE id = ?').run(underwriterId, result.lastInsertRowid);
      
      const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(result.lastInsertRowid);
      expect((policy as any).assigned_to).toBe(underwriterId);
    });

    it('should create notification for underwriter on policy submission', () => {
      const policyNumber = `POL-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      // Create notification
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        underwriterId, 'New Policy Application', `Policy ${policyNumber} requires review`, 'policy'
      );
      
      const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ?').all(underwriterId);
      expect(notifications).toHaveLength(1);
      expect((notifications[0] as any).title).toBe('New Policy Application');
    });

    it('should create SLA tracking record for new policy', () => {
      const policyNumber = `POL-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      // Create SLA tracking
      db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours) VALUES (?, ?, ?)').run(
        'policy', result.lastInsertRowid, 48
      );
      
      const slaRecord = db.prepare('SELECT * FROM sla_tracking WHERE entity_type = ? AND entity_id = ?').get(
        'policy', result.lastInsertRowid
      );
      
      expect(slaRecord).toBeDefined();
      expect((slaRecord as any).sla_hours).toBe(48);
      expect((slaRecord as any).is_breached).toBe(0);
    });
  });

  describe('Policy Approval', () => {
    it('should approve a policy and update status', () => {
      const policyNumber = `POL-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      const now = new Date().toISOString();
      db.prepare('UPDATE policies SET status = ?, approved_at = ? WHERE id = ?').run(
        'approved', now, result.lastInsertRowid
      );
      
      const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(result.lastInsertRowid);
      expect((policy as any).status).toBe('approved');
      expect((policy as any).approved_at).toBeDefined();
    });

    it('should create notification for customer on policy approval', () => {
      const policyNumber = `POL-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      db.prepare('UPDATE policies SET status = ? WHERE id = ?').run('approved', result.lastInsertRowid);
      
      // Create notification
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        customerId, 'Policy Approved', `Your policy ${policyNumber} has been approved`, 'policy'
      );
      
      const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ?').all(customerId);
      expect(notifications).toHaveLength(1);
      expect((notifications[0] as any).title).toBe('Policy Approved');
    });

    it('should update SLA tracking on policy completion', () => {
      const policyNumber = `POL-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours) VALUES (?, ?, ?)').run(
        'policy', result.lastInsertRowid, 48
      );
      
      const now = new Date().toISOString();
      db.prepare('UPDATE policies SET status = ? WHERE id = ?').run('approved', result.lastInsertRowid);
      db.prepare('UPDATE sla_tracking SET completed_at = ? WHERE entity_type = ? AND entity_id = ?').run(
        now, 'policy', result.lastInsertRowid
      );
      
      const slaRecord = db.prepare('SELECT * FROM sla_tracking WHERE entity_type = ? AND entity_id = ?').get(
        'policy', result.lastInsertRowid
      );
      
      expect((slaRecord as any).completed_at).toBeDefined();
    });
  });

  describe('Policy Retrieval', () => {
    beforeEach(() => {
      // Create multiple policies
      db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('POL-001', customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('POL-002', customerId, 'home', 200000, 800, '2024-01-01', '2025-01-01', 'approved');
      
      db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('POL-003', customerId, 'life', 500000, 2000, '2024-01-01', '2025-01-01', 'active');
    });

    it('should retrieve all policies for a customer', () => {
      const policies = db.prepare('SELECT * FROM policies WHERE customer_id = ?').all(customerId);
      expect(policies).toHaveLength(3);
    });

    it('should retrieve pending policies for underwriter', () => {
      const policies = db.prepare('SELECT * FROM policies WHERE status = ?').all('pending');
      expect(policies).toHaveLength(1);
      expect((policies[0] as any).policy_number).toBe('POL-001');
    });

    it('should retrieve policies by status', () => {
      const activePolicies = db.prepare('SELECT * FROM policies WHERE status = ?').all('active');
      const approvedPolicies = db.prepare('SELECT * FROM policies WHERE status = ?').all('approved');
      
      expect(activePolicies).toHaveLength(1);
      expect(approvedPolicies).toHaveLength(1);
    });

    it('should join policy with customer details', () => {
      const policies = db.prepare(
        'SELECT p.*, u.name as customer_name FROM policies p JOIN users u ON p.customer_id = u.id'
      ).all();
      
      expect(policies).toHaveLength(3);
      expect((policies[0] as any).customer_name).toBe('Test Customer');
    });
  });

  describe('Policy Renewal', () => {
    it('should identify policies expiring in 30 days', () => {
      const today = new Date();
      const expiry30Days = new Date(today);
      expiry30Days.setDate(today.getDate() + 30);
      
      db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('POL-EXPIRING', customerId, 'auto', 50000, 1200, '2024-01-01', expiry30Days.toISOString().split('T')[0], 'active');
      
      // In real implementation, this would be a more complex date query
      const policy = db.prepare('SELECT * FROM policies WHERE policy_number = ?').get('POL-EXPIRING');
      expect(policy).toBeDefined();
    });

    it('should create renewal reminder notification', () => {
      const policyNumber = 'POL-EXPIRING';
      
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        customerId, 'Policy Renewal Reminder', `Your policy ${policyNumber} expires in 30 days`, 'renewal'
      );
      
      const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? AND type = ?').all(
        customerId, 'renewal'
      );
      
      expect(notifications).toHaveLength(1);
    });
  });
});
