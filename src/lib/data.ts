
import { UserInDb, Semester, StudentProfile, TeacherRequest } from "./types";

export const getInitialUsers = (): UserInDb[] => {
    return [
        { id: '1', username: 'admin1', name: 'Admin One', roles: ['admin'], password: '12345' },
        { id: '2', username: 'رغد', name: 'Raghad', roles: ['admin'], password: '12345' },
        { id: '3', username: 'عبدالرحمن', name: 'Abdulrahman', roles: ['admin'], password: '12345' },
        { id: '4', username: 'manar', name: 'Manar', roles: ['admin', 'high-level-dashboard'], password: '12345' },
        { id: '5', username: 'MC', name: 'MC', roles: ['upper-management'], password: '12345' },
        { id: '6', username: 'نهاد', name: 'Nahad', roles: ['teacher'], password: '12345' },
        { id: '7', username: 'حازم', name: 'Hazem', roles: ['teacher'], password: '12345' },
        { id: '8', username: 'هاني', name: 'Hani', roles: ['teacher'], password: '12345' },
        { id: '9', username: 'نبيل', name: 'Nabil', roles: ['teacher'], password: '12345' },
        { id: '10', username: 'باسم', name: 'Basem', roles: ['teacher'], password: '12345' },
        { id: '11', username: 'بسام', name: 'Bassam', roles: ['teacher'], password: '12345' },
        { id: '12', username: 'ناجي', name: 'Naji', roles: ['teacher'], password: '12345' },
        { id: '13', username: 'يعرب', name: 'Yarob', roles: ['teacher'], password: '12345' },
        { id: '14', username: 'إسلام', name: 'Islam', roles: ['teacher'], password: '12345' },
    ];
};

export const getInitialStudents = (): StudentProfile[] => {
    return [
        {
            id: "STU001",
            name: "أحمد الفلاني",
            level: "Beginner",
            enrolledIn: [{ semesterId: "fall-2024", teacher: "نهاد", sessionId: "Saturday-13" }]
        },
        {
            id: "STU002",
            name: "فاطمة الزهراني",
            level: "Intermediate",
            enrolledIn: [{ semesterId: "fall-2024", teacher: "نهاد", sessionId: "Saturday-13" }]
        },
        {
            id: "STU003",
            name: "خالد المصري",
            level: "Advanced",
            enrolledIn: [{ semesterId: "fall-2024", teacher: "حازم", sessionId: "Sunday-14" }]
        },
         {
            id: "STU004",
            name: "مريم العتيبي",
            level: "Beginner",
            enrolledIn: [{ semesterId: "fall-2024", teacher: "هاني", sessionId: "Monday-17" }]
        },
        {
            id: "STU005",
            name: "علياء الشمري",
            level: "Intermediate",
            enrolledIn: [{ semesterId: "fall-2024", teacher: "بسام", sessionId: "Tuesday-18" }]
        },
        {
            id: "STU006",
            name: "يوسف القحطاني",
            level: "Beginner",
            enrolledIn: [{ semesterId: "fall-2024", teacher: "بسام", sessionId: "Tuesday-18" }]
        },
        {
            id: "STU007",
            name: "نورة الغامدي",
            level: "Advanced",
            enrolledIn: [{ semesterId: "fall-2024", teacher: "يعرب", sessionId: "Wednesday-16" }]
        },
        {
            id: "STU008",
            name: "سارة الدوسري",
            level: "Beginner",
            enrolledIn: [{ semesterId: "fall-2024", teacher: "نهاد", sessionId: "Saturday-15" }]
        },
        {
            id: "STU009",
            name: "محمد الحربي",
            level: "Intermediate",
            enrolledIn: [{ semesterId: "fall-2024", teacher: "حازم", sessionId: "Sunday-16" }]
        }
    ]
}

export const getInitialRequests = (): TeacherRequest[] => {
    return [
        {
            id: 'REQ001',
            type: 'remove-student',
            status: 'pending',
            date: '2024-05-20',
            teacherId: '6',
            teacherName: 'نهاد',
            details: {
                studentId: 'STU002',
                studentName: 'فاطمة الزهراني',
                sessionId: 'Saturday-13',
                sessionTime: '1:00 PM - 3:00 PM',
                day: 'Saturday',
                reason: 'Student has not attended for the last 4 weeks and has not responded to communication.',
                semesterId: 'fall-2024'
            }
        },
        {
            id: 'REQ002',
            type: 'remove-student',
            status: 'pending',
            date: '2024-05-21',
            teacherId: '7',
            teacherName: 'حازم',
            details: {
                studentId: 'STU003',
                studentName: 'خالد المصري',
                sessionId: 'Sunday-14',
                sessionTime: '2:00 PM - 3:00 PM',
                day: 'Sunday',
                reason: 'Student is moving to another city and can no longer attend.',
                semesterId: 'fall-2024'
            }
        },
         {
            id: 'REQ003',
            type: 'change-time',
            status: 'pending',
            date: '2024-05-22',
            teacherId: '8',
            teacherName: 'هاني',
            details: {
                studentId: 'STU004',
                studentName: 'مريم العتيبي',
                sessionId: 'Monday-17',
                sessionTime: '5:00 PM - 6:00 PM',
                day: 'Monday',
                reason: 'Student has a new work schedule and requests to move to the 7:00 PM slot.',
                semesterId: 'fall-2024'
            }
        }
    ]
}


export const getInitialSemesters = (): Semester[] => {
  const students = getInitialStudents();
  
  const createSessionStudents = (teacher: string, sessionId: string) => {
    return students
      .filter(s => s.enrolledIn.some(e => e.teacher === teacher && e.sessionId === sessionId))
      .map(s => ({ 
          id: s.id, 
          name: s.name, 
          attendance: null, 
          pendingRemoval: false 
      }));
  };
      
  return [
    {
      id: "fall-2024",
      name: "Fall 2024",
      startDate: "2024-09-01",
      endDate: "2024-12-20",
      teachers: ["نهاد", "حازم", "هاني", "نبيل", "باسم", "بسام", "ناجي", "يعرب", "إسلام"],
      masterSchedule: { 
        "نهاد": { 
            "Saturday": [ 
                { "id": "Saturday-13", "time": "1:00 PM - 3:00 PM", "students": createSessionStudents("نهاد", "Saturday-13"), "duration": 2, "specialization": "عود", "type": "practical" }, 
                { "id": "Saturday-15", "time": "3:00 PM - 5:00 PM", "students": createSessionStudents("نهاد", "Saturday-15"), "duration": 2, "specialization": "عود", "type": "practical" }, 
            ]
        }, 
        "حازم": { 
            "Sunday": [ 
                { "id": "Sunday-14", "time": "2:00 PM - 3:00 PM", "students": createSessionStudents("حازم", "Sunday-14"), "duration": 1, "specialization": "عود", "type": "practical" },
                { "id": "Sunday-16", "time": "4:00 PM - 5:00 PM", "students": createSessionStudents("حازم", "Sunday-16"), "duration": 1, "specialization": "عود", "type": "practical" }
            ]
        }, 
        "هاني": {
            "Monday": [
                 { "id": "Monday-17", "time": "5:00 PM - 6:00 PM", "students": createSessionStudents("هاني", "Monday-17"), "duration": 1, "specialization": "ناي", "type": "practical" }
            ]
        },
        "بسام": {
            "Tuesday": [
                { "id": "Tuesday-18", "time": "6:00 PM - 7:00 PM", "students": createSessionStudents("بسام", "Tuesday-18"), "duration": 1, "specialization": "قانون", "type": "practical" }
            ]
        },
        "يعرب": {
            "Wednesday": [
                { "id": "Wednesday-16", "time": "4:00 PM - 5:00 PM", "students": createSessionStudents("يعرب", "Wednesday-16"), "duration": 1, "specialization": "صناعة العود", "type": "practical" }
            ]
        }
      },
      weeklyAttendance: {},
    },
  ];
}
