import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const policies = db.prepare(
    `SELECT * FROM policies WHERE status = 'active' AND 
     julianday(end_date) - julianday('now') <= 30 AND 
     julianday(end_date) - julianday('now') > 0`
  ).all() as any[];
  
  // Send renewal reminders
  for (const policy of policies) {
    const existingNotification = db.prepare(
      'SELECT id FROM notifications WHERE user_id = ? AND message LIKE ? AND created_at > datetime("now", "-7 days")'
    ).get(policy.customer_id, `%${policy.policy_number}%renewal%`) as any;
    
    if (!existingNotification) {
      db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(
        policy.customer_id,
        'Policy Renewal Reminder',
        `Your policy ${policy.policy_number} expires on ${policy.end_date}. Please renew to maintain coverage.`,
        'renewal'
      );
    }
  }
  
  return NextResponse.json({ remindersSent: policies.length });
}
