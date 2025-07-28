// app/api/payments/change-due-dates/route.js
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format, setDate } from 'date-fns';
import { InstallmentRow } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { studentId, preferredDay, currentPreferredDay } = await request.json();
    
    // Start transaction
    await db.query('START TRANSACTION');

    // Get future unpaid installments
    const futureInstallments = await db.query(`
      SELECT * FROM installments 
      WHERE student_id = ? AND status = 'unpaid' AND due_date >= CURDATE()
    `, [studentId]) as InstallmentRow[];

    // Update due dates for future installments
    for (const inst of futureInstallments) {
      const dueDate = new Date(inst.due_date);
      const newDueDate = setDate(dueDate, preferredDay);
      
      await db.query(`
        UPDATE installments 
        SET due_date = ?, updated_at = NOW() 
        WHERE id = ?
      `, [format(newDueDate, 'yyyy-MM-dd'), inst.id]);
    }

    // Update student's preferred pay day
    await db.query(`
      UPDATE students 
      SET preferred_pay_day = ?, updated_at = NOW() 
      WHERE id = ?
    `, [preferredDay, studentId]);

    // Record the due date change
    const changeId = `DDC-${Date.now()}`;
    await db.query(`
      INSERT INTO due_date_changes (
        id, student_id, change_date, old_day, new_day, created_at
      ) VALUES (?, ?, CURDATE(), ?, ?, NOW())
    `, [changeId, studentId, currentPreferredDay || 1, preferredDay]);

    // Commit transaction
    await db.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    console.error("Error updating due dates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}