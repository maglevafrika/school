import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TypeConverters } from '@/lib/types';
import type { 
  StudentRow,
  GradeRow,
  EvaluationRow,
  LevelChange,
} from '@/lib/types';
import { RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    // Fetch main student record
    const studentQuery = `
      SELECT * FROM students 
      WHERE id = ?
    `;
    const studentRows = await db.query(studentQuery, [studentId]) as StudentRow[];
    
    if (studentRows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentRow = studentRows[0];

    // Fetch level history
    const levelHistoryQuery = `
      SELECT * FROM level_history 
      WHERE student_id = ? 
      ORDER BY change_date DESC
    `;
    const levelHistoryRows = await db.query(levelHistoryQuery, [studentId]) as RowDataPacket[];
    const levelHistory: LevelChange[] = levelHistoryRows.map(row => ({
      date: row.change_date,
      level: row.new_level,
      review: row.review_comments || ''
    }));

    // Fetch evaluations
    const evaluationsQuery = `
      SELECT * FROM evaluations 
      WHERE student_id = ? 
      ORDER BY evaluation_date DESC
    `;
    const evaluationRows = await db.query(evaluationsQuery, [studentId]) as EvaluationRow[];
    const evaluations = evaluationRows.map(row => 
      TypeConverters.evaluationRowToEvaluation(row)
    );

    // Fetch grades
    const gradesQuery = `
      SELECT * FROM grades 
      WHERE student_id = ? 
      ORDER BY grade_date DESC
    `;
    const gradeRows = await db.query(gradesQuery, [studentId]) as GradeRow[];
    const grades = gradeRows.map(row => 
      TypeConverters.gradeRowToGrade(row)
    );

    // Fetch installments
    const installmentsQuery = `
      SELECT * FROM installments 
      WHERE student_id = ? 
      ORDER BY due_date DESC
    `;
    const installmentRows = await db.query(installmentsQuery, [studentId]) as RowDataPacket[];
    const installments = installmentRows.map((row: RowDataPacket) => ({
      id: row.id,
      dueDate: row.due_date,
      amount: row.amount,
      status: row.status,
      paymentDate: row.payment_date,
      gracePeriodUntil: row.grace_period_until,
      invoiceNumber: row.invoice_number,
      paymentMethod: row.payment_method
    }));

    // Fetch due date changes
    const dueDateChangesQuery = `
      SELECT * FROM due_date_changes 
      WHERE student_id = ? 
      ORDER BY change_date DESC
    `;
    const dueDateChangeRows = await db.query(dueDateChangesQuery, [studentId]) as RowDataPacket[];
    const dueDateChangeHistory = dueDateChangeRows.map((row: RowDataPacket) => ({
      date: row.change_date,
      oldDay: row.old_day,
      newDay: row.new_day
    }));

    // Fetch enrolled sessions
    const enrolledInQuery = `
      SELECT ss.*, s.semester_id, s.teacher_name 
      FROM session_students ss
      JOIN sessions s ON ss.session_id = s.id
      WHERE ss.student_id = ? AND ss.pending_removal = false
    `;
    const enrolledInRows = await db.query(enrolledInQuery, [studentId]) as RowDataPacket[];
    const enrolledIn = enrolledInRows.map((row: RowDataPacket) => ({
      semesterId: row.semester_id,
      teacher: row.teacher_name,
      sessionId: row.session_id
    }));

    // Convert to StudentProfile
    const studentProfile = TypeConverters.studentRowToProfile(
      studentRow,
      levelHistory,
      evaluations,
      grades,
      installments,
      dueDateChangeHistory,
      enrolledIn
    );

    return NextResponse.json(studentProfile);
  } catch (error: any) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}