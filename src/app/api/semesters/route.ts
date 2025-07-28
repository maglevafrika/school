// app/api/semesters/route.js
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT id, name, start_date, end_date, teachers_json, is_active
      FROM semesters 
      ORDER BY is_active DESC, start_date DESC
    `;
    
    const rows = await db.query(query) as any[];
    const semesters = rows.map(row => ({
      ...row,
      teachers: JSON.parse(row.teachers_json || '[]')
    }));

    return NextResponse.json(semesters);
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json({ error: 'Failed to fetch semesters' }, { status: 500 });
  }
}
