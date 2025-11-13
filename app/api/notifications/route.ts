import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(userId);
  
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const { id } = await request.json();
  
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  
  return NextResponse.json({ success: true });
}
