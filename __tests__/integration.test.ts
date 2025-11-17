import { describe, it, expect, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const testDbPath = path.join(process.cwd(), 'insurance.test.db');

describe('Integration Tests - Complete Workflows', () => {
  let db: Database.Database;
  let customerId: number;
  let underwriterId: number;
  let adjusterId: number;
  let analystId: number;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    db = new Database(testDbPath);
    
    // Initialize complete schema
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE workflows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('issuance', 'renewal', 'endorsement', 'claim')),
        steps TEXT NOT NULL,
        sla_hours INTEGER NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
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

      CREATE TABLE audit_log (
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
    
    // Create test users
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const customerResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'customer@test.com', hashedPassword, 'Test Customer', 'customer'
    );
    const underwriterResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'underwriter@test.com', hashedPassword, 'Test Underwriter', 'underwriter'
    );
    const adjusterResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'adjuster@test.com', hashedPassword, 'Test Adjuster', 'adjuster'
    );
    const analystResult = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(
      'analyst@test.com', hashedPassword, 'Test Analyst', 'analyst'
    );
    
    customerId = customerResult.lastInsertRowid as number;
    underwriterId = underwriterResult.lastInsertRowid as number;
    adjusterId = adjusterResult.lastInsertRowid as number;
    analystId = analystResult.lastInsertRowid as number;
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('End-to-End: Policy Application to Approval', () => {
    it('should complete full policy application workflow', () => {
      // Step 1: Customer submits policy application
      const policyNumber = `POL-${Date.now()}`;
      const policyResult = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      const policyId = policyResult.lastInsertRowid as number;
      
      // Verify policy created
      const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId) as any;
      expect(policy.status).toBe('pending');
      
      // Step 2: Auto-assign to underwriter
      db.prepare('UPDATE policies SET assigned_to = ? WHERE id = ?').run(underwriterId, policyId);
      
      // Step 3: Create notification for underwriter
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        underwriterId, 'New Policy Application', `Policy ${policyNumber} requires review`, 'policy'
      );
      
      // Verify notification created
      const underwriterNotifications = db.prepare('SELECT * FROM notifications WHERE user_id = ?').all(underwriterId);
      expect(underwriterNotifications).toHaveLength(1);
      
      // Step 4: Create SLA tracking
      db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours) VALUES (?, ?, ?)').run(
        'policy', policyId, 48
      );
      
      // Step 5: Underwriter reviews and approves
      const now = new Date().toISOString();
      db.prepare('UPDATE policies SET status = ?, approved_at = ? WHERE id = ?').run('approved', now, policyId);
      
      // Step 6: Notify customer of approval
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        customerId, 'Policy Approved', `Your policy ${policyNumber} has been approved`, 'policy'
      );
      
      // Step 7: Update SLA tracking
      db.prepare('UPDATE sla_tracking SET completed_at = ? WHERE entity_type = ? AND entity_id = ?').run(
        now, 'policy', policyId
      );
      
      // Step 8: Create audit log
      db.prepare('INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)').run(
        underwriterId, 'APPROVE', 'policy', policyId, JSON.stringify({ policy_number: policyNumber })
      );
      
      // Verify final state
      const finalPolicy = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId) as any;
      expect(finalPolicy.status).toBe('approved');
      expect(finalPolicy.approved_at).toBeDefined();
      
      const customerNotifications = db.prepare('SELECT * FROM notifications WHERE user_id = ?').all(customerId);
      expect(customerNotifications).toHaveLength(1);
      expect(customerNotifications[0]).toMatchObject({ title: 'Policy Approved' });
      
      const slaRecord = db.prepare('SELECT * FROM sla_tracking WHERE entity_type = ? AND entity_id = ?').get('policy', policyId) as any;
      expect(slaRecord.completed_at).toBeDefined();
      
      const auditLogs = db.prepare('SELECT * FROM audit_log WHERE entity_type = ? AND entity_id = ?').all('policy', policyId);
      expect(auditLogs).toHaveLength(1);
    });
  });

  describe('End-to-End: Normal Claim Submission to Approval', () => {
    it('should complete full normal claim workflow', () => {
      // Setup: Create active policy first
      const policyNumber = `POL-${Date.now()}`;
      const policyResult = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'active');
      
      const policyId = policyResult.lastInsertRowid as number;
      
      // Step 1: Customer submits claim
      const claimNumber = `CLM-${Date.now()}`;
      const claimAmount = 5000;
      const documents = 'doc1.pdf,doc2.pdf,doc3.pdf';
      
      // Step 2: Calculate fraud score
      let fraudScore = 0;
      const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId) as any;
      
      if (claimAmount > policy.coverage_amount * 0.8) fraudScore += 30;
      if (documents.split(',').length < 2) fraudScore += 20;
      
      const isFlagged = fraudScore >= 50;
      
      const claimResult = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, documents, status, fraud_score, is_flagged) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, policyId, customerId, 'accident', claimAmount, 'Minor accident', documents, 'submitted', fraudScore, isFlagged ? 1 : 0);
      
      const claimId = claimResult.lastInsertRowid as number;
      
      // Verify claim created
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId) as any;
      expect(claim.status).toBe('submitted');
      expect(claim.fraud_score).toBe(0); // Low amount + sufficient docs
      expect(claim.is_flagged).toBe(0);
      
      // Step 3: Auto-assign to adjuster (not analyst since not flagged)
      db.prepare('UPDATE claims SET assigned_to = ?, status = ? WHERE id = ?').run(adjusterId, 'under_review', claimId);
      
      // Step 4: Notify adjuster
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        adjusterId, 'New Claim Submitted', `Claim ${claimNumber} requires review`, 'claim'
      );
      
      // Step 5: Create SLA tracking
      db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours) VALUES (?, ?, ?)').run(
        'claim', claimId, 72
      );
      
      // Step 6: Adjuster reviews and approves
      const now = new Date().toISOString();
      db.prepare('UPDATE claims SET status = ?, resolved_at = ? WHERE id = ?').run('approved', now, claimId);
      
      // Step 7: Notify customer
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        customerId, 'Claim Approved', `Your claim ${claimNumber} has been approved`, 'claim'
      );
      
      // Step 8: Update SLA tracking
      db.prepare('UPDATE sla_tracking SET completed_at = ? WHERE entity_type = ? AND entity_id = ?').run(
        now, 'claim', claimId
      );
      
      // Step 9: Create audit log
      db.prepare('INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)').run(
        adjusterId, 'APPROVE', 'claim', claimId, JSON.stringify({ claim_number: claimNumber, amount: claimAmount })
      );
      
      // Verify final state
      const finalClaim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId) as any;
      expect(finalClaim.status).toBe('approved');
      expect(finalClaim.resolved_at).toBeDefined();
      
      const customerNotifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? AND type = ?').all(customerId, 'claim');
      expect(customerNotifications).toHaveLength(1);
      
      const slaRecord = db.prepare('SELECT * FROM sla_tracking WHERE entity_type = ? AND entity_id = ?').get('claim', claimId) as any;
      expect(slaRecord.completed_at).toBeDefined();
    });
  });

  describe('End-to-End: Fraudulent Claim Detection to Investigation', () => {
    it('should complete full fraud detection workflow', () => {
      // Setup: Create active policy
      const policyNumber = `POL-${Date.now()}`;
      const policyResult = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(policyNumber, customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'active');
      
      const policyId = policyResult.lastInsertRowid as number;
      
      // Create multiple previous claims to trigger fraud detection
      db.prepare(
        "INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-10 days'))"
      ).run('CLM-PREV-1', policyId, customerId, 'accident', 5000, 'Previous claim 1', 'approved');
      
      db.prepare(
        "INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-20 days'))"
      ).run('CLM-PREV-2', policyId, customerId, 'theft', 5000, 'Previous claim 2', 'approved');
      
      db.prepare(
        "INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-30 days'))"
      ).run('CLM-PREV-3', policyId, customerId, 'accident', 5000, 'Previous claim 3', 'approved');
      
      // Step 1: Customer submits high-risk claim
      const claimNumber = `CLM-${Date.now()}`;
      const claimAmount = 45000; // High amount
      const documents = 'doc1.pdf'; // Low document count
      
      // Step 2: Calculate fraud score
      let fraudScore = 0;
      const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId) as any;
      
      if (claimAmount > policy.coverage_amount * 0.8) fraudScore += 30;
      if (documents.split(',').length < 2) fraudScore += 20;
      
      const recent = db.prepare(
        "SELECT COUNT(*) as count FROM claims WHERE customer_id = ? AND created_at > datetime('now', '-90 days')"
      ).get(customerId) as any;
      
      if (recent.count > 2) fraudScore += 50;
      
      const isFlagged = fraudScore >= 50;
      
      const claimResult = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, documents, status, fraud_score, is_flagged) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(claimNumber, policyId, customerId, 'accident', claimAmount, 'Major accident', documents, 'submitted', fraudScore, isFlagged ? 1 : 0);
      
      const claimId = claimResult.lastInsertRowid as number;
      
      // Verify high fraud score
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId) as any;
      expect(claim.fraud_score).toBe(100); // 30 + 20 + 50
      expect(claim.is_flagged).toBe(1);
      
      // Step 3: Auto-assign to fraud analyst (not adjuster)
      db.prepare('UPDATE claims SET assigned_to = ?, status = ? WHERE id = ?').run(analystId, 'under_review', claimId);
      
      // Step 4: Notify analyst with high-risk flag
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        analystId, 'High-Risk Claim Flagged', `Claim ${claimNumber} requires investigation`, 'claim'
      );
      
      // Step 5: Create SLA tracking with extended hours for fraud investigation
      db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours) VALUES (?, ?, ?)').run(
        'claim', claimId, 72
      );
      
      // Step 6: Analyst investigates and rejects
      const now = new Date().toISOString();
      db.prepare('UPDATE claims SET status = ?, resolved_at = ? WHERE id = ?').run('rejected', now, claimId);
      
      // Step 7: Notify customer
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        customerId, 'Claim Rejected', `Your claim ${claimNumber} has been rejected`, 'claim'
      );
      
      // Step 8: Update SLA tracking
      db.prepare('UPDATE sla_tracking SET completed_at = ? WHERE entity_type = ? AND entity_id = ?').run(
        now, 'claim', claimId
      );
      
      // Step 9: Create detailed audit log
      db.prepare('INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)').run(
        analystId, 'REJECT', 'claim', claimId, JSON.stringify({
          claim_number: claimNumber,
          amount: claimAmount,
          fraud_score: fraudScore,
          reason: 'High fraud score'
        })
      );
      
      // Verify final state
      const finalClaim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId) as any;
      expect(finalClaim.status).toBe('rejected');
      expect(finalClaim.assigned_to).toBe(analystId);
      expect(finalClaim.fraud_score).toBe(100);
      
      const analystNotifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? AND title LIKE ?').all(
        analystId, '%High-Risk%'
      );
      expect(analystNotifications).toHaveLength(1);
      
      const auditLogs = db.prepare('SELECT * FROM audit_log WHERE entity_id = ? AND entity_type = ?').all(claimId, 'claim');
      expect(auditLogs).toHaveLength(1);
      expect(JSON.parse((auditLogs[0] as any).details).fraud_score).toBe(100);
    });
  });

  describe('End-to-End: SLA Monitoring', () => {
    it('should track SLA compliance across policies and claims', () => {
      // Create multiple policies and claims with various SLA statuses
      
      // Policy 1: Completed within SLA
      const policy1Result = db.prepare(
        "INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 hour'))"
      ).run('POL-GOOD', customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'approved');
      
      db.prepare(
        "INSERT INTO sla_tracking (entity_type, entity_id, sla_hours, created_at, completed_at, is_breached) VALUES (?, ?, ?, datetime('now', '-2 hours'), datetime('now', '-1 hour'), ?)"
      ).run('policy', policy1Result.lastInsertRowid, 48, 0);
      
      // Policy 2: Breached SLA
      const policy2Result = db.prepare(
        "INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 hour'))"
      ).run('POL-BAD', customerId, 'home', 200000, 800, '2024-01-01', '2025-01-01', 'approved');
      
      db.prepare(
        "INSERT INTO sla_tracking (entity_type, entity_id, sla_hours, created_at, completed_at, is_breached) VALUES (?, ?, ?, datetime('now', '-50 hours'), datetime('now', '-1 hour'), ?)"
      ).run('policy', policy2Result.lastInsertRowid, 48, 1);
      
      // Claim 1: In progress, at risk
      const claimPolicy = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('POL-CLAIM', customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'active');
      
      const claim1Result = db.prepare(
        'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run('CLM-ATRISK', claimPolicy.lastInsertRowid, customerId, 'accident', 5000, 'Test', 'under_review');
      
      db.prepare(
        "INSERT INTO sla_tracking (entity_type, entity_id, sla_hours, created_at, is_breached) VALUES (?, ?, ?, datetime('now', '-70 hours'), ?)"
      ).run('claim', claim1Result.lastInsertRowid, 72, 0);
      
      // Query SLA metrics
      const totalSLA = db.prepare('SELECT COUNT(*) as count FROM sla_tracking').get() as any;
      const breachedSLA = db.prepare('SELECT COUNT(*) as count FROM sla_tracking WHERE is_breached = 1').get() as any;
      const completedSLA = db.prepare('SELECT COUNT(*) as count FROM sla_tracking WHERE completed_at IS NOT NULL').get() as any;
      
      expect(totalSLA.count).toBe(3);
      expect(breachedSLA.count).toBe(1);
      expect(completedSLA.count).toBe(2);
      
      // Check metrics by entity type
      const policySLA = db.prepare('SELECT COUNT(*) as count FROM sla_tracking WHERE entity_type = ?').get('policy') as any;
      const claimSLA = db.prepare('SELECT COUNT(*) as count FROM sla_tracking WHERE entity_type = ?').get('claim') as any;
      
      expect(policySLA.count).toBe(2);
      expect(claimSLA.count).toBe(1);
    });
  });

  describe('End-to-End: Notification System', () => {
    it('should track all notifications across workflow', () => {
      // Create policy
      const policyResult = db.prepare(
        'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('POL-NOTIF', customerId, 'auto', 50000, 1200, '2024-01-01', '2025-01-01', 'pending');
      
      // Notification 1: Underwriter assignment
      db.prepare('INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)').run(
        underwriterId, 'New Policy Application', 'Policy POL-NOTIF requires review', 'policy', 0
      );
      
      // Approve policy
      db.prepare('UPDATE policies SET status = ? WHERE id = ?').run('approved', policyResult.lastInsertRowid);
      
      // Notification 2: Customer approval
      db.prepare('INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)').run(
        customerId, 'Policy Approved', 'Your policy POL-NOTIF has been approved', 'policy', 0
      );
      
      // Mark as read
      const notification = db.prepare('SELECT * FROM notifications WHERE user_id = ? AND type = ? LIMIT 1').get(
        customerId, 'policy'
      ) as any;
      
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notification.id);
      
      // Verify notification states
      const allNotifications = db.prepare('SELECT * FROM notifications').all();
      expect(allNotifications).toHaveLength(2);
      
      const unreadNotifications = db.prepare('SELECT * FROM notifications WHERE is_read = 0').all();
      expect(unreadNotifications).toHaveLength(1);
      
      const readNotifications = db.prepare('SELECT * FROM notifications WHERE is_read = 1').all();
      expect(readNotifications).toHaveLength(1);
      
      const customerNotifications = db.prepare('SELECT * FROM notifications WHERE user_id = ?').all(customerId);
      expect(customerNotifications).toHaveLength(1);
      expect((customerNotifications[0] as any).is_read).toBe(1);
    });
  });
});
