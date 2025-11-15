import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json();
    
    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    
    // Default role is customer if not specified or invalid
    const validRoles = ['customer', 'underwriter', 'adjuster', 'analyst', 'manager', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'customer';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = db.prepare(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
    ).run(email, hashedPassword, name, userRole);
    
    // Return user data (without password)
    const user = {
      id: result.lastInsertRowid,
      email,
      name,
      role: userRole,
    };
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
