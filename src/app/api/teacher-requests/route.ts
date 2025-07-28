import { db } from "@/lib/db";
import { TeacherRequest } from "@/lib/types";
import { RowDataPacket } from 'mysql2';
import { NextRequest, NextResponse } from 'next/server';

// Convert database row to TeacherRequest format
const convertRowToRequest = (row: RowDataPacket): TeacherRequest => {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    date: row.request_date,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    details: {
      studentId: row.student_id,
      studentName: row.student_name,
      sessionId: row.session_id,
      sessionTime: row.session_time,
      day: row.day,
      reason: row.reason,
      semesterId: row.semester_id
    }
  };
};

// GET - Fetch all teacher requests
export async function GET() {
  try {
    const query = `
      SELECT 
        id, type, status, request_date, teacher_id, teacher_name,
        student_id, student_name, session_id, session_time, 
        day, reason, semester_id
      FROM requests 
      ORDER BY request_date DESC, created_at DESC
    `;
    
    const rows = await db.query(query) as RowDataPacket[];
    const requests = rows.map(convertRowToRequest);
    
    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Error fetching requests: ", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher requests" },
      { status: 500 }
    );
  }
}

// PUT - Update request status (approve/deny)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action || !['approved', 'denied'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE requests 
      SET status = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    
    await db.query(updateQuery, [action, requestId]);

    // If the request is approved and it's a remove-student request, 
    // update the session_students table
    if (action === "approved") {
      // First, get the request details
      const getRequestQuery = `
        SELECT type, session_id, student_id 
        FROM requests 
        WHERE id = ?
      `;
      const requestRows = await db.query(getRequestQuery, [requestId]) as RowDataPacket[];
      
      if (requestRows.length > 0 && requestRows[0].type === "remove-student") {
        try {
          // Mark student as pending removal or remove them entirely
          const updateSessionStudentQuery = `
            UPDATE session_students 
            SET pending_removal = TRUE, updated_at = NOW()
            WHERE session_id = ? AND student_id = ?
          `;
          await db.query(updateSessionStudentQuery, [
            requestRows[0].session_id,
            requestRows[0].student_id
          ]);
        } catch (sessionError) {
          console.error("Error updating session student:", sessionError);
          // Don't fail the main operation if this fails
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Request ${action} successfully` 
    });
  } catch (error: any) {
    console.error("Error updating request: ", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}