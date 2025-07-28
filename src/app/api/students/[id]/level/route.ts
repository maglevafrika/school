import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const { newLevel, review, currentLevel } = await request.json();

    await db.query('START TRANSACTION');

    // Update student level
    const updateStudentQuery = `
      UPDATE students 
      SET level = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    await db.query(updateStudentQuery, [newLevel, studentId]);

    // Add level history record
    const levelHistoryId = `LH-${Date.now()}`;
    const insertLevelHistoryQuery = `
      INSERT INTO level_history (
        id, student_id, previous_level, new_level, change_date, review_comments, created_at
      ) VALUES (?, ?, ?, ?, CURDATE(), ?, NOW())
    `;
    await db.query(insertLevelHistoryQuery, [
      levelHistoryId,
      studentId,
      currentLevel,
      newLevel,
      review
    ]);

    await db.query('COMMIT');
    
    return NextResponse.json({ success: true, newLevel });
  } catch (error: any) {
    await db.query('ROLLBACK');
    console.error('Error updating level:', error);
    return NextResponse.json(
      { error: 'Failed to update level', message: error.message },
      { status: 500 }
    );
  }
}