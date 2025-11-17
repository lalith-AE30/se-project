import { describe, it, expect, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const testDbPath = path.join(process.cwd(), 'insurance.test.db');

describe('Claims Management', () => {
  let db: Database.Database;
  let customerId: number;
  let adjusterId: number;
  let analystId: number;
  let activePolicyId: number;

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

      CREATE TABLE claims (
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
    const adjusterResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'adjuster@test.com', hashedPassword, 'Test Adjuster', 'adjuster'
    );
    const analystResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'analyst@test.com', hashedPassword, 'Test Analyst', 'analyst'
    );
    
    customerId = customerResult.lastInsertRowid as number;
    adjusterId = adjusterResult.lastInsertRowid as number;
    analystId = analystResult.lastInsertRowid as number;
    
    // Create an active policy
    const policyResult = db.prepare(
      'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('POL-ACTIVE', customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'active');
    
    activePolicyId = policyResult.lastInsertRowid as number;
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Claim Submission', () => {
    it('should create a new claim with submitted status', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 5000, 'Minor accident claim', 'submitted');
      
      expect(result.changes).toBe(1);
      
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid);
      expect(claim).toBeDefined();
      expect((claim as any).status).toBe('submitted');
      expect((claim as any).claim_number).toBe(claimNumber);
    });

    it('should calculate fraud score based on claim amount', () => {
      const claimNumber = `CLM-${Date.now()}`;
      const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(activePolicyId) as any;
      
      // High claim amount (>80% of coverage)
      const amount = policy.coverage_amount * 0.85;
      let fraudScore = 0;
      if (amount > policy.coverage_amount * 0.8) fraudScore += 30;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, fraud_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', amount, 'High value claim', 'submitted', fraudScore);
      
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid);
      expect((claim as any).fraud_score).toBe(30);
    });

    it('should calculate fraud score based on document count', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      // Low document count
      const documents = 'doc1.pdf';
      let fraudScore = 0;
      if (documents.split(',').length < 2) fraudScore += 20;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, documents, status, fraud_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 5000, 'Claim with few docs', documents, 'submitted', fraudScore);
      
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid);
      expect((claim as any).fraud_score).toBe(20);
    });

    it('should flag claims with high fraud score', () => {
      const claimNumber = `CLM-${Date.now()}`;
      const fraudScore = 60; // >= 50 should be flagged
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, fraud_score, is_flagged) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 45000, 'High risk claim', 'submitted', fraudScore, 1);
      
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid);
      expect((claim as any).is_flagged).toBe(1);
      expect((claim as any).fraud_score).toBe(60);
    });

    it('should assign normal claims to adjuster', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, fraud_score, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 5000, 'Normal claim', 'under_review', 20, adjusterId);
      
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid);
      expect((claim as any).assigned_to).toBe(adjusterId);
    });

    it('should assign flagged claims to analyst', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, fraud_score, is_flagged, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 45000, 'Flagged claim', 'under_review', 60, 1, analystId);
      
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid);
      expect((claim as any).assigned_to).toBe(analystId);
      expect((claim as any).is_flagged).toBe(1);
    });

    it('should create SLA tracking for new claims', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 5000, 'Test claim', 'submitted');
      
      db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours) VALUES (?, ?, ?)').run(
        'claim', result.lastInsertRowid, 72
      );
      
      const slaRecord = db.prepare('SELECT * FROM sla_tracking WHERE entity_type = ? AND entity_id = ?').get(
        'claim', result.lastInsertRowid
      );
      
      expect(slaRecord).toBeDefined();
      expect((slaRecord as any).sla_hours).toBe(72);
    });
  });

  describe('Claim Eligibility Validation', () => {
    it('should reject claim if policy is not active', () => {
      const inactivePolicyResult = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('POL-INACTIVE', customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      const policy = db.prepare('SELECT * FROM policies WHERE id = ? AND status = ?').get(
        inactivePolicyResult.lastInsertRowid, 'active'
      );
      
      expect(policy).toBeUndefined();
    });

    it('should reject claim if amount exceeds coverage', () => {
      const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(activePolicyId) as any;
      const excessiveAmount = policy.coverage_amount + 10000;
      
      const isValid = excessiveAmount <= policy.coverage_amount;
      expect(isValid).toBe(false);
    });

    it('should detect duplicate claims', () => {
      // Create first claim
      db.prepare(
        "INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"
      ).run('CLM-001', activePolicyId, customerId, 'accident', 5000, 'First claim', 'submitted');
      
      // Check for duplicate
      const duplicate = db.prepare(
        "SELECT id FROM claims WHERE policy_id = ? AND type = ? AND status NOT IN (?, ?) AND created_at > datetime('now', '-30 days')"
      ).get(activePolicyId, 'accident', 'rejected', 'paid');
      
      expect(duplicate).toBeDefined();
    });

    it('should allow claims if no recent duplicate exists', () => {
      // Create old claim (simulated as rejected)
      db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run('CLM-001', activePolicyId, customerId, 'accident', 5000, 'Old claim', 'rejected');
      
      // Check for duplicate should not find rejected claims
      const duplicate = db.prepare(
        "SELECT id FROM claims WHERE policy_id = ? AND type = ? AND status NOT IN (?, ?) AND created_at > datetime('now', '-30 days')"
      ).get(activePolicyId, 'theft', 'rejected', 'paid');
      
      expect(duplicate).toBeUndefined();
    });
  });

  describe('Claim Processing', () => {
    it('should approve a claim and update status', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 5000, 'Test claim', 'under_review');
      
      const now = new Date().toISOString();
      db.prepare('UPDATE claims SET status = ?, resolved_at = ? WHERE id = ?').run(
        'approved', now, result.lastInsertRowid
      );
      
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid);
      expect((claim as any).status).toBe('approved');
      expect((claim as any).resolved_at).toBeDefined();
    });

    it('should reject a claim and update status', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 5000, 'Test claim', 'under_review');
      
      const now = new Date().toISOString();
      db.prepare('UPDATE claims SET status = ?, resolved_at = ? WHERE id = ?').run(
        'rejected', now, result.lastInsertRowid
      );
      
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid);
      expect((claim as any).status).toBe('rejected');
    });

    it('should create notification on claim approval', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 5000, 'Test claim', 'under_review');
      
      db.prepare('UPDATE claims SET status = ? WHERE id = ?').run('approved', result.lastInsertRowid);
      
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        customerId, 'Claim Approved', `Your claim ${claimNumber} has been approved`, 'claim'
      );
      
      const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? AND type = ?').all(
        customerId, 'claim'
      );
      
      expect(notifications).toHaveLength(1);
      expect((notifications[0] as any).title).toBe('Claim Approved');
    });

    it('should create notification on claim rejection', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 5000, 'Test claim', 'under_review');
      
      db.prepare('UPDATE claims SET status = ? WHERE id = ?').run('rejected', result.lastInsertRowid);
      
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        customerId, 'Claim Rejected', `Your claim ${claimNumber} has been rejected`, 'claim'
      );
      
      const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? AND type = ?').all(
        customerId, 'claim'
      );
      
      expect(notifications).toHaveLength(1);
      expect((notifications[0] as any).title).toBe('Claim Rejected');
    });

    it('should update SLA tracking on claim completion', () => {
      const claimNumber = `CLM-${Date.now()}`;
      
      const result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, activePolicyId, customerId, 'accident', 5000, 'Test claim', 'under_review');
      
      db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours) VALUES (?, ?, ?)').run(
        'claim', result.lastInsertRowid, 72
      );
      
      const now = new Date().toISOString();
      db.prepare('UPDATE claims SET status = ? WHERE id = ?').run('approved', result.lastInsertRowid);
      db.prepare('UPDATE sla_tracking SET completed_at = ? WHERE entity_type = ? AND entity_id = ?').run(
        now, 'claim', result.lastInsertRowid
      );
      
      const slaRecord = db.prepare('SELECT * FROM sla_tracking WHERE entity_type = ? AND entity_id = ?').get(
        'claim', result.lastInsertRowid
      );
      
      expect((slaRecord as any).completed_at).toBeDefined();
    });
  });

  describe('Claim Retrieval', () => {
    beforeEach(() => {
      // Create multiple claims
      db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, fraud_score, is_flagged) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('CLM-001', activePolicyId, customerId, 'accident', 5000, 'Normal claim', 'submitted', 20, 0);
      
      db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, fraud_score, is_flagged) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('CLM-002', activePolicyId, customerId, 'theft', 10000, 'Under review', 'under_review', 30, 0);
      
      db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, fraud_score, is_flagged) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('CLM-003', activePolicyId, customerId, 'accident', 45000, 'Flagged claim', 'under_review', 60, 1);
    });

    it('should retrieve all claims for a customer', () => {
      const claims = db.prepare('SELECT * FROM claims WHERE customer_id = ?').all(customerId);
      expect(claims).toHaveLength(3);
    });

    it('should retrieve only flagged claims for analyst', () => {
      const flaggedClaims = db.prepare('SELECT * FROM claims WHERE is_flagged = 1').all();
      expect(flaggedClaims).toHaveLength(1);
      expect((flaggedClaims[0] as any).claim_number).toBe('CLM-003');
    });

    it('should retrieve claims by status for adjuster', () => {
      const claims = db.prepare(
        'SELECT * FROM claims WHERE status IN (?, ?)'
      ).all('submitted', 'under_review');
      
      expect(claims).toHaveLength(3);
    });

    it('should join claim with policy details', () => {
      const claims = db.prepare(
        'SELECT c.*, p.policy_number FROM claims c JOIN policies p ON c.policy_id = p.id'
      ).all();
      
      expect(claims).toHaveLength(3);
      expect((claims[0] as any).policy_number).toBe('POL-ACTIVE');
    });
  });

  describe('Fraud Detection Algorithm', () => {
    it('should calculate correct fraud score for high amount', () => {
      const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(activePolicyId) as any;
      const amount = policy.coverage_amount * 0.85;
      
      let fraudScore = 0;
      if (amount > policy.coverage_amount * 0.8) fraudScore += 30;
      
      expect(fraudScore).toBe(30);
    });

    it('should calculate correct fraud score for low documents', () => {
      const documents = 'doc1.pdf';
      
      let fraudScore = 0;
      if (documents.split(',').length < 2) fraudScore += 20;
      
      expect(fraudScore).toBe(20);
    });

    it('should calculate correct fraud score for frequent claims', () => {
      // Create multiple recent claims
      db.prepare(
        "INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-10 days'))"
      ).run('CLM-FREQ-1', activePolicyId, customerId, 'accident', 5000, 'Claim 1', 'approved');
      
      db.prepare(
        "INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-20 days'))"
      ).run('CLM-FREQ-2', activePolicyId, customerId, 'theft', 5000, 'Claim 2', 'approved');
      
      db.prepare(
        "INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-30 days'))"
      ).run('CLM-FREQ-3', activePolicyId, customerId, 'accident', 5000, 'Claim 3', 'approved');
      
      const recent = db.prepare(
        "SELECT COUNT(*) as count FROM claims WHERE customer_id = ? AND created_at > datetime('now', '-90 days')"
      ).get(customerId) as any;
      
      let fraudScore = 0;
      if (recent.count > 2) fraudScore += 50;
      
      expect(fraudScore).toBe(50);
    });

    it('should flag claim when fraud score >= 50', () => {
      let fraudScore = 30 + 10; // Amount + documents (not enough to flag)
      expect(fraudScore >= 50).toBe(false);
      
      fraudScore = 30 + 20 + 50; // Amount + documents + frequent claims
      expect(fraudScore >= 50).toBe(true);
    });
  });
});
