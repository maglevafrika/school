"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Users, User, Hourglass, Calendar, ChevronLeft, ChevronRight, BarChart3, UserPlus, Upload, FileDown, Check, X, Clock, File, Trash2, GripVertical, FileText } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays, format } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";

// Import for Export
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types based on MySQL schema
interface SessionStudent {
  id: string;
  name: string;
  attendance: 'present' | 'absent' | 'late' | 'excused' | null;
  note?: string;
  pendingRemoval?: boolean;
}

interface ProcessedSession {
  id: string;
  time: string;
  duration: number;
  students: SessionStudent[];
  specialization: string;
  type: 'practical' | 'theory';
  note?: string;
  day: string;
  startRow: number;
}

interface Semester {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  teachers: string[];
  is_active: boolean;
}

interface StudentProfile {
  id: string;
  name: string;
  level: string;
}

// API helper functions
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'API call failed');
  }
  
  return response.json();
};

// Placeholder Dialogs
const ImportScheduleDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Import Schedule</DialogTitle>
                <DialogDescription>Functionality to bulk-import students from a CSV file coming soon.</DialogDescription>
            </DialogHeader>
            <p>Import form will be here.</p>
        </DialogContent>
    </Dialog>
);

const EnrollStudentDialog = ({ isOpen, onOpenChange, students, semester, onEnrollmentSuccess }: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void,
    students: StudentProfile[],
    semester: Semester,
    onEnrollmentSuccess: () => void
}) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enroll Student</DialogTitle>
                <DialogDescription>Functionality to enroll students coming soon.</DialogDescription>
            </DialogHeader>
            <p>Enrollment form will be here.</p>
        </DialogContent>
    </Dialog>
);

const AddStudentDialog = ({ session, semester, teacherName, onStudentAdded, asChild, children }: { 
    session: ProcessedSession, 
    semester: Semester, 
    teacherName: string, 
    onStudentAdded: () => void, 
    asChild?: boolean, 
    children?: React.ReactNode 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.activeRole === 'admin';

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
        }
    }, [isOpen]);

    const fetchStudents = async () => {
        try {
            const students = await apiCall('/api/students');
            setAllStudents(students);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleAddStudent = async (student: StudentProfile) => {
        try {
            await apiCall('/api/session-students', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId: session.id,
                    studentId: student.id
                })
            });
            
            toast({ title: "Student Added", description: `${student.name} has been added to the session.` });
            onStudentAdded();
            setIsOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: `Failed to add student. ${error.message}`, variant: 'destructive' });
        }
    };
    
    const handleRequestAddStudent = async (student: StudentProfile) => {
        if (!user) return;
        try {
            await apiCall('/api/teacher-requests', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'add-student',
                    teacherId: user.id,
                    teacherName: user.name,
                    studentId: student.id,
                    studentName: student.name,
                    sessionId: session.id,
                    sessionTime: session.time,
                    day: session.day,
                    reason: `Teacher requested to add ${student.name} to their session.`,
                    semesterId: semester.id
                })
            });

            toast({ title: "Request Sent", description: `Request to add ${student.name} has been sent for approval.` });
            onStudentAdded();
            setIsOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: `Failed to send request. ${error.message}`, variant: 'destructive'});
        }
    };

    const filteredStudents = useMemo(() => {
        const sessionStudentIds = session.students.map(s => s.id);
        return allStudents.filter(student => 
            !sessionStudentIds.includes(student.id) &&
            student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allStudents, searchTerm, session.students]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild={asChild}>
                {children ?? (
                    <Button variant="ghost" size="sm" className="w-full h-full text-xs text-muted-foreground font-normal">
                        <UserPlus className="mr-2 h-3 w-3" /> { isAdmin ? "Add Student" : "Request to Add"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Student to Session</DialogTitle>
                    <DialogDescription>Search for an existing student to add to this session.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Input 
                        placeholder="Search student name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-2 border rounded-md">
                                <span>{student.name} ({student.level})</span>
                                <Button size="sm" onClick={() => isAdmin ? handleAddStudent(student) : handleRequestAddStudent(student)}>
                                    {isAdmin ? 'Add' : 'Request'}
                                </Button>
                            </div>
                        )) : <p className="text-sm text-muted-foreground text-center">No students found.</p>}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ScheduleGrid = ({ 
    processedSessions, 
    dayFilter, 
    semester, 
    teacherName, 
    onUpdate, 
    weekStartDate 
}: { 
    processedSessions: ProcessedSession[]; 
    dayFilter: string; 
    semester: Semester | undefined; 
    teacherName: string; 
    onUpdate: () => void; 
    weekStartDate: string;
}) => {
    const allDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const isMobile = useIsMobile();
    const days = isMobile && dayFilter.toLowerCase() !== 'all' ? [dayFilter] : allDays;
    const timeSlots = Array.from({ length: 13 }, (_, i) => `${i + 9}:00`);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleUpdateAttendance = async (
        studentId: string, 
        sessionId: string, 
        day: string, 
        status: SessionStudent['attendance']
    ) => {
        if (!semester || !user || !weekStartDate) return;
        
        try {
            await apiCall('/api/attendance', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    studentId,
                    weekStartDate,
                    status
                })
            });

            toast({ title: "Attendance updated", description: `Marked as ${status}.`});
            onUpdate();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive'});
        }
    };

    const handleRemoveStudent = async (student: SessionStudent, session: ProcessedSession) => {
        if (!semester) return;
        const isTeacher = user?.activeRole === 'teacher';

        try {
            if (isTeacher) {
                await apiCall('/api/teacher-requests', {
                    method: 'POST',
                    body: JSON.stringify({
                        type: 'remove-student',
                        teacherId: user!.id,
                        teacherName: user!.name,
                        studentId: student.id,
                        studentName: student.name,
                        sessionId: session.id,
                        sessionTime: session.time,
                        day: session.day,
                        reason: 'Teacher requested removal from schedule view.',
                        semesterId: semester.id
                    })
                });

                await apiCall('/api/session-students/pending', {
                    method: 'PUT',
                    body: JSON.stringify({
                        sessionId: session.id,
                        studentId: student.id,
                        pendingRemoval: true
                    })
                });

                toast({ title: "Removal Requested", description: `Request to remove ${student.name} has been sent for approval.` });
            } else {
                await apiCall('/api/session-students', {
                    method: 'DELETE',
                    body: JSON.stringify({
                        sessionId: session.id,
                        studentId: student.id
                    })
                });

                toast({ title: "Student Removed", description: `${student.name} has been removed from the session.` });
            }
            onUpdate();
        } catch (error: any) {
            toast({ title: "Error", description: `Failed to process removal. ${error.message}`, variant: 'destructive'});
        }
    };

    const formatTimeForDisplay = (time: string) => {
        const date = new Date(`1970-01-01T${time}:00`);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    };

    const filteredSessions = useMemo(() => {
        if (dayFilter.toLowerCase() === 'all') return processedSessions;
        return processedSessions.filter(s => s.day.toLowerCase() === dayFilter.toLowerCase());
    }, [processedSessions, dayFilter]);

    if (isMobile && dayFilter.toLowerCase() === 'all' && filteredSessions.length > 0) {
        return <Card className="mt-4"><CardContent className="p-4 text-center text-muted-foreground">Please select a day to view the schedule.</CardContent></Card>;
    }

    if (!processedSessions || processedSessions.length === 0 || (isMobile && filteredSessions.length === 0 && dayFilter.toLowerCase() !== 'all')) {
        return <Card className="mt-4"><CardContent className="p-4 text-center text-muted-foreground">No schedule available for the selected teacher/day.</CardContent></Card>;
    }

    return (
        <div id="schedule-grid-container" className={cn("grid gap-px bg-border", isMobile ? "grid-cols-[auto_1fr]" : "grid-cols-[auto_repeat(6,_1fr)] -ml-4 -mr-4")}>
            {/* Time Column */}
            <div className="flex flex-col">
                <div className="h-12 bg-background"></div>
                {timeSlots.map(time => (
                    <div key={time} className="h-28 flex items-start justify-center bg-background pt-2 px-2 text-xs text-muted-foreground">
                        {formatTimeForDisplay(time)}
                    </div>
                ))}
            </div>

            {/* Day Columns */}
            {days.map((day) => day && (
                <div key={day} className="relative col-span-1 bg-background">
                    <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm h-12 flex items-center justify-center font-semibold border-b">
                        {day}
                    </div>
                    <div className="absolute top-12 left-0 w-full h-[calc(13_*_7rem)] grid grid-rows-[repeat(13,_7rem)] gap-px">
                        {timeSlots.map((time) => (
                            <div key={`${day}-${time}`} className="h-28 border-t"></div>
                        ))}
                    </div>
                    <div className="absolute top-12 left-0 w-full h-full">
                        {filteredSessions
                            .filter(session => session.day === day)
                            .map(session => (
                                <div
                                    key={session.id}
                                    className="absolute w-full p-1"
                                    style={{ 
                                        top: `${session.startRow * 7}rem`, 
                                        height: `${session.duration * 7}rem` 
                                    }}
                                >
                                    <Card className="w-full h-full flex flex-col shadow-none">
                                        <CardContent className="p-2 flex-grow flex flex-col gap-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <p className="text-muted-foreground">{session.time}</p>
                                                <p className="font-medium">{session.type}</p>
                                            </div>
                                            <div className="my-1">
                                                <Badge variant="secondary" className="font-normal">{session.specialization}</Badge>
                                            </div>
                                            <Separator className="my-1"/>
                                            <div className="flex-grow overflow-y-auto pr-1">
                                                {session.students && session.students.length > 0 ? (
                                                    <ul className="space-y-1 text-xs">
                                                        {session.students.map((student: SessionStudent) => (
                                                            <li key={student.id} className={cn("flex justify-between items-center p-1 rounded group/student", student.pendingRemoval && "opacity-50")}>
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-3 w-3 shrink-0" />
                                                                    <span className="font-medium">{student.name}</span>
                                                                    {student.pendingRemoval && <Hourglass className="h-3 w-3 text-destructive animate-spin" />}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/student:opacity-100">
                                                                                <GripVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-auto p-1">
                                                                            <div className="flex gap-1">
                                                                                <Button onClick={() => handleUpdateAttendance(student.id, session.id, day, 'present')} variant="ghost" size="icon" className="h-7 w-7"><Check className="text-green-600"/></Button>
                                                                                <Button onClick={() => handleUpdateAttendance(student.id, session.id, day, 'absent')} variant="ghost" size="icon" className="h-7 w-7"><X className="text-red-600"/></Button>
                                                                                <Button onClick={() => handleUpdateAttendance(student.id, session.id, day, 'late')} variant="ghost" size="icon" className="h-7 w-7"><Clock className="text-amber-600"/></Button>
                                                                                <Button onClick={() => handleUpdateAttendance(student.id, session.id, day, 'excused')} variant="ghost" size="icon" className="h-7 w-7"><File className="text-blue-600"/></Button>
                                                                            </div>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                    <Button onClick={() => handleRemoveStudent(student, session)} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/student:opacity-100">
                                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="flex-grow flex items-center justify-center">
                                                        <p className="text-xs text-muted-foreground">No students enrolled</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        {semester && (
                                            <CardFooter className="p-1 border-t">
                                                <AddStudentDialog session={session} semester={semester} teacherName={teacherName} onStudentAdded={onUpdate} asChild>
                                                    <Button variant="ghost" size="sm" className="w-full h-auto text-xs text-muted-foreground font-normal">
                                                        <UserPlus className="mr-2 h-3 w-3" /> Enroll Student
                                                    </Button>
                                                </AddStudentDialog>
                                            </CardFooter>
                                        )}
                                    </Card>
                                </div>
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function DashboardPage() {
    const { user } = useAuth();
    const isAdmin = user?.activeRole === 'admin';
    const isMobile = useIsMobile();

    const [loading, setLoading] = useState(true);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dayFilter, setDayFilter] = useState('All');
    
    const [processedSessions, setProcessedSessions] = useState<ProcessedSession[]>([]);
    const [_, setForceUpdate] = useState({});

    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Prevent hydration error
    useEffect(() => {
        setSelectedDate(new Date());
    }, []);

    const weekStart = useMemo(() => {
        if (!selectedDate) return '';
        // Assuming week starts on Saturday
        const dayOfWeek = selectedDate.getDay();
        const difference = (dayOfWeek < 6) ? - (dayOfWeek + 1) : 0;
        const saturday = addDays(selectedDate, difference);
        return format(saturday, 'yyyy-MM-dd');
    }, [selectedDate]);

    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user, selectedSemesterId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch semesters
            const semestersData = await apiCall('/api/semesters');
            setSemesters(semestersData);

            if (semestersData.length > 0 && !selectedSemesterId) {
                setSelectedSemesterId(semestersData[0].id);
            }

            // Fetch students
            const studentsData = await apiCall('/api/students');
            setStudents(studentsData);

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedSemester = useMemo(() => {
        return semesters.find(s => s.id === selectedSemesterId);
    }, [semesters, selectedSemesterId]);

    const availableTeachers = useMemo(() => {
        if (!selectedSemester) return [];
        return user?.activeRole === 'teacher'
            ? selectedSemester.teachers.filter((t: string) => t === user.name)
            : selectedSemester.teachers;
    }, [selectedSemester, user]);

    useEffect(() => {
        if (availableTeachers.length > 0) {
            if (user?.activeRole === 'teacher' && user.name && availableTeachers.includes(user.name)) {
                setSelectedTeacher(user.name);
            } else if (!selectedTeacher || !availableTeachers.includes(selectedTeacher)) {
                setSelectedTeacher(availableTeachers[0]);
            }
        }
    }, [availableTeachers, user, selectedTeacher]);

    const loadScheduleForTeacherAndWeek = useCallback(async () => {
        if (!selectedSemester || !selectedTeacher || !weekStart) {
            setProcessedSessions([]);
            return;
        }

        try {
            const sessions = await apiCall(`/api/sessions?semesterId=${selectedSemester.id}&teacherName=${encodeURIComponent(selectedTeacher)}&weekStart=${weekStart}`);
            setProcessedSessions(sessions);
        } catch (error) {
            console.error('Error loading schedule:', error);
            setProcessedSessions([]);
        }
    }, [selectedSemester, selectedTeacher, weekStart]);

    useEffect(() => {
        loadScheduleForTeacherAndWeek();
    }, [loadScheduleForTeacherAndWeek]);

    const handleUpdate = () => {
        loadScheduleForTeacherAndWeek();
        setForceUpdate({}); // Force re-render if needed
    };

    const handleExportPDF = () => {
        const scheduleElement = document.getElementById('schedule-grid-container');
        if (scheduleElement) {
            html2canvas(scheduleElement).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('l', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`schedule-${selectedTeacher}-${weekStart}.pdf`);
            });
        }
    };
    
    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Day,Time,Specialization,Type,Student Name,Attendance\n";

        processedSessions.forEach(session => {
            session.students.forEach(student => {
                const row = [
                    `"${session.day}"`,
                    `"${session.time}"`,
                    `"${session.specialization}"`,
                    `"${session.type}"`,
                    `"${student.name}"`,
                    `"${student.attendance || 'N/A'}"`
                ].join(",");
                csvContent += row + "\r\n";
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `schedule-${selectedTeacher}-${weekStart}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading || !selectedDate) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const weekEnd = addDays(new Date(weekStart), 5);
    
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl font-headline self-start">Admin Dashboard</h1>
                {isAdmin && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEnrolling(true)}><UserPlus/> Enroll Student</Button>
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsImporting(true)}><Upload/> Import</Button>
                        <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportPDF}><FileText/> Export PDF</Button>
                        <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportCSV}><FileDown/> Export CSV</Button>
                    </div>
                )}
            </div>
            
            <Card>
                <CardContent className="p-4 flex flex-col xl:flex-row xl:items-center gap-4">
                    {isAdmin && (
                        <>
                            <div className="w-full xl:w-auto flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                                <Select value={selectedSemesterId ?? ""} onValueChange={setSelectedSemesterId}>
                                    <SelectTrigger className="w-full xl:w-[180px]">
                                        <SelectValue placeholder="Select a semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full xl:w-auto flex items-center gap-2">
                                <Users className="w-5 h-5 text-muted-foreground" />
                                <Select value={selectedTeacher} onValueChange={setSelectedTeacher} disabled={!selectedSemesterId || availableTeachers.length === 0}>
                                    <SelectTrigger className="w-full xl:w-[180px]">
                                        <SelectValue placeholder="Select a teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTeachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                    <div className="w-full xl:w-auto flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full xl:w-[240px] justify-start text-left font-normal">
                                    <span>{format(new Date(weekStart), 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent mode="single" selected={selectedDate || undefined} onSelect={(date) => date && setSelectedDate(date)} initialFocus/>
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(addDays(selectedDate, -7))}><ChevronLeft /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(addDays(selectedDate, 7))}><ChevronRight /></Button>
                        </div>
                    </div>
                    <div className="w-full xl:w-auto flex items-center gap-2 xl:ml-auto">
                        <Tabs value={dayFilter} onValueChange={setDayFilter} className="w-full md:w-auto">
                            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
                                <TabsTrigger value="All">All</TabsTrigger>
                                <TabsTrigger value="Saturday">Sat</TabsTrigger>
                                <TabsTrigger value="Sunday">Sun</TabsTrigger>
                                <TabsTrigger value="Monday">Mon</TabsTrigger>
                                <TabsTrigger value="Tuesday">Tue</TabsTrigger>
                                <TabsTrigger value="Wednesday">Wed</TabsTrigger>
                                <TabsTrigger value="Thursday">Thu</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>

            <div className="overflow-x-auto">
                {selectedTeacher ? (
                    <ScheduleGrid 
                        processedSessions={processedSessions} 
                        dayFilter={dayFilter} 
                        semester={selectedSemester}
                        teacherName={selectedTeacher}
                        onUpdate={handleUpdate}
                        weekStartDate={weekStart}
                    />
                ) : (
                    <Card><CardContent className="p-6 text-center text-muted-foreground">Please select a teacher to view their schedule.</CardContent></Card>
                )}
            </div>

            {selectedSemester && (
                <EnrollStudentDialog 
                    isOpen={isEnrolling} 
                    onOpenChange={setIsEnrolling} 
                    students={students}
                    semester={selectedSemester}
                    onEnrollmentSuccess={handleUpdate}
                />
            )}
            <ImportScheduleDialog isOpen={isImporting} onOpenChange={setIsImporting} />
        </div>
    );
}