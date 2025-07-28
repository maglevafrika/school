// lib/types.ts 

export type Role = "admin" | "teacher" | "upper-management" | "high-level-dashboard";

export interface User {
  id: string;
  username: string;
  name: string;
  roles: Role[];
  activeRole: Role;
}

export interface UserInDb {
  id: string;
  username: string;
  name: string;
  password?: string;
  roles: Role[];
}

// Main StudentProfile interface (for frontend use)
export interface StudentProfile {
  id: string;
  idPrefix?: string;
  name: string;
  gender?: 'male' | 'female';
  username?: string;
  dob?: string; // Stored as a string e.g. "YYYY-MM-DD"
  nationality?: string;
  instrumentInterest?: string;
  enrollmentDate?: string; // Stored as a string e.g. "YYYY-MM-DD"
  level: string;
  levelHistory?: LevelChange[];
  evaluations?: Evaluation[];
  grades?: Grade[];
  paymentPlan?: 'monthly' | 'quarterly' | 'yearly' | 'none';
  installments?: Installment[];
  subscriptionStartDate?: string; // Stored as a string e.g. "YYYY-MM-DD"
  preferredPayDay?: number;
  dueDateChangeHistory?: DueDateChange[];
  avatar?: string;
  enrolledIn: {
    semesterId: string;
    teacher: string;
    sessionId: string;
  }[];
  // MySQL fields
  created_at?: string;
  updated_at?: string;
}

// Database row interface for students table
export interface StudentRow {
  id: string;
  id_prefix?: string;
  name: string;
  gender?: 'male' | 'female';
  username?: string;
  dob?: string;
  nationality?: string;
  instrument_interest?: string;
  enrollment_date?: string;
  level: string;
  payment_plan?: 'monthly' | 'quarterly' | 'yearly' | 'none';
  subscription_start_date?: string;
  preferred_pay_day?: number;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface LevelChange {
  date: string; // Stored as a string e.g. "YYYY-MM-DD"
  level: string;
  review: string;
}

// Database row for level_history table
export interface LevelHistoryRow {
  id: string;
  student_id: string;
  previous_level?: string;
  new_level: string;
  change_date: string;
  review_comments: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  date: string; // Stored as a string e.g. "YYYY-MM-DD"
  evaluator: string;
  criteria: { name: string; score: number }[];
  notes: string;
}

// Database row for evaluations table
export interface EvaluationRow {
  id: string;
  student_id: string;
  evaluation_date: string;
  evaluator: string;
  criteria_json: string; // JSON string of criteria array
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  subject: string;
  type: 'test' | 'assignment' | 'quiz';
  title: string;
  score: number;
  maxScore: number;
  date: string; // Stored as a string e.g. "YYYY-MM-DD"
  attachment?: {
    name: string;
    type: string;
    dataUrl: string;
  };
  notes?: string;
}

// Database row for grades table
export interface GradeRow {
  id: string;
  student_id: string;
  subject: string;
  type: 'test' | 'assignment' | 'quiz';
  title: string;
  score: number;
  max_score: number;
  grade_date: string;
  attachment_json?: string; // JSON string of attachment object
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: string;
  dueDate: string; // Stored as a string e.g. "YYYY-MM-DD"
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  paymentDate?: string; // Stored as a string e.g. "YYYY-MM-DD"
  gracePeriodUntil?: string; // Stored as a string e.g. "YYYY-MM-DD"
  invoiceNumber?: string;
  paymentMethod?: 'visa' | 'mada' | 'cash' | 'transfer';
}

// Database row for installments table
export interface InstallmentRow {
  id: string;
  student_id: string;
  due_date: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  payment_date?: string;
  grace_period_until?: string;
  invoice_number?: string;
  payment_method?: 'visa' | 'mada' | 'cash' | 'transfer';
  created_at: string;
  updated_at: string;
}

export interface DueDateChange {
  date: string; // Stored as a string e.g. "YYYY-MM-DD"
  oldDay: number;
  newDay: number;
}

// Database row for due_date_changes table
export interface DueDateChangeRow {
  id: string;
  student_id: string;
  change_date: string;
  old_day: number;
  new_day: number;
  created_at: string;
}

export interface SessionStudent {
  id: string;
  name: string;
  attendance: 'present' | 'absent' | 'late' | 'excused' | null;
  note?: string;
  pendingRemoval?: boolean;
}

export interface Session {
  id: string; // e.g., "Saturday-13"
  time: string; // e.g., "1:00 PM - 3:00 PM"
  duration: number; // in hours
  students: SessionStudent[];
  specialization: string;
  type: 'practical' | 'theory';
  note?: string;
}

// Database row for sessions table
export interface SessionRow {
  id: string;
  semester_id: string;
  teacher_name: string;
  day_of_week: string;
  time_slot: string;
  duration: number;
  specialization: string;
  type: 'practical' | 'theory';
  note?: string;
  created_at: string;
  updated_at: string;
}

// Database row for session_students table (junction table)
export interface SessionStudentRow {
  id: string;
  session_id: string;
  student_id: string;
  pending_removal: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcessedSession extends Session {
  day: string;
  startRow: number;
}

export interface WeeklyAttendance {
  [sessionId: string]: { // e.g., "Saturday-13"
    [studentId: string]: {
      status: 'present' | 'absent' | 'late' | 'excused';
      note?: string;
    };
  };
}

// Database row for attendance table
export interface AttendanceRow {
  id: string;
  session_id: string;
  student_id: string;
  week_start_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherSchedule {
  [day: string]: Session[];
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  teachers: string[];
  masterSchedule: {
    [teacherName: string]: TeacherSchedule;
  };
  weeklyAttendance: {
    [weekStartDate: string]: { // YYYY-MM-DD format
      [teacherName: string]: WeeklyAttendance;
    };
  };
}

// Database row for semesters table
export interface SemesterRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  teachers_json: string; // JSON array of teacher names
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TeacherRequestType = 'remove-student' | 'change-time' | 'add-student';

export interface TeacherRequest {
  id: string;
  type: TeacherRequestType;
  status: 'pending' | 'approved' | 'denied';
  date: string;
  teacherId: string;
  teacherName: string;
  details: {
    studentId: string;
    studentName: string;
    sessionId: string;
    sessionTime: string;
    day: string;
    reason: string;
    semesterId: string;
  };
}

// Database row for teacher_requests table
export interface TeacherRequestRow {
  id: string;
  type: TeacherRequestType;
  status: 'pending' | 'approved' | 'denied';
  request_date: string;
  teacher_id: string;
  teacher_name: string;
  student_id: string;
  student_name: string;
  session_id: string;
  session_time: string;
  day: string;
  reason: string;
  semester_id: string;
  created_at: string;
  updated_at: string;
}

export interface AppData {
  semesters: Semester[];
  students: StudentProfile[];
}

// Utility types for database operations
export type TableName = 
  | 'users'
  | 'students' 
  | 'grades' 
  | 'evaluations' 
  | 'level_history'
  | 'installments'
  | 'due_date_changes'
  | 'semesters'
  | 'sessions'
  | 'session_students'
  | 'attendance'
  | 'teacher_requests';

// Helper functions to convert between frontend and database formats
export class TypeConverters {
  // Convert StudentRow to StudentProfile
  static studentRowToProfile(
    row: StudentRow,
    levelHistory: LevelChange[] = [],
    evaluations: Evaluation[] = [],
    grades: Grade[] = [],
    installments: Installment[] = [],
    dueDateChangeHistory: DueDateChange[] = [],
    enrolledIn: { semesterId: string; teacher: string; sessionId: string; }[] = []
  ): StudentProfile {
    return {
      id: row.id,
      idPrefix: row.id_prefix,
      name: row.name,
      gender: row.gender,
      username: row.username,
      dob: row.dob,
      nationality: row.nationality,
      instrumentInterest: row.instrument_interest,
      enrollmentDate: row.enrollment_date,
      level: row.level,
      paymentPlan: row.payment_plan,
      subscriptionStartDate: row.subscription_start_date,
      preferredPayDay: row.preferred_pay_day,
      avatar: row.avatar,
      levelHistory,
      evaluations,
      grades,
      installments,
      dueDateChangeHistory,
      enrolledIn,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // Convert StudentProfile to StudentRow
  static studentProfileToRow(profile: StudentProfile): Omit<StudentRow, 'created_at' | 'updated_at'> {
    return {
      id: profile.id,
      id_prefix: profile.idPrefix,
      name: profile.name,
      gender: profile.gender,
      username: profile.username,
      dob: profile.dob,
      nationality: profile.nationality,
      instrument_interest: profile.instrumentInterest,
      enrollment_date: profile.enrollmentDate,
      level: profile.level,
      payment_plan: profile.paymentPlan,
      subscription_start_date: profile.subscriptionStartDate,
      preferred_pay_day: profile.preferredPayDay,
      avatar: profile.avatar
    };
  }

  // Convert GradeRow to Grade
  static gradeRowToGrade(row: GradeRow): Grade {
    return {
      id: row.id,
      subject: row.subject,
      type: row.type,
      title: row.title,
      score: row.score,
      maxScore: row.max_score,
      date: row.grade_date,
      attachment: row.attachment_json ? JSON.parse(row.attachment_json) : undefined,
      notes: row.notes
    };
  }

  // Convert Grade to GradeRow
  static gradeToRow(grade: Grade, studentId: string): Omit<GradeRow, 'created_at' | 'updated_at'> {
    return {
      id: grade.id,
      student_id: studentId,
      subject: grade.subject,
      type: grade.type,
      title: grade.title,
      score: grade.score,
      max_score: grade.maxScore,
      grade_date: grade.date,
      attachment_json: grade.attachment ? JSON.stringify(grade.attachment) : undefined,
      notes: grade.notes
    };
  }

  // Convert EvaluationRow to Evaluation
  static evaluationRowToEvaluation(row: EvaluationRow): Evaluation {
    return {
      id: row.id,
      date: row.evaluation_date,
      evaluator: row.evaluator,
      criteria: JSON.parse(row.criteria_json),
      notes: row.notes
    };
  }

  // Convert Evaluation to EvaluationRow
  static evaluationToRow(evaluation: Evaluation, studentId: string): Omit<EvaluationRow, 'created_at' | 'updated_at'> {
    return {
      id: evaluation.id,
      student_id: studentId,
      evaluation_date: evaluation.date,
      evaluator: evaluation.evaluator,
      criteria_json: JSON.stringify(evaluation.criteria),
      notes: evaluation.notes
    };
  }
}