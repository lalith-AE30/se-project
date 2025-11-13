import db, { initDb } from './lib/db';
import bcrypt from 'bcryptjs';

console.log('🚀 Starting database population...\n');

// Initialize database schema
initDb();
console.log('✅ Database schema initialized\n');

// Get existing users
const customer = db.prepare('SELECT * FROM users WHERE email = ?').get('customer@test.com') as any;
const underwriter = db.prepare('SELECT * FROM users WHERE email = ?').get('underwriter@insurance.com') as any;
const adjuster = db.prepare('SELECT * FROM users WHERE email = ?').get('adjuster@insurance.com') as any;
const analyst = db.prepare('SELECT * FROM users WHERE email = ?').get('analyst@insurance.com') as any;

console.log('📊 Adding mock policies...');

// Add sample policies with various statuses
const policies = [
  {
    policyNumber: 'POL-2025001',
    customerId: customer.id,
    type: 'auto',
    coverageAmount: 50000,
    premium: 1200,
    startDate: '2025-01-15',
    endDate: '2026-01-15',
    status: 'active',
    assignedTo: underwriter.id,
    approvedAt: '2025-01-10 14:30:00'
  },
  {
    policyNumber: 'POL-2025002',
    customerId: customer.id,
    type: 'home',
    coverageAmount: 250000,
    premium: 1800,
    startDate: '2025-02-01',
    endDate: '2026-02-01',
    status: 'active',
    assignedTo: underwriter.id,
    approvedAt: '2025-01-28 10:15:00'
  },
  {
    policyNumber: 'POL-2025003',
    customerId: customer.id,
    type: 'health',
    coverageAmount: 100000,
    premium: 2400,
    startDate: '2024-12-01',
    endDate: '2025-12-01',
    status: 'active',
    assignedTo: underwriter.id,
    approvedAt: '2024-11-25 16:45:00'
  },
  {
    policyNumber: 'POL-2025004',
    customerId: customer.id,
    type: 'life',
    coverageAmount: 500000,
    premium: 3600,
    startDate: '2025-03-01',
    endDate: '2026-03-01',
    status: 'pending',
    assignedTo: underwriter.id,
    approvedAt: null
  },
  {
    policyNumber: 'POL-2024999',
    customerId: customer.id,
    type: 'auto',
    coverageAmount: 40000,
    premium: 1000,
    startDate: '2024-11-15',
    endDate: '2025-11-15',
    status: 'expired',
    assignedTo: underwriter.id,
    approvedAt: '2024-11-10 09:20:00'
  },
];

const insertPolicy = db.prepare(`
  INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status, assigned_to, approved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const policyIds: number[] = [];
for (const policy of policies) {
  const result = insertPolicy.run(
    policy.policyNumber,
    policy.customerId,
    policy.type,
    policy.coverageAmount,
    policy.premium,
    policy.startDate,
    policy.endDate,
    policy.status,
    policy.assignedTo,
    policy.approvedAt
  );
  policyIds.push(result.lastInsertRowid as number);
  
  // Add SLA tracking for active/pending policies
  if (policy.status === 'active' || policy.status === 'pending') {
    db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours, created_at, completed_at, is_breached) VALUES (?, ?, ?, ?, ?, ?)').run(
      'policy',
      result.lastInsertRowid,
      48,
      policy.status === 'active' ? policy.approvedAt?.split(' ')[0] + ' 00:00:00' : new Date().toISOString(),
      policy.approvedAt || null,
      0
    );
  }
}

console.log(`✅ Added ${policies.length} policies\n`);

console.log('💼 Adding mock claims...');

// Add sample claims with various statuses and fraud scores
const claims = [
  {
    claimNumber: 'CLM-2025001',
    policyId: policyIds[0],
    customerId: customer.id,
    type: 'accident',
    amount: 8000,
    description: 'Minor fender bender in parking lot. Front bumper damage and headlight replacement needed.',
    documents: 'police_report.pdf,photo1.jpg,photo2.jpg,repair_estimate.pdf',
    status: 'approved',
    fraudScore: 15,
    isFlagged: 0,
    assignedTo: adjuster.id,
    resolvedAt: '2025-02-15 14:30:00'
  },
  {
    claimNumber: 'CLM-2025002',
    policyId: policyIds[1],
    customerId: customer.id,
    type: 'damage',
    amount: 45000,
    description: 'Water damage from burst pipe in kitchen. Extensive damage to flooring and cabinets.',
    documents: 'plumber_report.pdf,photo1.jpg,photo2.jpg',
    status: 'under_review',
    fraudScore: 35,
    isFlagged: 0,
    assignedTo: adjuster.id,
    resolvedAt: null
  },
  {
    claimNumber: 'CLM-2025003',
    policyId: policyIds[2],
    customerId: customer.id,
    type: 'medical',
    amount: 15000,
    description: 'Emergency surgery for appendicitis. 3-day hospital stay.',
    documents: 'hospital_bill.pdf,doctor_note.pdf,prescription.pdf',
    status: 'paid',
    fraudScore: 10,
    isFlagged: 0,
    assignedTo: adjuster.id,
    resolvedAt: '2025-03-10 11:20:00'
  },
  {
    claimNumber: 'CLM-2025004',
    policyId: policyIds[0],
    customerId: customer.id,
    type: 'theft',
    amount: 42000,
    description: 'Vehicle stolen from driveway overnight. No signs of forced entry.',
    documents: 'police_report.pdf',
    status: 'under_review',
    fraudScore: 70,
    isFlagged: 1,
    assignedTo: analyst.id,
    resolvedAt: null
  },
  {
    claimNumber: 'CLM-2025005',
    policyId: policyIds[1],
    customerId: customer.id,
    type: 'damage',
    amount: 220000,
    description: 'Fire damage to property. Most of the structure needs rebuilding.',
    documents: 'fire_dept_report.pdf',
    status: 'submitted',
    fraudScore: 85,
    isFlagged: 1,
    assignedTo: analyst.id,
    resolvedAt: null
  },
  {
    claimNumber: 'CLM-2025006',
    policyId: policyIds[2],
    customerId: customer.id,
    type: 'medical',
    amount: 3500,
    description: 'Routine dental procedure - root canal and crown.',
    documents: 'dental_invoice.pdf,xray.jpg',
    status: 'rejected',
    fraudScore: 5,
    isFlagged: 0,
    assignedTo: adjuster.id,
    resolvedAt: '2025-03-20 09:15:00'
  },
];

const insertClaim = db.prepare(`
  INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, documents, status, fraud_score, is_flagged, assigned_to, resolved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const claim of claims) {
  const result = insertClaim.run(
    claim.claimNumber,
    claim.policyId,
    claim.customerId,
    claim.type,
    claim.amount,
    claim.description,
    claim.documents,
    claim.status,
    claim.fraudScore,
    claim.isFlagged,
    claim.assignedTo,
    claim.resolvedAt
  );
  
  // Add SLA tracking for claims
  const createdDate = claim.status === 'submitted' ? new Date().toISOString() : '2025-02-10 08:00:00';
  db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours, created_at, completed_at, is_breached) VALUES (?, ?, ?, ?, ?, ?)').run(
    'claim',
    result.lastInsertRowid,
    72,
    createdDate,
    claim.resolvedAt || null,
    claim.isFlagged ? 0 : (claim.status === 'under_review' ? 1 : 0)
  );
}

console.log(`✅ Added ${claims.length} claims\n`);

console.log('🔔 Adding mock notifications...');

// Add sample notifications
const notifications = [
  {
    userId: customer.id,
    title: 'Policy Approved',
    message: 'Your policy POL-2025001 has been approved',
    type: 'policy',
    isRead: 1,
    createdAt: '2025-01-10 14:35:00'
  },
  {
    userId: customer.id,
    title: 'Claim Approved',
    message: 'Your claim CLM-2025001 has been approved',
    type: 'claim',
    isRead: 1,
    createdAt: '2025-02-15 14:35:00'
  },
  {
    userId: customer.id,
    title: 'Policy Renewal Reminder',
    message: 'Your policy POL-2025003 expires on 2025-12-01. Please renew to maintain coverage.',
    type: 'renewal',
    isRead: 0,
    createdAt: new Date().toISOString()
  },
  {
    userId: customer.id,
    title: 'Claim Rejected',
    message: 'Your claim CLM-2025006 has been rejected',
    type: 'claim',
    isRead: 0,
    createdAt: '2025-03-20 09:20:00'
  },
  {
    userId: underwriter.id,
    title: 'New Policy Application',
    message: 'Policy POL-2025004 requires review',
    type: 'policy',
    isRead: 0,
    createdAt: new Date().toISOString()
  },
  {
    userId: adjuster.id,
    title: 'New Claim Submitted',
    message: 'Claim CLM-2025002 requires review',
    type: 'claim',
    isRead: 0,
    createdAt: new Date().toISOString()
  },
  {
    userId: analyst.id,
    title: 'High-Risk Claim Flagged',
    message: 'Claim CLM-2025004 requires investigation',
    type: 'claim',
    isRead: 0,
    createdAt: new Date().toISOString()
  },
  {
    userId: analyst.id,
    title: 'High-Risk Claim Flagged',
    message: 'Claim CLM-2025005 requires investigation',
    type: 'claim',
    isRead: 0,
    createdAt: new Date().toISOString()
  },
];

const insertNotification = db.prepare(`
  INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const notif of notifications) {
  insertNotification.run(
    notif.userId,
    notif.title,
    notif.message,
    notif.type,
    notif.isRead,
    notif.createdAt
  );
}

console.log(`✅ Added ${notifications.length} notifications\n`);

console.log('📝 Adding audit log entries...');

// Add sample audit log entries
const auditEntries = [
  {
    userId: customer.id,
    action: 'POLICY_APPLIED',
    entityType: 'policy',
    entityId: policyIds[0],
    details: 'Applied for auto insurance policy',
    createdAt: '2025-01-08 10:00:00'
  },
  {
    userId: underwriter.id,
    action: 'POLICY_APPROVED',
    entityType: 'policy',
    entityId: policyIds[0],
    details: 'Approved policy after review',
    createdAt: '2025-01-10 14:30:00'
  },
  {
    userId: customer.id,
    action: 'CLAIM_SUBMITTED',
    entityType: 'claim',
    entityId: 1,
    details: 'Submitted claim for accident damage',
    createdAt: '2025-02-12 09:00:00'
  },
  {
    userId: adjuster.id,
    action: 'CLAIM_APPROVED',
    entityType: 'claim',
    entityId: 1,
    details: 'Approved claim after validation',
    createdAt: '2025-02-15 14:30:00'
  },
];

const insertAudit = db.prepare(`
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const entry of auditEntries) {
  insertAudit.run(
    entry.userId,
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.details,
    entry.createdAt
  );
}

console.log(`✅ Added ${auditEntries.length} audit log entries\n`);

// Print summary statistics
const stats = {
  users: db.prepare('SELECT COUNT(*) as count FROM users').get() as any,
  workflows: db.prepare('SELECT COUNT(*) as count FROM workflows').get() as any,
  policies: db.prepare('SELECT COUNT(*) as count FROM policies').get() as any,
  claims: db.prepare('SELECT COUNT(*) as count FROM claims').get() as any,
  notifications: db.prepare('SELECT COUNT(*) as count FROM notifications').get() as any,
  slaTracking: db.prepare('SELECT COUNT(*) as count FROM sla_tracking').get() as any,
  auditLog: db.prepare('SELECT COUNT(*) as count FROM audit_log').get() as any,
};

console.log('📊 Database Summary:');
console.log('═══════════════════════════════════════');
console.log(`   Users: ${stats.users.count}`);
console.log(`   Workflows: ${stats.workflows.count}`);
console.log(`   Policies: ${stats.policies.count}`);
console.log(`   Claims: ${stats.claims.count}`);
console.log(`   Notifications: ${stats.notifications.count}`);
console.log(`   SLA Tracking Records: ${stats.slaTracking.count}`);
console.log(`   Audit Log Entries: ${stats.auditLog.count}`);
console.log('═══════════════════════════════════════\n');

console.log('✨ Database population complete!\n');
console.log('You can now login and see:');
console.log('  • Customer: 5 policies (4 active, 1 pending) + 6 claims');
console.log('  • Underwriter: 1 pending policy to review');
console.log('  • Adjuster: 1 claim to review');
console.log('  • Analyst: 2 flagged claims to investigate');
console.log('  • Manager: SLA metrics with some breaches');
console.log('  • All roles: Multiple notifications\n');
