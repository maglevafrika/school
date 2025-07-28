// app/api/attendance/route.js
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, studentId, weekStartDate, status } = await request.json();

    if (!sessionId || !studentId || !weekStartDate || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const attendanceId = `ATT-${Date.now()}`;
    await db.query(`
      INSERT INTO attendance (id, session_id, student_id, week_start_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      status = VALUES(status), updated_at = NOW()
    `, [attendanceId, sessionId, studentId, weekStartDate, status]);

    return NextResponse.json({ success: true, message: 'Attendance updated' });
  } catch (error: any) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: error.message || 'Failed to update attendance' }, { status: 500 });
  }
}