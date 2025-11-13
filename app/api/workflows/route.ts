import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  let report;
  
  if (type === 'compliance') {
    report = {
      timestamp: new Date().toISOString(),
      policies: {
        total: db.prepare('SELECT COUNT(*) as count FROM policies').get(),
        active: db.prepare('SELECT COUNT(*) as count FROM policies WHERE status = ?').get('active'),
        pending: db.prepare('SELECT COUNT(*) as count FROM policies WHERE status = ?').get('pending'),
      },
      claims: {
        total: db.prepare('SELECT COUNT(*) as count FROM claims').get(),
        approved: db.prepare('SELECT COUNT(*) as count FROM claims WHERE status = ?').get('approved'),
        rejected: db.prepare('SELECT COUNT(*) as count FROM claims WHERE status = ?').get('rejected'),
        flagged: db.prepare('SELECT COUNT(*) as count FROM claims WHERE is_flagged = 1').get(),
      },
      sla: {
        breached: db.prepare('SELECT COUNT(*) as count FROM sla_tracking WHERE is_breached = 1').get(),
        total: db.prepare('SELECT COUNT(*) as count FROM sla_tracking').get(),
      },
      audit: db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100').all(),
    };
  } else if (type === 'workflows') {
    report = db.prepare('SELECT * FROM workflows').all();
  }
  
  return NextResponse.json({ report });
}

export async function POST(request: Request) {
  const { name, type, steps, slaHours, createdBy } = await request.json();
  
  const result = db.prepare(
    'INSERT INTO workflows (name, type, steps, sla_hours, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(name, type, JSON.stringify(steps), slaHours, createdBy);
  
  return NextResponse.json({ workflowId: result.lastInsertRowid });
}
