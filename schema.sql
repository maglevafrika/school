-- This SQL script is used to create the database schema for the application.
-- It includes tables for users, students, evaluations, grades, installments, sessions, and more
-- Run this to create all tables

-- Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  roles JSON NOT NULL, -- Array of roles
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
);

-- Students table
CREATE TABLE students (
  id VARCHAR(255) PRIMARY KEY,
  id_prefix VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  username VARCHAR(255) UNIQUE,
  dob DATE,
  nationality VARCHAR(100),
  instrument_interest VARCHAR(255),
  enrollment_date DATE,
  level VARCHAR(100) NOT NULL DEFAULT 'Beginner',
  payment_plan VARCHAR(20) DEFAULT 'none' CHECK (payment_plan IN ('monthly', 'quarterly', 'yearly', 'none')),
  subscription_start_date DATE,
  preferred_pay_day INT,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_username (username),
  INDEX idx_level (level),
  INDEX idx_enrollment_date (enrollment_date)
);

-- Level history table
CREATE TABLE level_history (
  id VARCHAR(255) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  previous_level VARCHAR(100),
  new_level VARCHAR(100) NOT NULL,
  change_date DATE NOT NULL,
  review_comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_id (student_id),
  INDEX idx_change_date (change_date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Evaluations table
CREATE TABLE evaluations (
  id VARCHAR(255) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  evaluation_date DATE NOT NULL,
  evaluator VARCHAR(255) NOT NULL,
  criteria_json JSON NOT NULL, -- Array of {name: string, score: number}
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_id (student_id),
  INDEX idx_evaluation_date (evaluation_date),
  INDEX idx_evaluator (evaluator),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Grades table
CREATE TABLE grades (
  id VARCHAR(255) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('test', 'assignment', 'quiz')),
  title VARCHAR(255) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL,
  grade_date DATE NOT NULL,
  attachment_json JSON, -- {name: string, type: string, dataUrl: string}
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_id (student_id),
  INDEX idx_subject (subject),
  INDEX idx_type (type),
  INDEX idx_grade_date (grade_date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Installments table
CREATE TABLE installments (
  id VARCHAR(255) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue')),
  payment_date DATE,
  grace_period_until DATE,
  invoice_number VARCHAR(255),
  payment_method VARCHAR(20) CHECK (payment_method IN ('visa', 'mada', 'cash', 'transfer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_id (student_id),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status),
  INDEX idx_payment_date (payment_date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Due date changes table
CREATE TABLE due_date_changes (
  id VARCHAR(255) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  change_date DATE NOT NULL,
  old_day INT NOT NULL,
  new_day INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_id (student_id),
  INDEX idx_change_date (change_date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Semesters table
CREATE TABLE semesters (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  teachers_json JSON, -- Array of teacher names
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_is_active (is_active)
);

-- Sessions table
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY, -- e.g., "Saturday-13"
  semester_id VARCHAR(255) NOT NULL,
  teacher_name VARCHAR(255) NOT NULL,
  day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  time_slot VARCHAR(255) NOT NULL, -- e.g., "1:00 PM - 3:00 PM"
  duration DECIMAL(3,1) NOT NULL, -- in hours
  specialization VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('practical', 'theory')),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_semester_id (semester_id),
  INDEX idx_teacher_name (teacher_name),
  INDEX idx_day_of_week (day_of_week),
  INDEX idx_time_slot (time_slot),
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- Session students junction table
CREATE TABLE session_students (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  pending_removal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, student_id),
  INDEX idx_session_id (session_id),
  INDEX idx_student_id (student_id),
  INDEX idx_pending_removal (pending_removal),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Attendance table
CREATE TABLE attendance (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of the week
  status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, student_id, week_start_date),
  INDEX idx_session_id (session_id),
  INDEX idx_student_id (student_id),
  INDEX idx_week_start_date (week_start_date),
  INDEX idx_status (status),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Teacher requests table
CREATE TABLE teacher_requests (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('remove-student', 'change-time', 'add-student')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  request_date DATE NOT NULL,
  teacher_id VARCHAR(255) NOT NULL,
  teacher_name VARCHAR(255) NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  session_time VARCHAR(255) NOT NULL,
  day VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  semester_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_student_id (student_id),
  INDEX idx_session_id (session_id),
  INDEX idx_semester_id (semester_id),
  INDEX idx_request_date (request_date),
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create compound indexes for better query performance
CREATE INDEX idx_students_compound ON students(level, enrollment_date, payment_plan);
CREATE INDEX idx_grades_compound ON grades(student_id, grade_date, subject);
CREATE INDEX idx_evaluations_compound ON evaluations(student_id, evaluation_date, evaluator);
CREATE INDEX idx_installments_compound ON installments(student_id, status, due_date);
CREATE INDEX idx_attendance_compound ON attendance(session_id, week_start_date, status);

-- Create views for common queries
GO
CREATE VIEW student_summary AS
SELECT 
  s.id,
  s.name,
  s.level,
  s.enrollment_date,
  s.payment_plan,
  COUNT(DISTINCT g.id) as total_grades,
  COUNT(DISTINCT e.id) as total_evaluations,
  COUNT(DISTINCT i.id) as total_installments,
  COUNT(DISTINCT CASE WHEN i.status = 'unpaid' THEN i.id END) as unpaid_installments,
  AVG(g.score / g.max_score * 100) as average_grade_percentage
FROM students s
LEFT JOIN grades g ON s.id = g.student_id
LEFT JOIN evaluations e ON s.id = e.student_id
LEFT JOIN installments i ON s.id = i.student_id
GROUP BY s.id, s.name, s.level, s.enrollment_date, s.payment_plan;

GO
-- View for session enrollment
CREATE VIEW session_enrollment AS
SELECT 
  ses.id as session_id,
  ses.teacher_name,
  ses.day_of_week,
  ses.time_slot,
  ses.specialization,
  ses.type,
  COUNT(ss.student_id) as enrolled_students,
  COUNT(CASE WHEN ss.pending_removal = TRUE THEN ss.student_id END) as pending_removals
FROM sessions ses
LEFT JOIN session_students ss ON ses.id = ss.session_id
GROUP BY ses.id, ses.teacher_name, ses.day_of_week, ses.time_slot, ses.specialization, ses.type;

GO
-- View for weekly attendance summary
CREATE VIEW weekly_attendance_summary AS
SELECT 
  a.week_start_date,
  a.session_id,
  s.teacher_name,
  s.day_of_week,
  s.time_slot,
  COUNT(a.student_id) as total_students,
  COUNT(CASE WHEN a.status = 'present' THEN a.student_id END) as present_count,
  COUNT(CASE WHEN a.status = 'absent' THEN a.student_id END) as absent_count,
  COUNT(CASE WHEN a.status = 'late' THEN a.student_id END) as late_count,
  COUNT(CASE WHEN a.status = 'excused' THEN a.student_id END) as excused_count,
  ROUND(COUNT(CASE WHEN a.status = 'present' THEN a.student_id END) / COUNT(a.student_id) * 100, 2) as attendance_rate
FROM attendance a
JOIN sessions s ON a.session_id = s.id
GROUP BY a.week_start_date, a.session_id, s.teacher_name, s.day_of_week, s.time_slot;