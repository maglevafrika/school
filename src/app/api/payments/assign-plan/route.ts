// app/api/payments/assign-plan/route.js
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format, addMonths, addQuarters, addYears } from 'date-fns';
import { Installment } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { studentId, plan, startDate } = await request.json();
    
    const installments: Installment[] = [];
    const planDetails = {
      monthly: { count: 12, addPeriod: addMonths, amount: 500 },
      quarterly: { count: 4, addPeriod: addQuarters, amount: 1500 },
      yearly: { count: 1, addPeriod: addYears, amount: 5500 },
    };
    const { count, addPeriod, amount } = planDetails[plan as keyof typeof planDetails];

    const startDateObj = new Date(startDate);
    for (let i = 0; i < count; i++) {
      installments.push({
        id: `${studentId}-inst-${i}`,
        dueDate: format(addPeriod(startDateObj, i), 'yyyy-MM-dd'),
        amount,
        status: 'unpaid',
      });
    }
    
    // Start transaction
    await db.query('START TRANSACTION');

    // Update student record
    await db.query(`
      UPDATE students 
      SET payment_plan = ?, subscription_start_date = ?, updated_at = NOW() 
      WHERE id = ?
    `, [plan, format(startDateObj, 'yyyy-MM-dd'), studentId]);

    // Delete existing installments
    await db.query('DELETE FROM installments WHERE student_id = ?', [studentId]);

    // Insert new installments
    for (const installment of installments) {
      await db.query(`
        INSERT INTO installments (
          id, student_id, due_date, amount, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        installment.id,
        studentId,
        installment.dueDate,
        installment.amount,
        installment.status
      ]);
    }

    // Commit transaction
    await db.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    console.error("Error assigning plan:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}