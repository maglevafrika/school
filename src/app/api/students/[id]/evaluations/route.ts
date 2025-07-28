import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TypeConverters } from '@/lib/types';
import type { Evaluation } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const evaluationData = await request.json() as Omit<Evaluation, 'id'>;
    
    const newEvaluation: Evaluation = {
      ...evaluationData,
      id: `EVAL-${Date.now()}`
    };
    
    const evaluationRow = TypeConverters.evaluationToRow(newEvaluation, studentId);
    
    const insertQuery = `
      INSERT INTO evaluations (
        id, student_id, evaluation_date, evaluator, criteria_json, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    await db.query(insertQuery, [
      evaluationRow.id,
      evaluationRow.student_id,
      evaluationRow.evaluation_date,
      evaluationRow.evaluator,
      evaluationRow.criteria_json,
      evaluationRow.notes
    ]);

    return NextResponse.json({ success: true, evaluation: newEvaluation });
  } catch (error: any) {
    console.error('Error adding evaluation:', error);
    return NextResponse.json
({ success: false, error: error.message }, { status: 500 });
  }
}