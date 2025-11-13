import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const userId = searchParams.get('userId');
  
  let policies;
  
  if (role === 'customer') {
    policies = db.prepare('SELECT * FROM policies WHERE customer_id = ? ORDER BY created_at DESC').all(userId);
  } else if (role === 'underwriter') {
    policies = db.prepare('SELECT p.*, u.name as customer_name FROM policies p JOIN users u ON p.customer_id = u.id WHERE p.status = ? OR p.assigned_to = ? ORDER BY created_at DESC').all('pending', userId);
  } else {
    policies = db.prepare('SELECT p.*, u.name as customer_name FROM policies p JOIN users u ON p.customer_id = u.id ORDER BY created_at DESC').all();
  }
  
  return NextResponse.json({ policies });
}

export async function POST(request: Request) {
  const { customerId, type, coverageAmount, premium, startDate, endDate } = await request.json();
  
  const policyNumber = `POL-${Date.now()}`;
  
  const result = db.prepare(
    'INSERT INTO policies (policy_number, customer_id, type, coverage_amount, premium, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(policyNumber, customerId, type, coverageAmount, premium, startDate, endDate, 'pending');
  
  // Auto-assign to first available underwriter
  const underwriter = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('underwriter') as any;
  if (underwriter) {
    db.prepare('UPDATE policies SET assigned_to = ? WHERE id = ?').run(underwriter.id, result.lastInsertRowid);
    
    // Create notification
    db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
      underwriter.id, 'New Policy Application', `Policy ${policyNumber} requires review`, 'policy'
    );
  }
  
  // Create SLA tracking
  db.prepare('INSERT INTO sla_tracking (entity_type, entity_id, sla_hours) VALUES (?, ?, ?)').run('policy', result.lastInsertRowid, 48);
  
  return NextResponse.json({ policyId: result.lastInsertRowid, policyNumber });
}

export async function PATCH(request: Request) {
  const { id, status, underwriterId } = await request.json();
  
  const now = new Date().toISOString();
  
  if (status === 'approved') {
    db.prepare('UPDATE policies SET status = ?, approved_at = ? WHERE id = ?').run(status, now, id);
    
    const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(id) as any;
    
    // Notify customer
    db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
      policy.customer_id, 'Policy Approved', `Your policy ${policy.policy_number} has been approved`, 'policy'
    );
    
    // Update SLA tracking
    db.prepare('UPDATE sla_tracking SET completed_at = ? WHERE entity_type = ? AND entity_id = ?').run(now, 'policy', id);
  } else {
    db.prepare('UPDATE policies SET status = ? WHERE id = ?').run(status, id);
  }
  
  return NextResponse.json({ success: true });
}
