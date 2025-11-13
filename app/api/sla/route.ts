import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const slaData = db.prepare(`
    SELECT 
      entity_type,
      COUNT(*) as total,
      SUM(CASE WHEN is_breached = 1 THEN 1 ELSE 0 END) as breached,
      SUM(CASE WHEN completed_at IS NULL AND julianday('now') - julianday(created_at) > sla_hours/24.0 THEN 1 ELSE 0 END) as at_risk,
      AVG(CASE WHEN completed_at IS NOT NULL THEN (julianday(completed_at) - julianday(created_at)) * 24 ELSE NULL END) as avg_completion_hours
    FROM sla_tracking
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY entity_type
  `).all();
  
  // Mark breached SLAs
  db.prepare(`
    UPDATE sla_tracking 
    SET is_breached = 1 
    WHERE completed_at IS NULL 
    AND julianday('now') - julianday(created_at) > sla_hours/24.0
  `).run();
  
  return NextResponse.json({ slaData });
}
