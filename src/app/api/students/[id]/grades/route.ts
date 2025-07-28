import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TypeConverters } from '@/lib/types';
import type { Grade } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const gradeData = await request.json() as Omit<Grade, 'id'>;
    
    const newGrade: Grade = {
      ...gradeData,
      id: `GRD-${Date.now()}`
    };
    
    const gradeRow = TypeConverters.gradeToRow(newGrade, studentId);
    
    const insertQuery = `
      INSERT INTO grades (
        id, student_id, subject, type, title, score, max_score, 
        grade_date, attachment_json, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    await db.query(insertQuery, [
      gradeRow.id,
      gradeRow.student_id,
      gradeRow.subject,
      gradeRow.type,
      gradeRow.title,
      gradeRow.score,
      gradeRow.max_score,
      gradeRow.grade_date,
      gradeRow.attachment_json,
      gradeRow.notes
    ]);

    return NextResponse.json({ success: true, grade: newGrade });
  } catch (error: any) {
    console.error('Error adding grade:', error);
    return NextResponse.json(
      { error: 'Failed to add grade', message: error.message },
      { status: 500 }
    );
  }
}