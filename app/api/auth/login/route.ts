import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { initDb } from '@/lib/db';

export async function POST(request: Request) {
  initDb();
  
  const { email, password } = await request.json();
  const user = await authenticate(email, password);
  
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  return NextResponse.json({ user });
}
