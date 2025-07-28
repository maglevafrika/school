// app/api/sessions/route.js
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get('semesterId');
    const teacherName = searchParams.get('teacherName');
    const weekStart = searchParams.get('weekStart');

    if (!semesterId || !teacherName || !weekStart) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const query = `
      SELECT s.*, ss.student_id, st.name as student_name, ss.pending_removal,
             a.status as attendance_status
      FROM sessions s
      LEFT JOIN session_students ss ON s.id = ss.session_id
      LEFT JOIN students st ON ss.student_id = st.id
      LEFT JOIN attendance a ON (s.id = a.session_id AND ss.student_id = a.student_id AND a.week_start_date = ?)
      WHERE s.semester_id = ? AND s.teacher_name = ?
      ORDER BY s.day_of_week, s.time_slot, st.name
    `;

    const sessionRows = await db.query(query, [weekStart, semesterId, teacherName]) as any[];

    // Group sessions and their students
    const sessionMap = new Map();

    sessionRows.forEach(row => {
      if (!sessionMap.has(row.id)) {
        // Parse time to calculate start row
        const timeMatch = row.time_slot.match(/(\d+):\d{2}\s*(AM|PM)?/i);
        let startRow = 0;
        if (timeMatch) {
          let startHour = parseInt(timeMatch[1]);
          const isPM = timeMatch[2]?.toLowerCase() === 'pm';
          if (isPM && startHour !== 12) startHour += 12;
          if (!isPM && startHour === 12) startHour = 0;
          startRow = startHour - 9;
        }

        sessionMap.set(row.id, {
          id: row.id,
          time: row.time_slot,
          duration: row.duration,
          specialization: row.specialization,
          type: row.type,
          note: row.note,
          day: row.day_of_week,
          startRow: Math.max(0, Math.min(12, startRow)),
          students: []
        });
      }

      // Add student if exists
      if (row.student_id) {
        const session = sessionMap.get(row.id);
        session.students.push({
          id: row.student_id,
          name: row.student_name,
          attendance: row.attendance_status || null,
          pendingRemoval: row.pending_removal || false
        });
      }
    });

    const processedSessions = Array.from(sessionMap.values());
    return NextResponse.json(processedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}