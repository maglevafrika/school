// app/api/payments/students/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StudentProfile, StudentRow, InstallmentRow, Installment } from '@/lib/types';

export async function GET() {
  try {
    // Fetch students with enrolled sessions
    const studentsQuery = `
      SELECT DISTINCT s.*, 
             GROUP_CONCAT(DISTINCT CONCAT(ss.session_id, ':', ses.semester_id, ':', ses.teacher_name) SEPARATOR '|') as enrolled_sessions
      FROM students s
      LEFT JOIN session_students ss ON s.id = ss.student_id AND ss.pending_removal = false
      LEFT JOIN sessions ses ON ss.session_id = ses.id
      GROUP BY s.id
    `;
    
    const studentRows = await db.query(studentsQuery) as (StudentRow & { enrolled_sessions: string })[];
    
    const students: StudentProfile[] = [];
    
    for (const studentRow of studentRows) {
      // Parse enrolled sessions
      const enrolledIn = studentRow.enrolled_sessions 
        ? studentRow.enrolled_sessions.split('|').map(session => {
            const [sessionId, semesterId, teacher] = session.split(':');
            return { sessionId, semesterId, teacher };
          })
        : [];

      // Fetch installments for this student
      const installmentsQuery = `
        SELECT * FROM installments 
        WHERE student_id = ? 
        ORDER BY due_date ASC
      `;
      const installmentRows = await db.query(installmentsQuery, [studentRow.id]) as InstallmentRow[];
      
      const installments: Installment[] = installmentRows.map(row => ({
        id: row.id,
        dueDate: row.due_date,
        amount: row.amount,
        status: row.status,
        paymentDate: row.payment_date,
        gracePeriodUntil: row.grace_period_until,
        invoiceNumber: row.invoice_number,
        paymentMethod: row.payment_method
      }));

      // Convert to StudentProfile
      const student: StudentProfile = {
        id: studentRow.id,
        idPrefix: studentRow.id_prefix,
        name: studentRow.name,
        gender: studentRow.gender,
        username: studentRow.username,
        dob: studentRow.dob,
        nationality: studentRow.nationality,
        instrumentInterest: studentRow.instrument_interest,
        enrollmentDate: studentRow.enrollment_date,
        level: studentRow.level,
        paymentPlan: studentRow.payment_plan,
        subscriptionStartDate: studentRow.subscription_start_date,
        preferredPayDay: studentRow.preferred_pay_day,
        avatar: studentRow.avatar,
        installments,
        enrolledIn,
        created_at: studentRow.created_at,
        updated_at: studentRow.updated_at
      };
      
      students.push(student);
    }
    
    return NextResponse.json(students);
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}