import { NextRequest, NextResponse } from 'next/server';
import { db, testConnection } from '@/lib/db';
import { 
  getInitialSemesters, 
  getInitialStudents, 
  getInitialRequests, 
  getInitialUsers 
} from '@/lib/data';

interface SeedCollection {
  name: string;
  initialData: () => any[];
  checkField: string;
}

async function createTables(): Promise<void> {
  const createTableQueries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      roles JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Students table
    `CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(255) PRIMARY KEY,
      id_prefix VARCHAR(50),
      name VARCHAR(255) NOT NULL,
      gender ENUM('male', 'female'),
      username VARCHAR(255),
      dob DATE,
      nationality VARCHAR(100),
      instrument_interest VARCHAR(255),
      enrollment_date DATE,
      level VARCHAR(100) NOT NULL,
      payment_plan ENUM('monthly', 'quarterly', 'yearly', 'none') DEFAULT 'monthly',
      subscription_start_date DATE,
      preferred_pay_day INT,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Semesters table
    `CREATE TABLE IF NOT EXISTS semesters (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      teachers_json JSON,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Sessions table
    `CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      semester_id VARCHAR(255) NOT NULL,
      teacher_name VARCHAR(255) NOT NULL,
      day_of_week VARCHAR(20) NOT NULL,
      time_slot VARCHAR(50) NOT NULL,
      duration DECIMAL(3,1) NOT NULL,
      specialization VARCHAR(255),
      type ENUM('practical', 'theory') NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_semester (semester_id)
    )`,

    // Session Students junction table
    `CREATE TABLE IF NOT EXISTS session_students (
      id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      student_id VARCHAR(255) NOT NULL,
      pending_removal BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_session_student (session_id, student_id),
      INDEX idx_session (session_id),
      INDEX idx_student (student_id)
    )`,

    // Grades table
    `CREATE TABLE IF NOT EXISTS grades (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      type ENUM('test', 'assignment', 'quiz') NOT NULL,
      title VARCHAR(255) NOT NULL,
      score DECIMAL(5,2) NOT NULL,
      max_score DECIMAL(5,2) NOT NULL,
      grade_date DATE NOT NULL,
      attachment_json JSON,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_student (student_id)
    )`,

    // Evaluations table
    `CREATE TABLE IF NOT EXISTS evaluations (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      evaluation_date DATE NOT NULL,
      evaluator VARCHAR(255) NOT NULL,
      criteria_json JSON NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_student (student_id)
    )`,

    // Level history table
    `CREATE TABLE IF NOT EXISTS level_history (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      previous_level VARCHAR(100),
      new_level VARCHAR(100) NOT NULL,
      change_date DATE NOT NULL,
      review_comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_student (student_id)
    )`,

    // Installments table
    `CREATE TABLE IF NOT EXISTS installments (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      due_date DATE NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('paid', 'unpaid', 'overdue') DEFAULT 'unpaid',
      payment_date DATE,
      grace_period_until DATE,
      invoice_number VARCHAR(100),
      payment_method ENUM('visa', 'mada', 'cash', 'transfer'),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_student (student_id),
      INDEX idx_due_date (due_date)
    )`,

    // Due date changes table
    `CREATE TABLE IF NOT EXISTS due_date_changes (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      change_date DATE NOT NULL,
      old_day INT NOT NULL,
      new_day INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_student (student_id)
    )`,

    // Attendance table
    `CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      student_id VARCHAR(255) NOT NULL,
      week_start_date DATE NOT NULL,
      status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_attendance (session_id, student_id, week_start_date),
      INDEX idx_session (session_id),
      INDEX idx_student (student_id),
      INDEX idx_week (week_start_date)
    )`,

    // Teacher requests table (mapping to your "requests" table)
    `CREATE TABLE IF NOT EXISTS requests (
      id VARCHAR(255) PRIMARY KEY,
      type ENUM('remove-student', 'change-time', 'add-student') NOT NULL,
      status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',
      request_date DATE NOT NULL,
      teacher_id VARCHAR(255) NOT NULL,
      teacher_name VARCHAR(255) NOT NULL,
      student_id VARCHAR(255),
      student_name VARCHAR(255),
      session_id VARCHAR(255),
      session_time VARCHAR(50),
      day VARCHAR(20),
      reason TEXT,
      semester_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_teacher (teacher_id),
      INDEX idx_status (status),
      INDEX idx_semester (semester_id)
    )`
  ];

  // Execute all table creation queries
  for (const query of createTableQueries) {
    await db.query(query);
  }
  
  console.log('✅ All tables created successfully');
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
      [tableName]
    );
    return (result as any)[0].count > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

async function isTableEmpty(tableName: string): Promise<boolean> {
  try {
    const count = await db.count(tableName);
    return count === 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} is empty:`, error);
    return false;
  }
}

// Function to handle student enrollment data
async function populateSessionStudents(): Promise<void> {
  try {
    console.log('🔗 Populating session_students junction table...');
    
    // Get all students with their enrollment data
    const studentsData = getInitialStudents();
    
    for (const student of studentsData) {
      if (student.enrolledIn && Array.isArray(student.enrolledIn)) {
        for (const enrollment of student.enrolledIn) {
          // Generate a unique ID for the session_students record
          const sessionStudentId = `${enrollment.sessionId}-${student.id}`;
          
          try {
            // Check if this enrollment already exists
            const existing = await db.findOne('session_students', {
              session_id: enrollment.sessionId,
              student_id: student.id
            });
            
            if (!existing) {
              await db.insert('session_students', {
                id: sessionStudentId,
                session_id: enrollment.sessionId,
                student_id: student.id,
                pending_removal: false
              });
              console.log(`✅ Enrolled student ${student.id} in session ${enrollment.sessionId}`);
            } else {
              console.log(`Student ${student.id} already enrolled in session ${enrollment.sessionId}`);
            }
          } catch (error) {
            console.error(`Error enrolling student ${student.id} in session ${enrollment.sessionId}:`, error);
            // Continue with other enrollments even if one fails
          }
        }
      }
    }
    
    console.log('✅ Session students population complete');
  } catch (error) {
    console.error('❌ Error populating session_students:', error);
    throw error;
  }
}

async function seedInitialData(): Promise<{ success: boolean; error?: string }> {
  try {
    const collectionsToSeed: SeedCollection[] = [
      { name: "users", initialData: getInitialUsers, checkField: "username" },
      { name: "semesters", initialData: getInitialSemesters, checkField: "name" },
      { name: "students", initialData: getInitialStudents, checkField: "name" },
      { name: "requests", initialData: getInitialRequests, checkField: "type" }
    ];

    for (const { name, initialData } of collectionsToSeed) {
      console.log(`Checking table: ${name}`);
      
      const tableExists = await checkTableExists(name);
      if (!tableExists) {
        console.warn(`Table ${name} does not exist even after creation attempt.`);
        continue;
      }

      const isEmpty = await isTableEmpty(name);
      if (isEmpty) {
        console.log(`Seeding ${name}...`);
        const data = initialData();
        
        for (const item of data) {
          try {
            if (item.id) {
              let processedItem = { ...item };
              
              // Handle users table JSON fields
              if (name === 'users' && processedItem.roles && typeof processedItem.roles === 'object') {
                processedItem.roles = JSON.stringify(processedItem.roles);
              }
              
              // Handle semesters table - transform field names and JSON fields
              if (name === 'semesters') {
                processedItem = {
                  id: item.id,
                  name: item.name,
                  start_date: item.startDate,  // Transform camelCase to snake_case
                  end_date: item.endDate,      // Transform camelCase to snake_case
                  teachers_json: JSON.stringify(item.teachers || []), // Transform and stringify
                  is_active: item.is_active !== undefined ? item.is_active : true
                };
                
                // Note: masterSchedule and weeklyAttendance are not in the table schema
                // If you need them, add them to your CREATE TABLE statement
              }
              
              // Handle students table - filter out fields not in the table schema
              if (name === 'students') {
                // Only include fields that exist in the students table
                processedItem = {
                  id: item.id,
                  id_prefix: item.id_prefix || null,
                  name: item.name,
                  gender: item.gender || null,
                  username: item.username || null,
                  dob: item.dob || null,
                  nationality: item.nationality || null, 
                  instrument_interest: item.instrument_interest || null,
                  enrollment_date: item.enrollment_date || null,
                  level: item.level,
                  payment_plan: item.payment_plan || 'monthly',
                  subscription_start_date: item.subscription_start_date || null,
                  preferred_pay_day: item.preferred_pay_day || null,
                  avatar: item.avatar || null
                };
                
                // Note: enrolledIn is handled through the session_students junction table
                // You'll need to create separate logic to populate session_students
                // based on the enrolledIn data from your student records
              }
              
              // Handle requests table - transform field names and flatten details
              if (name === 'requests') {
                const details = item.details || {};
                processedItem = {
                  id: item.id,
                  type: item.type,
                  status: item.status || 'pending',
                  request_date: item.date,                    // Transform date -> request_date
                  teacher_id: item.teacherId,                 // Transform teacherId -> teacher_id
                  teacher_name: item.teacherName,             // Transform teacherName -> teacher_name
                  student_id: details.studentId || null,     // Extract from details
                  student_name: details.studentName || null, // Extract from details
                  session_id: details.sessionId || null,     // Extract from details
                  session_time: details.sessionTime || null, // Extract from details
                  day: details.day || null,                   // Extract from details
                  reason: details.reason || null,             // Extract from details
                  semester_id: details.semesterId || null    // Extract from details
                };
              }
              
              await db.insert(name, processedItem);
            } else {
              console.warn(`Item in table ${name} is missing an ID.`, item);
            }
          } catch (insertError: any) {
            if (insertError.code === 'ER_DUP_ENTRY') {
              console.log(`Item with ID ${item.id} already exists in ${name}, skipping...`);
            } else {
              console.error(`Error inserting into ${name}:`, insertError);
              console.error('Item data:', item);
              throw insertError;
            }
          }
        }
        console.log(`✅ Successfully seeded ${name}`);
      } else {
        console.log(`Table ${name} already has data, skipping...`);
      }
    }
    
    // Handle student enrollments (populate junction table)
    console.log('🔗 Populating session_students junction table...');
    await populateSessionStudents();
    
    console.log("🎉 Seeding check complete.");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error seeding data: ", error);
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Test database connection
    const connected = await testConnection();
    
    if (!connected) {
      return NextResponse.json(
        { error: 'Failed to connect to database', connected: false, seedingComplete: false },
        { status: 500 }
      );
    }

    console.log('✅ Database connection successful');

    // Create tables first
    console.log('📋 Creating database tables...');
    await createTables();

    // Then perform seeding
    console.log('🌱 Starting data seeding...');
    const seedResult = await seedInitialData();
    
    if (!seedResult.success) {
      return NextResponse.json(
        { 
          error: seedResult.error || 'Seeding failed', 
          connected: true, 
          seedingComplete: false 
        },
        { status: 500 }
      );
    }

    console.log('🎉 Database initialization complete!');
    
    return NextResponse.json({
      connected: true,
      seedingComplete: true,
      message: 'Database initialized successfully'
    });

  } catch (error: any) {
    console.error('❌ Database initialization API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Database initialization failed', 
        connected: false, 
        seedingComplete: false 
      },
      { status: 500 }
    );
  }
}
