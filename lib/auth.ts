import bcrypt from 'bcryptjs';
import db from './db';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'underwriter' | 'adjuster' | 'analyst' | 'manager' | 'admin';
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) return null;
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function getUser(id: number): User | null {
  const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(id) as any;
  return user || null;
}

export function getAllUsers(): User[] {
  const users = db.prepare('SELECT id, email, name, role FROM users ORDER BY created_at DESC').all() as any[];
  return users;
}

export function getUsersByRole(role: string): User[] {
  const users = db.prepare('SELECT id, email, name, role FROM users WHERE role = ? ORDER BY created_at DESC').all(role) as any[];
  return users;
}
