import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StudentProfile, TypeConverters, StudentRow } from '@/lib/types';
import { RowDataPacket } from 'mysql2';

// GET handler - fetch all students
export async function GET() {
  try {
    const studentsQuery = `
      SELECT s.*, 
        GROUP_CONCAT(
          CONCAT(ss.session_id, ':', s2.semester_id, ':', s2.teacher_name) 
          SEPARATOR ','
        ) as enrolled_sessions
      FROM students s
      LEFT JOIN session_students ss ON s.id = ss.student_id AND ss.pending_removal = false
      LEFT JOIN sessions s2 ON ss.session_id = s2.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;
    
    const studentRows = await db.query(studentsQuery) as StudentRow[];
    
    const students: StudentProfile[] = studentRows.map(row => {
      const enrolledIn = [];
      if ((row as any).enrolled_sessions) {
        const sessions = (row as any).enrolled_sessions.split(',');
        for (const session of sessions) {
          const [sessionId, semesterId, teacher] = session.split(':');
          if (sessionId && semesterId && teacher) {
            enrolledIn.push({ sessionId, semesterId, teacher });
          }
        }
      }
      
      return TypeConverters.studentRowToProfile(row, [], [], [], [], [], enrolledIn);
    });

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    
    // Check if it's a "table doesn't exist" error
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { 
          error: 'Database not initialized', 
          message: 'Please initialize the database first by calling POST /api/database/initialize',
          needsInitialization: true 
        },
        { status: 424 } // 424 Failed Dependency
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// POST handler - create new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, level } = body;

    // Validate input
    if (!name || !level) {
      return NextResponse.json(
        { error: 'Name and level are required' },
        { status: 400 }
      );
    }

    // Generate a new student ID 
    const newStudentId = `STD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newStudent: StudentProfile = {
      id: newStudentId,
      name: name.trim(),
      level: level,
      enrollmentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      enrolledIn: [],
    };

    // Convert StudentProfile to StudentRow format for database insertion
    const studentRow = TypeConverters.studentProfileToRow(newStudent);

    const insertQuery = `
      INSERT INTO students (
        id, name, level, enrollment_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

    await db.query(insertQuery, [
      studentRow.id,
      studentRow.name,
      studentRow.level,
      studentRow.enrollment_date
    ]);

    return NextResponse.json({ 
      success: true, 
      student: newStudent,
      message: 'Student created successfully' 
    });

  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
