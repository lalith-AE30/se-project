import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const userId = searchParams.get('userId');
  
  let claims;
  
  if (role === 'customer') {
    claims = db.prepare('SELECT c.*, p.policy_number FROM claims c JOIN policies p ON c.policy_id = p.id WHERE c.customer_id = ? ORDER BY c.created_at DESC').all(userId);
  } else if (role === 'adjuster') {
    claims = db.prepare('SELECT c.*, p.policy_number, u.name as customer_name FROM claims c JOIN policies p ON c.policy_id = p.id JOIN users u ON c.customer_id = u.id WHERE c.status IN (?, ?) OR c.assigned_to = ? ORDER BY c.created_at DESC').all('submitted', 'under_review', userId);
  } else if (role === 'analyst') {
    claims = db.prepare('SELECT c.*, p.policy_number, u.name as customer_name FROM claims c JOIN policies p ON c.policy_id = p.id JOIN users u ON c.customer_id = u.id WHERE c.is_flagged = 1 ORDER BY c.created_at DESC').all();
  } else {
    claims = db.prepare('SELECT c.*, p.policy_number, u.name as customer_name FROM claims c JOIN policies p ON c.policy_id = p.id JOIN users u ON c.customer_id = u.id ORDER BY c.created_at DESC').all();
  }
  
  return NextResponse.json({ claims });
}

export async function POST(request: Request) {
  const { policyId, customerId, type, amount, description, documents } = await request.json();
  
  const claimNumber = `CLM-${Date.now()}`;
  
  // Check eligibility
  const policy = db.prepare('SELECT * FROM policies WHERE id = ? AND status = ?').get(policyId, 'active') as any;
  if (!policy) {
    return NextResponse.json({ error: 'Policy not active or not found' }, { status: 400 });
  }
  
  if (amount > policy.coverage_amount) {
    return NextResponse.json({ error: 'Claim amount exceeds coverage' }, { status: 400 });
  }
  
  // Check for duplicate claims
  const duplicate = db.prepare(
    'SELECT id FROM claims WHERE policy_id = ? AND type = ? AND status NOT IN (?, ?) AND created_at > datetime("now", "-30 days")'
  ).get(policyId, type, 'rejected', 'paid') as any;
  
  if (duplicate) {
    return NextResponse.json({ error: 'Duplicate claim detected' }, { status: 400 });
  }
  
  // Calculate fraud score (simplified)
  let fraudScore = 0;
  if (amount > policy.coverage_amount * 0.8) fraudScore += 30;
  if (documents?.split(',').length < 2) fraudScore += 20;
  
  const recent = db.prepare('SELECT COUNT(*) as count FROM claims WHERE customer_id = ? AND created_at > datetime("now", "-90 days")').get(customerId) as any;
  if (recent.count > 2) fraudScore += 50;
  
  const isFlagged = fraudScore >= 50;
  
  const result = db.prepare(
    'INSERT INTO claims (claim_number, policy_id, customer_id, type, amount, description, documents, status, fraud_score, is_flagged) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(claimNumber, policyId, customerId, type, amount, description, documents, 'submitted', fraudScore, isFlagged ? 1 : 0);
  
  // Auto-assign to adjuster or analyst
  const assignRole = isFlagged ? 'analyst' : 'adjuster';
  const assignee = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get(assignRole) as any;
  
  if (assignee) {
    db.prepare('UPDATE claims SET assigned_to = ?, status = ? WHERE id = ?').run(assignee.id, 'under_review', result.lastInsertRowid);
    
    db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
      assignee.id,
      isFlagged ? 'High-Risk Claim Flagged' : 'New Claim Submitted',
      `Claim ${claimNumber} requires ${isFlagged ? 'investigation' : 'review'}`,
      'claim'
    );
  }
  
  // Create SLA tracking
  db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours) VALUES (?, ?, ?)').run('claim', result.lastInsertRowid, 72);
  
  return NextResponse.json({ claimId: result.lastInsertRowid, claimNumber, fraudScore, isFlagged });
}

export async function PATCH(request: Request) {
  const { id, status } = await request.json();
  
  const now = new Date().toISOString();
  
  db.prepare('UPDATE claims SET status = ?, resolved_at = ? WHERE id = ?').run(status, now, id);
  
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(id) as any;
  
  // Notify customer
  db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
    claim.customer_id,
    `Claim ${status === 'approved' ? 'Approved' : 'Rejected'}`,
    `Your claim ${claim.claim_number} has been ${status}`,
    'claim'
  );
  
  // Update SLA tracking
  db.prepare('UPDATE sla_tracking SET completed_at = ? WHERE entity_type = ? AND entity_id = ?').run(now, 'claim', id);
  
  return NextResponse.json({ success: true });
}
