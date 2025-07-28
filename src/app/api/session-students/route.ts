// app/api/session-students/route.js
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, studentId } = await request.json();

    if (!sessionId || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.query('START TRANSACTION');

    const sessionStudentId = `SS-${Date.now()}`;
    await db.query(`
      INSERT INTO session_students (id, session_id, student_id, pending_removal, created_at, updated_at)
      VALUES (?, ?, ?, false, NOW(), NOW())
    `, [sessionStudentId, sessionId, studentId]);

    await db.query('COMMIT');

    return NextResponse.json({ success: true, message: 'Student added to session' });
  } catch (error: any) {
    await db.query('ROLLBACK');
    console.error('Error adding student to session:', error);
    return NextResponse.json({ error: error.message || 'Failed to add student to session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId, studentId } = await request.json();

    if (!sessionId || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.query(`
      DELETE FROM session_students 
      WHERE session_id = ? AND student_id = ?
    `, [sessionId, studentId]);

    return NextResponse.json({ success: true, message: 'Student removed from session' });
  } catch (error: any) {
    console.error('Error removing student from session:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove student from session' }, { status: 500 });
  }
}