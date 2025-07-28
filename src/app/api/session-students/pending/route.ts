// app/api/session-students/pending/route.js
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, studentId, pendingRemoval } = await request.json();

    if (!sessionId || !studentId || pendingRemoval === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.query(`
      UPDATE session_students 
      SET pending_removal = ?, updated_at = NOW()
      WHERE session_id = ? AND student_id = ?
    `, [pendingRemoval, sessionId, studentId]);

    return NextResponse.json({ success: true, message: 'Pending removal status updated' });
  } catch (error: any) {
    console.error('Error updating pending removal status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update pending removal status' }, { status: 500 });
  }
}